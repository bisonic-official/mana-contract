require("@nomicfoundation/hardhat-toolbox");
require('solidity-coverage');

// Go to https://www.alchemyapi.io, sign up, create
// a new App in its dashboard, and replace "KEY" with its key
const ALCHEMY_API_KEY = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

// Replace this private key with your Goerli account private key
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key
// Beware: NEVER put real Ether into testing accounts
const GOERLI_PRIVATE_KEY = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    goerli: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [GOERLI_PRIVATE_KEY]
    },
    ronin: {
      chainId: 2020,
      url: 'https://api.roninchain.com/rpc',
      accounts: ['0x0000000000000000000000000000000000000000000000000000000000000000']
    },
    saigon: {
      chainId: 2021,
      url: 'https://saigon-testnet.roninchain.com/rpc',
      accounts: ['0x0000000000000000000000000000000000000000000000000000000000000000']
    },
  }
};
