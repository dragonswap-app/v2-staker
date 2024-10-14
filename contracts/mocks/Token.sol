// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Token is ERC20 {
    uint8 private tokenDecimals;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) ERC20(_name, _symbol) {
        tokenDecimals = uint8(_decimals);
        _mint(msg.sender, 100_000_000 * 10**_decimals);
    }

    function decimals() public view virtual override returns (uint8) {
        return tokenDecimals;
    }
}
