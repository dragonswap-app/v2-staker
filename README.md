# dragonswap-v2-staker

This is the canonical staking contract for [Dragonswap V2](https://github.com/dragonswap-app/v2-core).

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
