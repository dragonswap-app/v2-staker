import { saveJson, jsons } from './utils';
import { ethers , network, run } from "hardhat";


async function main() {
  // Compile contracts.
  await run("compile");
  console.log("Compiled contracts...");

  const name = "MockToken";
  const symbol = "MTKN";
  const decimals = 6;

  const mockTokenFactory = await ethers.getContractFactory('Token');
  const mockToken = await mockTokenFactory.deploy(name, symbol, decimals);
  await mockToken.deployed();
  console.log(`MockToken address: ${mockToken.address}`);

  saveJson(jsons.addresses, network.name, 'MockToken', mockToken.address);

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