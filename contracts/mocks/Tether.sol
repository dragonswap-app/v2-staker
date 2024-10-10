// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Tether is ERC20 {
    constructor() ERC20("Tether", "USDT") {
        _mint(msg.sender, 100_000_000 * 10e6);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}