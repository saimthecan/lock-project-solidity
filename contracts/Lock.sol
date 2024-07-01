// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

/**
 * @title Lock
 * @dev This contract allows users to lock their ERC20 tokens for a specified time period.
 */
contract Lock {
    IERC20 public token; 
    uint256 public lockerCount;
    uint256 public totalLocked;
    mapping(address => uint256) public lockers;
    mapping(address => uint256) public deadline;

    /**
     * @dev Initializes the contract with the specified ERC20 token address.
     * @param tokenAddress The address of the ERC20 token to be locked.
     */
    constructor(address tokenAddress) {
        require(tokenAddress != address(0), "Invalid token address");
        token = IERC20(tokenAddress);
    }

    /**
     * @notice Locks the specified amount of tokens for the specified time period.
     * @param amount The amount of tokens to lock.
     * @param time The time period in seconds for which the tokens will be locked.
     */
    function lockTokens(uint256 amount, uint256 time) external {
        require(amount > 0, "Token amount must be bigger than 0.");
        require(time > 0, "Locking time must be bigger than 0.");
        
        if (lockers[msg.sender] == 0) lockerCount++;
        
        totalLocked += amount;
        lockers[msg.sender] += amount;
        deadline[msg.sender] = block.timestamp + time;

        bool ok = token.transferFrom(msg.sender, address(this), amount);
        require(ok, "Transfer failed.");
    }

    /**
     * @notice Withdraws the locked tokens after the lock period has expired.
     */
    function withdrawTokens() external {
        require(lockers[msg.sender] > 0, "Not enough token.");
        require(block.timestamp >= deadline[msg.sender], "Deadline is not over.");

        uint256 amount = lockers[msg.sender];
        console.log("<><><>", msg.sender, amount);

        delete lockers[msg.sender];
        delete deadline[msg.sender];
        totalLocked -= amount;
        lockerCount--;
        
        bool ok = token.transfer(msg.sender, amount);
        require(ok, "Transfer failed.");
    }
}
