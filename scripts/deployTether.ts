import { getJson, saveJson, jsons } from './utils';
import {ethers , network, run} from 'hardhat';

async function main() {
  await run("compile");
  console.log("Compiled contracts...");

  const tetherFactory = await ethers.getContractFactory('Tether');
  const tether = await tetherFactory.deploy();
  await tether.deployed();
  console.log(`Tether address: ${tether.address}`);

  saveJson(jsons.addresses, network.name, 'MockTether', tether.address);

  console.log('Done!');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });