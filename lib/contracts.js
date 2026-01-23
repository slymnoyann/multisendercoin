export const MULTI_SENDER_ABI = [
  // ERC20 Functions
  {
    inputs: [
      { internalType: "contract IERC20", name: "token", type: "address" },
      { internalType: "address[]", name: "recipients", type: "address[]" },
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    name: "sendToMany",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract IERC20", name: "token", type: "address" },
      { internalType: "address[]", name: "recipients", type: "address[]" },
      { internalType: "uint256", name: "amountPerRecipient", type: "uint256" },
    ],
    name: "sendEqual",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Native Token Functions
  {
    inputs: [
      { internalType: "address[]", name: "recipients", type: "address[]" },
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    name: "sendNativeToMany",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "recipients", type: "address[]" },
      { internalType: "uint256", name: "amountPerRecipient", type: "uint256" },
    ],
    name: "sendNativeEqual",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  // View Functions
  {
    inputs: [{ internalType: "uint256", name: "txId", type: "uint256" }],
    name: "getTransaction",
    outputs: [
      {
        components: [
          { internalType: "address", name: "token", type: "address" },
          { internalType: "address", name: "sender", type: "address" },
          { internalType: "uint256", name: "recipientCount", type: "uint256" },
          { internalType: "uint256", name: "totalAmount", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "uint256", name: "fee", type: "uint256" },
        ],
        internalType: "struct MultiSender.Transaction",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "estimateFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feePercentage",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "transactionCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeCollector",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  // Admin functions
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "bool", name: "whitelisted", type: "bool" },
    ],
    name: "setTokenWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "bool", name: "blacklisted", type: "bool" },
    ],
    name: "setRecipientBlacklist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint128", name: "minAmount", type: "uint128" },
      { internalType: "uint128", name: "maxAmount", type: "uint128" },
    ],
    name: "setAmountLimits",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // View functions
  {
    inputs: [{ internalType: "uint256[]", name: "txIds", type: "uint256[]" }],
    name: "getMultipleTransactions",
    outputs: [
      {
        components: [
          { internalType: "address", name: "token", type: "address" },
          { internalType: "address", name: "sender", type: "address" },
          { internalType: "uint32", name: "recipientCount", type: "uint32" },
          { internalType: "uint64", name: "timestamp", type: "uint64" },
          { internalType: "uint128", name: "totalAmount", type: "uint128" },
          { internalType: "uint128", name: "fee", type: "uint128" },
        ],
        internalType: "struct MultiSender.Transaction[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
    name: "calculateFeeForAmounts",
    outputs: [{ internalType: "uint256", name: "totalFee", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getStats",
    outputs: [
      { internalType: "uint256", name: "totalTransactions", type: "uint256" },
      { internalType: "uint256", name: "totalVolume", type: "uint256" },
      { internalType: "uint256", name: "totalFees", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "getTokenVolume",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "sender", type: "address" }],
    name: "getSenderTransactionCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "whitelistedTokens",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "blacklistedRecipients",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "token", type: "address" },
      { indexed: true, name: "sender", type: "address" },
      { indexed: true, name: "txId", type: "uint256" },
      { indexed: false, name: "recipientCount", type: "uint256" },
      { indexed: false, name: "totalAmount", type: "uint256" },
      { indexed: false, name: "fee", type: "uint256" },
    ],
    name: "TokensSent",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "sender", type: "address" },
      { indexed: true, name: "txId", type: "uint256" },
      { indexed: false, name: "recipientCount", type: "uint256" },
      { indexed: false, name: "totalAmount", type: "uint256" },
      { indexed: false, name: "fee", type: "uint256" },
    ],
    name: "NativeTokensSent",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "oldFee", type: "uint256" },
      { indexed: false, name: "newFee", type: "uint256" },
    ],
    name: "FeeUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "token", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "EmergencyWithdraw",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "token", type: "address" },
      { indexed: true, name: "sender", type: "address" },
      { indexed: true, name: "txId", type: "uint256" },
      { indexed: false, name: "recipientCount", type: "uint256" },
      { indexed: false, name: "totalAmount", type: "uint256" },
      { indexed: false, name: "fee", type: "uint256" },
      { indexed: false, name: "recipients", type: "address[]" },
      { indexed: false, name: "amounts", type: "uint256[]" },
    ],
    name: "TokensSentDetailed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "sender", type: "address" },
      { indexed: true, name: "txId", type: "uint256" },
      { indexed: false, name: "recipientCount", type: "uint256" },
      { indexed: false, name: "totalAmount", type: "uint256" },
      { indexed: false, name: "fee", type: "uint256" },
      { indexed: false, name: "recipients", type: "address[]" },
      { indexed: false, name: "amounts", type: "uint256[]" },
    ],
    name: "NativeTokensSentDetailed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "whitelisted", type: "bool" },
    ],
    name: "TokenWhitelisted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "recipient", type: "address" },
      { indexed: false, name: "blacklisted", type: "bool" },
    ],
    name: "RecipientBlacklisted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "minAmount", type: "uint128" },
      { indexed: false, name: "maxAmount", type: "uint128" },
    ],
    name: "AmountLimitsUpdated",
    type: "event",
  },
];

export const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

/** Base mainnet: Native ETH, USDC, WETH, DAI, etc. */
export const BASE_TOKENS = [
  { address: "native", symbol: "ETH", decimals: 18, name: "Ethereum" },
  { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", decimals: 6, name: "USD Coin" },
  { address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, name: "Wrapped Ether" },
  { address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", symbol: "DAI", decimals: 18, name: "Dai Stablecoin" },
  { address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", symbol: "USDbC", decimals: 6, name: "USD Base Coin" },
];
