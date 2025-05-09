const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    try {
        const [deployer] = await ethers.getSigners();
        const deployerAddress = await deployer.getAddress();
        console.log("Deploying contracts with the account:", deployerAddress);

        // Deploy PKMBToken
        const PKMBToken = await ethers.getContractFactory("PKMBToken");
        const pkmbToken = await PKMBToken.deploy(deployerAddress);
        await pkmbToken.waitForDeployment();
        const pkmbTokenAddress = await pkmbToken.getAddress();
        console.log("PKMBToken deployed to:", pkmbTokenAddress);

        // Deploy PKMB721
        const PKMB721 = await ethers.getContractFactory("PKMB721");
        const pkmb721 = await PKMB721.deploy(deployerAddress);
        await pkmb721.waitForDeployment();
        const pkmb721Address = await pkmb721.getAddress();
        console.log("PKMB721 deployed to:", pkmb721Address);

        // Set mint details for PKMB721
        // Example: 10 PKMB tokens for minting (10 * 10^18)
        const mintPrice = ethers.parseUnits("10", 18); 
        console.log(`Setting mint details for PKMB721: token ${pkmbTokenAddress}, price ${mintPrice.toString()}`);
        const txSetMintDetails = await pkmb721.setMintDetails(pkmbTokenAddress, mintPrice);
        await txSetMintDetails.wait();
        console.log("Mint details set for PKMB721.");

        // Deploy Faucet
        // Example: Claim 100 PKMB tokens (100 * 10^18)
        const claimAmount = ethers.parseUnits("100", 18); 
        // Example: Claim interval 1 day (24 * 60 * 60 seconds)
        const claimInterval = 24 * 60 * 60; 
        const Faucet = await ethers.getContractFactory("Faucet");
        const faucet = await Faucet.deploy(
            deployerAddress,
            pkmbTokenAddress,
            claimAmount,
            claimInterval
        );
        await faucet.waitForDeployment();
        const faucetAddress = await faucet.getAddress();
        console.log("Faucet deployed to:", faucetAddress);

        console.log("\n--- All contracts deployed successfully ---");
        console.log("PKMBToken:", pkmbTokenAddress);
        console.log("PKMB721:", pkmb721Address);
        console.log("Faucet:", faucetAddress);
        console.log("----------------------------------------");

    } catch (error) {
        console.error("Deployment failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });