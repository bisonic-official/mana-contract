//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ManaVendingMachine is Ownable {
    /**
     * @notice Vault address.
     * @notice This address will receive all the funds after withdrawal.
     */
    address payable public vaultAddress;

    /**
     * @notice Contract balance.
     * @notice This contract will hold funds after mana purchase until withdrawal.
     */
    uint256 public contractBalance;

    /**
     * @notice Package struct.
     * @notice This struct defines the mana quantity and price of a package.
     */
    struct Package {
        string packageId;
        uint256 price;
    }

    /**
     * @notice Package struct.
     * @notice This struct defines the mana quantity and price of a package.
     */
    struct Balances {
        uint256 packageIndex;
        uint256 quantity;
    }

    /**
     * @notice Define maximum integer value.
     */
    uint256 MAX_INT = type(uint256).max;

    /**
     * @notice Number of packages.
     * @notice This number should be the same as the length of the packages array.
     */
    uint8 public pkgQty = 50;
    Package[] public packages;

    /**
     * @notice Package balances.
     * @notice This mapping stores the package balance of each address.
     */
    mapping(address => mapping(uint256 => uint256)) public packageBalances;
    mapping(address => uint256[]) private packageKeys;

    /**
     * @dev Event to be emited on purchase.
     * @param buyer address The address of the buyer.
     * @param quantity uint256[] The quantity of the purchased packages.
     */
    event PurchaseEvent(address buyer, uint256[] quantity);

    /**
     * @dev Event to be emited on purchase.
     * @param buyer address The address of the buyer.
     * @param packageIndex uint256 The index of the purchased package.
     * @param quantity uint256 The quantity of the purchased package.
     */
    event PackagePurchased(
        address buyer,
        uint256 packageIndex,
        uint256 quantity
    );

    /**
     * @dev Constructor function.
     */
    constructor() Ownable(msg.sender) {
        // Set the owner and vaultAddress as the contract creator
        vaultAddress = payable(msg.sender);

        for (uint8 i = 0; i < pkgQty; i++) {
            packages.push(Package("0x0", MAX_INT));
        }
    }

    /**
     * @dev Set the vault address.
     * @param _vaultAdress address The address of the vault.
     */
    function setVaultAddress(address _vaultAdress) external onlyOwner {
        vaultAddress = payable(_vaultAdress);
    }

    /**
     * @dev Get the number of packages defined in contract.
     * @return uint8 The number of packages.
     */
    function getPkgQty() public view returns (uint8) {
        return pkgQty;
    }

    /**
     * @dev Get the mana balance of an address.
     * @param _address address The address to check.
     * @return uint The mana balance.
     */
    function getBalances(
        address _address
    ) public view returns (Balances[] memory) {
        uint256 length = packageKeys[_address].length;
        Balances[] memory balances = new Balances[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 packageId = packageKeys[_address][i];
            balances[i] = Balances(
                packageId,
                packageBalances[_address][packageId]
            );
        }

        return balances;
    }

    /**
     * @dev Get the packages list.
     * @return Package[] The list of packages.
     */
    function getPackages() public view returns (Package[] memory) {
        return packages;
    }

    /**
     * @dev Get a package from its id.
     * @param packageIndex uint8 The index of the package.
     * @return Package The package.
     */
    function getPackageFromIndex(
        uint8 packageIndex
    ) public view returns (Package memory) {
        // Id should be in the size of the packages array
        require(
            packageIndex < packages.length,
            "The packageIndex must be in the size of the packages array"
        );

        return packages[packageIndex];
    }

    /**
     * @dev Set the packages.
     * @param _packageIds string[] An array with the Id of each package.
     * @param _prices uint256[] An array with the price of each package.
     */
    function setPackages(
        string[] calldata _packageIds,
        uint256[] calldata _prices
    ) external onlyOwner {
        // Arrays should be the same length
        require(
            _packageIds.length == _prices.length,
            "Packages Ids and prices arrays must have the same length"
        );

        // Arrays should be the same size as pkgQty (packages quantity)
        require(
            _packageIds.length == pkgQty,
            "Packages Ids and prices arrays must have the same length as pkgQty"
        );

        // Loop through the arrays and create the packages
        for (uint8 i = 0; i < _packageIds.length; i++) {
            packages[i] = Package(_packageIds[i], _prices[i]);
        }
    }

    /**
     * @dev Purchase packages.
     * @param _quantity uint256[] The quantity of each package to purchase.
     */
    function purchasePackages(uint256[] memory _quantity) public payable {
        // Array should be the same length as the number of packages
        require(
            _quantity.length == packages.length,
            "The length of the array is not the same as the number of packages"
        );

        // Loop through the array to calculate the total price
        uint256 totalPrice = 0;
        for (uint8 i = 0; i < _quantity.length; i++) {
            totalPrice += packages[i].price * _quantity[i];
        }

        // Check if the value sent is enough
        require(msg.value == totalPrice, "Value sent is not exact");

        // Update the user's balance
        for (uint8 i = 0; i < _quantity.length; i++) {
            if (_quantity[i] != 0) {
                packageKeys[msg.sender].push(i);
                packageBalances[msg.sender][i] += _quantity[i];
                emit PackagePurchased(msg.sender, i, _quantity[i]);
            }
        }

        // Save the value to the contract balance
        contractBalance += totalPrice;

        // Emit the event
        // emit PurchaseEvent(msg.sender, _quantity);
    }

    /**
     * @dev Withdraw funds to the vault using call.
     * @param _amount uint256 The amount to withdraw.
     */
    function withdraw(uint256 _amount) external onlyOwner {
        contractBalance -= _amount;

        (bool success, ) = vaultAddress.call{value: _amount}("");
        require(success, "Withdraw was not successful");
    }

    /**
     * @dev Withdraw all the funds to the vaultAdress using call.
     */
    function withdrawAll() external onlyOwner {
        uint256 _amount = contractBalance;
        contractBalance = 0;

        (bool success, ) = vaultAddress.call{value: _amount}("");
        require(success, "Withdraw all was not successful");
    }
}
