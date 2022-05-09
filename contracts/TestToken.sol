// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor(uint256 supply) ERC20("TestToken", "Test") {
        _mint(msg.sender, supply * (10**18));
    }
}
