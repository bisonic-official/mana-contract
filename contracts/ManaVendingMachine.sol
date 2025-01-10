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
     * @dev Event to be emited on purchase.
     * @param buyer address The address of the buyer.
     * @param package uint256 The index of the purchased packages.
     * @param quantity uint256 The quantity of the purchased packages.
     */
    event PurchaseEvent(address buyer, uint256 package, uint256 quantity);

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
     * @param _indices uint256[] The indices of each package to purchase.
     * @param _quantities uint256[] The quantity of each package to purchase.
     */
    function purchasePackages(
        uint256[] memory _indices,
        uint256[] memory _quantities
    ) public payable {
        // Array should be the same length as the number of packages
        require(
            _quantities.length == _indices.length,
            "The length of the indices is not the same as the quantities"
        );

        // Loop through the array to calculate the total price
        uint256 totalPrice = 0;
        for (uint8 i = 0; i < _indices.length; i++) {
            require(
                _indices[i] >= 0 && _indices[i] < pkgQty,
                "Package id not valid"
            );
            require(_quantities[i] > 0, "Package qty not valid");

            totalPrice += packages[_indices[i]].price * _quantities[i];
        }

        // Check if the value sent is enough
        require(msg.value == totalPrice, "Value sent is not exact");

        // Save the value to the contract balance
        contractBalance += totalPrice;

        // Emit the events
        for (uint8 i = 0; i < _indices.length; i++) {
            emit PurchaseEvent(msg.sender, _indices[i], _quantities[i]);
        }
    }

    /**
     * @dev Purchase packages.
     * @param _index uint256 The index of the package to purchase.
     * @param _quantity uint256 The quantity of the package to purchase.
     */
    function purchasePackage(uint256 _index, uint256 _quantity) public payable {
        // Array should be the same length as the number of packages
        require(
            _index >= 0 && _index < pkgQty,
            "The index of package is not valid"
        );

        // Loop through the array to calculate the total price
        uint256 totalPrice = packages[_index].price * _quantity;

        // Check if the value sent is enough
        require(msg.value == totalPrice, "Value sent is not exact");

        // Save the value to the contract balance
        contractBalance += totalPrice;

        // Emit the event
        emit PurchaseEvent(msg.sender, _index, _quantity);
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
