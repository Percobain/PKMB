// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PKMBToken is ERC20, Ownable {
    constructor(address initialOwner) ERC20("PKMB Token", "PKMB") Ownable(initialOwner) {
        // Mint 1 billion tokens to the initial owner.
        // 1 billion = 1,000,000,000
        // ERC20 tokens usually have 18 decimal places.
        // So, the amount to mint is 1,000,000,000 * (10**18).
        _mint(initialOwner, 1000000000 * (10**uint256(decimals())));
    }

    /**
     * @dev Creates `amount` new tokens and assigns them to `to`.
     * Emits a {Transfer} event with `from` set to the zero address.
     * Requirements:
     * - `to` cannot be the zero address.
     * - Only callable by the contract owner.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Destroys `amount` tokens from the caller.
     * See {ERC20-_burn}.
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, deducting from the caller's
     * allowance. See {ERC20-_burn} and {ERC20-allowance}.
     * Requirements:
     * - the caller must have allowance for ``accounts``'s tokens of at least
     * `amount`.
     */
    function burnFrom(address account, uint256 amount) public {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }

    /**
     * @dev Allows the contract owner to withdraw any PKMB tokens that were
     * mistakenly sent to this contract's address.
     */
    function withdrawStuckPKMB() public onlyOwner {
        uint256 balance = balanceOf(address(this));
        require(balance > 0, "PKMBToken: No PKMB tokens to withdraw from contract");
        _transfer(address(this), owner(), balance);
    }

    /**
     * @dev Allows the contract owner to withdraw any other ERC20 tokens
     * that were mistakenly sent to this contract's address.
     * @param tokenContract The address of the ERC20 token to withdraw.
     */
    function withdrawStuckERC20(IERC20 tokenContract) public onlyOwner {
        require(address(tokenContract) != address(0), "PKMBToken: Token address cannot be zero");
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance > 0, "PKMBToken: No tokens of this type to withdraw from contract");
        bool success = tokenContract.transfer(owner(), balance);
        require(success, "PKMBToken: ERC20 token transfer failed");
    }
}