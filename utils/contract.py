import json

from web3 import Web3


def connect_to_web3(network='goerli', api_key=None):
    """Connect to web3 and return the web3 object and connection status.
    
    Parameters
    ----------
    network : str, optional
        The network to connect to, by default 'goerli'.
    api_key : str
        The API key for the Alchemy API.
    
    Returns
    -------
    w3 : Web3
        The web3 object.
    status : bool
        The connection status.
    """

    if network == 'goerli':
        if api_key is None or api_key == '':
            raise ValueError('API key is required for Alchemy')
        else:
            url = 'https://eth-goerli.g.alchemy.com/v2/' + api_key
    elif network == 'goerli-arbitrum':
        url = 'https://arb-goerli.g.alchemy.com/v2/' + api_key

    w3 = Web3(Web3.HTTPProvider(url))
    status = w3.is_connected()

    return w3, status


def load_contract(w3, contract_address, abi_path):
    """Load the contract ABI from a JSON contract file.
    
    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract_address : str
        The contract address.
    abi_path : str
        The path to the ABI file.
    """

    # Import the contract abi from a file
    with open(abi_path, 'rt', encoding='utf-8') as f:
        contract = json.load(f)
    abi = contract['abi']

    # Connect to the contract in Arbitrum
    contract = w3.eth.contract(address=contract_address, abi=abi)

    return contract
