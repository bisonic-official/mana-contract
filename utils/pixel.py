""""""

import math

from web3.middleware import geth_poa_middleware
import requests

from utils.contract import connect_to_web3
from utils.contract import load_contract


def get_price(config):
    """Get PIXEL price in USDC (1e6).

    Parameters
    ----------
    config : dict
        The config object.
    """

    value_in_usdc = -1

    headers = {
        "X-CMC_PRO_API_KEY": config["pixel"]["api_key"],
        "Accepts": "application/json"
    }

    parameters = {"symbol": "PIXEL"}

    response = requests.get(config["pixel"]["url"],
                            headers=headers,
                            params=parameters,
                            timeout=30)

    if response.status_code == 200:
        data = response.json()["data"]
        value = data["PIXEL"][0]["quote"]["USD"]["price"]

        value_in_usdc = math.ceil(value * 1e6)

    return value_in_usdc


def update_price(config, value):
    """Update PIXEL the price in USDC (1e6) in contract.

    Parameters
    ----------
    config : dict
        The config object.
    value : int
        A 6 digit based value of PIXEL in USDC.
    """

    # Connect to web3
    w3, status = connect_to_web3(network=config["network"]["network"],
                                 api_key=config["network"]["api_key"])

    # Add PoA middleware
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)

    # Load wallet address and wallet key
    address = w3.to_checksum_address(config["account"]["address"])
    private_key = config["account"]["private_key"]

    if status:
        connection_msg = "Web3 connection successful!"
        print(f"[INFO] {connection_msg}")

        # Load the contract
        contract_address = w3.to_checksum_address(
            config["contract"]["address"])
        contract = load_contract(w3, contract_address,
                                 config["contract"]["abi"])

        # Update PIXEL price
        txn_receipt = execute_pixel_update(w3, contract, address, private_key,
                                           value)

        txn_msg = f"Transaction receipt (setPIXELPrice): {txn_receipt}"
        print(f"[INFO] {txn_msg}")


def execute_pixel_update(w3, contract, address, private_key, value):
    """Mint an NFT.

    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract
        The contract object.
    address : str
        The txn sender address.
    private_key : str
        The private key.
    value : int
        The price of PIXEL to update.

    Returns
    -------
    txn : dict
        The transaction dictionary.
    """

    txn = contract.functions.setPIXELPrice(value).build_transaction({
        "nonce":
        w3.eth.get_transaction_count(address),
        "gas":
        100000
    })

    # Sign the transaction
    txn_signed = w3.eth.account.sign_transaction(txn, private_key)

    # Send the transaction and wait for the transaction receipt
    txn_hash = w3.eth.send_raw_transaction(txn_signed.rawTransaction)
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    txn_receipt = txn_receipt.transactionHash.hex()

    return txn_receipt
