
require('dotenv').config();

const path = require("path");
const HDWalletProvider = require('@truffle/hdwallet-provider');

const mnemonic = process.env.MNEMONIC;
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
const infuraNode = process.env.INFURA_NODE;

module.exports = {
  networks: {
    develop: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    rinkeby: {
      provider: function() {
       return new HDWalletProvider(mnemonic, infuraNode);
      },
      network_id: 4
    }
  },
  compilers: {
    solc: {
      version: "0.8.11",
    }
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: etherscanApiKey
  },
};
