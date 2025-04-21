const { expect } = require("chai");
const { ethers } = require("hardhat");
const { HermesClient } = require('@pythnetwork/hermes-client');


describe("📝 Mana Contract", function () {
    this.timeout(60000); // Increase timeout globally in Hardhat test suite

    // Set to true to only run Pyth Oracle tests
    const only_oracle = false;
    const run_oracle = false;
    const display_hex = false;

    //  Set global variables
    let ManaVendingMachine, contract, owner;
    let initialBalance;
    let usdcAddress, pixelAddress;

    //  Set Pyth address
    const PythAddress = "0xEbe57e8045F2F230872523bbff7374986E45C486"; // Saigon
    // const PythAddress = "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21"; // Sepolia
    const connection = new HermesClient("https://hermes.pyth.network", {});

    // You can find the ids of prices at https://pyth.network/developers/price-feed-ids#pyth-evm-stable
    // const priceId = ["0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a"]; // USDC/USD price id
    // const priceId = ["0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"]; // ETH/USD price id
    const priceId = ["0x97cfe19da9153ef7d647b011c5e355142280ddb16004378573e6494e499879f3"]; // RON/USD price id

    beforeEach(async function () {
        [ owner ] = await ethers.getSigners();

        // Deploy the Token contract
        USDCToken = await ethers.getContractFactory("USDCMock");
        PIXELToken = await ethers.getContractFactory("PIXELMock");
        ManaVendingMachine = await ethers.getContractFactory("ManaVendingMachine");

        // Deploy ERC20Mock (USDC)
        usdcContract = await USDCToken.deploy();
        await usdcContract.waitForDeployment();
        usdcAddress = await usdcContract.getAddress();

        // Mint tokens (USDC)
        await usdcContract.mint(owner, "100000000000");

        // Deploy ERC20Mock (PIXEL)
        pixelContract = await PIXELToken.deploy();
        await pixelContract.waitForDeployment();
        pixelAddress = await pixelContract.getAddress();

        // Mint tokens (PIXEL)
        await pixelContract.mint(owner, "100000000000000000000000");

        // Deploy main contract
        contract = await ManaVendingMachine.deploy(
            PythAddress,
            usdcAddress,
            pixelAddress
        );
        await contract.waitForDeployment();

        //  Deploy ERC20Mock
        initialBalance = await ethers.provider.getBalance(
            await contract.getAddress()
        );
    });

    // Runs tests that not include consulting the oracle 
    if (!only_oracle){
        it("🔥 Should verify contract owner", async function () {
            expect(await contract.owner()).to.equal(owner.address);// Hermes client
            const priceUpdates = await connection.getLatestPriceUpdates(priceId);
        
            // Display generated hex code from Hermes for Feed ID
            if (display_hex) {
                const updateData = priceUpdates['binary']['data'][0];
                const formattedHex = updateData.startsWith("0x") ? updateData : "0x" + updateData;
                console.log(formattedHex);
                console.log(priceUpdates['parsed'][0]['price']);
            }
        });

        it("🔥 Should verify getter and setter of token addresses (USDC + PIXEL)", async function () {
            // Verify initial addresses (getteres)
            expect(await contract.getUSDCAddress()).to.equal(usdcAddress);
            expect(await contract.getPIXELAddress()).to.equal(pixelAddress);

            // Set new addresses (setters)
            await contract.setUSDCAddress(owner.address);
            expect(await contract.getUSDCAddress()).to.equal(owner.address);
            await contract.setPIXELAddress(owner.address);
            expect(await contract.getPIXELAddress()).to.equal(owner.address);
        });

        it("🔥 Should verify getter and setter of Pyth address", async function () {
            // Verify initial address (getter)
            expect(await contract.getPythAddress()).to.equal(PythAddress);

            // Set new address (setter)
            const newPythAddress = "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729"; // Sepolia
            await contract.setPythAddress(newPythAddress);
            expect(await contract.getPythAddress()).to.equal(newPythAddress);
        });

        it("🔥 Should verify getter and setter of feed ID", async function () {
            // Verify getter
            const feedID = await contract.getFeedID();
            expect(feedID.symbol).to.equal("NULL");
            expect(feedID.id).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");

            // Verify setter
            await contract.setFeedID(
                "TEST/USD", 
                "0x0000000000000000000000000000000000000000000000000000000000000001"
            );
            
            // Verify new values set
            const new_feedID = await contract.getFeedID();
            expect(new_feedID.symbol).to.equal("TEST/USD");
            expect(new_feedID.id).to.equal(
                "0x0000000000000000000000000000000000000000000000000000000000000001"
            );
        });

        it("🔥 Should verify getter and setter of PIXEL updater address", async function () {
            // Test getter
            let updaterAddress = await contract.getUpdaterAddress();
            expect(updaterAddress).to.equal("0x0000000000000000000000000000000000000000");

            // Test setter
            await contract.setUpdaterAddress(owner.address);
            updaterAddress = await contract.getUpdaterAddress();
            expect(updaterAddress).to.equal(owner.address);
        });

        it("🔥 Should verify getter and setter of PIXEL price", async function () {
            // Test getter
            let pixelPrice = await contract.getPIXELPrice();
            expect(pixelPrice).to.equal(BigInt(Math.pow(2, 256)) - BigInt(1));

            // Setter should fail with invalid address
            await expect(
                contract.connect(owner).setPIXELPrice("2000000000000000000")
            ).to.be.revertedWith("The address is not allowed to change the PIXEL price");

            // Test setter
            await contract.setUpdaterAddress(owner.address);
            await contract.connect(owner).setPIXELPrice("2000000000000000000");
            pixelPrice = await contract.getPIXELPrice();
            expect(pixelPrice).to.equal(BigInt(2e18));
        });

        it("🔥 Should verify getter and setter of discount for tokens", async function () {
            // Test getters
            let cryptoDiscount = await contract.getCryptoDiscount();
            let usdcDiscount = await contract.getUSDCDiscount();
            let pixelDiscount = await contract.getPIXELDiscount();
            expect(cryptoDiscount).to.equal(0);
            expect(usdcDiscount).to.equal(0);
            expect(pixelDiscount).to.equal(0);

            // Should revert with invalid discount amounts
            await expect(
                contract.setCryptoDiscount(10000000)
            ).to.be.revertedWith("The discount amount is not valid");
            await expect(
                contract.setUSDCDiscount(10000000)
            ).to.be.revertedWith("The discount amount is not valid");
            await expect(
                contract.setPIXELDiscount(10000000)
            ).to.be.revertedWith("The discount amount is not valid");
            
            // Test setters
            const discountValue = 100000;
            await contract.setCryptoDiscount(discountValue);
            await contract.setUSDCDiscount(discountValue);
            await contract.setPIXELDiscount(discountValue);
            cryptoDiscount = await contract.getCryptoDiscount();
            usdcDiscount = await contract.getUSDCDiscount();
            pixelDiscount = await contract.getPIXELDiscount();
            expect(cryptoDiscount).to.equal(discountValue);
            expect(usdcDiscount).to.equal(discountValue);
            expect(pixelDiscount).to.equal(discountValue);
        });

        it("🔥 Should verify packages initial quantity", async function () {
            const pkgQty = await contract.getPkgQty();
            const pkgs = await contract.getPackages();
            const n_elements = Object.keys(pkgs).length;
            expect(pkgQty).to.equal(n_elements);
        });

        it("🔥 Should verify getter of packages", async function () {
            expect(await contract.getPackages()).to.not.be.empty;
            const pkgs = await contract.getPackages();
            expect(pkgs.length).to.equal(50);

            for (const values in pkgs) {
                expect(pkgs[values]['packageId']).to.equal('0x0');
                expect(pkgs[values]['price']).to.equal(BigInt(Math.pow(2, 256)) - BigInt(1));
            }

            // Get packages from Id
            await expect(
                contract.getPackageFromIndex(60)
            ).to.be.revertedWith("The packageIndex must be in the size of the packages array");

            const pkg = await contract.getPackageFromIndex(0);
            expect(pkg['packageId']).to.equal('0x0');
            expect(pkg['price']).to.equal(BigInt(Math.pow(2, 256)) - BigInt(1));
        });

        it("🔥 Should verify setter of packages", async function () {
            // Set vault address
            const vaultAddress = '0x0d72fD549214Eb53cC241f400B147364e926E15B';
            await contract.connect(owner).setVaultAddress(vaultAddress);
            expect(await contract.vaultAddress()).to.equal(vaultAddress);

            // Set packages and verify modified values
            const pkgSize = 50;
            const packageIds = Array(pkgSize).fill('0x0');
            const packagePrices = Array(pkgSize).fill(0);

            packageIds[0] = 'Package 1';
            packageIds[1] = 'Package 2';
            packageIds[2] = 'Package 3';

            packagePrices[0] = 1;
            packagePrices[1] = 2;
            packagePrices[2] = 3;

            await contract.setPackages(packageIds, packagePrices);
            const pkgs = await contract.getPackages();

            for (const values in pkgs) {
                expect(pkgs[values]['packageId']).to.equal(packageIds[values]);
                expect(pkgs[values]['price']).to.equal(packagePrices[values]);
            }

            // Revert with unmatching arrays
            let badPackageIds = Array(pkgSize + 1).fill('0x0');
            let badPackagePrices = Array(pkgSize).fill(0);

            await expect(
                contract.setPackages(badPackageIds, badPackagePrices)
            ).to.be.revertedWith("Packages Ids and prices arrays must have the same length");

            // Revert with unmatching sizes with pkgQty
            badPackageIds = Array(pkgSize + 1).fill('0x0');
            badPackagePrices = Array(pkgSize + 1).fill(0);

            await expect(
                contract.setPackages(badPackageIds, badPackagePrices)
            ).to.be.revertedWith("Packages Ids and prices arrays must have the same length as pkgQty");
        });

        it("🔥 Should allow purchase with other tokens and update balance", async function () {
            // Set packages
            const pkgSize = 50;
            const packageIds = Array(pkgSize).fill('0x0');
            const packagePrices = Array(pkgSize).fill(0);
        
            packageIds[0] = 'Package 1';
            packageIds[1] = 'Package 2';
            packageIds[2] = 'Package 3';
        
            packagePrices[0] = 10e6;
            packagePrices[1] = 20e6;
            packagePrices[2] = 30e6;
        
            await contract.setPackages(packageIds, packagePrices);

            // Set PIXEL price
            await contract.setUpdaterAddress(owner.address);
            await contract.connect(owner).setPIXELPrice("25000");

            // Try to purchase USDC
            const pkgIndex = 0;
            const pkgQty = 1;

            // IMPOTANT! THIS IS NEEDED! - USDC
            // Add allowance
            const vendingMachineAddress = await contract.getAddress();
            await usdcContract.approve(vendingMachineAddress, 10e6);

            // Purchase with USDC
            const priorBalanceUSDC = await usdcContract.balanceOf(owner);
            const txUSDC = await contract.purchasePackageWithUSDC(
                pkgIndex, // Package with index 0
                pkgQty // Qty of packages
            );
            const postBalanceUSDC = await usdcContract.balanceOf(owner);
            
            // Wait for txn
            const receiptUSDC = await txUSDC.wait();

            // Validate results and updates
            expect(receiptUSDC.status).to.be.equal(1);
            expect(priorBalanceUSDC - postBalanceUSDC).to.be.equal(10e6);
            const contractUSDCBalance = await usdcContract.balanceOf(
                await contract.getAddress()
            );
            expect(contractUSDCBalance).to.be.equal(10e6);

            // IMPOTANT! THIS IS NEEDED! - PIXEL
            // Add allowance
            await pixelContract.approve(
                vendingMachineAddress,
                400000000000000000000n
            );

            // Purchase with PIXEL
            const priorBalancePIXEL = await pixelContract.balanceOf(owner);
            const txPIXEL = await contract.purchasePackageWithPIXEL(
                pkgIndex, // Package with index 0
                pkgQty // Qty of packages
            );
            const postBalancePIXEL = await pixelContract.balanceOf(owner);
            
            // Wait for txn
            const receiptPIXEL = await txPIXEL.wait();

            // Validate results and updates
            expect(receiptPIXEL.status).to.be.equal(1);
            expect(priorBalancePIXEL - postBalancePIXEL).to.be.equal(
                400000000000000000000n
            );
            const contractPIXELBalance = await pixelContract.balanceOf(
                await contract.getAddress()
            );
            expect(contractPIXELBalance).to.be.equal(400000000000000000000n);
        });

        it("🔥 Should test discount values for other tokens and update balance", async function () {
            // Set packages
            const pkgSize = 50;
            const packageIds = Array(pkgSize).fill('0x0');
            const packagePrices = Array(pkgSize).fill(0);
        
            packageIds[0] = 'Package 1';
            packageIds[1] = 'Package 2';
            packageIds[2] = 'Package 3';
        
            packagePrices[0] = 10e6;
            packagePrices[1] = 20e6;
            packagePrices[2] = 30e6;
        
            await contract.setPackages(packageIds, packagePrices);

            // Set PIXEL price
            await contract.setUpdaterAddress(owner.address);
            await contract.connect(owner).setPIXELPrice("25000");

            // Set USDC & PIXEL discounts (10% each)
            const discAmount = 100000
            await contract.setUSDCDiscount(discAmount);
            await contract.setPIXELDiscount(discAmount);

            // Verify amount set
            expect(await contract.getUSDCDiscount()).to.be.equal(discAmount);
            expect(await contract.getPIXELDiscount()).to.be.equal(discAmount);

            // Try to purchase USDC
            const pkgIndex = 0;
            const pkgQty = 1;

            // IMPOTANT! THIS IS NEEDED! - USDC
            // Add allowance
            const totalUSDC = 10e6;
            const discountUSDC = (totalUSDC * (discAmount / 1e6));
            let payUSDCAmount = totalUSDC - discountUSDC;
            payUSDCAmount = BigInt(payUSDCAmount);
            const vendingMachineAddress = await contract.getAddress();
            await usdcContract.approve(vendingMachineAddress, payUSDCAmount);

            // Purchase with USDC
            const priorBalanceUSDC = await usdcContract.balanceOf(owner);
            const txUSDC = await contract.purchasePackageWithUSDC(
                pkgIndex, // Package with index 0
                pkgQty // Qty of packages
            );
            const postBalanceUSDC = await usdcContract.balanceOf(owner);
            
            // Wait for txn
            const receiptUSDC = await txUSDC.wait();

            // Validate results and updates
            expect(receiptUSDC.status).to.be.equal(1);
            expect(priorBalanceUSDC - postBalanceUSDC).to.be.equal(payUSDCAmount);
            const contractUSDCBalance = await usdcContract.balanceOf(
                await contract.getAddress()
            );
            expect(contractUSDCBalance).to.be.equal(payUSDCAmount);

            // IMPOTANT! THIS IS NEEDED! - PIXEL
            // Add allowance
            const totalPIXEL = 400000000000000000000;
            const discountPIXEL = (totalPIXEL * discAmount / 1e6);
            let payPIXELAmount = totalPIXEL - discountPIXEL;
            payPIXELAmount = BigInt(payPIXELAmount);
            await pixelContract.approve(
                vendingMachineAddress,
                payPIXELAmount
            );

            // Purchase with PIXEL
            const priorBalancePIXEL = await pixelContract.balanceOf(owner);
            const txPIXEL = await contract.purchasePackageWithPIXEL(
                pkgIndex, // Package with index 0
                pkgQty // Qty of packages
            );
            const postBalancePIXEL = await pixelContract.balanceOf(owner);
            
            // Wait for txn
            const receiptPIXEL = await txPIXEL.wait();

            // Validate results and updates
            expect(receiptPIXEL.status).to.be.equal(1);
            expect(priorBalancePIXEL - postBalancePIXEL).to.be.equal(
                payPIXELAmount
            );
            const contractPIXELBalance = await pixelContract.balanceOf(
                await contract.getAddress()
            );
            expect(contractPIXELBalance).to.be.equal(payPIXELAmount);
        });

        it("🔥 Should fail purchase with insufficient tokens", async function () {
            // Set packages
            const pkgSize = 50;
            const packageIds = Array(pkgSize).fill('0x0');
            const packagePrices = Array(pkgSize).fill(0);
        
            packageIds[0] = 'Package 1';
            packageIds[1] = 'Package 2';
            packageIds[2] = 'Package 3';
        
            packagePrices[0] = 1e12
            packagePrices[1] = 2e12;
            packagePrices[2] = 3e12;
        
            await contract.setPackages(packageIds, packagePrices);

            // Try to purchase
            const pkgIndex = 0;
            const pkgQty = 100;

            // Purchase with USDC
            await expect(contract.purchasePackageWithUSDC(
                pkgIndex, // Package with index 0
                pkgQty // Qty of packages
            )).to.be.revertedWith("Not enough USDC in account");
        });

        it("🔥 Should not allow to purchase when locked or feed not set", async function () {
            // Lock purchasing functions
            await contract.lockCrypto(false);
            await contract.lockUSDCToken(false);
            await contract.lockPIXELToken(false);

            // Try to purchase
            const pkgIndex = 0;
            const pkgQty = 1;

            // Purchase with Crypto (feed ID not set)
            await expect(contract.purchasePackage(
                pkgIndex, // Package with index 0
                pkgQty, // Qty of packages 
                [owner.address],
                {
                    value: ethers.parseEther("0.000000000000000001"),
                    gasLimit: 1000000,
                }
            )).to.be.revertedWith("Feed ID is not set");

            // Set feed
            await contract.setFeedID(
                "RON/USD", 
                priceId[0]
            );

            // Purchase with Crypto
            await expect(contract.purchasePackage(
                pkgIndex, // Package with index 0
                pkgQty, // Qty of packages 
                [owner.address],
                {
                    value: ethers.parseEther("0.000000000000000001"),
                    gasLimit: 1000000,
                }
            )).to.be.revertedWith("Crypto payments are not enabled!");

            // Purchase with USDC
            await expect(contract.purchasePackageWithUSDC(
                pkgIndex, // Package with index 0
                pkgQty // Qty of packages
            )).to.be.revertedWith("USDC payments are not enabled!");

            // Purchase with PIXEL
            await expect(contract.purchasePackageWithPIXEL(
                pkgIndex, // Package with index 0
                pkgQty // Qty of packages
            )).to.be.revertedWith("PIXEL payments are not enabled!");
        });

        it("🔥 Should verify withdrawals for Token txns", async function () {
            // Set packages
            const pkgSize = 50;
            const packageIds = Array(pkgSize).fill('0x0');
            const packagePrices = Array(pkgSize).fill(0);
        
            packageIds[0] = 'Package 1';
            packageIds[1] = 'Package 2';
            packageIds[2] = 'Package 3';
        
            packagePrices[0] = 10e6;
            packagePrices[1] = 20e6;
            packagePrices[2] = 30e6;
        
            await contract.setPackages(packageIds, packagePrices);

            // Set PIXEL price
            await contract.setUpdaterAddress(owner.address);
            await contract.connect(owner).setPIXELPrice("25000");

            // Try to purchase
            const pkgIndex = 0;
            const pkgQty = 1;


            // IMPOTANT! THIS IS NEEDED!
            // Add allowance - USDC
            const vendingMachineAddress = await contract.getAddress();
            await usdcContract.approve(vendingMachineAddress, 10e6);

            // Purchase with USDC
            const tx = await contract.purchasePackageWithUSDC(
                pkgIndex, // Package with index 0
                pkgQty // Qty of packages
            );
            
            // Wait for txn
            const receipt = await tx.wait();

            // Validate results and updates
            expect(receipt.status).to.be.equal(1);


            // IMPOTANT! THIS IS NEEDED! - PIXEL
            // Add allowance
            await pixelContract.approve(
                vendingMachineAddress,
                400000000000000000000n
            );

            // Purchase with PIXEL
            const txPIXEL = await contract.purchasePackageWithPIXEL(
                pkgIndex, // Package with index 0
                pkgQty // Qty of packages
            );
            
            // Wait for txn
            const receiptPIXEL = await txPIXEL.wait();

            // Validate results and updates
            expect(receiptPIXEL.status).to.be.equal(1);


            // Set vault address
            const vaultAddress = "0x0d72fD549214Eb53cC241f400B147364e926E15B";
            await contract.setVaultAddress(vaultAddress);
            
            
            // WITHDRAW AN AMOUNT - USDC
            // Get balances before withdrawal
            const beforeAddress = await usdcContract.balanceOf(vaultAddress);
            const beforeWithdraw = await usdcContract.balanceOf(
                await contract.getAddress()
            );

            // Withdraw 1 unit
            await contract.withdrawUSDCToken(1);
            const afterWithdraw = await usdcContract.balanceOf(
                await contract.getAddress()
            );
            expect(beforeWithdraw - afterWithdraw).to.equal(1);
            
            // Verify amounts
            const afterAddress = await usdcContract.balanceOf(vaultAddress);
            expect(afterAddress - beforeAddress).to.equal(1);
            
            
            // WITHDRAW AN AMOUNT - PIXEL
            // Get balances before withdrawal
            const beforeAddressPIXEL = await pixelContract.balanceOf(vaultAddress);
            const beforeWithdrawPIXEL = await pixelContract.balanceOf(
                await contract.getAddress()
            );

            // Withdraw 1 unit
            await contract.withdrawPIXELToken(1);
            const afterWithdrawPIXEL = await pixelContract.balanceOf(
                await contract.getAddress()
            );
            expect(beforeWithdrawPIXEL - afterWithdrawPIXEL).to.equal(1);
            
            // Verify amounts
            const afterAddressPIXEL = await pixelContract.balanceOf(vaultAddress);
            expect(afterAddressPIXEL - beforeAddressPIXEL).to.equal(1);


            // WITHDRAW ALL TOKEN FUNDS - USDC
            // Get balances before withdrawal
            const beforeAddressAll = await usdcContract.balanceOf(vaultAddress);
            const beforeWithdrawAll = await usdcContract.balanceOf(
                await contract.getAddress()
            );

            // Withdraw all
            await contract.withdrawAllUSDC();
            const afterWithdrawAll = await usdcContract.balanceOf(
                await contract.getAddress()
            );
            expect(afterWithdrawAll).to.equal(0);
            
            // Verify amounts
            const afterAddressAll = await usdcContract.balanceOf(vaultAddress);
            expect(afterAddressAll - beforeAddressAll).to.equal(beforeWithdrawAll);


            // WITHDRAW ALL TOKEN FUNDS - PIXEL
            // Get balances before withdrawal
            const beforeAddressAllPIXEL = await pixelContract.balanceOf(vaultAddress);
            const beforeWithdrawAllPIXEL = await pixelContract.balanceOf(
                await contract.getAddress()
            );

            // Withdraw all
            await contract.withdrawAllPIXEL();
            const afterWithdrawAllPIXEL = await pixelContract.balanceOf(
                await contract.getAddress()
            );
            expect(afterWithdrawAllPIXEL).to.equal(0);
            
            // Verify amounts
            const afterAddressAllPIXEL = await pixelContract.balanceOf(vaultAddress);
            expect(afterAddressAllPIXEL - beforeAddressAllPIXEL).to.equal(beforeWithdrawAllPIXEL);
        });
    }

    // These tests include consulting the oracle 
    if (run_oracle){
        it("🔥 Should verify price fetch, allow purchase with crypto and update balance", async function () {
            // Hermes client
            const priceUpdates = await connection.getLatestPriceUpdates(priceId);
        
            const updateData = priceUpdates['binary']['data'][0];
            const formattedHex = updateData.startsWith("0x") ? updateData : "0x" + updateData;

            // Set feed
            await contract.setFeedID(
                "RON/USD", 
                priceId[0]
            );
        
            // Set packages
            const pkgSize = 50;
            const packageIds = Array(pkgSize).fill('0x0');
            const packagePrices = Array(pkgSize).fill(0);
        
            packageIds[0] = 'Package 1';
            packageIds[1] = 'Package 2';
            packageIds[2] = 'Package 3';
        
            packagePrices[0] = 2e5;
            packagePrices[1] = 3e5;
            packagePrices[2] = 4e5;
        
            await contract.setPackages(packageIds, packagePrices);
        
        
            // Call function that interacts with Orcale
            const pkgIndex = 0;
            const pkgQty = 1;
            
            const tx = await contract.purchasePackage(
                pkgIndex, // Package with index 0
                pkgQty, // Qty of packages
                [formattedHex], 
                {
                    value: ethers.parseEther("0.45"),
                    gasLimit: 1000000
                }
            );
            expect(await contract.purchasePackage(
                pkgIndex, // Package with index 0
                pkgQty, // Qty of packages
                [formattedHex], 
                {
                    value: ethers.parseEther("0.4"),
                    gasLimit: 10000000
                }
            )).to.be.revertedWith("Insufficient crypto sent");
            // Print testing address to validate income
            // console.log(await contract.getAddress());
            
            // Wait for txn
            const receipt = await tx.wait();

            // Validate results and updates
            expect(receipt.status).to.be.equal(1);
            const newBalance = await ethers.provider.getBalance(
                await contract.getAddress()
            );
            expect(newBalance).to.be.gt(initialBalance);
            // console.log("Initial balance:", initialBalance);
            // console.log("New balance after purchase:", newBalance);
        });

        it("🔥 Should test discount value for crypto token and update balance", async function () {
            // Hermes client
            const priceUpdates = await connection.getLatestPriceUpdates(priceId);
        
            const updateData = priceUpdates['binary']['data'][0];
            const formattedHex = updateData.startsWith("0x") ? updateData : "0x" + updateData;

            // Set feed
            await contract.setFeedID(
                "RON/USD", 
                priceId[0]
            );
        
            // Set packages
            const pkgSize = 50;
            const packageIds = Array(pkgSize).fill('0x0');
            const packagePrices = Array(pkgSize).fill(0);
        
            packageIds[0] = 'Package 1';
            packageIds[1] = 'Package 2';
            packageIds[2] = 'Package 3';
        
            packagePrices[0] = 2e5;
            packagePrices[1] = 3e5;
            packagePrices[2] = 4e5;
        
            await contract.setPackages(packageIds, packagePrices);


            // Set Crypto discount (10%)
            const discAmount = 100000
            await contract.setCryptoDiscount(discAmount);

            // Verify amount set
            expect(await contract.getCryptoDiscount()).to.be.equal(discAmount);


            // Calculate discount
            const totalCrypto = 0.45e18;
            const discountCrypto = (totalCrypto * discAmount / 1e6);
            let payCrypto = (totalCrypto - discountCrypto) / 1e18;
            payCrypto = ethers.parseEther(payCrypto.toString());
        
        
            // Call function that interacts with Orcale
            const pkgIndex = 0;
            const pkgQty = 1;
            const tx = await contract.purchasePackage(
                pkgIndex, // Package with index 0
                pkgQty, // Qty of packages
                [formattedHex], 
                {
                    value: payCrypto,
                    gasLimit: 1000000
                }
            );
            
            // Wait for txn
            const receipt = await tx.wait();

            // Validate results and updates
            expect(receipt.status).to.be.equal(1);
            const newBalance = await ethers.provider.getBalance(
                await contract.getAddress()
            );
            expect(newBalance).to.be.gt(initialBalance);
            // console.log("Initial balance:", initialBalance);
            // console.log("New balance after purchase:", newBalance);
        });

        it("🔥 Should fail purchase with insufficient crypto sent", async function () {
            // Hermes client
            const priceUpdates = await connection.getLatestPriceUpdates(priceId);
        
            const updateData = priceUpdates['binary']['data'][0];
            const formattedHex = updateData.startsWith("0x") ? updateData : "0x" + updateData;

            // Set feed
            await contract.setFeedID(
                "RON/USD", 
                priceId[0]
            );
        
            // Set packages
            const pkgSize = 50;
            const packageIds = Array(pkgSize).fill('0x0');
            const packagePrices = Array(pkgSize).fill(0);
        
            packageIds[0] = 'Package 1';
            packageIds[1] = 'Package 2';
            packageIds[2] = 'Package 3';
        
            packagePrices[0] = 2e5;
            packagePrices[1] = 3e5;
            packagePrices[2] = 4e5;
        
            await contract.setPackages(packageIds, packagePrices);
            
            
            // Call function that interacts with Orcale
            const pkgIndex = 0;
            const pkgQty = 100;
            expect(await contract.purchasePackage(
                pkgIndex, // Package with index 0
                pkgQty, // Qty of packages
                [formattedHex], 
                {
                    value: ethers.parseEther("0.01"),
                    gasLimit: 10000000
                }
            )).to.be.revertedWith("Insufficient crypto sent");
        });

        it("🔥 Should verify withdrawals for crypto txns", async function () {
            // Hermes client
            const priceUpdates = await connection.getLatestPriceUpdates(priceId);
        
            const updateData = priceUpdates['binary']['data'][0];
            const formattedHex = updateData.startsWith("0x") ? updateData : "0x" + updateData;

            // Set feed
            await contract.setFeedID(
                "RON/USD", 
                priceId[0]
            );


            // Set packages
            const pkgSize = 50;
            const packageIds = Array(pkgSize).fill('0x0');
            const packagePrices = Array(pkgSize).fill(0);
        
            packageIds[0] = 'Package 1';
            packageIds[1] = 'Package 2';
            packageIds[2] = 'Package 3';
        
            packagePrices[0] = 2e5;
            packagePrices[1] = 3e5;
            packagePrices[2] = 4e5;
        
            await contract.setPackages(packageIds, packagePrices);

            // Call function that interacts with Orcale
            const pkgIndex = 0;
            const pkgQty = 1;
            const tx = await contract.purchasePackage(
                pkgIndex, // Package with index 0
                pkgQty, // Qty of packages
                [formattedHex], 
                {
                    value: ethers.parseEther("0.45"),
                    gasLimit: 10000000
                }
            );
            // Print testing address to validate income
            // console.log(await contract.getAddress());
            
            // Wait for txn and validate status
            const receipt = await tx.wait();
            expect(receipt.status).to.be.equal(1);


            // Set vault address
            const vaultAddress = "0x0d72fD549214Eb53cC241f400B147364e926E15B";
            await contract.setVaultAddress(vaultAddress);


            // WITHDRAW AN AMOUNT
            // Get balances before withdrawal
            const beforeAddress = await ethers.provider.getBalance(vaultAddress);
            const beforeWithdraw = await ethers.provider.getBalance(
                await contract.getAddress()
            );

            // Withdraw 100 units
            await contract.withdraw(100);
            const afterWithdraw = await ethers.provider.getBalance(
                await contract.getAddress()
            );
            expect(beforeWithdraw - afterWithdraw).to.equal(100);
            
            // Verify amounts
            const afterAddress = await ethers.provider.getBalance(vaultAddress);
            expect(afterAddress - beforeAddress).to.equal(100);

            // WITHDRAW ALL TOKEN FUNDS
            // Get balances before withdrawal
            const beforeAddressAll = await ethers.provider.getBalance(vaultAddress);
            const beforeWithdrawAll = await ethers.provider.getBalance(
                await contract.getAddress()
            );

            // Withdraw all
            await contract.withdrawAll();
            const afterWithdrawAll = await ethers.provider.getBalance(
                await contract.getAddress()
            );
            expect(afterWithdrawAll).to.equal(0);
            
            // Verify amounts
            const afterAddressAll = await ethers.provider.getBalance(vaultAddress);
            expect(afterAddressAll - beforeAddressAll).to.equal(beforeWithdrawAll);
        });
    }
});