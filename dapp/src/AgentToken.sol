// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title AgentToken
 * @notice Simple ERC20 token with fixed supply for AI chess agents
 * @dev Minted once at deployment, no mint/burn capabilities
 */
contract AgentToken is ERC20 {
    /// @notice Fixed supply of 1 billion tokens
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;

    /**
     * @notice Deploy a new agent token
     * @param name Token name (e.g., "AgentChess Alpha")
     * @param symbol Token symbol (e.g., "AGENT")
     * @param factory Address to mint all tokens to (AgentFactory)
     */
    constructor(
        string memory name,
        string memory symbol,
        address factory
    ) ERC20(name, symbol) {
        require(factory != address(0), "Invalid factory address");
        _mint(factory, TOTAL_SUPPLY);
    }
}
