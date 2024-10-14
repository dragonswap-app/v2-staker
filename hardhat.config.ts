import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-contract-sizer'
import { HardhatUserConfig } from 'hardhat/config'
import { SolcUserConfig, NetworkUserConfig } from 'hardhat/types'
import 'solidity-coverage'
import "dotenv/config";

const accounts = process.env.PK ? [process.env.PK] : [];

const DEFAULT_COMPILER_SETTINGS: SolcUserConfig = {
  version: '0.7.6',
  settings: {
    optimizer: {
      enabled: true,
      runs: 1_000_000,
    },
    metadata: {
      bytecodeHash: 'none',
    },
  },
}

if (process.env.RUN_COVERAGE == '1') {
  /**
   * Updates the default compiler settings when running coverage.
   *
   * See https://github.com/sc-forks/solidity-coverage/issues/417#issuecomment-730526466
   */
  console.info('Using coverage compiler settings')
  DEFAULT_COMPILER_SETTINGS.settings.details = {
    yul: true,
    yulDetails: {
      stackAllocation: true,
    },
  }
}

const seiTestnet: NetworkUserConfig = {
  url: "https://evm-rpc-testnet.sei-apis.com",
  chainId: 1328,
  accounts: accounts,
};

const seiMainnet: NetworkUserConfig = {
  url: "https://evm-rpc.sei-apis.com",
  chainId: 1329,
  accounts: accounts,
};

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
    },
    mainnet: seiMainnet,
    testnet: seiTestnet,
  },
  solidity: {
    compilers: [DEFAULT_COMPILER_SETTINGS],
  },
  contractSizer: {
    alphaSort: false,
    disambiguatePaths: true,
    runOnCompile: false,
  },
}

if (process.env.ETHERSCAN_API_KEY) {
  config.etherscan = {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API_KEY,
  }
}

export default config
