Let me update your README.md to include a demo video section:

```markdown
# $PKMB - India's Unity Memecoin

![PKMB Logo](./frontend/public/favicon.png)

## Overview

$PKMB is a community-driven memecoin that celebrates India's unity and strength. With a focus on humor and national pride, PKMB offers a unique Web3 experience featuring ERC-20 tokens, NFTs, and community engagement.

Website: [https://www.pkmb.xyz/](https://www.pkmb.xyz/)

## Demo

[PKMB Demo Video](./demo/PKMB.mp4)

Watch the full demo video to see PKMB in action! The video demonstrates the token faucet, NFT minting, and social sharing features.

## Features

### Token Faucet

-   Claim 100 PKMB tokens every 24 hours
-   Simple process requiring only wallet connection
-   No complex requirements or barriers to entry

### NFT Collection

-   Mint custom NFTs representing Indian pride
-   Pay using PKMB tokens (10 PKMB per NFT)
-   Share your NFTs on social media with direct Twitter integration

### Social Sharing

-   Each NFT has a shareable link for social media
-   Twitter integration for easy sharing
-   Custom viewer page for showcasing NFTs

## Project Structure
```

PKMB/
├── contracts/ # Solidity smart contracts
│ ├── scripts/ # Deployment scripts
│ └── test/ # Contract test files
└── frontend/ # React-based web application
├── public/ # Static assets
└── src/
├── abis/ # Contract ABIs
├── components/# UI components
├── pages/ # Main application pages
└── styles/ # CSS and styling

````

## Smart Contracts

The project includes the following smart contracts:

1. **PKMBToken** - An ERC-20 token contract for the $PKMB currency
2. **PKMB721** - An ERC-721 NFT contract for minting custom NFTs
3. **Faucet** - A faucet contract for distributing PKMB tokens

## Technology Stack

-   **Frontend**: React, TypeScript, Vite, TailwindCSS, ShadCn UI
-   **Web3**: Ethers.js, MetaMask integration
-   **Smart Contracts**: Solidity, Hardhat
-   **Storage**: IPFS for decentralized NFT metadata and images

## Development Setup

### Smart Contracts

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
````

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Deployment

Smart contracts are deployed to the blockchain with configurable parameters:

```javascript
// Token faucet configuration
const claimAmount = ethers.parseUnits("100", 18); // 100 PKMB tokens per claim
const claimInterval = 24 * 60 * 60; // 24 hours between claims

// NFT mint configuration
const mintPrice = ethers.parseUnits("10", 18); // 10 PKMB tokens per NFT
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Disclaimer

$PKMB is a memecoin created for entertainment purposes. The project makes humorous references to India-Pakistan relations but is intended for fun and community building only. Please use responsibly.

```

```
