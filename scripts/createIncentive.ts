import { ethers, network, run } from "hardhat";
import config from "../config";
import { saveJson, jsons, sleep } from "./utils";
import { parseUnits } from "ethers/lib/utils";

const wait = async () => {
  await sleep(3000);
};

const main = async () => {
  // Get network data from Hardhat config (see hardhat.config.ts).
  const networkName = network.name;

  // Check if the network is supported.
  if (networkName === "testnet" || networkName === "mainnet") {
    console.log(`Creating incentive on ${networkName} network...`);

    const zeroAddress = ethers.constants.AddressZero;
    const refundeeAddress = config.Address.Refundee[networkName];

    // Check if the addresses in the config are set.
    if (refundeeAddress === zeroAddress) {
      throw new Error("Missing refundee address");
    }

    // Compile contracts.
    await run("compile");
    console.log("Compiled contracts...");

    const dragonswapV2StakerAddress = config.Address.DragonswapV2Staker[networkName];

    const dragonswapV2Staker = await ethers.getContractAt(
      "DragonswapV2Staker",
      dragonswapV2StakerAddress,
    );

    // Define incentive parameters
    const rewardToken = config.Address.RewardToken[networkName]; // Address of the reward token
    const pool = config.Address.Pool[networkName]; // Address of the Dragonswap V2 pool
    const startTime = config.StartTime[networkName]; // Start time
    const endTime = config.EndTime[networkName]; // End time
    const refundee = refundeeAddress; // Address to receive leftover rewards

    // Create the incentive key
    const incentiveKey = {
      rewardToken,
      pool,
      startTime,
      endTime,
      refundee
    };

    // Approve the DragonswapV2Staker contract to spend reward tokens
    const rewardTokenContract = await ethers.getContractAt("Token", rewardToken);
    const rewardTokenDecimals = await rewardTokenContract.decimals();
    const rewardAmount = parseUnits(config.RewardAmount[networkName].toString(), rewardTokenDecimals);
    await rewardTokenContract.approve(dragonswapV2StakerAddress, rewardAmount);

    await wait();

    // Create the incentive
    const createIncentiveTx = await dragonswapV2Staker.createIncentive(
      incentiveKey,
      rewardAmount
    );

    const createIncentiveTxReceipt = await createIncentiveTx.wait();

    console.log("Incentive created. Transaction hash:", createIncentiveTxReceipt.transactionHash);

    // Save the incentive details
    saveJson(
      jsons.incentives,
      network.name,
      "LatestIncentive",
      {
        rewardToken,
        pool,
        startTime,
        endTime,
        refundee,
        rewardAmount: rewardAmount.toString()
      }
    );
  } else {
    console.log(`Creating incentive on ${networkName} network is not supported...`);
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
