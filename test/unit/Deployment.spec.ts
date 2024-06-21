import { LoadFixtureFunction } from '../types'
import { ethers } from 'hardhat'
import { DragonswapV2Staker } from '../../typechain'
import { dragonswapFixture, DragonswapFixtureType } from '../shared/fixtures'
import { expect } from '../shared'
import { createFixtureLoader, provider } from '../shared/provider'

let loadFixture: LoadFixtureFunction

describe('unit/Deployment', () => {
  let context: DragonswapFixtureType

  before('loader', async () => {
    loadFixture = createFixtureLoader(provider.getWallets(), provider)
  })

  beforeEach('create fixture loader', async () => {
    context = await loadFixture(dragonswapFixture)
  })

  it('deploys and has an address', async () => {
    const stakerFactory = await ethers.getContractFactory('DragonswapV2Staker')
    const staker = (await stakerFactory.deploy(
      context.factory.address,
      context.nft.address,
      2 ** 32,
      2 ** 32
    )) as DragonswapV2Staker
    expect(staker.address).to.be.a.string
  })

  it('sets immutable variables', async () => {
    const stakerFactory = await ethers.getContractFactory('DragonswapV2Staker')
    const staker = (await stakerFactory.deploy(
      context.factory.address,
      context.nft.address,
      2 ** 32,
      2 ** 32
    )) as DragonswapV2Staker

    expect(await staker.factory()).to.equal(context.factory.address)
    expect(await staker.nonfungiblePositionManager()).to.equal(context.nft.address)
    expect(await staker.maxIncentiveDuration()).to.equal(2 ** 32)
    expect(await staker.maxIncentiveStartLeadTime()).to.equal(2 ** 32)
  })
})
