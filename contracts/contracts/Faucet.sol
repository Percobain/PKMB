// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Faucet is Ownable, ReentrancyGuard {
    IERC20 public pkmbToken;
    uint256 public claimAmount;
    uint256 public claimInterval;
    bool public paused;

    mapping(address => uint256) public lastClaimTime;

    event TokensClaimed(address indexed recipient, uint256 amount, uint256 timestamp);
    event TokenSet(address indexed tokenAddress);
    event ClaimAmountSet(uint256 newAmount);
    event ClaimIntervalSet(uint256 newInterval);
    event FaucetPaused(bool isPaused);
    event TokensWithdrawnByOwner(address indexed owner, uint256 amount);
    event StuckTokensWithdrawnByOwner(address indexed tokenAddress, address indexed owner, uint256 amount);

    constructor(
        address initialOwner,
        address _tokenAddress,
        uint256 _claimAmount,
        uint256 _claimInterval
    ) Ownable(initialOwner) {
        require(_tokenAddress != address(0), "Faucet: Token address cannot be zero");
        require(_claimAmount > 0, "Faucet: Claim amount must be greater than zero");
        require(_claimInterval > 0, "Faucet: Claim interval must be greater than zero");

        pkmbToken = IERC20(_tokenAddress);
        claimAmount = _claimAmount;
        claimInterval = _claimInterval;
        paused = false;

        emit TokenSet(_tokenAddress);
        emit ClaimAmountSet(_claimAmount);
        emit ClaimIntervalSet(_claimInterval);
    }

    /**
     * @dev Allows a user to claim PKMB tokens.
     * Requirements:
     * - Faucet must not be paused.
     * - PKMB token address must be set.
     * - Claim amount must be greater than zero.
     * - User must wait for the claimInterval to pass since their last claim.
     * - Faucet must have enough PKMB tokens to fulfill the claim.
     */
    function claimTokens() external nonReentrant {
        require(!paused, "Faucet: Faucet is currently paused");
        require(address(pkmbToken) != address(0), "Faucet: Token address not set");
        require(claimAmount > 0, "Faucet: Claim amount not set or is zero");
        require(block.timestamp >= lastClaimTime[msg.sender] + claimInterval, "Faucet: Claim interval not yet passed");
        require(pkmbToken.balanceOf(address(this)) >= claimAmount, "Faucet: Not enough tokens in faucet");

        lastClaimTime[msg.sender] = block.timestamp;
        bool success = pkmbToken.transfer(msg.sender, claimAmount);
        require(success, "Faucet: Token transfer failed");

        emit TokensClaimed(msg.sender, claimAmount, block.timestamp);
    }

    // --- Owner Functions ---

    /**
     * @dev Sets the PKMB token address.
     * Only callable by the owner.
     * @param _tokenAddress The address of the PKMB ERC20 token.
     */
    function setToken(address _tokenAddress) external onlyOwner {
        require(_tokenAddress != address(0), "Faucet: Token address cannot be zero");
        pkmbToken = IERC20(_tokenAddress);
        emit TokenSet(_tokenAddress);
    }

    /**
     * @dev Sets the amount of tokens users can claim.
     * Only callable by the owner.
     * @param _amount The new claim amount.
     */
    function setClaimAmount(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Faucet: Claim amount must be greater than zero");
        claimAmount = _amount;
        emit ClaimAmountSet(_amount);
    }

    /**
     * @dev Sets the interval between claims.
     * Only callable by the owner.
     * @param _interval The new claim interval in seconds (e.g., 1 days for daily).
     */
    function setClaimInterval(uint256 _interval) external onlyOwner {
        require(_interval > 0, "Faucet: Claim interval must be greater than zero");
        claimInterval = _interval;
        emit ClaimIntervalSet(_interval);
    }

    /**
     * @dev Pauses or unpauses the faucet.
     * Only callable by the owner.
     * @param _pauseState True to pause, false to unpause.
     */
    function setPaused(bool _pauseState) external onlyOwner {
        paused = _pauseState;
        emit FaucetPaused(_pauseState);
    }

    /**
     * @dev Allows the owner to withdraw PKMB tokens from the faucet contract.
     * This can be used to retrieve excess tokens or to empty the faucet.
     * Only callable by the owner.
     * @param _amount The amount of PKMB tokens to withdraw.
     */
    function withdrawPKMBTokens(uint256 _amount) external onlyOwner nonReentrant {
        require(_amount > 0, "Faucet: Withdraw amount must be greater than zero");
        uint256 balance = pkmbToken.balanceOf(address(this));
        require(balance >= _amount, "Faucet: Not enough PKMB tokens in faucet to withdraw specified amount");
        bool success = pkmbToken.transfer(owner(), _amount);
        require(success, "Faucet: PKMB token withdrawal failed");
        emit TokensWithdrawnByOwner(owner(), _amount);
    }

    /**
     * @dev Allows the owner to withdraw all remaining PKMB tokens from the faucet contract.
     * Only callable by the owner.
     */
    function withdrawAllPKMBTokens() external onlyOwner nonReentrant {
        uint256 balance = pkmbToken.balanceOf(address(this));
        require(balance > 0, "Faucet: No PKMB tokens to withdraw");
        bool success = pkmbToken.transfer(owner(), balance);
        require(success, "Faucet: PKMB token withdrawal failed");
        emit TokensWithdrawnByOwner(owner(), balance);
    }

    /**
     * @dev Allows the contract owner to withdraw any other ERC20 tokens
     * that were mistakenly sent to this contract's address.
     * @param _otherTokenContract The address of the ERC20 token to withdraw.
     */
    function withdrawStuckERC20(IERC20 _otherTokenContract) external onlyOwner nonReentrant {
        require(address(_otherTokenContract) != address(0), "Faucet: Token address cannot be zero");
        require(address(_otherTokenContract) != address(pkmbToken), "Faucet: Cannot withdraw PKMB token using this function");

        uint256 balance = _otherTokenContract.balanceOf(address(this));
        require(balance > 0, "Faucet: No tokens of this type to withdraw from contract");

        bool success = _otherTokenContract.transfer(owner(), balance);
        require(success, "Faucet: Stuck ERC20 token transfer failed");
        emit StuckTokensWithdrawnByOwner(address(_otherTokenContract), owner(), balance);
    }
}