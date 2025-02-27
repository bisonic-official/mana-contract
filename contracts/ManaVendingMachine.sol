//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ManaVendingMachine is Ownable {
    /**
     * @notice Pyth contract address.
     * @notice Must be set during deployment.
     */
    IPyth pyth;

    /**
     * @notice The USDC contract address.
     * @notice Must be set during deployment.
     */
    IERC20 public usdcToken;

    /**
     * @notice The XPToken contract address.
     * @notice Must be set during deployment.
     */
    IERC20 public xpToken;

    /**
     * @notice XP rate vlaue
     * @notice This is used to convert the equivalence between XP and USDC.
     */
    uint256 xpRate = 100;

    /**
     * @notice Enables payments with Tokens
     * @notice This is used to lock payments with specific tokens.
     */
    bool cryptoEnabled = true;
    bool usdcTokenEnabled = true;
    bool xpTokenEnabled = true;

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
    uint8 pkgQty = 50;
    Package[] packages;

    /**
     * @notice Package struct.
     * @notice This struct defines the mana quantity and price of a package.
     */
    struct FeedID {
        string symbol;
        bytes32 id;
    }

    /**
     * @notice Number of packages.
     * @notice This number should be the same as the length of the packages array.
     */
    uint8 feedQty = 3;
    FeedID[] feedIDs;

    /**
     * @dev Event to be emited on purchase.
     * @param buyer address The address of the buyer.
     * @param package uint256 The index of the purchased packages.
     * @param quantity uint256 The quantity of the purchased packages.
     */
    event PurchaseEvent(address buyer, uint256 package, uint256 quantity);

    /**
     * @dev Constructor function.
     * @param _pyth The address of the Pyth contract
     * @param _usdcToken The address of the USDC contract
     * @param _xpToken The address of the XP contract
     */
    constructor(
        address _pyth,
        address _usdcToken,
        address _xpToken
    ) Ownable(msg.sender) {
        // Set the Pyth contract address
        pyth = IPyth(_pyth);

        // Set the USDC contract address
        usdcToken = IERC20(_usdcToken);

        // Set the XP Token contract address
        xpToken = IERC20(_xpToken);

        // Set the owner and vaultAddress as the contract creator
        vaultAddress = payable(msg.sender);

        // Initialize packages
        for (uint8 i = 0; i < pkgQty; i++) {
            packages.push(Package("0x0", MAX_INT));
        }

        // Initialize feed IDs
        // You can find the ids of prices at:
        //  https://pyth.network/developers/price-feed-ids#pyth-evm-stable
        feedIDs.push(
            FeedID(
                "USDC/USD",
                0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a
            )
        );
        feedIDs.push(
            FeedID(
                "ETH/USD",
                0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace
            )
        );
        feedIDs.push(
            FeedID(
                "RON/USD",
                0x97cfe19da9153ef7d647b011c5e355142280ddb16004378573e6494e499879f3
            )
        );
    }

    /**
     * @dev Get the USDC contract address.
     */
    function getUSDCAddress() public view returns (IERC20) {
        return usdcToken;
    }

    /**
     * @dev Set the USDC contract address.
     * @param _USDCAddress address The address of the USDC contract.
     */
    function setUSDCAddress(IERC20 _USDCAddress) external onlyOwner {
        usdcToken = _USDCAddress;
    }

    /**
     * @dev Get the XP contract address.
     */
    function getXPAddress() public view returns (IERC20) {
        return xpToken;
    }

    /**
     * @dev Set the XP contract address.
     * @param _xpAddress address The address of the XP contract.
     */
    function setXPAddress(IERC20 _xpAddress) external onlyOwner {
        xpToken = _xpAddress;
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
            require(
                _prices[i] >= 0,
                "Package price must be greater than or equal to 0"
            );
            packages[i] = Package(_packageIds[i], _prices[i]);
        }
    }

    /**
     * @dev Get the XP Rate.
     * @return uint256 The XP Rate for conversion.
     */
    function getXPRate() public view returns (uint256) {
        return xpRate;
    }

    /**
     * @dev Set the feed IDs list.
     * @param _xpRate uint256 The new XP Rate value.
     */
    function setXPRate(uint256 _xpRate) external onlyOwner {
        require(_xpRate > 0, "XP rate must be greater than zero");
        xpRate = _xpRate;
    }

    /**
     * @dev Get the feed IDs list.
     * @return FeedID[] The list of feed IDs.
     */
    function getFeedIDs() public view returns (FeedID[] memory) {
        return feedIDs;
    }

    /**
     * @dev Set a new feed ID.
     * @param index uint256 The index of the package.
     * @param _symbol string The convertion symbol.
     * @param _id bytes32 The feed ID value.
     */
    function setFeedID(
        uint256 index,
        string calldata _symbol,
        bytes32 _id
    ) external onlyOwner {
        require(index < feedIDs.length, "Invalid index");
        feedIDs[index] = FeedID(_symbol, _id);
    }

    /**
     * @dev Lock crypto payments.
     * @param _locked bool The lock value.
     */
    function lockCrypto(bool _locked) public onlyOwner {
        cryptoEnabled = _locked;
    }

    /**
     * @dev Lock USDC payments.
     * @param _locked bool The lock value.
     */
    function lockUSDCToken(bool _locked) public onlyOwner {
        usdcTokenEnabled = _locked;
    }

    /**
     * @dev Lock XP payments.
     * @param _locked bool The lock value.
     */
    function lockXPToken(bool _locked) public onlyOwner {
        xpTokenEnabled = _locked;
    }

    /**
     * This method interacts with the Pyth contract.
     * Fetch the priceUpdate from Hermes and pass it to the Pyth contract to update the prices.
     * Add the priceUpdate argument to any method on your contract that needs to read the Pyth price.
     * See https://docs.pyth.network/price-feeds/fetch-price-updates for more information on how to fetch the priceUpdate.
     * @param updateData The encoded data to update the contract with the latest price
     */
    function fetchPrice(
        uint256 index,
        bytes[] calldata updateData
    ) public payable returns (PythStructs.Price memory) {
        // Fetch the priceUpdate from hermes
        uint256 updateFee = pyth.getUpdateFee(updateData);
        pyth.updatePriceFeeds{value: updateFee}(updateData);

        // Fetch the latest price
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(
            feedIDs[index].id,
            60
        );
        require(price.price != 0, "Price data unavailable");
        return price;
    }

    /**
     * @dev Allows users to purchase packages using crypto (ETH, RON, etc.).
     * @param _index uint256 The index of the package to purchase.
     * @param _quantity uint256 The quantity of the packages to purchase.
     * @param feedIndex uint256 The feed index to specify crypto to be used.
     * @param updateData bytes[] Update data from Pyth to obtain a recent fee.
     */
    function purchasePackage(
        uint256 _index,
        uint256 _quantity,
        uint256 feedIndex,
        bytes[] calldata updateData
    ) public payable {
        // Require enabled payments
        require(cryptoEnabled, "Crypto payments are not enabled!");

        // Calculate packages total
        uint256 totalPrice = packages[_index].price * _quantity;

        // Fetch price
        PythStructs.Price memory price = fetchPrice(feedIndex, updateData);
        uint256 priceValue = uint256(int256(price.price));
        int32 priceExpo = price.expo;
        require(priceValue > 0, "Oracle price must be greater than zero");

        // Transform to Wei using exponent
        uint256 convertedPrice = uint256(priceValue * (10 ** 18)) /
            (10 ** uint32(-1 * priceExpo));
        require(convertedPrice > 0, "Invalid price feed value returned");

        // Make conversion to USDC
        uint256 requiredCrypto = (totalPrice * 10 ** 18) /
            uint256(convertedPrice);

        // Here goes rate eps
        require(msg.value >= requiredCrypto, "Insufficient crypto sent");

        // Finish purchase and emit event
        contractBalance += requiredCrypto;
        emit PurchaseEvent(msg.sender, _index, _quantity);
    }

    /**
     * @dev Allows users to purchase packages using USDC.
     * @param _index uint256 The index of the package to purchase.
     * @param _quantity uint256 The quantity of the packages to purchase.
     */
    function purchasePackageWithUSDC(
        uint256 _index,
        uint256 _quantity
    ) public payable {
        // Require enabled payments
        require(usdcTokenEnabled, "USDC payments are not enabled!");

        // Calculate packages total
        uint256 totalPrice = packages[_index].price * _quantity;

        // Validate enough tokens in account
        require(
            usdcToken.balanceOf(msg.sender) >= totalPrice,
            "Not enough USDC in account"
        );

        // Validate allowance to pay with USDC
        require(
            usdcToken.allowance(msg.sender, address(this)) >= totalPrice,
            "Not enough allowance"
        );

        // Require transfer from USDC to this contract
        require(
            usdcToken.transferFrom(msg.sender, address(this), totalPrice),
            "USDC payment failed"
        );

        // Purchase with USDC increases Crypto
        emit PurchaseEvent(msg.sender, _index, _quantity);
    }

    /**
     * @dev Allows users to purchase packages using XP.
     * @param _index uint256 The index of the package to purchase.
     * @param _quantity uint256 The quantity of the packages to purchase.
     */
    function purchasePackageWithXP(
        uint256 _index,
        uint256 _quantity
    ) public payable {
        // Require enabled payments
        require(xpTokenEnabled, "XP payments are not enabled!");

        // Calculate packages total
        uint256 totalPrice = packages[_index].price * _quantity;
        uint256 requiredToken = totalPrice * xpRate;

        // Validate enough tokens in account
        require(
            xpToken.balanceOf(msg.sender) >= requiredToken,
            "Not enough XP in account"
        );

        // Validate allowance to pay with USDC
        require(
            xpToken.allowance(msg.sender, address(this)) >= requiredToken,
            "Not enough allowance"
        );

        // Require transfer from USDC to this contract
        require(
            xpToken.transferFrom(msg.sender, address(this), requiredToken),
            "XP payment failed"
        );

        // Purchase with USDC increases Crypto
        emit PurchaseEvent(msg.sender, _index, _quantity);
    }

    /**
     * @dev Withdraw native funds to the vault using call.
     * @param _amount uint256 The amount to withdraw.
     */
    function withdraw(uint256 _amount) external onlyOwner {
        require(_amount <= contractBalance, "Insufficient contract balance");
        contractBalance -= _amount;

        (bool success, ) = vaultAddress.call{value: _amount}("");
        require(success, "Withdraw was not successful");
    }

    /**
     * @dev Withdraw funds to the vault using transferFrom.
     * @param _amount uint256 The amount to withdraw.
     */
    function withdrawUSDCToken(uint256 _amount) external onlyOwner {
        uint256 usdcBalance = usdcToken.balanceOf(address(this));
        require(_amount <= usdcBalance, "Insufficient contract balance");

        // Transfer token to vault address
        bool success = usdcToken.transferFrom(
            address(this),
            vaultAddress,
            _amount
        );

        require(success, "Withdraw was not successful");
    }

    /**
     * @dev Withdraw funds to the vault using transferFrom.
     * @param _amount uint256 The amount to withdraw.
     */
    function withdrawXPToken(uint256 _amount) external onlyOwner {
        uint256 xpBalance = xpToken.balanceOf(address(this));
        require(_amount <= xpBalance, "Insufficient contract balance");

        // Transfer token to vault address
        bool success = xpToken.transferFrom(
            address(this),
            vaultAddress,
            _amount
        );

        require(success, "Withdraw was not successful");
    }

    /**
     * @dev Withdraw all the native funds to the vaultAdress using call.
     */
    function withdrawAll() external onlyOwner {
        uint256 _amount = contractBalance;
        contractBalance = 0;

        (bool success, ) = vaultAddress.call{value: _amount}("");
        require(success, "Withdraw all was not successful");
    }

    /**
     * @dev Withdraw all the USDC funds to the vaultAdress using call.
     */
    function withdrawAllUSDC() external onlyOwner {
        uint256 _amount = usdcToken.balanceOf(address(this));

        // Transfer token to vault address
        bool success = usdcToken.transferFrom(
            address(this),
            vaultAddress,
            _amount
        );

        require(success, "Withdraw all was not successful");
    }

    /**
     * @dev Withdraw all the XP funds to the vaultAdress using call.
     */
    function withdrawAllXP() external onlyOwner {
        uint256 _amount = xpToken.balanceOf(address(this));

        // Transfer token to vault address
        bool success = xpToken.transferFrom(
            address(this),
            vaultAddress,
            _amount
        );

        require(success, "Withdraw all was not successful");
    }
}
