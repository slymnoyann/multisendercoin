// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MultiSender
 * @notice Advanced multi-token sender with gas optimization, native token support, and fee system
 * @dev Optimized for Base network with batch operations and security features
 */
contract MultiSender is ReentrancyGuard, Ownable, Pausable {
    struct Transaction {
        address token;
        address sender;
        uint256 recipientCount;
        uint256 totalAmount;
        uint256 timestamp;
        uint256 fee;
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

    event NativeTokensSent(
        address indexed sender,
        uint256 indexed txId,
        uint256 recipientCount,
        uint256 totalAmount,
        uint256 fee
    );

    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event EmergencyWithdraw(address token, uint256 amount);

    // State variables
    uint256 public constant MAX_RECIPIENTS = 200; // Gas optimization limit
    uint256 public transactionCount;
    uint256 public feePercentage = 50; // 0.5% = 50/10000
    uint256 public constant FEE_DENOMINATOR = 10000;

    mapping(uint256 => Transaction) public transactions;

    // Fee collection
    address public feeCollector;

    constructor(address _feeCollector) Ownable(msg.sender) {
        feeCollector = _feeCollector;
        require(_feeCollector != address(0), "MultiSender: invalid fee collector");
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

        uint256 totalAmount = _calculateTotalAmount(amounts);
        uint256 fee = _calculateFee(totalAmount);
        uint256 netAmount = totalAmount + fee;

        // Transfer total amount including fee
        require(
            token.transferFrom(msg.sender, address(this), netAmount),
            "MultiSender: transfer failed"
        );

        uint256 txId = transactionCount++;

        // Batch transfer to recipients (gas optimized)
        _batchTransferERC20(token, recipients, amounts);

        // Collect fee
        if (fee > 0) {
            require(token.transfer(feeCollector, fee), "MultiSender: fee transfer failed");
        }

        // Record transaction
        transactions[txId] = Transaction({
            token: address(token),
            sender: msg.sender,
            recipientCount: recipients.length,
            totalAmount: totalAmount,
            timestamp: block.timestamp,
            fee: fee
        });

        emit TokensSent(address(token), msg.sender, txId, recipients.length, totalAmount, fee);
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

        uint256 totalAmount = amountPerRecipient * recipients.length;
        uint256 fee = _calculateFee(totalAmount);
        uint256 netAmount = totalAmount + fee;

        // Transfer total amount including fee
        require(
            token.transferFrom(msg.sender, address(this), netAmount),
            "MultiSender: transfer failed"
        );

        uint256 txId = transactionCount++;

        // Batch transfer to recipients (gas optimized)
        _batchTransferERC20Equal(token, recipients, amountPerRecipient);

        // Collect fee
        if (fee > 0) {
            require(token.transfer(feeCollector, fee), "MultiSender: fee transfer failed");
        }

        // Record transaction
        transactions[txId] = Transaction({
            token: address(token),
            sender: msg.sender,
            recipientCount: recipients.length,
            totalAmount: totalAmount,
            timestamp: block.timestamp,
            fee: fee
        });

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
            recipientCount: recipients.length,
            totalAmount: totalAmount,
            timestamp: block.timestamp,
            fee: fee
        });

        emit NativeTokensSent(msg.sender, txId, recipients.length, totalAmount, fee);
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

        uint256 totalAmount = amountPerRecipient * recipients.length;
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
            recipientCount: recipients.length,
            totalAmount: totalAmount,
            timestamp: block.timestamp,
            fee: fee
        });

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
    }

    function _calculateTotalAmount(uint256[] calldata amounts) internal pure returns (uint256 total) {
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
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
            require(
                token.transfer(recipients[i], amounts[i]),
                "MultiSender: transfer to recipient failed"
            );
        }
    }

    function _batchTransferERC20Equal(
        IERC20 token,
        address[] calldata recipients,
        uint256 amount
    ) internal {
        for (uint256 i = 0; i < recipients.length; i++) {
            require(
                token.transfer(recipients[i], amount),
                "MultiSender: transfer to recipient failed"
            );
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

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(IERC20 token) external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner(), balance), "MultiSender: emergency withdraw failed");
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

    function estimateFee(uint256 amount) external view returns (uint256) {
        return _calculateFee(amount);
    }

    // Receive function for native token transfers
    receive() external payable {}
}
