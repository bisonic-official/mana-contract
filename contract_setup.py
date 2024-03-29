"""Setup the contract by setting the vault address and packages."""

import argparse

from utils.config import load_config
from utils.config import setup_custom_logger
from utils.contract import connect_to_web3
from utils.contract import load_contract
from utils.buyer import set_vault_address
from utils.buyer import set_packages


def build_parser():
    """Builds parser for CLI params.

    Returns
    -------
    parser : argparse.ArgumentParser
        The parser object.
    """

    parser = argparse.ArgumentParser()
    parser.add_argument('-c', '--config', type=str, default='config.ini')

    return parser


def main():
    """The main function to mint and NFT."""

    # Load config and setup logger
    parser = build_parser()
    args = parser.parse_args()

    config = load_config(args.config)
    _ = setup_custom_logger()

    # Connect to web3
    w3, status = connect_to_web3(network=config['network']['network'],
                                 api_key=config['network']['api_key'])
    private_key = config['account']['private_key']
    address = config['account']['address']

    if status:
        connection_msg = 'Web3 connection successful!'
        print(f'[INFO] {connection_msg}')

        # Load the contract
        contract = load_contract(w3, config['contract']['address'],
                                 config['contract']['abi'])

        # Set vault address
        # txn_receipt = set_vault_address(w3, contract, private_key, address,
        #                                 address)
        # txn_msg = f'Transaction receipt (setVaultAddress): {txn_receipt}'
        # print(f'[INFO] {txn_msg}')

        # Verify vault address
        vault_address = contract.functions.vaultAddress().call()
        print(f'[INFO] Vault address: {vault_address}')

        # # Set and verify packages
        # packages = {
        #     'manaQty': [800, 4500, 12500],
        #     'prices': [
        #         20000000000000000, 100000000000000000,
        #         250000000000000000
        #     ],
        # }

        # txn_receipt = set_packages(w3, contract, private_key, address,
        #                            packages)
        # txn_msg = f'Transaction receipt (setPackages): {txn_receipt}'
        # print(f'[INFO] {txn_msg}')

        # Get packages to verify setPackages function
        packages = contract.functions.getPackages().call()
        print(f'[INFO] Packages: {packages}')


if __name__ == '__main__':
    main()
