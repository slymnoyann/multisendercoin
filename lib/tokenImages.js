// Token logo/image mappings for Base network
export const TOKEN_IMAGES = {
  // Native ETH
  native: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  
  // Base tokens
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png", // USDC
  "0x4200000000000000000000000000000000000006": "https://assets.coingecko.com/coins/images/2518/small/weth.png", // WETH
  "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb": "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png", // DAI
  "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA": "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png", // USDbC
};

export function getTokenImage(address) {
  if (!address || address === "native") {
    return TOKEN_IMAGES.native;
  }
  return TOKEN_IMAGES[address] || null;
}
