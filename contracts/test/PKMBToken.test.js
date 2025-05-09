const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("PKMBToken Contract", function () {
    async function deployPKMBTokenFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const pkmbTokenFactory = await ethers.getContractFactory("PKMBToken");
        const pkmbToken = await pkmbTokenFactory.deploy(owner.address);
        await pkmbToken.waitForDeployment();
        const pkmbTokenAddress = await pkmbToken.getAddress();
        return { pkmbToken, pkmbTokenAddress, owner, addr1, addr2 };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { pkmbToken, owner } = await loadFixture(deployPKMBTokenFixture);
            expect(await pkmbToken.owner()).to.equal(owner.address);
        });

        it("Should assign the total supply of tokens to the owner", async function () {
            const { pkmbToken, owner } = await loadFixture(deployPKMBTokenFixture);
            const ownerBalance = await pkmbToken.balanceOf(owner.address);
            const expectedSupply = ethers.parseUnits("1000000000", 18); // 1 billion tokens with 18 decimals
            expect(await pkmbToken.totalSupply()).to.equal(expectedSupply);
            expect(ownerBalance).to.equal(expectedSupply);
        });

        it("Should have correct name and symbol", async function () {
            const { pkmbToken } = await loadFixture(deployPKMBTokenFixture);
            expect(await pkmbToken.name()).to.equal("PKMB Token");
            expect(await pkmbToken.symbol()).to.equal("PKMB");
        });
    });

    describe("Transactions", function () {
        it("Should transfer tokens between accounts", async function () {
            const { pkmbToken, owner, addr1, addr2 } = await loadFixture(deployPKMBTokenFixture);
            const amount = ethers.parseUnits("100", 18);

            // Transfer 100 tokens from owner to addr1
            await expect(pkmbToken.transfer(addr1.address, amount))
                .to.emit(pkmbToken, "Transfer")
                .withArgs(owner.address, addr1.address, amount);
            expect(await pkmbToken.balanceOf(addr1.address)).to.equal(amount);

            // Transfer 50 tokens from addr1 to addr2
            await expect(pkmbToken.connect(addr1).transfer(addr2.address, ethers.parseUnits("50", 18)))
                .to.emit(pkmbToken, "Transfer")
                .withArgs(addr1.address, addr2.address, ethers.parseUnits("50", 18));
            expect(await pkmbToken.balanceOf(addr2.address)).to.equal(ethers.parseUnits("50", 18));
        });

        it("Should fail if sender doesn’t have enough tokens", async function () {
            const { pkmbToken, owner, addr1 } = await loadFixture(deployPKMBTokenFixture);
            const initialOwnerBalance = await pkmbToken.balanceOf(owner.address);
            const amount = ethers.parseUnits("1", 18);

            await expect(
                pkmbToken.connect(addr1).transfer(owner.address, amount) // addr1 has 0 tokens
            ).to.be.revertedWithCustomError(pkmbToken, "ERC20InsufficientBalance");

            expect(await pkmbToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
        });
    });

    describe("Minting", function () {
        it("Should allow owner to mint tokens", async function () {
            const { pkmbToken, owner, addr1 } = await loadFixture(deployPKMBTokenFixture);
            const amount = ethers.parseUnits("500", 18);
            const initialTotalSupply = await pkmbToken.totalSupply();

            await expect(pkmbToken.mint(addr1.address, amount))
                .to.emit(pkmbToken, "Transfer")
                .withArgs(ethers.ZeroAddress, addr1.address, amount);

            expect(await pkmbToken.balanceOf(addr1.address)).to.equal(amount);
            expect(await pkmbToken.totalSupply()).to.equal(initialTotalSupply + amount);
        });

        it("Should not allow non-owner to mint tokens", async function () {
            const { pkmbToken, addr1, addr2 } = await loadFixture(deployPKMBTokenFixture);
            const amount = ethers.parseUnits("100", 18);
            await expect(
                pkmbToken.connect(addr1).mint(addr2.address, amount)
            ).to.be.revertedWithCustomError(pkmbToken, "OwnableUnauthorizedAccount")
            .withArgs(addr1.address);
        });
    });

    describe("Burning", function () {
        it("Should allow users to burn their tokens", async function () {
            const { pkmbToken, owner } = await loadFixture(deployPKMBTokenFixture);
            const burnAmount = ethers.parseUnits("100", 18);
            const initialOwnerBalance = await pkmbToken.balanceOf(owner.address);
            const initialTotalSupply = await pkmbToken.totalSupply();

            await expect(pkmbToken.burn(burnAmount))
                .to.emit(pkmbToken, "Transfer")
                .withArgs(owner.address, ethers.ZeroAddress, burnAmount);

            expect(await pkmbToken.balanceOf(owner.address)).to.equal(initialOwnerBalance - burnAmount);
            expect(await pkmbToken.totalSupply()).to.equal(initialTotalSupply - burnAmount);
        });

        it("Should not allow burning more tokens than balance", async function () {
            const { pkmbToken, addr1 } = await loadFixture(deployPKMBTokenFixture);
            const burnAmount = ethers.parseUnits("100", 18);
            await expect(
                pkmbToken.connect(addr1).burn(burnAmount) // addr1 has 0 tokens
            ).to.be.revertedWithCustomError(pkmbToken, "ERC20InsufficientBalance");
        });

        it("Should allow approved address to burnFrom", async function () {
            const { pkmbToken, owner, addr1 } = await loadFixture(deployPKMBTokenFixture);
            const transferAmount = ethers.parseUnits("200", 18);
            const burnAmount = ethers.parseUnits("100", 18);
            await pkmbToken.transfer(addr1.address, transferAmount); // Give addr1 some tokens

            const initialAddr1Balance = await pkmbToken.balanceOf(addr1.address);
            const initialTotalSupply = await pkmbToken.totalSupply();

            await pkmbToken.connect(addr1).approve(owner.address, burnAmount); // addr1 approves owner to spend
            await expect(pkmbToken.connect(owner).burnFrom(addr1.address, burnAmount))
                .to.emit(pkmbToken, "Transfer")
                .withArgs(addr1.address, ethers.ZeroAddress, burnAmount);

            expect(await pkmbToken.balanceOf(addr1.address)).to.equal(initialAddr1Balance - burnAmount);
            expect(await pkmbToken.totalSupply()).to.equal(initialTotalSupply - burnAmount);
        });

        it("Should not allow burnFrom without allowance", async function () {
            const { pkmbToken, owner, addr1 } = await loadFixture(deployPKMBTokenFixture);
            const transferAmount = ethers.parseUnits("100", 18);
            await pkmbToken.transfer(addr1.address, transferAmount);
            const burnAmount = ethers.parseUnits("50", 18);

            await expect(
                pkmbToken.connect(owner).burnFrom(addr1.address, burnAmount)
            ).to.be.revertedWithCustomError(pkmbToken, "ERC20InsufficientAllowance");
        });
    });

    describe("Withdraw Stuck Tokens", function () {
        it("Should allow owner to withdraw stuck PKMB tokens", async function () {
            const { pkmbToken, pkmbTokenAddress, owner } = await loadFixture(deployPKMBTokenFixture);
            const stuckAmount = ethers.parseUnits("100", 18);
            await pkmbToken.transfer(pkmbTokenAddress, stuckAmount); // Send tokens to the contract itself

            expect(await pkmbToken.balanceOf(pkmbTokenAddress)).to.equal(stuckAmount);
            const ownerInitialBalance = await pkmbToken.balanceOf(owner.address);

            await expect(pkmbToken.withdrawStuckPKMB())
                .to.emit(pkmbToken, "Transfer")
                .withArgs(pkmbTokenAddress, owner.address, stuckAmount);

            expect(await pkmbToken.balanceOf(pkmbTokenAddress)).to.equal(0);
            expect(await pkmbToken.balanceOf(owner.address)).to.equal(ownerInitialBalance + stuckAmount);
        });

        it("Should not allow non-owner to withdraw stuck PKMB tokens", async function () {
            const { pkmbToken, pkmbTokenAddress, addr1 } = await loadFixture(deployPKMBTokenFixture);
            const stuckAmount = ethers.parseUnits("100", 18);
            await pkmbToken.transfer(pkmbTokenAddress, stuckAmount);

            await expect(
                pkmbToken.connect(addr1).withdrawStuckPKMB()
            ).to.be.revertedWithCustomError(pkmbToken, "OwnableUnauthorizedAccount")
            .withArgs(addr1.address);
        });

        it("Should allow owner to withdraw other stuck ERC20 tokens", async function () {
            const { pkmbToken, pkmbTokenAddress, owner, addr1 } = await loadFixture(deployPKMBTokenFixture);

            // Deploy a dummy ERC20 token
            const DummyERC20 = await ethers.getContractFactory("PKMBToken"); // Using PKMBToken as a generic ERC20
            const dummyToken = await DummyERC20.deploy(owner.address);
            await dummyToken.waitForDeployment();
            const dummyTokenAddress = await dummyToken.getAddress();

            const stuckAmount = ethers.parseUnits("50", 18);
            await dummyToken.transfer(pkmbTokenAddress, stuckAmount); // Send dummy tokens to PKMBToken contract

            expect(await dummyToken.balanceOf(pkmbTokenAddress)).to.equal(stuckAmount);
            const ownerInitialDummyBalance = await dummyToken.balanceOf(owner.address);

            await expect(pkmbToken.withdrawStuckERC20(dummyTokenAddress))
                .to.emit(dummyToken, "Transfer") // Event from dummyToken
                .withArgs(pkmbTokenAddress, owner.address, stuckAmount);

            expect(await dummyToken.balanceOf(pkmbTokenAddress)).to.equal(0);
            expect(await dummyToken.balanceOf(owner.address)).to.equal(ownerInitialDummyBalance + stuckAmount);
        });
    });
});