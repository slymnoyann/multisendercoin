const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying MultiSender with account:", deployer.address);

  const MultiSender = await hre.ethers.getContractFactory("MultiSender");
  const multiSender = await MultiSender.deploy();
  await multiSender.waitForDeployment();

  const address = await multiSender.getAddress();
  console.log("MultiSender deployed to:", address);
  console.log("Save this address for NEXT_PUBLIC_MULTI_SENDER_ADDRESS in .env");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
