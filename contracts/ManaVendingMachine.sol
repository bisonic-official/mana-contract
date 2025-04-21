//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ManaVendingMachine is Ownable, ReentrancyGuard {
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
     * @notice The PIXEL contract address.
     * @notice Must be set during deployment.
     */
    IERC20 public pixelToken;

    /**
     * @notice Enables payments with Tokens
     * @notice This is used to lock payments with specific tokens.
     */
    bool cryptoEnabled = true;
    bool usdcTokenEnabled = true;
    bool pixelTokenEnabled = true;

    /**
     * @notice Vault address.
     * @notice This address will receive all the funds after withdrawal.
     */
    address payable public vaultAddress;

    /**
     * @notice Updater address.
     * @notice This address is used for contract updates.
     */
    address updaterAddress;

    /**
     * @notice PIXEL base price (in USDC).
     * @notice This is the conversion value used for PIXEL.
     */
    uint256 pixelPrice;

    /**
     * @notice Discount amount for Crypto token.
     * @notice This discount will be applied to the Crypto token. It uses
     * 6 numbers: 2 for the integer part and 4 for the decimals, for instance
     * 125000 translates to 12.5000 % of discount.
     */
    uint discountCrypto = 0;

    /**
     * @notice Discount amount for USDC token.
     * @notice This discount will be applied to the USDC token. It uses
     * 6 numbers: 2 for the integer part and 4 for the decimals, for instance
     * 125000 translates to 12.5000 % of discount.
     */
    uint discountUSDC = 0;

    /**
     * @notice Discount amount for PIXEL token.
     * @notice This discount will be applied to the PIXEL token. It uses
     * 6 numbers: 2 for the integer part and 4 for the decimals, for instance
     * 125000 translates to 12.5000 % of discount.
     */
    uint discountPIXEL = 0;

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
     * @notice Internal feed ID.
     * @notice This contains the feed ID used in this contract.
     */
    FeedID feedID;

    /**
     * @dev Event to be emited on purchase.
     * @param buyer address The address of the buyer.
     * @param package uint256 The index of the purchased packages.
     * @param quantity uint256 The quantity of the purchased packages.
     * @param amountSpent uint256 The amount spent in the purchased packages.
     */
    event PurchaseEvent(
        address buyer,
        uint256 package,
        uint256 quantity,
        uint256 amountSpent
    );

    /**
     * @dev Event to be emited on purchase with USDC.
     * @param buyer address The address of the buyer.
     * @param package uint256 The index of the purchased packages.
     * @param quantity uint256 The quantity of the purchased packages.
     * @param amountSpent uint256 The amount spent in the purchased packages.
     */
    event PurchaseEventUSDC(
        address buyer,
        uint256 package,
        uint256 quantity,
        uint256 amountSpent
    );

    /**
     * @dev Event to be emited on purchase with PIXEL.
     * @param buyer address The address of the buyer.
     * @param package uint256 The index of the purchased packages.
     * @param quantity uint256 The quantity of the purchased packages.
     * @param amountSpent uint256 The amount spent in the purchased packages.
     */
    event PurchaseEventPIXEL(
        address buyer,
        uint256 package,
        uint256 quantity,
        uint256 amountSpent
    );

    /**
     * @dev Constructor function.
     * @param _pyth The address of the Pyth contract
     * @param _usdcToken The address of the USDC contract
     * @param _pixelToken The address of the PIXEL contract
     */
    constructor(
        address _pyth,
        address _usdcToken,
        address _pixelToken
    ) Ownable(msg.sender) {
        // Set the Pyth contract address
        pyth = IPyth(_pyth);

        // Set the USDC contract address
        usdcToken = IERC20(_usdcToken);

        // Set the PICEL contract address
        pixelToken = IERC20(_pixelToken);

        // Set the owner and vaultAddress as the contract creator
        vaultAddress = payable(msg.sender);

        // Set the pixel price to MAX_INT
        pixelPrice = MAX_INT;

        // Set the updater address to 0x0 address
        updaterAddress = address(0);

        // Initialize packages
        for (uint8 i = 0; i < pkgQty; i++) {
            packages.push(Package("0x0", MAX_INT));
        }

        // Initialize an empty feed ID
        feedID = FeedID("NULL", bytes32(0));
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
     * @dev Get the PIXEL contract address.
     */
    function getPIXELAddress() public view returns (IERC20) {
        return pixelToken;
    }

    /**
     * @dev Set the PIXEL contract address.
     * @param _PIXELAddress address The address of the PIXEL contract.
     */
    function setPIXELAddress(IERC20 _PIXELAddress) external onlyOwner {
        pixelToken = _PIXELAddress;
    }

    /**
     * @dev Get the updater address.
     */
    function getUpdaterAddress() public view returns (address) {
        return updaterAddress;
    }

    /**
     * @dev Set the updater address.
     * @param _updaterAddress address The updater address for pixel price.
     */
    function setUpdaterAddress(address _updaterAddress) external onlyOwner {
        updaterAddress = _updaterAddress;
    }

    /**
     * @dev Get the Pyth contract address.
     */
    function getPythAddress() public view returns (IPyth) {
        return pyth;
    }

    /**
     * @dev Set the Pyth oracle address.
     * @param _pyth address The address of the Pyth oracle.
     */
    function setPythAddress(address _pyth) external onlyOwner {
        pyth = IPyth(_pyth);
    }

    /**
     * @dev Set the vault address.
     * @param _vaultAdress address The address of the vault.
     */
    function setVaultAddress(address _vaultAdress) external onlyOwner {
        vaultAddress = payable(_vaultAdress);
    }

    /**
     * @dev Get the Crypto discount.
     */
    function getCryptoDiscount() public view returns (uint) {
        return discountCrypto;
    }

    /**
     * @dev Set the Crypto discount value.
     * @param _discountCrypto uint The discount value for Crypto token. It uses
     * 6 numbers: 2 for the integer part and 4 for the decimals, for instance
     * 125000 translates to 12.5000 % of discount.
     */
    function setCryptoDiscount(uint _discountCrypto) external onlyOwner {
        require(
            _discountCrypto <= 1000000 && _discountCrypto >= 0,
            "The discount amount is not valid"
        );
        discountCrypto = _discountCrypto;
    }

    /**
     * @dev Get the USDC discount.
     */
    function getUSDCDiscount() public view returns (uint) {
        return discountUSDC;
    }

    /**
     * @dev Set the USDC discount value.
     * @param _discountUSDC uint The discount value for USDC token. It uses
     * 6 numbers: 2 for the integer part and 4 for the decimals, for instance
     * 125000 translates to 12.5000 % of discount.
     */
    function setUSDCDiscount(uint _discountUSDC) external onlyOwner {
        require(
            _discountUSDC <= 1000000 && _discountUSDC >= 0,
            "The discount amount is not valid"
        );
        discountUSDC = _discountUSDC;
    }

    /**
     * @dev Get the PIXEL discount.
     */
    function getPIXELDiscount() public view returns (uint) {
        return discountPIXEL;
    }

    /**
     * @dev Set the PIXEL discount value.
     * @param _discountPIXEL uint The discount value for PIXEL token. It uses
     * 6 numbers: 2 for the integer part and 4 for the decimals, for instance
     * 125000 translates to 12.5000 % of discount.
     */
    function setPIXELDiscount(uint _discountPIXEL) external onlyOwner {
        require(
            _discountPIXEL <= 1000000 && _discountPIXEL >= 0,
            "The discount amount is not valid"
        );
        discountPIXEL = _discountPIXEL;
    }

    /**
     * @dev Get the PIXEL price.
     */
    function getPIXELPrice() public view returns (uint256) {
        return pixelPrice;
    }

    /**
     * @dev Set the PIXEL price.
     * @param _pixelPrice address The address of the USDC contract.
     */
    function setPIXELPrice(uint256 _pixelPrice) external {
        require(
            msg.sender == updaterAddress,
            "The address is not allowed to change the PIXEL price"
        );
        pixelPrice = _pixelPrice;
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
     * @dev Get the feed ID.
     * @return FeedID The feed ID values.
     */
    function getFeedID() public view returns (FeedID memory) {
        return feedID;
    }

    /**
     * @dev Set a new feed ID.
     * @param _symbol string The convertion symbol.
     * @param _id bytes32 The feed ID value.
     */
    function setFeedID(
        string calldata _symbol,
        bytes32 _id
    ) external onlyOwner {
        // You can find the IDs of prices at:
        //  https://pyth.network/developers/price-feed-ids#pyth-evm-stable

        feedID = FeedID(_symbol, _id);
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
     * @dev Lock PIXEL payments.
     * @param _locked bool The lock value.
     */
    function lockPIXELToken(bool _locked) public onlyOwner {
        pixelTokenEnabled = _locked;
    }

    /**
     * This method interacts with the Pyth contract.
     * Fetch the priceUpdate from Hermes and pass it to the Pyth contract to update the prices.
     * Add the priceUpdate argument to any method on your contract that needs to read the Pyth price.
     * See https://docs.pyth.network/price-feeds/fetch-price-updates for more information on how to fetch the priceUpdate.
     * @param updateData The encoded data to update the contract with the latest price
     */
    function fetchPrice(
        bytes[] calldata updateData
    ) public payable returns (PythStructs.Price memory) {
        // Fetch the priceUpdate from hermes
        uint256 updateFee = pyth.getUpdateFee(updateData);
        pyth.updatePriceFeeds{value: updateFee}(updateData);

        // Fetch the latest price
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(
            feedID.id,
            60
        );
        require(price.price != 0, "Price data unavailable");
        return price;
    }

    /**
     * @dev Allows users to purchase packages using crypto (ETH, RON, etc.).
     * @param _index uint256 The index of the package to purchase.
     * @param _quantity uint256 The quantity of the packages to purchase.
     * @param updateData bytes[] Update data from Pyth to obtain a recent fee.
     */
    function purchasePackage(
        uint256 _index,
        uint256 _quantity,
        bytes[] calldata updateData
    ) public payable {
        // Require feed ID set
        require(feedID.id != bytes32(0), "Feed ID is not set");

        // Require enabled payments
        require(cryptoEnabled, "Crypto payments are not enabled!");

        // Require a valid index
        require(_index < packages.length, "Invalid package index");

        // Require valid package price
        require(
            packages[_index].price > 0 && packages[_index].price < MAX_INT,
            "Invalid package price for index"
        );

        // Require a valid quantity
        require(_quantity > 0, "Quantity must be greater than zero");

        // Calculate packages total in USDC (1e6)
        uint256 totalPrice = packages[_index].price * _quantity;

        // Fetch price
        PythStructs.Price memory price = fetchPrice(updateData);
        uint256 priceValue = uint256(int256(price.price));
        int32 priceExpo = price.expo;
        require(priceValue > 0, "Oracle price must be greater than zero");

        // Transform to corresponding unit
        uint256 convertedPrice = 0;
        if (priceExpo < 0) {
            convertedPrice =
                uint256(priceValue * 1e6) /
                (10 ** uint32(-1 * priceExpo));
        } else {
            convertedPrice =
                uint256(priceValue * 1e6) *
                (10 ** uint32(priceExpo));
        }

        // Make conversion equivalent to USDC (1e6) in crypto (1e18)
        require(convertedPrice > 0, "Invalid price feed value returned");
        uint256 requiredCrypto = (totalPrice * 1e18) / uint256(convertedPrice);

        // Substract discount
        uint256 discount = (requiredCrypto * discountCrypto) / 1e6;
        requiredCrypto -= discount;

        // Here goes rate eps
        require(msg.value >= requiredCrypto, "Insufficient crypto sent");

        // Finish purchase and emit event
        emit PurchaseEvent(msg.sender, _index, _quantity, msg.value);
    }

    /**
     * @dev Allows users to purchase packages using USDC.
     * @param _index uint256 The index of the package to purchase.
     * @param _quantity uint256 The quantity of the packages to purchase.
     */
    function purchasePackageWithUSDC(
        uint256 _index,
        uint256 _quantity
    ) external {
        // Require enabled payments
        require(usdcTokenEnabled, "USDC payments are not enabled!");

        // Require a valid index
        require(_index < packages.length, "Invalid package index");

        // Require valid package price
        require(
            packages[_index].price != MAX_INT,
            "Index set to max value may cause an overflow"
        );

        // Require a valid quantity
        require(_quantity > 0, "Quantity must be greater than zero");

        // Calculate packages total
        uint256 totalPrice = packages[_index].price * _quantity;

        // Substract discount
        uint256 discount = (totalPrice * discountUSDC) / 1e6;
        totalPrice -= discount;

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
        emit PurchaseEventUSDC(msg.sender, _index, _quantity, totalPrice);
    }

    /**
     * @dev Allows users to purchase packages using PIXEL.
     * @param _index uint256 The index of the package to purchase.
     * @param _quantity uint256 The quantity of the packages to purchase.
     */
    function purchasePackageWithPIXEL(
        uint256 _index,
        uint256 _quantity
    ) external {
        // Require enabled payments
        require(pixelTokenEnabled, "PIXEL payments are not enabled!");

        // Require a valid index
        require(_index < packages.length, "Invalid package index");

        // Require valid package price
        require(
            packages[_index].price != MAX_INT,
            "Index set to max value may cause an overflow"
        );

        // Require a valid quantity
        require(_quantity > 0, "Quantity must be greater than zero");

        // Calculate packages total (1e6)
        uint256 totalPrice = packages[_index].price * _quantity;

        // Make conversion
        uint256 requiredPixel = (totalPrice * 1e18) / pixelPrice;

        // Substract discount
        uint256 discount = (requiredPixel * discountPIXEL) / 1e6;
        requiredPixel -= discount;

        // Validate enough tokens in account
        require(
            pixelToken.balanceOf(msg.sender) >= requiredPixel,
            "Not enough PIXEL in account"
        );

        // Validate allowance to pay with USDC
        require(
            pixelToken.allowance(msg.sender, address(this)) >= requiredPixel,
            "Not enough allowance"
        );

        // Require transfer from USDC to this contract
        require(
            pixelToken.transferFrom(msg.sender, address(this), requiredPixel),
            "PIXEL payment failed"
        );

        // Purchase with USDC increases Crypto
        emit PurchaseEventPIXEL(msg.sender, _index, _quantity, requiredPixel);
    }

    /**
     * @dev Withdraw native funds to the vault using call.
     * @param _amount uint256 The amount to withdraw.
     */
    function withdraw(uint256 _amount) external nonReentrant onlyOwner {
        require(_amount > 0, "Amount must be greater than 0");
        require(
            _amount <= address(this).balance,
            "Insufficient contract balance"
        );

        (bool success, ) = vaultAddress.call{value: _amount}("");
        require(success, "Withdraw was not successful");
    }

    /**
     * @dev Withdraw funds to the vault using transferFrom.
     * @param _amount uint256 The amount to withdraw.
     */
    function withdrawUSDCToken(uint256 _amount) external onlyOwner {
        uint256 usdcBalance = usdcToken.balanceOf(address(this));
        require(_amount > 0, "Amount must be greater than 0");
        require(_amount <= usdcBalance, "Insufficient contract balance");

        // Add allowance
        usdcToken.approve(address(this), _amount);

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
    function withdrawPIXELToken(uint256 _amount) external onlyOwner {
        uint256 pixelBalance = pixelToken.balanceOf(address(this));
        require(_amount > 0, "Amount must be greater than 0");
        require(_amount <= pixelBalance, "Insufficient contract balance");

        // Add allowance
        pixelToken.approve(address(this), _amount);

        // Transfer token to vault address
        bool success = pixelToken.transferFrom(
            address(this),
            vaultAddress,
            _amount
        );

        require(success, "Withdraw was not successful");
    }

    /**
     * @dev Withdraw all the native funds to the vaultAdress using call.
     */
    function withdrawAll() external nonReentrant onlyOwner {
        uint256 _amount = address(this).balance;
        require(_amount > 0, "Amount must be greater than 0");

        (bool success, ) = vaultAddress.call{value: _amount}("");
        require(success, "Withdraw all was not successful");
    }

    /**
     * @dev Withdraw all the USDC funds to the vaultAdress using call.
     */
    function withdrawAllUSDC() external onlyOwner {
        uint256 _amount = usdcToken.balanceOf(address(this));
        require(_amount > 0, "Amount must be greater than 0");

        // Add allowance
        usdcToken.approve(address(this), _amount);

        // Transfer token to vault address
        bool success = usdcToken.transferFrom(
            address(this),
            vaultAddress,
            _amount
        );

        require(success, "Withdraw all was not successful");
    }

    /**
     * @dev Withdraw all the PIXEL funds to the vaultAdress using call.
     */
    function withdrawAllPIXEL() external onlyOwner {
        uint256 _amount = pixelToken.balanceOf(address(this));
        require(_amount > 0, "Amount must be greater than 0");

        // Add allowance
        pixelToken.approve(address(this), _amount);

        // Transfer token to vault address
        bool success = pixelToken.transferFrom(
            address(this),
            vaultAddress,
            _amount
        );

        require(success, "Withdraw all was not successful");
    }
}
