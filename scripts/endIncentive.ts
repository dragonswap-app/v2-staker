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

    const dragonswapV2StakerAddress = config.Address.DragonswapV2Staker[networkName];

    const dragonswapV2Staker = await ethers.getContractAt(
      "DragonswapV2Staker",
      dragonswapV2StakerAddress,
    );

    // // Load the incentive to end details from config
    // const latestIncentive = {
    //   rewardToken: config.Address.RewardToken[networkName],
    //   pool: config.Address.Pool[networkName],
    //   startTime: config.StartTime[networkName],
    //   endTime: config.EndTime[networkName],
    //   refundee: config.Address.Refundee[networkName]
    // };

    // Load the latest incentive details from incentives.json
    const latestIncentive = getJson(jsons.incentives)[networkName]["LatestIncentive"];

    // Create the incentive key
    const incentiveKey = {
      rewardToken: latestIncentive.rewardToken,
      pool: latestIncentive.pool,
      startTime: latestIncentive.startTime,
      endTime: latestIncentive.endTime,
      refundee: latestIncentive.refundee
    };

    await wait();
    // End the incentive
    const endIncentiveTx = await dragonswapV2Staker.endIncentive(incentiveKey);

    const endIncentiveTxReceipt = await endIncentiveTx.wait();

    console.log("Incentive ended. Transaction hash:", endIncentiveTxReceipt.transactionHash);

    // Get the refund amount from the transaction logs
    const refundEvent = endIncentiveTxReceipt.events?.find(e => e.event === "IncentiveEnded");
    const refundAmount = refundEvent?.args?.refund;

    const rewardTokenContract = await ethers.getContractAt("Token", latestIncentive.rewardToken);
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
