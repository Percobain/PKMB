const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("PKMB721 Contract", function () {
    async function deployPKMB721Fixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy PKMBToken (ERC20)
        const pkmbTokenFactory = await ethers.getContractFactory("PKMBToken");
        const pkmbToken = await pkmbTokenFactory.deploy(owner.address);
        await pkmbToken.waitForDeployment();
        const pkmbTokenAddress = await pkmbToken.getAddress();

        // Deploy PKMB721 (ERC721)
        const pkmb721Factory = await ethers.getContractFactory("PKMB721");
        const pkmb721 = await pkmb721Factory.deploy(owner.address);
        await pkmb721.waitForDeployment();
        const pkmb721Address = await pkmb721.getAddress();

        return { pkmb721, pkmb721Address, pkmbToken, pkmbTokenAddress, owner, addr1, addr2 };
    }

    describe("Deployment", function () {
        it("Should set the right owner for PKMB721", async function () {
            const { pkmb721, owner } = await loadFixture(deployPKMB721Fixture);
            expect(await pkmb721.owner()).to.equal(owner.address);
        });
        it("Should have correct name and symbol for PKMB721", async function () {
            const { pkmb721 } = await loadFixture(deployPKMB721Fixture);
            expect(await pkmb721.name()).to.equal("PKMB NFT");
            expect(await pkmb721.symbol()).to.equal("PKMB_NFT");
        });
        it("Token counter should be 0 initially", async function () {
            const { pkmb721 } = await loadFixture(deployPKMB721Fixture);
            expect(await pkmb721.tokenCounter()).to.equal(0);
        });
    });

    describe("setMintDetails", function () {
        it("Should allow owner to set mint details", async function () {
            const { pkmb721, pkmbTokenAddress, owner } = await loadFixture(deployPKMB721Fixture);
            const mintPrice = ethers.parseUnits("100", 18);
            await expect(pkmb721.setMintDetails(pkmbTokenAddress, mintPrice))
                .to.emit(pkmb721, "MintDetailsUpdated")
                .withArgs(pkmbTokenAddress, mintPrice);
            expect(await pkmb721.pkmbToken()).to.equal(pkmbTokenAddress);
            expect(await pkmb721.mintPrice()).to.equal(mintPrice);
        });
        it("Should not allow non-owner to set mint details", async function () {
            const { pkmb721, pkmbTokenAddress, addr1 } = await loadFixture(deployPKMB721Fixture);
            const mintPrice = ethers.parseUnits("100", 18);
            await expect(
                pkmb721.connect(addr1).setMintDetails(pkmbTokenAddress, mintPrice)
            ).to.be.revertedWithCustomError(pkmb721, "OwnableUnauthorizedAccount")
            .withArgs(addr1.address);
        });
        it("Should revert if PKMB token address is zero", async function () {
            const { pkmb721, owner } = await loadFixture(deployPKMB721Fixture);
            const mintPrice = ethers.parseUnits("100", 18);
            await expect(
                pkmb721.setMintDetails(ethers.ZeroAddress, mintPrice)
            ).to.be.revertedWith("PKMB721: PKMB token address cannot be zero");
        });
        it("Should revert if mint price is zero", async function () {
            const { pkmb721, pkmbTokenAddress, owner } = await loadFixture(deployPKMB721Fixture);
            await expect(
                pkmb721.setMintDetails(pkmbTokenAddress, 0)
            ).to.be.revertedWith("PKMB721: Mint price must be greater than zero");
        });
    });

    describe("mintNFT", function () {
        const mintPrice = ethers.parseUnits("100", 18);
        const tokenURI = "ipfs://somehash";

        async function setupMint() {
            const fixture = await loadFixture(deployPKMB721Fixture);
            const { pkmb721, pkmbToken, pkmbTokenAddress, owner, addr1 } = fixture;
            await pkmb721.setMintDetails(pkmbTokenAddress, mintPrice);
            // Transfer some PKMB tokens to addr1 for minting
            await pkmbToken.transfer(addr1.address, ethers.parseUnits("200", 18));
            // Addr1 approves PKMB721 contract to spend PKMB tokens
            await pkmbToken.connect(addr1).approve(await pkmb721.getAddress(), mintPrice);
            return fixture;
        }

        it("Should allow users to mint an NFT after paying with PKMB tokens", async function () {
            const { pkmb721, pkmb721Address, pkmbToken, owner, addr1 } = await setupMint();
            const initialContractBalance = await pkmbToken.balanceOf(pkmb721Address);

            await expect(pkmb721.connect(addr1).mintNFT(addr1.address, tokenURI))
                .to.emit(pkmb721, "NFTMinted")
                .withArgs(addr1.address, addr1.address, 0, tokenURI);

            expect(await pkmb721.ownerOf(0)).to.equal(addr1.address);
            expect(await pkmb721.tokenURI(0)).to.equal(tokenURI);
            expect(await pkmb721.tokenCounter()).to.equal(1);
            expect(await pkmbToken.balanceOf(pkmb721Address)).to.equal(initialContractBalance + mintPrice);
        });

        it("Should fail if PKMB token address not set", async function () {
            const { pkmb721, addr1 } = await loadFixture(deployPKMB721Fixture); // No setMintDetails
            await expect(
                pkmb721.connect(addr1).mintNFT(addr1.address, tokenURI)
            ).to.be.revertedWith("PKMB721: PKMB token address not set");
        });

        it("Should fail if mint price not set", async function () {
            const { pkmb721, addr1 } = await loadFixture(deployPKMB721Fixture);
            await expect(
                pkmb721.connect(addr1).mintNFT(addr1.address, tokenURI)
            ).to.be.revertedWith("PKMB721: PKMB token address not set");
        });


        it("Should fail if recipient is zero address", async function () {
            const { pkmb721, addr1 } = await setupMint();
            await expect(
                pkmb721.connect(addr1).mintNFT(ethers.ZeroAddress, tokenURI)
            ).to.be.revertedWith("PKMB721: Mint to the zero address");
        });

        it("Should fail if caller has insufficient PKMB allowance", async function () {
            const { pkmb721, pkmbToken, pkmbTokenAddress, owner, addr1 } = await loadFixture(deployPKMB721Fixture);
            await pkmb721.setMintDetails(pkmbTokenAddress, mintPrice);
            await pkmbToken.transfer(addr1.address, mintPrice);
            // No approval given by addr1
            await expect(
                pkmb721.connect(addr1).mintNFT(addr1.address, tokenURI)
            ).to.be.revertedWith("PKMB721: Check PKMB token allowance");
        });

        it("Should fail if caller has insufficient PKMB balance for transferFrom", async function () {
            const { pkmb721, pkmbToken, pkmbTokenAddress, pkmb721Address, owner, addr1 } = await loadFixture(deployPKMB721Fixture);
            await pkmb721.setMintDetails(pkmbTokenAddress, mintPrice);
            // addr1 has 0 PKMB tokens but gives allowance
            await pkmbToken.connect(addr1).approve(pkmb721Address, mintPrice);
            await expect(
                pkmb721.connect(addr1).mintNFT(addr1.address, tokenURI)
            ).to.be.revertedWithCustomError(pkmbToken, "ERC20InsufficientBalance");
        });
    });

    describe("burnNFT", function () {
        // ... (similar setup as mintNFT, mint one first)
        it("Should allow token owner to burn their NFT", async function () {
            // 1. Setup mint details
            // 2. addr1 mints an NFT (tokenId 0)
            // 3. addr1 calls burnNFT(0)
            // 4. Check NFT is burned (ownerOf(0) should revert)
        });
        it("Should allow approved address to burn NFT", async function () {
            // 1. Setup mint details
            // 2. addr1 mints an NFT (tokenId 0)
            // 3. addr1 approves addr2 for tokenId 0
            // 4. addr2 calls burnNFT(0)
            // 5. Check NFT is burned
        });
        it("Should not allow non-owner/non-approved to burn NFT", async function () {
            // 1. Setup mint details
            // 2. addr1 mints an NFT (tokenId 0)
            // 3. addr2 (unrelated) tries to burnNFT(0) -> should revert
        });
    });

    describe("withdrawPKMB", function () {
        it("Should allow owner to withdraw collected PKMB tokens", async function () {
            // 1. Setup mint details
            // 2. addr1 mints an NFT, contract receives PKMB
            // 3. owner calls withdrawPKMB()
            // 4. Check contract PKMB balance is 0
            // 5. Check owner PKMB balance increased
        });
        it("Should not allow non-owner to withdraw PKMB tokens", async function () {
            // ...
        });
        it("Should revert if no PKMB tokens to withdraw", async function () {
            // ...
        });
    });

    describe("tokenURI", function () {
        it("Should return the correct token URI", async function () {
            // 1. Mint an NFT with a specific URI
            // 2. Call tokenURI(tokenId) and check if it matches
        });
        it("Should revert for non-existent token", async function () {
            const { pkmb721 } = await loadFixture(deployPKMB721Fixture);
            await expect(pkmb721.tokenURI(0)).to.be.revertedWithCustomError(pkmb721, "ERC721NonexistentToken");
        });
    });
});