const { expect } = require("chai");
const { ethers } = require("hardhat");
const { HermesClient } = require('@pythnetwork/hermes-client');


describe("📝 Mana Contract", function () {
    // Set to true to only run Pyth Oracle tests
    const only_oracle = false;
    const run_oracle = false;

    //  Set global variables
    let ManaVendingMachine, contract, owner;
    let initialBalance;
    let tokenAddress;

    //  Set Pyth address
    const PythAddress = "0xEbe57e8045F2F230872523bbff7374986E45C486"; // Saigon
    const connection = new HermesClient("https://hermes.pyth.network", {});

    // You can find the ids of prices at https://pyth.network/developers/price-feed-ids#pyth-evm-stable
    const priceIds = [
        "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a", // USDC/USD price id
        "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", // ETH/USD price id
        "0x97cfe19da9153ef7d647b011c5e355142280ddb16004378573e6494e499879f3" // RON/USD price id
    ];

    beforeEach(async function () {
        [ owner ] = await ethers.getSigners();

        // Deploy the Token contract
        otherToken = await ethers.getContractFactory("ERC20Mock");
        ManaVendingMachine = await ethers.getContractFactory("ManaVendingMachine");

        // Deploy ERC20Mock
        tokenContract = await otherToken.deploy();
        await tokenContract.waitForDeployment();
        tokenAddress = await tokenContract.getAddress();

        // Mint tokens
        await tokenContract.mint(owner, 1000);

        // Deploy main contract
        contract = await ManaVendingMachine.deploy(
            PythAddress,
            tokenAddress,
            tokenAddress
        );
        await contract.waitForDeployment();

        //  Deploy ERC20Mock
        initialBalance = await contract.contractBalance();
    });

    // Runs tests that not include consulting the oracle 
    if (!only_oracle){
        it("🔥 Should verify contract owner", async function () {
            expect(await contract.owner()).to.equal(owner.address);
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

        it("🔥 Should verify getter and setter of XP Rate", async function () {
            // Verify getter
            expect(await contract.getXPRate()).to.equal(100);

            // Verify setter
            await contract.setXPRate(50);
            expect(await contract.getXPRate()).to.equal(50);
        });

        it("🔥 Should verify getter and setter of feed ids", async function () {
            // Verify getter
            const feedIDs = await contract.getFeedIDs();
            expect(feedIDs[0].symbol).to.equal("USDC/USD");
            expect(
                feedIDs[0].id
            ).to.equal(
                "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a"
            );
            expect(feedIDs[1].symbol).to.equal("ETH/USD");
            expect(
                feedIDs[1].id
            ).to.equal(
                "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
            );
            expect(feedIDs[2].symbol).to.equal("RON/USD");
            expect(
                feedIDs[2].id
            ).to.equal(
                "0x97cfe19da9153ef7d647b011c5e355142280ddb16004378573e6494e499879f3"
            );

            // Verify setter
            await contract.setFeedID(
                0, "TEST/USD", 
                "0x0000000000000000000000000000000000000000000000000000000000000000"
            );
            // Verify new values set
            const new_feedIDs = await contract.getFeedIDs();
            expect(new_feedIDs[0].symbol).to.equal("TEST/USD");
            expect(
                new_feedIDs[0].id
            ).to.equal(
                "0x0000000000000000000000000000000000000000000000000000000000000000"
            );
        });

        it("🔥 Should allow purchase with other Tokens and update balance", async function () {
            // Set packages
            const pkgSize = 50;
            const packageIds = Array(pkgSize).fill('0x0');
            const packagePrices = Array(pkgSize).fill(0);
        
            packageIds[0] = 'Package 1';
            packageIds[1] = 'Package 2';
            packageIds[2] = 'Package 3';
        
            packagePrices[0] = 10;
            packagePrices[1] = 20;
            packagePrices[2] = 30;
        
            await contract.setPackages(packageIds, packagePrices);

            // Try to purchase
            const pkgIndex = 0;
            const pkgQty = 1;

            // TODO
            console.log("TEST IS PENDING!");

            // // Purchase with USDC
            // let tx = await contract.purchasePackageWithUSDC(
            //     pkgIndex, // Package with index 0
            //     pkgQty, // Qty of packages 
            //     {
            //         value: ethers.parseEther("0.00000000000000001"),
            //         gasLimit: 1000000,
            //     }
            // );
            
            // // Wait for txn
            // let receipt = await tx.wait();

            // // Validate results and updates
            // expect(receipt.status).to.be.equal(1);
            // expect(await tokenContract.balanceOf(owner)).to.be.equal(1);


            // // Purchase with XP
            // tx = await contract.purchasePackageWithXP(
            //     pkgIndex, // Package with index 0
            //     pkgQty, // Qty of packages 
            //     {
            //         value: ethers.parseEther("0.000000000000001"),
            //         gasLimit: 1000000,
            //     }
            // );
            
            // // Wait for txn
            // receipt = await tx.wait();

            // // Validate results and updates
            // expect(receipt.status).to.be.equal(1);
            // expect(await tokenContract.balanceOf(owner)).to.be.equal(1);
        });

        it("🔥 Should fail purchase with insufficient Tokens", async function () {
            // Set packages
            const pkgSize = 50;
            const packageIds = Array(pkgSize).fill('0x0');
            const packagePrices = Array(pkgSize).fill(0);
        
            packageIds[0] = 'Package 1';
            packageIds[1] = 'Package 2';
            packageIds[2] = 'Package 3';
        
            packagePrices[0] = 1000000000000;
            packagePrices[1] = 2000000000000;
            packagePrices[2] = 3000000000000;
        
            await contract.setPackages(packageIds, packagePrices);

            // Try to purchase
            const pkgIndex = 0;
            const pkgQty = 100;

            // Purchase with USDC
            await expect(contract.purchasePackageWithUSDC(
                pkgIndex, // Package with index 0
                pkgQty, // Qty of packages 
                {
                    value: ethers.parseEther("0.000000000000000001"),
                    gasLimit: 1000000,
                }
            )).to.be.revertedWith("Not enough USDC in account");

            // Purchase with XP
            await expect(contract.purchasePackageWithXP(
                pkgIndex, // Package with index 0
                pkgQty, // Qty of packages 
                {
                    value: ethers.parseEther("0.0000000000000001"),
                    gasLimit: 1000000,
                }
            )).to.be.revertedWith("Not enough XP in account");
        });

        it("🔥 Should not allow to purchase when locked", async function () {
            // Locj purchasing functions
            await contract.lockCrypto(false);
            await contract.lockUSDCToken(false);
            await contract.lockXPToken(false);

            // Try to purchase
            const pkgIndex = 0;
            const pkgQty = 1;

            // Purchase with Crypto
            await expect(contract.purchasePackage(
                pkgIndex, // Package with index 0
                pkgQty, // Qty of packages 
                1, [owner.address],
                {
                    value: ethers.parseEther("0.000000000000000001"),
                    gasLimit: 1000000,
                }
            )).to.be.revertedWith("Crypto payments are not enabled!");

            // Purchase with USDC
            await expect(contract.purchasePackageWithUSDC(
                pkgIndex, // Package with index 0
                pkgQty, // Qty of packages 
                {
                    value: ethers.parseEther("0.000000000000000001"),
                    gasLimit: 1000000,
                }
            )).to.be.revertedWith("USDC payments are not enabled!");

            // Purchase with XP
            await expect(contract.purchasePackageWithXP(
                pkgIndex, // Package with index 0
                pkgQty, // Qty of packages 
                {
                    value: ethers.parseEther("0.0000000000000001"),
                    gasLimit: 1000000,
                }
            )).to.be.revertedWith("XP payments are not enabled!");
        });
    }

    // These tests include consulting the oracle 
    if (run_oracle){
        it("🔥 Should verify price fetch, allow purchase with crypto and update balance", async function () {
            // Hermes client
            const priceUpdates = await connection.getLatestPriceUpdates(priceIds);
        
            const updateData = priceUpdates['binary']['data'][0];
            const formattedHex = updateData.startsWith("0x") ? updateData : "0x" + updateData;
        
            // Set packages
            const pkgSize = 50;
            const packageIds = Array(pkgSize).fill('0x0');
            const packagePrices = Array(pkgSize).fill(0);
        
            packageIds[0] = 'Package 1';
            packageIds[1] = 'Package 2';
            packageIds[2] = 'Package 3';
        
            packagePrices[0] = 1000;
            packagePrices[1] = 2000;
            packagePrices[2] = 3000;
        
            await contract.setPackages(packageIds, packagePrices);
        
        
            // Call function that interacts with Orcale
            const pkgIndex = 0;
            const pkgQty = 2;
            const feedIndex = 2; // Ronin
            const tx = await contract.purchasePackage(
                pkgIndex, // Package with index 0
                pkgQty, // Qty of packages 
                feedIndex, // Feed id 2 -> RON
                [formattedHex], 
                {
                    value: ethers.parseEther("0.0001"),
                    gasLimit: 1000000,
                }
            );
            
            // Wait for txn
            const receipt = await tx.wait();

            // Validate results and updates
            expect(receipt.status).to.be.equal(1);
            const newBalance = await contract.contractBalance();
            expect(newBalance).to.be.gt(initialBalance);
        });

        // it("🔥 Should fail purchase with insufficient crypto sent", async function () {
        //     // Hermes client
        //     const priceUpdates = await connection.getLatestPriceUpdates(priceIds);
            
        //     const updateData = priceUpdates['binary']['data'][0];
        //     const formattedHex = updateData.startsWith("0x") ? updateData : "0x" + updateData;
            
        //     // Set packages
        //     const pkgSize = 50;
        //     const packageIds = Array(pkgSize).fill('0x0');
        //     const packagePrices = Array(pkgSize).fill(0);
            
        //     packageIds[0] = 'Package 1';
        //     packageIds[1] = 'Package 2';
        //     packageIds[2] = 'Package 3';
            
        //     packagePrices[0] = 1;
        //     packagePrices[1] = 2;
        //     packagePrices[2] = 3;
            
        //     await contract.setPackages(packageIds, packagePrices);
            
            
        //     // Call function thta interacts with Orcale
        //     const pkgIndex = 2;
        //     const pkgQty = 100;
        //     const feedIndex = 2; // Ronin
        //     console.log(ethers.parseEther("0.000000000000000001"));
        //     // await expect(
        //         await contract.purchaseWithCrypto(
        //             pkgIndex, // Package with index 0
        //             pkgQty, // Qty of packages 
        //             feedIndex, // Feed id 2 -> RON
        //             [formattedHex], 
        //             {
        //                 value: ethers.parseEther("0.000000000000000001"),
        //                 gasLimit: 1000000,
        //             }
        //         )
        //     // ).to.be.revertedWith("Insufficient crypto sent");
        // });

        // it("🔥 Should verify withdrawal of an amount", async function () {
        //     // Define vault address
        //     const vault = '0x0d72fD549214Eb53cC241f400B147364e926E15B';
        //     const buyer = owner;

        //     // Set packages
        //     const pkgSize = 50;
        //     const packageIds = Array(pkgSize).fill('0x0');
        //     const packagePrices = Array(pkgSize).fill(0);

        //     packageIds[0] = 'Package 1';
        //     packageIds[1] = 'Package 2';
        //     packageIds[2] = 'Package 3';

        //     packagePrices[0] = 1;
        //     packagePrices[1] = 2;
        //     packagePrices[2] = 3;

        //     await contract.setPackages(packageIds, packagePrices);

        //     // Set vault address
        //     await contract.connect(owner).setVaultAddress(vault);
        //     expect(await contract.vaultAddress()).to.equal(vault);

        //     // Buy packages and add funds to contract
        //     const packageList = Array(3).fill(0);
        //     const packageQty = Array(3).fill(0);
        //     packageList[0] = 0;
        //     packageList[1] = 1;
        //     packageList[2] = 2;
        //     packageQty[0] = 3;
        //     packageQty[1] = 2;
        //     packageQty[2] = 1;

        //     await contract.connect(buyer).purchasePackages(
        //         packageList, packageQty,
        //         { value: 10, from: buyer.address }
        //     );

        //     // Get balances before withdrawal
        //     const beforeWithdraw = await contract.contractBalance();
        //     const beforeWithdrawVault = await ethers.provider.getBalance(vault);
        //     expect(beforeWithdraw).to.equal(10);

        //     // Withdraw 10 units
        //     await contract.connect(owner).withdraw(5);
        //     expect(await contract.contractBalance()).to.equal(5);

        //     // Verify amounts
        //     const afterWithdrawVault = await ethers.provider.getBalance(vault);
        //     expect(afterWithdrawVault).to.equal(beforeWithdrawVault + 5n);
        // });

        // it("🔥 Should verify withdrawal of all funds", async function () {
        //     // Define vault address
        //     const vault = '0x0d72fD549214Eb53cC241f400B147364e926E15B';
        //     const buyer = owner;

        //     // Set packages
        //     const pkgSize = 50;
        //     const packageIds = Array(pkgSize).fill('0x0');
        //     const packagePrices = Array(pkgSize).fill(0);

        //     packageIds[0] = 'Package 1';
        //     packageIds[1] = 'Package 2';
        //     packageIds[2] = 'Package 3';

        //     packagePrices[0] = 1;
        //     packagePrices[1] = 2;
        //     packagePrices[2] = 3;

        //     await contract.setPackages(packageIds, packagePrices);

        //     // Set vault address
        //     await contract.connect(owner).setVaultAddress(vault);
        //     expect(await contract.vaultAddress()).to.equal(vault);

        //     // Buy packages and add funds to contract
        //     const packageList = Array(3).fill(0);
        //     const packageQty = Array(3).fill(0);
        //     packageList[0] = 0;
        //     packageList[1] = 1;
        //     packageList[2] = 2;
        //     packageQty[0] = 3;
        //     packageQty[1] = 2;
        //     packageQty[2] = 1;

        //     await contract.connect(buyer).purchasePackages(
        //         packageList, packageQty,
        //         { value: 10, from: buyer.address }
        //     );

        //     const beforeWithdraw = await contract.contractBalance();
        //     const beforeWithdrawVault = await ethers.provider.getBalance(vault);
        //     expect(beforeWithdraw).to.equal(10);
        //     await contract.withdrawAll();
        //     expect(await contract.contractBalance()).to.equal(0);
        //     const afterWithdrawVault = await ethers.provider.getBalance(vault);
        //     expect(afterWithdrawVault).to.equal(beforeWithdrawVault + 10n);
        // });
    }
});