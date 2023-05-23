//SPDX-License-Identifier: UNLICENSED

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";

// Functions
// SetPackagesPrices(array prices) onlyOwner -> Changed to setPackages()
// GetPackagePrices() public -> Changed to getPackages()
// SetVaultAddress onlyOwner
// function buyMana(array packages)

// Pending
// Whitdraw(amount) onlyOwner
// WhitdrawAll(amount) onlyOwner

contract ManaVendingMachine is Ownable {
    // ManaVault contract address
    address payable public vaultAdress;

    // Mapping of Mana balances
    mapping(address => uint) public manaBalances;

    // Create structure for a package
    struct Package {
        uint32 manaQty;
        uint32 price;
    }

    // List of packages available for sale
    uint8 public pkgQty = 10;
    Package[] public packages;

    // Contract constructor: set owner
    constructor() {
        // Set the owner as the contract creator
        Ownable(msg.sender);

        for (uint8 i = 0; i < pkgQty; i++) {
            packages.push(Package(0, 0));
        }
    }

    // Setter of vaultAdress
    function setVaultAddress(address _vaultAdress) external onlyOwner {
        vaultAdress = payable(_vaultAdress);
    }

    // Getter of pkgQty
    function getPkgQty() public view returns (uint8) {
        return pkgQty;
    }

    // Get balance of a given address
    function getManaBalance(address _address) public view returns (uint) {
        return manaBalances[_address];
    }

    // Getter for the list of packages
    function getPackages() public view returns (Package[] memory) {
        return packages;
    }

    // Getter for the list of packages
    function getPackageFromId(
        uint8 pkgId
    ) public view returns (Package memory) {
        return packages[pkgId];
    }

    // Set the list of packages
    function setPackages(
        uint32[] calldata _manaQty,
        uint32[] calldata _prices
    ) external onlyOwner {
        // Check if the arrays have the same length
        require(
            _manaQty.length == _prices.length,
            "Mana quantity and prices arrays must have the same length"
        );

        // Arrays should be shorter than pkgQty
        require(
            _manaQty.length <= pkgQty,
            "Mana quantity and prices arrays must be shorter than pkgQty"
        );

        // Empty the packages array
        for (uint8 i = 0; i < pkgQty; i++) {
            packages[i] = Package(0, 0);
        }

        // Loop through the arrays and create the packages
        for (uint8 i = 0; i < _manaQty.length; i++) {
            packages[i] = Package(_manaQty[i], _prices[i]);
        }
    }

    // Buy a package
    function purchasePackages(uint8[] memory _qty) public payable {
        // Check if the length of the array is the same as the number of packages
        require(
            _qty.length == packages.length,
            "The length of the array is not the same as the number of packages"
        );

        // Loop through the array to calculate the total price
        uint256 totalEth = 0;
        uint256 totalMana = 0;
        for (uint8 i = 0; i < _qty.length; i++) {
            totalEth += packages[i].price * _qty[i];
            totalMana += packages[i].manaQty * _qty[i];
        }

        // Check if the value sent is enough
        require(msg.value >= totalEth, "Value sent is not enough");

        // Send the value to the vault
        vaultAdress.transfer(msg.value);

        // Add the mana to the user's balance
        manaBalances[msg.sender] += totalMana;
    }
}
