# Multiple Sender

Send any ERC20 token to multiple recipients in a single transaction on [Base](https://base.org).

[![Base](https://img.shields.io/badge/Base-0052FF?style=flat&logo=base)](https://base.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.x-FFF?style=flat)](https://hardhat.org)
[![viem](https://img.shields.io/badge/viem-2.x-6B7280?style=flat)](https://viem.sh)
[![RainbowKit](https://img.shields.io/badge/RainbowKit-2.x-FFCDD2?style=flat)](https://rainbowkit.com)

---

## Features

- **Multi-recipient sends** — Distribute any ERC20 to many addresses in one on-chain transaction
- **Two modes:**
  - **Equal amount** — Same amount to each recipient
  - **Custom amounts** — Different amount per address
- **Any ERC20 on Base** — Preset tokens (USDC, WETH, DAI, USDbC) or custom contract address
- **Wallet connect** — [RainbowKit](https://rainbowkit.com) with support for Base and Base Sepolia
- **viem + wagmi** — Type-safe reads and writes to the MultiSender contract

---

## Tech Stack

| Layer        | Stack                          |
| ------------ | ------------------------------ |
| Contract     | Solidity 0.8.20, OpenZeppelin  |
| Tooling      | Hardhat                        |
| Frontend     | Next.js 14, React 18           |
| Blockchain   | viem, wagmi, RainbowKit        |
| Network      | Base, Base Sepolia             |

---

## Prerequisites

- Node.js 18+
- A [WalletConnect Cloud](https://cloud.walletconnect.com) Project ID
- (For deploy) Private key with Base Sepolia or Base mainnet ETH

---

## Quick Start

### 1. Install

```bash
git clone <your-repo-url>
cd multisendercoin
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env`:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — from [WalletConnect Cloud](https://cloud.walletconnect.com)
- `NEXT_PUBLIC_MULTI_SENDER_ADDRESS` — leave empty until you deploy (see below)
- `PRIVATE_KEY` — only if you will run `deploy:base` or `deploy:base-sepolia`

### 3. Deploy the contract

```bash
npm run compile
npm run deploy:base-sepolia   # testnet
# or
npm run deploy:base           # mainnet
```

Copy the printed contract address into `.env` as `NEXT_PUBLIC_MULTI_SENDER_ADDRESS`.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect your wallet, choose a token and mode, add recipients and amounts, then **Approve** (if needed) and **Send**.

---

## Contract

### `MultiSender.sol`

- **`sendToMany(IERC20 token, address[] recipients, uint256[] amounts)`**  
  Sends `amounts[i]` of `token` to `recipients[i]`. Use for custom amounts.

- **`sendEqual(IERC20 token, address[] recipients, uint256 amountPerRecipient)`**  
  Sends `amountPerRecipient` of `token` to each entry in `recipients`.

The contract pulls the total required amount from `msg.sender` and forwards it to the recipients. No ETH is stored; only the ERC20 flow passes through the contract. [ReentrancyGuard](https://docs.openzeppelin.com/contracts/5.x/api/utils#ReentrancyGuard) is used for safety.

---

## Environment variables

| Variable                         | Required | Description                               |
| -------------------------------- | -------- | ----------------------------------------- |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes      | WalletConnect Cloud project ID             |
| `NEXT_PUBLIC_MULTI_SENDER_ADDRESS`     | Yes      | Deployed MultiSender contract address      |
| `PRIVATE_KEY`                    | Deploy   | Deployer EOA private key                   |
| `BASE_RPC_URL`                   | No       | Base mainnet RPC (default: mainnet.base.org) |
| `BASE_SEPOLIA_RPC_URL`           | No       | Base Sepolia RPC (default: sepolia.base.org) |

---

## Scripts

| Command              | Description                    |
| -------------------- | ------------------------------ |
| `npm run dev`        | Start Next.js dev server       |
| `npm run build`      | Build for production           |
| `npm run start`      | Run production build           |
| `npm run compile`    | Compile Hardhat contracts      |
| `npm run deploy:base-sepolia` | Deploy to Base Sepolia  |
| `npm run deploy:base`         | Deploy to Base mainnet   |

---

## Project structure

```
multisendercoin/
├── app/
│   ├── globals.css      # Global and UI styles
│   ├── layout.js        # Root layout and metadata
│   ├── page.js          # Main Multiple Sender UI
│   └── providers.js     # Wagmi + RainbowKit + React Query
├── contracts/
│   └── MultiSender.sol  # ERC20 multi-send logic
├── lib/
│   └── contracts.js     # ABIs and Base token list
├── scripts/
│   └── deploy.js        # Hardhat deploy script
├── hardhat.config.js
├── next.config.js
├── package.json
├── .env.example
└── README.md
```

---

## Security

- The MultiSender contract has not been audited. Use on mainnet at your own risk.
- Test thoroughly on Base Sepolia before using real funds on Base mainnet.

---

## License

MIT
