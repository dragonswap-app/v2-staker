# dragonswap-v2-staker

[![Tests](https://github.com/dragonswap-app/v2-staker/workflows/Tests/badge.svg)](https://github.com/dragonswap-app/v2-staker/actions?query=workflow%3ATests)
[![Lint](https://github.com/dragonswap-app/v2-staker/workflows/Lint/badge.svg)](https://github.com/dragonswap-app/v2-staker/actions?query=workflow%3ALint)

This is the staking contract for [Dragonswap V2](https://github.com/dragonswap-app/v2-core).

## Links

- [Contract Design](docs/Design.md)
- [Audit](https://github.com/dragonswap-app/v2-core/blob/main/audits/20240801_Paladin_DragonSwapDEX_Final_Report.pdf)

## Development and Testing

```sh
yarn
yarn test
```

## Gas Snapshots

```sh
# if gas snapshots need to be updated
$ UPDATE_SNAPSHOT=1 yarn test
```

## Contract Sizing

```sh
yarn size-contracts
```
