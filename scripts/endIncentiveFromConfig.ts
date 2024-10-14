import { ethers, network, run } from "hardhat";
import config from "../config";
import { jsons, sleep, getJson } from "./utils";

const wait = async () => {
  await sleep(3000);
};

const main = async () => {
  // Get network data from Hardhat config
  const networkName = network.name;

  // Check if the network is supported
  if (networkName === "testnet" || networkName === "mainnet") {
    console.log(`Ending incentive on ${networkName} network...`);

    // Compile contracts
    await run("compile");
    console.log("Compiled contracts...");

    const dragonswapV2StakerAddress = config.dragonswapV2Staker[networkName];

    const dragonswapV2Staker = await ethers.getContractAt(
      "DragonswapV2Staker",
      dragonswapV2StakerAddress,
    );

    // Load the incentive to end details from config
    const incentiveFromConfing = {
      rewardToken: config.rewardToken[networkName],
      pool: config.pool[networkName],
      startTime: config.startTime[networkName],
      endTime: config.endTime[networkName],
      refundee: config.refundee[networkName]
    };

    await wait();
    // End the incentive
    const endIncentiveTx = await dragonswapV2Staker.endIncentive(incentiveFromConfing);

    const endIncentiveTxReceipt = await endIncentiveTx.wait();

    console.log("Incentive ended. Transaction hash:", endIncentiveTxReceipt.transactionHash);

    // Get the refund amount from the transaction logs
    const refundEvent = endIncentiveTxReceipt.events?.find(e => e.event === "IncentiveEnded");
    const refundAmount = refundEvent?.args?.refund;

    const rewardTokenContract = await ethers.getContractAt("Token", incentiveFromConfing.rewardToken);
    const rewardTokenDecimals = await rewardTokenContract.decimals();

    console.log("Refund amount:", ethers.utils.formatUnits(refundAmount, rewardTokenDecimals));

  } else {
    console.log(`Ending incentive on ${networkName} network is not supported...`);
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
