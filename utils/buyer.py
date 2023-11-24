"""Buyer utility functions."""

import logging


def set_vault_address(w3, contract, private_key, owner_address, vault_address):
    """Set the vault address.

    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract
        The contract object.
    private_key : str
        The private key.
    owner_address : str
        The owner address.
    vault_address : str
        The vault address.

    Returns
    -------
    txn : dict
        The transaction dictionary.
    """

    logger = logging.getLogger('buyer')

    txn = contract.functions.setVaultAddress(vault_address).build_transaction({
        'nonce':
        w3.eth.get_transaction_count(owner_address),
        'gas':
        100000
    })

    # Sign the transaction
    txn_signed = w3.eth.account.sign_transaction(txn, private_key)

    # Send the transaction and wait for the transaction receipt
    txn_hash = w3.eth.send_raw_transaction(txn_signed.rawTransaction)
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    txn_receipt = txn_receipt.transactionHash.hex()

    log_msg = f"TXN with hash: { txn_receipt }"
    logger.info(log_msg)

    return txn_receipt


def set_packages(w3, contract, private_key, owner_address, packages):
    """Set the packages.

    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract
        The contract object.
    private_key : str
        The private key.
    packages : dict
        The packages dictionary.

    Returns
    -------
    txn : dict
        The transaction dictionary.
    """

    logger = logging.getLogger('buyer')

    txn = contract.functions.setPackages(
        packages['manaQty'], packages['prices']).build_transaction({
            'nonce':
            w3.eth.get_transaction_count(owner_address),
            'gas':
            100000
        })

    # Sign the transaction
    txn_signed = w3.eth.account.sign_transaction(txn, private_key)

    # Send the transaction and wait for the transaction receipt
    txn_hash = w3.eth.send_raw_transaction(txn_signed.rawTransaction)
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    txn_receipt = txn_receipt.transactionHash.hex()

    log_msg = f"TXN with hash: { txn_receipt }"
    logger.info(log_msg)

    return txn_receipt


def buy_mana(w3, contract, private_key, buyer_address, amounts):
    """Mint an NFT.

    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract
        The contract object.
    private_key : str
        The private key.
    buyer_address : str
        The buyer address.
    amounts : list
        The amount of MANA to buy.

    Returns
    -------
    txn : dict
        The transaction dictionary.
    """

    logger = logging.getLogger('buyer')
    packages = contract.functions.getPackages().call()
    total = 0

    for i, amount in enumerate(amounts):
        total += packages[i][1] * amount

    txn = contract.functions.purchasePackages(amounts).build_transaction({
        'nonce':
        w3.eth.get_transaction_count(buyer_address),
        'gas':
        100000,
        'value':
        total,
    })

    # Sign the transaction
    txn_signed = w3.eth.account.sign_transaction(txn, private_key)

    # Send the transaction and wait for the transaction receipt
    txn_hash = w3.eth.send_raw_transaction(txn_signed.rawTransaction)
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    txn_receipt = txn_receipt.transactionHash.hex()

    log_msg = f"TXN with hash: { txn_receipt }"
    logger.info(log_msg)

    return txn_receipt


def withdraw_eth(w3, contract, private_key, owner_address, amount):
    """Withdraw ETH.

    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract
        The contract object.
    private_key : str
        The private key.
    owner_address : str
        The owner address.
    amount : int
        The amount of Mana to withdraw.

    Returns
    -------
    txn : dict
        The transaction dictionary.
    """

    logger = logging.getLogger('buyer')

    txn = contract.functions.withdraw(amount).build_transaction({
        'nonce':
        w3.eth.get_transaction_count(owner_address),
        'gas':
        100000
    })

    # Sign the transaction
    txn_signed = w3.eth.account.sign_transaction(txn, private_key)

    # Send the transaction and wait for the transaction receipt
    txn_hash = w3.eth.send_raw_transaction(txn_signed.rawTransaction)
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    txn_receipt = txn_receipt.transactionHash.hex()

    log_msg = f"TXN with hash: { txn_receipt }"
    logger.info(log_msg)

    return txn_receipt


def withdraw_all_eth(w3, contract, private_key, owner_address):
    """Withdraw all Mana.

    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract
        The contract object.
    private_key : str
        The private key.
    owner_address : str
        The owner address.

    Returns
    -------
    txn : dict
        The transaction dictionary.
    """

    logger = logging.getLogger('buyer')

    txn = contract.functions.withdrawAll().build_transaction({
        'nonce':
        w3.eth.get_transaction_count(owner_address),
        'gas':
        100000
    })

    # Sign the transaction
    txn_signed = w3.eth.account.sign_transaction(txn, private_key)

    # Send the transaction and wait for the transaction receipt
    txn_hash = w3.eth.send_raw_transaction(txn_signed.rawTransaction)
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    txn_receipt = txn_receipt.transactionHash.hex()

    log_msg = f"TXN with hash: { txn_receipt }"
    logger.info(log_msg)

    return txn_receipt
