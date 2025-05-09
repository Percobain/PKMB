// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PKMB721 is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;
    IERC20 public pkmbToken;
    uint256 public mintPrice;

    event NFTMinted(address indexed minter, address indexed recipient, uint256 indexed tokenId, string tokenURI);
    event MintDetailsUpdated(address indexed pkmbTokenAddress, uint256 mintPrice);
    event PKMBWithdrawn(address indexed to, uint256 amount);

    constructor(address initialOwner) ERC721("PKMB NFT", "PKMB_NFT") Ownable(initialOwner) {
        tokenCounter = 0;
    }

    /**
     * @dev Sets the PKMB token address and the mint price for NFTs.
     * Only callable by the owner.
     * @param _pkmbTokenAddress The address of the PKMB ERC20 token.
     * @param _mintPrice The price in PKMB tokens to mint an NFT.
     */
    function setMintDetails(address _pkmbTokenAddress, uint256 _mintPrice) public onlyOwner {
        require(_pkmbTokenAddress != address(0), "PKMB721: PKMB token address cannot be zero");
        require(_mintPrice > 0, "PKMB721: Mint price must be greater than zero");
        pkmbToken = IERC20(_pkmbTokenAddress);
        mintPrice = _mintPrice;
        emit MintDetailsUpdated(_pkmbTokenAddress, _mintPrice);
    }

    /**
     * @dev Mints a new NFT to the recipient after payment with PKMB tokens.
     * @param recipient The address that will receive the minted NFT.
     * @param _tokenURI The URI for the NFT's metadata.
     */
    function mintNFT(address recipient, string memory _tokenURI) public returns (uint256) {
        require(address(pkmbToken) != address(0), "PKMB721: PKMB token address not set");
        require(mintPrice > 0, "PKMB721: Mint price not set or is zero");
        require(recipient != address(0), "PKMB721: Mint to the zero address");

        // Transfer PKMB tokens from the caller to this contract
        uint256 currentAllowance = pkmbToken.allowance(msg.sender, address(this));
        require(currentAllowance >= mintPrice, "PKMB721: Check PKMB token allowance");
        bool success = pkmbToken.transferFrom(msg.sender, address(this), mintPrice);
        require(success, "PKMB721: PKMB token transfer failed");

        uint256 newTokenId = tokenCounter;
        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        tokenCounter++;

        emit NFTMinted(msg.sender, recipient, newTokenId, _tokenURI);
        return newTokenId;
    }

    /**
     * @dev Burns an existing NFT.
     * Only callable by the owner of the token or an approved address.
     * @param tokenId The ID of the token to burn.
     */
    function burnNFT(uint256 tokenId) public {
        // require(_isApprovedOrOwner(msg.sender, tokenId), "PKMB721: Caller is not owner nor approved");
        // _isApprovedOrOwner is an internal function in ERC721.sol.
        // We need to ensure the sender is authorized.
        // ownerOf(tokenId) will revert if token doesn't exist.
        // isApprovedForAll(ownerOf(tokenId), msg.sender) checks operator approval.
        // getApproved(tokenId) == msg.sender checks single token approval.
        require(ownerOf(tokenId) == msg.sender || isApprovedForAll(ownerOf(tokenId), msg.sender) || getApproved(tokenId) == msg.sender, "PKMB721: Caller is not owner nor approved for this token");
        _burn(tokenId);
    }

    /**
     * @dev Allows the owner to withdraw collected PKMB tokens from this contract.
     */
    function withdrawPKMB() public onlyOwner {
        uint256 balance = pkmbToken.balanceOf(address(this));
        require(balance > 0, "PKMB721: No PKMB tokens to withdraw");
        bool success = pkmbToken.transfer(owner(), balance);
        require(success, "PKMB721: PKMB token withdrawal failed");
        emit PKMBWithdrawn(owner(), balance);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     * Overridden to make it external (it's public in ERC721URIStorage).
     */
    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}