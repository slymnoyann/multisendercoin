// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MultiSender
 * @notice Advanced multi-token sender with gas optimization, native token support, and fee system
 * @dev Optimized for Base network with batch operations and security features
 */
contract MultiSender is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // Packed struct for gas optimization
    struct Transaction {
        address token;        // 20 bytes
        address sender;        // 20 bytes
        uint32 recipientCount; // 4 bytes (max 4.2B)
        uint64 timestamp;     // 8 bytes (year 2106)
        uint128 totalAmount;  // 16 bytes (max 3.4e38)
        uint128 fee;          // 16 bytes
    }

    struct AmountLimits {
        uint128 minAmount;
        uint128 maxAmount;
    }

    struct Statistics {
        uint256 totalTransactions;
        uint256 totalVolume;
        uint256 totalFees;
    }

    // Events
    event TokensSent(
        address indexed token,
        address indexed sender,
        uint256 indexed txId,
        uint256 recipientCount,
        uint256 totalAmount,
        uint256 fee
    );

    event TokensSentDetailed(
        address indexed token,
        address indexed sender,
        uint256 indexed txId,
        uint256 recipientCount,
        uint256 totalAmount,
        uint256 fee,
        address[] recipients,
        uint256[] amounts
    );

    event NativeTokensSent(
        address indexed sender,
        uint256 indexed txId,
        uint256 recipientCount,
        uint256 totalAmount,
        uint256 fee
    );

    event NativeTokensSentDetailed(
        address indexed sender,
        uint256 indexed txId,
        uint256 recipientCount,
        uint256 totalAmount,
        uint256 fee,
        address[] recipients,
        uint256[] amounts
    );

    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event EmergencyWithdraw(address token, uint256 amount);
    event TokenWhitelisted(address indexed token, bool whitelisted);
    event RecipientBlacklisted(address indexed recipient, bool blacklisted);
    event AmountLimitsUpdated(address indexed token, uint128 minAmount, uint128 maxAmount);

    // State variables
    uint256 public constant MAX_RECIPIENTS = 200; // Gas optimization limit
    uint256 public transactionCount;
    uint256 public feePercentage = 50; // 0.5% = 50/10000
    uint256 public constant FEE_DENOMINATOR = 10000;

    mapping(uint256 => Transaction) public transactions;
    mapping(address => bool) public whitelistedTokens;
    mapping(address => bool) public blacklistedRecipients;
    mapping(address => AmountLimits) public tokenLimits;
    mapping(address => uint256) public tokenVolumes;
    mapping(address => uint256) public senderTransactionCounts;

    // Statistics
    Statistics public stats;

    // Fee collection
    address public feeCollector;

    constructor(address _feeCollector) Ownable(msg.sender) {
        require(_feeCollector != address(0), "MultiSender: invalid fee collector");
        feeCollector = _feeCollector;
        
        // Native token is always whitelisted
        whitelistedTokens[address(0)] = true;
    }

    /**
     * @notice Send ERC20 tokens to multiple recipients with individual amounts (gas optimized)
     * @param token The ERC20 token contract address
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to send to each recipient (in token's smallest unit)
     */
    function sendToMany(
        IERC20 token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external nonReentrant whenNotPaused {
        _validateInputs(recipients, amounts);
        _checkTokenWhitelist(address(token));
        _checkRecipientsBlacklist(recipients);
        _checkAmountLimits(address(token), amounts);

        uint256 totalAmount = _calculateTotalAmount(amounts);
        uint256 fee = _calculateFee(totalAmount);
        uint256 netAmount = totalAmount + fee;

        // Transfer total amount including fee using SafeERC20
        token.safeTransferFrom(msg.sender, address(this), netAmount);

        uint256 txId = transactionCount++;

        // Batch transfer to recipients (gas optimized with SafeERC20)
        _batchTransferERC20(token, recipients, amounts);

        // Collect fee
        if (fee > 0) {
            token.safeTransfer(feeCollector, fee);
        }

        // Record transaction
        transactions[txId] = Transaction({
            token: address(token),
            sender: msg.sender,
            recipientCount: uint32(recipients.length),
            totalAmount: uint128(totalAmount),
            timestamp: uint64(block.timestamp),
            fee: uint128(fee)
        });

        // Update statistics
        _updateStatistics(address(token), totalAmount, fee);
        senderTransactionCounts[msg.sender]++;

        // Emit detailed event for small batches, summary for large
        if (recipients.length <= 10) {
            emit TokensSentDetailed(
                address(token),
                msg.sender,
                txId,
                recipients.length,
                totalAmount,
                fee,
                recipients,
                amounts
            );
        } else {
            emit TokensSent(address(token), msg.sender, txId, recipients.length, totalAmount, fee);
        }
    }

    /**
     * @notice Send equal amount of ERC20 tokens to multiple recipients (gas optimized)
     * @param token The ERC20 token contract address
     * @param recipients Array of recipient addresses
     * @param amountPerRecipient Amount to send to each recipient (in token's smallest unit)
     */
    function sendEqual(
        IERC20 token,
        address[] calldata recipients,
        uint256 amountPerRecipient
    ) external nonReentrant whenNotPaused {
        require(recipients.length > 0, "MultiSender: no recipients");
        require(amountPerRecipient > 0, "MultiSender: zero amount");
        require(recipients.length <= MAX_RECIPIENTS, "MultiSender: too many recipients");
        _checkTokenWhitelist(address(token));
        _checkRecipientsBlacklist(recipients);
        _checkDuplicateRecipients(recipients);

        uint256 totalAmount;
        unchecked {
            totalAmount = amountPerRecipient * recipients.length;
        }
        
        uint256 fee = _calculateFee(totalAmount);
        uint256 netAmount = totalAmount + fee;

        // Check amount limits
        AmountLimits memory limits = tokenLimits[address(token)];
        if (limits.minAmount > 0) {
            require(totalAmount >= limits.minAmount, "MultiSender: amount too low");
        }
        if (limits.maxAmount > 0) {
            require(totalAmount <= limits.maxAmount, "MultiSender: amount too high");
        }

        // Transfer total amount including fee using SafeERC20
        token.safeTransferFrom(msg.sender, address(this), netAmount);

        uint256 txId = transactionCount++;

        // Batch transfer to recipients (gas optimized)
        _batchTransferERC20Equal(token, recipients, amountPerRecipient);

        // Collect fee
        if (fee > 0) {
            token.safeTransfer(feeCollector, fee);
        }

        // Record transaction
        transactions[txId] = Transaction({
            token: address(token),
            sender: msg.sender,
            recipientCount: uint32(recipients.length),
            totalAmount: uint128(totalAmount),
            timestamp: uint64(block.timestamp),
            fee: uint128(fee)
        });

        // Update statistics
        _updateStatistics(address(token), totalAmount, fee);
        senderTransactionCounts[msg.sender]++;

        emit TokensSent(address(token), msg.sender, txId, recipients.length, totalAmount, fee);
    }

    /**
     * @notice Send native tokens (ETH/Base) to multiple recipients
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to send to each recipient (in wei)
     */
    function sendNativeToMany(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external payable nonReentrant whenNotPaused {
        _validateInputs(recipients, amounts);
        _checkRecipientsBlacklist(recipients);

        uint256 totalAmount = _calculateTotalAmount(amounts);
        uint256 fee = _calculateFee(totalAmount);
        uint256 netAmount = totalAmount + fee;

        require(msg.value >= netAmount, "MultiSender: insufficient ETH sent");

        uint256 txId = transactionCount++;

        // Batch transfer native tokens (gas optimized)
        _batchTransferNative(recipients, amounts);

        // Collect fee
        if (fee > 0) {
            (bool feeSuccess,) = payable(feeCollector).call{value: fee}("");
            require(feeSuccess, "MultiSender: fee transfer failed");
        }

        // Refund excess ETH
        uint256 excess = msg.value - netAmount;
        if (excess > 0) {
            (bool refundSuccess,) = payable(msg.sender).call{value: excess}("");
            require(refundSuccess, "MultiSender: refund failed");
        }

        // Record transaction
        transactions[txId] = Transaction({
            token: address(0), // Native token
            sender: msg.sender,
            recipientCount: uint32(recipients.length),
            totalAmount: uint128(totalAmount),
            timestamp: uint64(block.timestamp),
            fee: uint128(fee)
        });

        // Update statistics
        _updateStatistics(address(0), totalAmount, fee);
        senderTransactionCounts[msg.sender]++;

        // Emit detailed event for small batches
        if (recipients.length <= 10) {
            emit NativeTokensSentDetailed(
                msg.sender,
                txId,
                recipients.length,
                totalAmount,
                fee,
                recipients,
                amounts
            );
        } else {
            emit NativeTokensSent(msg.sender, txId, recipients.length, totalAmount, fee);
        }
    }

    /**
     * @notice Send equal amount of native tokens to multiple recipients
     * @param recipients Array of recipient addresses
     * @param amountPerRecipient Amount to send to each recipient (in wei)
     */
    function sendNativeEqual(
        address[] calldata recipients,
        uint256 amountPerRecipient
    ) external payable nonReentrant whenNotPaused {
        require(recipients.length > 0, "MultiSender: no recipients");
        require(amountPerRecipient > 0, "MultiSender: zero amount");
        require(recipients.length <= MAX_RECIPIENTS, "MultiSender: too many recipients");
        _checkRecipientsBlacklist(recipients);
        _checkDuplicateRecipients(recipients);

        uint256 totalAmount;
        unchecked {
            totalAmount = amountPerRecipient * recipients.length;
        }
        
        uint256 fee = _calculateFee(totalAmount);
        uint256 netAmount = totalAmount + fee;

        require(msg.value >= netAmount, "MultiSender: insufficient ETH sent");

        uint256 txId = transactionCount++;

        // Batch transfer native tokens (gas optimized)
        _batchTransferNativeEqual(recipients, amountPerRecipient);

        // Collect fee
        if (fee > 0) {
            (bool feeSuccess,) = payable(feeCollector).call{value: fee}("");
            require(feeSuccess, "MultiSender: fee transfer failed");
        }

        // Refund excess ETH
        uint256 excess = msg.value - netAmount;
        if (excess > 0) {
            (bool refundSuccess,) = payable(msg.sender).call{value: excess}("");
            require(refundSuccess, "MultiSender: refund failed");
        }

        // Record transaction
        transactions[txId] = Transaction({
            token: address(0), // Native token
            sender: msg.sender,
            recipientCount: uint32(recipients.length),
            totalAmount: uint128(totalAmount),
            timestamp: uint64(block.timestamp),
            fee: uint128(fee)
        });

        // Update statistics
        _updateStatistics(address(0), totalAmount, fee);
        senderTransactionCounts[msg.sender]++;

        emit NativeTokensSent(msg.sender, txId, recipients.length, totalAmount, fee);
    }

    // Internal functions for gas optimization

    function _validateInputs(address[] calldata recipients, uint256[] calldata amounts) internal pure {
        require(recipients.length > 0, "MultiSender: no recipients");
        require(recipients.length == amounts.length, "MultiSender: length mismatch");
        require(recipients.length <= MAX_RECIPIENTS, "MultiSender: too many recipients");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "MultiSender: zero address");
            require(amounts[i] > 0, "MultiSender: zero amount");
        }
        
        // Check for duplicates
        _checkDuplicateRecipients(recipients);
    }

    function _checkDuplicateRecipients(address[] calldata recipients) internal pure {
        for (uint256 i = 0; i < recipients.length; i++) {
            for (uint256 j = i + 1; j < recipients.length; j++) {
                require(recipients[i] != recipients[j], "MultiSender: duplicate recipient");
            }
        }
    }

    function _checkTokenWhitelist(address token) internal view {
        require(whitelistedTokens[token], "MultiSender: token not whitelisted");
    }

    function _checkRecipientsBlacklist(address[] calldata recipients) internal view {
        for (uint256 i = 0; i < recipients.length; i++) {
            require(!blacklistedRecipients[recipients[i]], "MultiSender: recipient blacklisted");
        }
    }

    function _checkAmountLimits(address token, uint256[] calldata amounts) internal view {
        AmountLimits memory limits = tokenLimits[token];
        if (limits.minAmount == 0 && limits.maxAmount == 0) {
            return; // No limits set
        }

        uint256 totalAmount = _calculateTotalAmount(amounts);
        
        if (limits.minAmount > 0) {
            require(totalAmount >= limits.minAmount, "MultiSender: amount too low");
        }
        if (limits.maxAmount > 0) {
            require(totalAmount <= limits.maxAmount, "MultiSender: amount too high");
        }
    }

    function _calculateTotalAmount(uint256[] calldata amounts) internal pure returns (uint256 total) {
        unchecked {
            for (uint256 i = 0; i < amounts.length; i++) {
                total += amounts[i];
            }
        }
    }

    function _calculateFee(uint256 amount) internal view returns (uint256) {
        return (amount * feePercentage) / FEE_DENOMINATOR;
    }

    function _batchTransferERC20(
        IERC20 token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) internal {
        for (uint256 i = 0; i < recipients.length; i++) {
            token.safeTransfer(recipients[i], amounts[i]);
        }
    }

    function _batchTransferERC20Equal(
        IERC20 token,
        address[] calldata recipients,
        uint256 amount
    ) internal {
        for (uint256 i = 0; i < recipients.length; i++) {
            token.safeTransfer(recipients[i], amount);
        }
    }

    function _batchTransferNative(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) internal {
        for (uint256 i = 0; i < recipients.length; i++) {
            (bool success,) = payable(recipients[i]).call{value: amounts[i]}("");
            require(success, "MultiSender: native transfer failed");
        }
    }

    function _batchTransferNativeEqual(
        address[] calldata recipients,
        uint256 amount
    ) internal {
        for (uint256 i = 0; i < recipients.length; i++) {
            (bool success,) = payable(recipients[i]).call{value: amount}("");
            require(success, "MultiSender: native transfer failed");
        }
    }

    function _updateStatistics(address token, uint256 amount, uint256 fee) internal {
        unchecked {
            stats.totalTransactions++;
            stats.totalVolume += amount;
            stats.totalFees += fee;
            tokenVolumes[token] += amount;
        }
    }

    // Admin functions

    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 500, "MultiSender: fee too high"); // Max 5%
        uint256 oldFee = feePercentage;
        feePercentage = _feePercentage;
        emit FeeUpdated(oldFee, _feePercentage);
    }

    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "MultiSender: invalid fee collector");
        feeCollector = _feeCollector;
    }

    function setTokenWhitelist(address token, bool whitelisted) external onlyOwner {
        whitelistedTokens[token] = whitelisted;
        emit TokenWhitelisted(token, whitelisted);
    }

    function setRecipientBlacklist(address recipient, bool blacklisted) external onlyOwner {
        blacklistedRecipients[recipient] = blacklisted;
        emit RecipientBlacklisted(recipient, blacklisted);
    }

    function setAmountLimits(
        address token,
        uint128 minAmount,
        uint128 maxAmount
    ) external onlyOwner {
        require(minAmount <= maxAmount || maxAmount == 0, "MultiSender: invalid limits");
        tokenLimits[token] = AmountLimits(minAmount, maxAmount);
        emit AmountLimitsUpdated(token, minAmount, maxAmount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(IERC20 token) external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(owner(), balance);
        emit EmergencyWithdraw(address(token), balance);
    }

    function emergencyWithdrawNative() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success,) = payable(owner()).call{value: balance}("");
        require(success, "MultiSender: emergency withdraw failed");
        emit EmergencyWithdraw(address(0), balance);
    }

    // View functions

    function getTransaction(uint256 txId) external view returns (Transaction memory) {
        return transactions[txId];
    }

    function getMultipleTransactions(uint256[] calldata txIds)
        external
        view
        returns (Transaction[] memory)
    {
        Transaction[] memory results = new Transaction[](txIds.length);
        for (uint256 i = 0; i < txIds.length; i++) {
            results[i] = transactions[txIds[i]];
        }
        return results;
    }

    function estimateFee(uint256 amount) external view returns (uint256) {
        return _calculateFee(amount);
    }

    function calculateFeeForAmounts(uint256[] calldata amounts)
        external
        view
        returns (uint256 totalFee)
    {
        uint256 total = _calculateTotalAmount(amounts);
        return _calculateFee(total);
    }

    function getStats() external view returns (
        uint256 totalTransactions,
        uint256 totalVolume,
        uint256 totalFees
    ) {
        return (stats.totalTransactions, stats.totalVolume, stats.totalFees);
    }

    function getTokenVolume(address token) external view returns (uint256) {
        return tokenVolumes[token];
    }

    function getSenderTransactionCount(address sender) external view returns (uint256) {
        return senderTransactionCounts[sender];
    }

    // Receive function for native token transfers
    receive() external payable {}
}
