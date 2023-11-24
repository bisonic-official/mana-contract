"""Withdraw ETH from the contract."""

from utils.config import load_config
from utils.config import setup_custom_logger
from utils.contract import connect_to_web3
from utils.contract import load_contract
from utils.buyer import withdraw_all_eth
from utils.buyer import withdraw_eth


def main():
    """The main function to test ETH withdrawals from contract."""

    # Load config and setup logger
    config = load_config('config.eth.ini')
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

        # Verify vault address
        vault_address = contract.functions.vaultAddress().call()
        print(f'[INFO] Vault address: {vault_address}')

        # Get crypto balance before withdraw
        eth_balance = w3.eth.get_balance(address)
        print(f'[INFO] Wallet ETH balance before withdraw: {eth_balance}')

        # Get contract balance
        contract_balance = w3.eth.get_balance(contract.address)
        print(
            f'[INFO] Contract ETH balance before withdraw: {contract_balance}')

        # Withdraw ETH
        txn_receipt = withdraw_eth(w3, contract, private_key, address, 1)
        txn_msg = f'Transaction receipt (withdraw): {txn_receipt}'
        print(f'[INFO] {txn_msg}')

        # # Withdraw all ETH
        # txn_receipt = withdraw_all_eth(w3, contract, private_key, address)
        # txn_msg = f'Transaction receipt (withdrawAll): {txn_receipt}'
        # print(f'[INFO] {txn_msg}')

        # Get crypto balance after withdraw
        eth_balance = w3.eth.get_balance(address)
        print(f'[INFO] Wallet ETH balance after withdraw: {eth_balance}')

        # Get contract balance after withdraw
        contract_balance = w3.eth.get_balance(contract.address)
        print(
            f'[INFO] Contract ETH balance after withdraw: {contract_balance}')


if __name__ == '__main__':
    main()
