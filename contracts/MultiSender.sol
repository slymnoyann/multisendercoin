// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MultiSender
 * @notice Allows users to send ERC20 tokens to multiple recipients in a single transaction
 * @dev Optimized for gas efficiency on Base network
 */
contract MultiSender is ReentrancyGuard {
    event TokensSent(
        address indexed token,
        address indexed sender,
        uint256 recipientCount,
        uint256 totalAmount
    );

    /**
     * @notice Send ERC20 tokens to multiple recipients with individual amounts
     * @param token The ERC20 token contract address
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to send to each recipient (in token's smallest unit)
     */
    function sendToMany(
        IERC20 token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external nonReentrant {
        require(recipients.length > 0, "MultiSender: no recipients");
        require(recipients.length == amounts.length, "MultiSender: length mismatch");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "MultiSender: zero address");
            require(amounts[i] > 0, "MultiSender: zero amount");
            totalAmount += amounts[i];
        }

        require(
            token.transferFrom(msg.sender, address(this), totalAmount),
            "MultiSender: transfer failed"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            require(
                token.transfer(recipients[i], amounts[i]),
                "MultiSender: transfer to recipient failed"
            );
        }

        emit TokensSent(address(token), msg.sender, recipients.length, totalAmount);
    }

    /**
     * @notice Send equal amount of ERC20 tokens to multiple recipients
     * @param token The ERC20 token contract address
     * @param recipients Array of recipient addresses
     * @param amountPerRecipient Amount to send to each recipient (in token's smallest unit)
     */
    function sendEqual(
        IERC20 token,
        address[] calldata recipients,
        uint256 amountPerRecipient
    ) external nonReentrant {
        require(recipients.length > 0, "MultiSender: no recipients");
        require(amountPerRecipient > 0, "MultiSender: zero amount");

        uint256 totalAmount = amountPerRecipient * recipients.length;

        require(
            token.transferFrom(msg.sender, address(this), totalAmount),
            "MultiSender: transfer failed"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "MultiSender: zero address");
            require(
                token.transfer(recipients[i], amountPerRecipient),
                "MultiSender: transfer to recipient failed"
            );
        }

        emit TokensSent(address(token), msg.sender, recipients.length, totalAmount);
    }
}
