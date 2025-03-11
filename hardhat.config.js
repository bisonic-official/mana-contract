require('@nomicfoundation/hardhat-toolbox');
require('solidity-coverage');
require('hardhat-deploy');

// Ensure your configuration variables are set before executing the script
const { vars } = require("hardhat/config");


const ALCHEMY_API_KEY = "";
const SEPOLIA_PRIVATE_KEY = "";
const MAINNET_PRIVATE_KEY = "";
const PRIVATE_KEY = "";


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  namedAccounts: {
    deployer: 'privatekey://',
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    ethereum: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [MAINNET_PRIVATE_KEY]
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY]
    },
    ronin: {
      chainId: 2020,
      url: 'https://api.roninchain.com/rpc',
      gasPrice: 21_000_000_000,
      accounts: [PRIVATE_KEY],
    },
    saigon: {
      chainId: 2021,
      url: 'https://saigon-testnet.roninchain.com/rpc',
      gasPrice: 21_000_000_000,
      accounts: [PRIVATE_KEY],
    }
  },
  etherscan: {
    apiKey: ""
  }
};