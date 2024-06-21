import { Fixture } from 'ethereum-waffle'
import { constants } from 'ethers'
import { ethers, waffle } from 'hardhat'

import DragonswapV2Pool from '@dragonswap/v2-core/artifacts/contracts/DragonswapV2Pool.sol/DragonswapV2Pool.json'
import DragonswapV2FactoryJson from '@dragonswap/v2-core/artifacts/contracts/DragonswapV2Factory.sol/DragonswapV2Factory.json'
import NFTDescriptorJson from '@dragonswap/v2-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json'
import NonfungiblePositionManagerJson from '@dragonswap/v2-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import NonfungibleTokenPositionDescriptor from '@dragonswap/v2-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json'
import SwapRouter from '@dragonswap/v2-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json'
import WSEI from './external/WSEI.json'
import { linkLibraries } from './linkLibraries'
import { ISwapRouter } from '../../types/ISwapRouter'
import { IWSEI } from '../../types/IWSEI'
import {
  DragonswapV2Staker,
  TestERC20,
  INonfungiblePositionManager,
  IDragonswapV2Factory,
  IDragonswapV2Pool,
  TestIncentiveId,
} from '../../typechain'
import { NFTDescriptor } from '../../types/NFTDescriptor'
import { FeeAmount, BigNumber, encodePriceSqrt, MAX_GAS_LIMIT } from '../shared'
import { ActorFixture } from './actors'

type WSEIFixture = { wsei: IWSEI }

export const wseiFixture: Fixture<WSEIFixture> = async ([wallet]) => {
  const wsei = (await waffle.deployContract(wallet, {
    bytecode: WSEI.bytecode,
    abi: WSEI.abi,
  })) as IWSEI

  return { wsei }
}

const v2CoreFactoryFixture: Fixture<IDragonswapV2Factory> = async ([wallet]) => {
  return ((await waffle.deployContract(wallet, {
    bytecode: DragonswapV2FactoryJson.bytecode,
    abi: DragonswapV2FactoryJson.abi,
  })) as unknown) as IDragonswapV2Factory
}

export const v2RouterFixture: Fixture<{
  wsei: IWSEI
  factory: IDragonswapV2Factory
  router: ISwapRouter
}> = async ([wallet], provider) => {
  const { wsei } = await wseiFixture([wallet], provider)
  const factory = await v2CoreFactoryFixture([wallet], provider)
  const router = ((await waffle.deployContract(
    wallet,
    {
      bytecode: SwapRouter.bytecode,
      abi: SwapRouter.abi,
    },
    [factory.address, wsei.address]
  )) as unknown) as ISwapRouter

  return { factory, wsei, router }
}

const nftDescriptorLibraryFixture: Fixture<NFTDescriptor> = async ([wallet]) => {
  return (await waffle.deployContract(wallet, {
    bytecode: NFTDescriptorJson.bytecode,
    abi: NFTDescriptorJson.abi,
  })) as NFTDescriptor
}

type DragonswapFactoryFixture = {
  wsei: IWSEI
  factory: IDragonswapV2Factory
  router: ISwapRouter
  nft: INonfungiblePositionManager
  tokens: [TestERC20, TestERC20, TestERC20]
}

export const dragonswapFactoryFixture: Fixture<DragonswapFactoryFixture> = async (wallets, provider) => {
  const { wsei, factory, router } = await v2RouterFixture(wallets, provider)
  const tokenFactory = await ethers.getContractFactory('TestERC20')
  const tokens = (await Promise.all([
    tokenFactory.deploy(constants.MaxUint256.div(2)), // do not use maxu256 to avoid overflowing
    tokenFactory.deploy(constants.MaxUint256.div(2)),
    tokenFactory.deploy(constants.MaxUint256.div(2)),
  ])) as [TestERC20, TestERC20, TestERC20]

  const nftDescriptorLibrary = await nftDescriptorLibraryFixture(wallets, provider)

  const linkedBytecode = linkLibraries(
    {
      bytecode: NonfungibleTokenPositionDescriptor.bytecode,
      linkReferences: {
        'NFTDescriptor.sol': {
          NFTDescriptor: [
            {
              length: 20,
              start: 1681,
            },
          ],
        },
      },
    },
    {
      NFTDescriptor: nftDescriptorLibrary.address,
    }
  )

  const positionDescriptor = await waffle.deployContract(
    wallets[0],
    {
      bytecode: linkedBytecode,
      abi: NonfungibleTokenPositionDescriptor.abi,
    },
    [tokens[0].address]
  )

  const nftFactory = new ethers.ContractFactory(
    NonfungiblePositionManagerJson.abi,
    NonfungiblePositionManagerJson.bytecode,
    wallets[0]
  )
  const nft = (await nftFactory.deploy(
    factory.address,
    wsei.address,
    positionDescriptor.address
  )) as INonfungiblePositionManager

  tokens.sort((a, b) => (a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1))

  return {
    wsei,
    factory,
    router,
    tokens,
    nft,
  }
}

export const mintPosition = async (
  nft: INonfungiblePositionManager,
  mintParams: {
    token0: string
    token1: string
    fee: FeeAmount
    tickLower: number
    tickUpper: number
    recipient: string
    amount0Desired: any
    amount1Desired: any
    amount0Min: number
    amount1Min: number
    deadline: number
  }
): Promise<string> => {
  const transferFilter = nft.filters.Transfer(null, null, null)
  const transferTopic = nft.interface.getEventTopic('Transfer')

  let tokenId: BigNumber | undefined

  const receipt = await (
    await nft.mint(
      {
        token0: mintParams.token0,
        token1: mintParams.token1,
        fee: mintParams.fee,
        tickLower: mintParams.tickLower,
        tickUpper: mintParams.tickUpper,
        recipient: mintParams.recipient,
        amount0Desired: mintParams.amount0Desired,
        amount1Desired: mintParams.amount1Desired,
        amount0Min: mintParams.amount0Min,
        amount1Min: mintParams.amount1Min,
        deadline: mintParams.deadline,
      },
      {
        gasLimit: MAX_GAS_LIMIT,
      }
    )
  ).wait()

  for (let i = 0; i < receipt.logs.length; i++) {
    const log = receipt.logs[i]
    if (log.address === nft.address && log.topics.includes(transferTopic)) {
      // for some reason log.data is 0x so this hack just re-fetches it
      const events = await nft.queryFilter(transferFilter, log.blockHash)
      if (events.length === 1) {
        tokenId = events[0].args?.tokenId
      }
      break
    }
  }

  if (tokenId === undefined) {
    throw 'could not find tokenId after mint'
  } else {
    return tokenId.toString()
  }
}

export type DragonswapFixtureType = {
  factory: IDragonswapV2Factory
  fee: FeeAmount
  nft: INonfungiblePositionManager
  pool01: string
  pool12: string
  poolObj: IDragonswapV2Pool
  router: ISwapRouter
  staker: DragonswapV2Staker
  testIncentiveId: TestIncentiveId
  tokens: [TestERC20, TestERC20, TestERC20]
  token0: TestERC20
  token1: TestERC20
  rewardToken: TestERC20
}
export const dragonswapFixture: Fixture<DragonswapFixtureType> = async (wallets, provider) => {
  const { tokens, nft, factory, router } = await dragonswapFactoryFixture(wallets, provider)
  const signer = new ActorFixture(wallets, provider).stakerDeployer()
  const stakerFactory = await ethers.getContractFactory('DragonswapV2Staker', signer)
  const staker = (await stakerFactory.deploy(factory.address, nft.address, 2 ** 32, 2 ** 32)) as DragonswapV2Staker

  const testIncentiveIdFactory = await ethers.getContractFactory('TestIncentiveId', signer)
  const testIncentiveId = (await testIncentiveIdFactory.deploy()) as TestIncentiveId

  for (const token of tokens) {
    await token.approve(nft.address, constants.MaxUint256)
  }

  const fee = FeeAmount.MEDIUM
  await nft.createAndInitializePoolIfNecessary(tokens[0].address, tokens[1].address, fee, encodePriceSqrt(1, 1))

  await nft.createAndInitializePoolIfNecessary(tokens[1].address, tokens[2].address, fee, encodePriceSqrt(1, 1))

  const pool01 = await factory.getPool(tokens[0].address, tokens[1].address, fee)

  const pool12 = await factory.getPool(tokens[1].address, tokens[2].address, fee)

  const poolObj = poolFactory.attach(pool01) as IDragonswapV2Pool

  return {
    nft,
    router,
    tokens,
    staker,
    testIncentiveId,
    factory,
    pool01,
    pool12,
    fee,
    poolObj,
    token0: tokens[0],
    token1: tokens[1],
    rewardToken: tokens[2],
  }
}

export const poolFactory = new ethers.ContractFactory(DragonswapV2Pool.abi, DragonswapV2Pool.bytecode)
