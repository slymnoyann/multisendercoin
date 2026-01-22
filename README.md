# 🚀 MultiSender - Advanced Multi-Token Sender

Send any ERC20 token or native ETH/Base to multiple recipients in a single, gas-optimized transaction on [Base](https://base.org).

[![Base](https://img.shields.io/badge/Base-0052FF?style=flat&logo=base)](https://base.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.x-FFF?style=flat)](https://hardhat.org)
[![viem](https://img.shields.io/badge/viem-2.x-6B7280?style=flat)](https://viem.sh)
[![RainbowKit](https://img.shields.io/badge/RainbowKit-2.x-FFCDD2?style=flat)](https://rainbowkit.com)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=flat&logo=solidity)](https://soliditylang.org)

---

## ✨ Features

### Core Functionality
- **Multi-recipient sends** — Distribute any ERC20 token or native ETH/Base to many addresses in one on-chain transaction
- **Two distribution modes:**
  - **Equal amount** — Same amount to each recipient (gas optimized)
  - **Custom amounts** — Different amount per address
- **Native token support** — Send ETH/Base directly without wrapping
- **Any ERC20 on Base** — Preset tokens (USDC, WETH, DAI, USDbC) or custom contract address
- **Gas optimized** — Batch transfer patterns and efficient contract design

### Advanced Features
- **CSV Bulk Upload** — Upload recipient lists via CSV file with validation
- **Real-time Gas Estimation** — See estimated gas costs before sending
- **Transaction History** — Track all successful transactions locally
- **Fee System** — Configurable platform fee (default 0.5%)
- **Emergency Controls** — Pause functionality for security
- **Transaction Summary** — Detailed breakdown before sending

### User Experience
- **Modern UI** — Beautiful dark theme with smooth animations
- **Responsive Design** — Works perfectly on mobile, tablet, and desktop
- **Accessibility** — Full keyboard navigation and screen reader support
- **Wallet Integration** — [RainbowKit](https://rainbowkit.com) with support for Base and Base Sepolia
- **Type Safety** — viem + wagmi for type-safe blockchain interactions

---

## 🏗️ Architecture

### Smart Contract (`MultiSender.sol`)

#### ERC20 Token Functions
- **`sendToMany(IERC20 token, address[] recipients, uint256[] amounts)`**  
  Sends `amounts[i]` of `token` to `recipients[i]`. Use for custom amounts per recipient.

- **`sendEqual(IERC20 token, address[] recipients, uint256 amountPerRecipient)`**  
  Sends `amountPerRecipient` of `token` to each entry in `recipients`. Optimized for equal distributions.

#### Native Token Functions
- **`sendNativeToMany(address[] recipients, uint256[] amounts)`**  
  Sends `amounts[i]` of native ETH/Base to `recipients[i]`. Payable function.

- **`sendNativeEqual(address[] recipients, uint256 amountPerRecipient)`**  
  Sends `amountPerRecipient` of native ETH/Base to each recipient. Payable function.

#### Admin Functions
- **`setFeePercentage(uint256 _feePercentage)`** — Update platform fee (max 5%)
- **`setFeeCollector(address _feeCollector)`** — Set fee collection address
- **`pause()` / `unpause()`** — Emergency pause functionality
- **`emergencyWithdraw(IERC20 token)`** — Emergency token withdrawal
- **`emergencyWithdrawNative()`** — Emergency native token withdrawal

#### View Functions
- **`getTransaction(uint256 txId)`** — Retrieve transaction details
- **`estimateFee(uint256 amount)`** — Calculate fee for a given amount
- **`feePercentage()`** — Get current fee percentage
- **`transactionCount()`** — Get total transaction count
- **`paused()`** — Check if contract is paused

#### Security Features
- **ReentrancyGuard** — Protection against reentrancy attacks
- **Ownable** — Owner-only admin functions
- **Pausable** — Emergency pause mechanism
- **Input Validation** — Comprehensive checks for addresses and amounts
- **Maximum Recipients** — Limit of 200 recipients per transaction (gas optimization)

#### Events
- **`TokensSent`** — Emitted on ERC20 transfers
- **`NativeTokensSent`** — Emitted on native token transfers
- **`FeeUpdated`** — Emitted when fee percentage changes
- **`EmergencyWithdraw`** — Emitted on emergency withdrawals

---

## 🎨 UI Features

### Modern Design
- **Dark Theme** — Professional dark mode with gradient accents
- **Smooth Animations** — Fade-in, slide-in, and hover effects
- **Glass Morphism** — Modern card designs with backdrop blur
- **Responsive Grid** — Adaptive layouts for all screen sizes

### User Interface Components
- **Token Selector** — Dropdown with popular tokens + custom address input
- **Balance Display** — Real-time token balance with formatting
- **Mode Toggle** — Switch between equal and custom amount modes
- **Recipient Manager** — Add/remove recipients with validation
- **CSV Upload Modal** — Bulk import with template download
- **Transaction Summary** — Detailed breakdown with gas estimates
- **Status Messages** — Success, error, and info notifications
- **Transaction History** — Collapsible history panel with BaseScan links

### Accessibility
- **ARIA Labels** — Full screen reader support
- **Keyboard Navigation** — Tab order and keyboard shortcuts
- **Semantic HTML** — Proper heading hierarchy and landmarks
- **Focus Management** — Visible focus indicators
- **Error Messages** — Clear, descriptive error feedback

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| **Contract** | Solidity 0.8.20, OpenZeppelin 5.0.2 |
| **Tooling**  | Hardhat 2.x                         |
| **Frontend** | Next.js 14, React 18                |
| **Blockchain** | viem 2.x, wagmi 2.x, RainbowKit 2.x |
| **Network**  | Base, Base Sepolia                  |
| **Styling**  | CSS3 with CSS Variables             |

---

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **WalletConnect Cloud** Project ID ([Get one here](https://cloud.walletconnect.com))
- **Private Key** (for deployment) with Base Sepolia or Base mainnet ETH
- **Modern Browser** with Web3 wallet extension (MetaMask, Coinbase Wallet, etc.)

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd multisendercoin
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_MULTI_SENDER_ADDRESS=  # Leave empty until deployed

# Optional (for deployment)
PRIVATE_KEY=your_private_key
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### 3. Deploy the Contract

```bash
# Compile contracts
npm run compile

# Deploy to Base Sepolia (testnet)
npm run deploy:base-sepolia

# Or deploy to Base mainnet
npm run deploy:base
```

After deployment, copy the contract address into `.env` as `NEXT_PUBLIC_MULTI_SENDER_ADDRESS`.

**Note:** The contract constructor requires a `feeCollector` address. Update `scripts/deploy.js` with your fee collector address before deploying.

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Use the Application

1. **Connect Wallet** — Click "Connect Wallet" and select your preferred wallet
2. **Select Token** — Choose from preset tokens or enter a custom ERC20 address
3. **Choose Mode** — Select "Equal Amounts" or "Custom Amounts"
4. **Add Recipients** — 
   - Manually add recipients one by one
   - Or use CSV bulk upload (click "Bulk Upload" button)
5. **Review Summary** — Check transaction summary with gas estimates
6. **Approve** (if needed) — For ERC20 tokens, approve spending first
7. **Send** — Execute the transaction

---

## 📁 Project Structure

```
multisendercoin/
├── app/
│   ├── globals.css          # Global styles with modern dark theme
│   ├── layout.js            # Root layout and metadata
│   ├── page.js              # Main page with dynamic import (SSR disabled)
│   └── providers.js         # Wagmi + RainbowKit + React Query setup
├── components/
│   └── Home.js              # Main application component
├── contracts/
│   └── MultiSender.sol      # Advanced multi-send contract
├── lib/
│   ├── contracts.js         # ABIs and Base token configurations
│   └── csvParser.js         # CSV parsing and validation utilities
├── scripts/
│   └── deploy.js            # Hardhat deployment script
├── hardhat.config.js        # Hardhat configuration
├── next.config.js           # Next.js configuration
├── package.json
├── .env.example
└── README.md
```

---

## 🔧 Available Scripts

| Command                    | Description                          |
| -------------------------- | ------------------------------------ |
| `npm run dev`              | Start Next.js development server     |
| `npm run build`            | Build for production                 |
| `npm run start`            | Run production build                  |
| `npm run lint`             | Run ESLint                           |
| `npm run compile`          | Compile Hardhat contracts            |
| `npm run deploy:base-sepolia` | Deploy to Base Sepolia testnet   |
| `npm run deploy:base`      | Deploy to Base mainnet                |

---

## 📊 Contract Details

### Gas Optimization

The contract is optimized for gas efficiency:
- **Batch transfers** — Efficient loop patterns
- **Maximum recipients** — 200 recipients limit to prevent gas issues
- **Minimal storage** — Only essential state variables
- **Event optimization** — Indexed parameters for efficient filtering

### Fee System

- **Default Fee:** 0.5% (50 basis points)
- **Fee Denominator:** 10000 (allows for precise fee calculations)
- **Maximum Fee:** 5% (500 basis points)
- **Fee Collection:** Automatic transfer to fee collector address

### Security Measures

1. **ReentrancyGuard** — Prevents reentrancy attacks
2. **Ownable** — Owner-only admin functions
3. **Pausable** — Emergency pause for security incidents
4. **Input Validation** — Comprehensive checks:
   - No zero addresses
   - No zero amounts
   - Array length matching
   - Recipient count limits
5. **Safe Transfers** — Proper error handling for all transfers

---

## 📝 CSV Upload Format

### Equal Amount Mode

```csv
address
0x742d35Cc6634C0532925a3b844Bc454e4438f44e
0x8ba1f109551bD432803012645Hac136c22C9c8d7
0x1234567890123456789012345678901234567890
```

### Custom Amount Mode

```csv
address,amount
0x742d35Cc6634C0532925a3b844Bc454e4438f44e,1.5
0x8ba1f109551bD432803012645Hac136c22C9c8d7,2.0
0x1234567890123456789012345678901234567890,0.5
```

**Requirements:**
- First row must be headers
- Addresses must be valid Ethereum addresses (0x...)
- Amounts must be positive numbers
- CSV file must have `.csv` extension

**Validation:**
- Invalid addresses are rejected with error messages
- Invalid amounts are flagged
- Duplicate addresses are allowed (intentional for testing)

---

## 🔐 Environment Variables

| Variable                         | Required | Description                               |
| -------------------------------- | -------- | ----------------------------------------- |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes      | WalletConnect Cloud project ID             |
| `NEXT_PUBLIC_MULTI_SENDER_ADDRESS`     | Yes      | Deployed MultiSender contract address      |
| `PRIVATE_KEY`                    | Deploy   | Deployer EOA private key (for deployment)  |
| `BASE_RPC_URL`                   | No       | Base mainnet RPC (default: mainnet.base.org) |
| `BASE_SEPOLIA_RPC_URL`           | No       | Base Sepolia RPC (default: sepolia.base.org) |

---

## 🎯 Use Cases

### Airdrops
Distribute tokens to a large number of recipients efficiently.

### Payroll
Send salaries or payments to multiple employees in one transaction.

### Rewards Distribution
Distribute rewards, dividends, or staking rewards to token holders.

### Community Payouts
Send funds to community members, contributors, or participants.

### Batch Transfers
Any scenario requiring multiple token transfers in a single transaction.

---

## 🧪 Testing

### Testnet Testing

1. Get Base Sepolia ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. Deploy contract to Base Sepolia
3. Test all features with testnet tokens
4. Verify gas costs and transaction success

### Mainnet Deployment

1. **Audit Recommended** — Contract has not been audited
2. **Test Thoroughly** — Use testnet extensively before mainnet
3. **Start Small** — Begin with small amounts
4. **Monitor** — Watch for any unexpected behavior

---

## 🔒 Security Considerations

### Contract Security
- ⚠️ **Not Audited** — Contract has not undergone professional security audit
- ✅ **OpenZeppelin** — Uses battle-tested OpenZeppelin contracts
- ✅ **ReentrancyGuard** — Protection against reentrancy attacks
- ✅ **Input Validation** — Comprehensive validation of all inputs
- ✅ **Emergency Controls** — Pause functionality for security incidents

### Best Practices
- **Test on Testnet** — Always test thoroughly on Base Sepolia first
- **Start Small** — Begin with small amounts on mainnet
- **Verify Contract** — Verify contract source code on BaseScan
- **Monitor Transactions** — Keep track of all transactions
- **Secure Private Keys** — Never commit private keys to version control

### Known Limitations
- **Maximum Recipients:** 200 per transaction (gas optimization)
- **No Refunds:** Once sent, tokens cannot be recovered
- **Fee Deduction:** Platform fee is automatically deducted
- **Pause Risk:** Contract can be paused by owner (emergency only)

---

## 🚀 Recent Improvements

### Smart Contract Enhancements
- ✅ **Native Token Support** — Send ETH/Base directly
- ✅ **Fee System** — Configurable platform fees
- ✅ **Emergency Controls** — Pause and emergency withdrawal
- ✅ **Gas Optimization** — Batch transfer patterns
- ✅ **Transaction Tracking** — Event-based transaction history
- ✅ **Admin Functions** — Owner-only management functions

### UI/UX Improvements
- ✅ **Modern Design** — Complete UI redesign with dark theme
- ✅ **CSV Upload** — Bulk recipient import functionality
- ✅ **Gas Estimation** — Real-time gas cost calculation
- ✅ **Transaction History** — Local storage-based history
- ✅ **Responsive Design** — Mobile-first approach
- ✅ **Accessibility** — Full ARIA and keyboard support
- ✅ **Animations** — Smooth transitions and effects

### Developer Experience
- ✅ **Type Safety** — Full TypeScript-ready structure
- ✅ **Code Organization** — Separated components and utilities
- ✅ **Error Handling** — Comprehensive error messages
- ✅ **Documentation** — Detailed inline comments

---

## 📚 API Reference

### Contract Functions

#### `sendToMany`
```solidity
function sendToMany(
    IERC20 token,
    address[] calldata recipients,
    uint256[] calldata amounts
) external nonReentrant
```

#### `sendEqual`
```solidity
function sendEqual(
    IERC20 token,
    address[] calldata recipients,
    uint256 amountPerRecipient
) external nonReentrant
```

#### `sendNativeToMany`
```solidity
function sendNativeToMany(
    address[] calldata recipients,
    uint256[] calldata amounts
) external payable nonReentrant
```

#### `sendNativeEqual`
```solidity
function sendNativeEqual(
    address[] calldata recipients,
    uint256 amountPerRecipient
) external payable nonReentrant
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- [Base](https://base.org) for the amazing L2 network
- [OpenZeppelin](https://openzeppelin.com) for secure contract libraries
- [RainbowKit](https://rainbowkit.com) for wallet integration
- [wagmi](https://wagmi.sh) and [viem](https://viem.sh) for blockchain interactions
- [Next.js](https://nextjs.org) for the excellent React framework

---

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review contract code comments

---

## ⚠️ Disclaimer

This software is provided "as is" without warranty. Use at your own risk. Always test thoroughly on testnet before using real funds. The contract has not been audited by a professional security firm.

---

**Built with ❤️ for the Base ecosystem**
