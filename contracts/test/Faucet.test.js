const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Faucet Contract", function () {
    const claimAmount = ethers.parseUnits("100", 18); // 100 PKMB
    const claimInterval = 24 * 60 * 60; // 1 day in seconds

    async function deployFaucetFixture() {
        const [owner, user1, user2] = await ethers.getSigners();

        // Deploy PKMBToken
        const pkmbTokenFactory = await ethers.getContractFactory("PKMBToken");
        const pkmbToken = await pkmbTokenFactory.deploy(owner.address);
        await pkmbToken.waitForDeployment();
        const pkmbTokenAddress = await pkmbToken.getAddress();

        // Deploy Faucet
        const faucetFactory = await ethers.getContractFactory("Faucet");
        const faucet = await faucetFactory.deploy(owner.address, pkmbTokenAddress, claimAmount, claimInterval);
        await faucet.waitForDeployment();
        const faucetAddress = await faucet.getAddress();

        // Fund the Faucet with PKMB tokens
        const faucetFundAmount = ethers.parseUnits("10000", 18); // 10,000 PKMB
        await pkmbToken.transfer(faucetAddress, faucetFundAmount);

        return { faucet, faucetAddress, pkmbToken, pkmbTokenAddress, owner, user1, user2 };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { faucet, owner } = await loadFixture(deployFaucetFixture);
            expect(await faucet.owner()).to.equal(owner.address);
        });
        it("Should set the correct PKMB token address", async function () {
            const { faucet, pkmbTokenAddress } = await loadFixture(deployFaucetFixture);
            expect(await faucet.pkmbToken()).to.equal(pkmbTokenAddress);
        });
        it("Should set the correct claim amount and interval", async function () {
            const { faucet } = await loadFixture(deployFaucetFixture);
            expect(await faucet.claimAmount()).to.equal(claimAmount);
            expect(await faucet.claimInterval()).to.equal(claimInterval);
        });
        it("Should not be paused initially", async function () {
            const { faucet } = await loadFixture(deployFaucetFixture);
            expect(await faucet.paused()).to.be.false;
        });
        it("Faucet should have received funds", async function () {
            const { faucet, pkmbToken } = await loadFixture(deployFaucetFixture);
            const faucetFundAmount = ethers.parseUnits("10000", 18);
            expect(await pkmbToken.balanceOf(await faucet.getAddress())).to.equal(faucetFundAmount);
        });
    });

    describe("claimTokens", function () {
        it("Should allow a user to claim tokens", async function () {
            const { faucet, pkmbToken, user1 } = await loadFixture(deployFaucetFixture);
            const initialUserBalance = await pkmbToken.balanceOf(user1.address);

            await expect(faucet.connect(user1).claimTokens())
                .to.emit(faucet, "TokensClaimed")
                .withArgs(user1.address, claimAmount, (await time.latest()) + 1); // timestamp might be off by 1

            expect(await pkmbToken.balanceOf(user1.address)).to.equal(initialUserBalance + claimAmount);
            expect(await faucet.lastClaimTime(user1.address)).to.be.closeTo(await time.latest(), 2);
        });

        it("Should not allow claiming tokens before interval passes", async function () {
            const { faucet, user1 } = await loadFixture(deployFaucetFixture);
            await faucet.connect(user1).claimTokens(); // First claim
            await expect(
                faucet.connect(user1).claimTokens() // Second claim immediately
            ).to.be.revertedWith("Faucet: Claim interval not yet passed");
        });

        it("Should allow claiming after interval passes", async function () {
            const { faucet, pkmbToken, user1 } = await loadFixture(deployFaucetFixture);
            await faucet.connect(user1).claimTokens(); // First claim
            const firstClaimUserBalance = await pkmbToken.balanceOf(user1.address);

            await time.increase(claimInterval + 1); // Increase time

            await expect(faucet.connect(user1).claimTokens())
                .to.emit(faucet, "TokensClaimed");
            expect(await pkmbToken.balanceOf(user1.address)).to.equal(firstClaimUserBalance + claimAmount);
        });

        it("Should fail if faucet is paused", async function () {
            const { faucet, owner, user1 } = await loadFixture(deployFaucetFixture);
            await faucet.connect(owner).setPaused(true);
            await expect(
                faucet.connect(user1).claimTokens()
            ).to.be.revertedWith("Faucet: Faucet is currently paused");
        });

        it("Should fail if faucet has insufficient funds", async function () {
            const { faucet, pkmbToken, owner, user1 } = await loadFixture(deployFaucetFixture);
            // Withdraw all funds from faucet
            const faucetBalance = await pkmbToken.balanceOf(await faucet.getAddress());
            await faucet.connect(owner).withdrawPKMBTokens(faucetBalance);

            await expect(
                faucet.connect(user1).claimTokens()
            ).to.be.revertedWith("Faucet: Not enough tokens in faucet");
        });
    });

    describe("Owner Functions", function () {
        it("setToken: Should allow owner to set token address", async function () {
            // ...
        });
        it("setClaimAmount: Should allow owner to set claim amount", async function () {
            // ...
        });
        it("setClaimInterval: Should allow owner to set claim interval", async function () {
            // ...
        });
        it("setPaused: Should allow owner to pause and unpause", async function () {
            // ...
        });
        it("withdrawPKMBTokens: Should allow owner to withdraw specific amount", async function () {
            // ...
        });
        it("withdrawAllPKMBTokens: Should allow owner to withdraw all tokens", async function () {
            // ...
        });
        it("withdrawStuckERC20: Should allow owner to withdraw other stuck ERC20s", async function () {
            // ...
        });
        // Add tests for non-owner calls failing for each owner function
    });
});