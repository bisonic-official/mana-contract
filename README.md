# Mana Contract 📃

This repository contains some explorations of basic Mana contract deployed to the ETH Goerli Testnet.

## Setup

1. Clone this repository
2. Install dependencies:
    - NPM Dependencies: `npm install`
    - Python dependencies: `pip install -r requirements.txt`

### Deploying the Mana Contract to Goerli

1. Add your `GOERLI_PRIVATE_KEY` in `hardhat.config.js`.
2. Run `npx hardhat compile` to compile the contracts.
3. Run `npx hardhat run scripts/deploy.js --network goerli` to deploy the contract to Goerli.
4. Once the contract is deployed, copy the address of the contract and paste it in the ´[contract]´ section of the `config.ini` file.

### Running the Tests and Coverage

1. Add your `GOERLI_PRIVATE_KEY` in `hardhat.config.js`.
2. Run `npx hardhat test` to run the tests.
3. Run `npx hardhat coverage` to run the coverage.

> **Note:** The results of the coverage can be found in: `coverage/index.html`

### Running the Python Scripts

#### Run Contract setup

1. Add your `api_key` in the `config.ini` file. Fill missing fields with the information of your choice.
2. Set the values in the `contract_setup.py` script in order to specify the vault address as well as the Mana packages.
2. Run `python contract_setup.py` to run the script and set the mana contract.

#### Run Mana Buying Tests

1. Add your `api_key` in the `config.ini` file. Fill missing fields with the information of your choice.
2. Edit the `contract_test_buy_mana.py` script to add the buyer address and the mana amount.
3. Run `python contract_buy_mana.py` to run the script and buy mana.

#### Run Withdrawal Tests

1. Add your `api_key` in the `config.ini` file. Fill missing fields with the information of your choice.
2. Please, be sure the vault address is set. You can use the the `contract_setup.py` script for this.
3. Edit the `contract_test_widthdraw.py` script to add the amount or use the `withdraw_all` function.
4. Run `python contract_test_widthdraw.py` to run the script and transfer an Item.
