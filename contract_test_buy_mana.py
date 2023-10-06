"""Buy mana from the contract."""

from utils.config import load_config
from utils.config import setup_custom_logger
from utils.contract import connect_to_web3
from utils.contract import load_contract
from utils.buyer import buy_mana


def main():
    """The main function to mint and NFT."""

    # Load config and setup logger
    config = load_config('config.ini')
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

        # Get crypto balance before buying mana
        eth_balance = w3.eth.get_balance(address)
        print(f'[INFO] ETH balance before purchase: {eth_balance}')

        # Get contract balance before buying mana
        contract_balance = w3.eth.get_balance(contract.address)
        print(f'[INFO] Contract balance before purchase: {contract_balance}')

        # Get mana balance before purchase
        mana_balance = contract.functions.getManaBalance(address).call()
        print(f'[INFO] Mana balance before purchase: {mana_balance}')

        # Buy mana
        packages = [1, 0, 0]

        txn_receipt = buy_mana(w3, contract, private_key, address, packages)

        txn_msg = f'Transaction receipt (buyPackages): {txn_receipt}'
        print(f'[INFO] {txn_msg}')

        # Get mana balance after purchase
        mana_balance = contract.functions.getManaBalance(address).call()
        print(f'[INFO] Mana balance after purchase: {mana_balance}')

        # Get contract balance after buying mana
        contract_balance = w3.eth.get_balance(contract.address)
        print(f'[INFO] Contract balance after purchase: {contract_balance}')

        # Get crypto balance after buying mana
        eth_balance = w3.eth.get_balance(address)
        print(f'[INFO] ETH balance after purchase: {eth_balance}')


if __name__ == '__main__':
    main()
