const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("📝 Mana Contract", function () {
    let ManaVendingMachine, contract, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2, signer] = await ethers.getSigners();

        // Deploy the Token contract
        ManaVendingMachine = await ethers.getContractFactory("ManaVendingMachine");
        contract = await ManaVendingMachine.deploy();
        await contract.waitForDeployment();
    });

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
        await contract.connect(owner).setVaultAddress(addr1.address);
        expect(await contract.vaultAddress()).to.equal(addr1.address);

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

    it("🔥 Purchase should revert with bad quantity input", async function () {
        await expect(
            contract.purchasePackages([0, 1], [0], { value: 1, from: owner.address })
        ).to.be.revertedWith("The length of the indices is not the same as the quantities");

    });

    it("🔥 Purchase should revert inexact value sent", async function () {
        // Set packages
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

         // Purchase packages
         const packageList = Array(pkgSize).fill(0);
         const packageQty = Array(pkgSize).fill(0);
         packageList[0] = 0;
         packageList[1] = 1;
         packageList[2] = 2;
         packageQty[0] = 1;
         packageQty[1] = 1;
         packageQty[2] = 1;
 
         await expect(contract.connect(owner).purchasePackages(
             packageList, packageQty,
             { value: 10, from: owner.address }
         )).to.be.revertedWith("Value sent is not exact");

        // Purchase single package
        const _index = 100;
        const _qty = 3;
        await expect(
            contract.connect(addr1).purchasePackage(
                _index, _qty,
                { value: 3, from: addr1.address }
            )
        ).to.be.revertedWith("The index of package is not valid");

    });

    it("🔥 Should verify purchase, package index, and balances", async function () {
        // Set packages
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

        // Purchase packages
        const packageList = Array(pkgSize).fill(0);
        const packageQty = Array(pkgSize).fill(0);
        packageList[0] = 0;
        packageList[1] = 1;
        packageList[2] = 2;
        packageQty[0] = 1;
        packageQty[1] = 1;
        packageQty[2] = 1;

        await contract.connect(addr1).purchasePackages(
            packageList, packageQty,
            { value: 6, from: addr1.address }
        );

        // Verify contract balance
        expect(await contract.contractBalance()).to.equal(6);

        // Purchase single package
        const _index = 1;
        const _qty = 3;
        await contract.connect(addr2).purchasePackage(
            _index, _qty,
            { value: 6, from: addr2.address }
        )

        // Verify contract balance
        expect(await contract.contractBalance()).to.equal(12);
    });

    it("🔥 Should verify withdrawal of an amount", async function () {
        // Define vault address
        const vault = addr2;
        const buyer = addr1;

        // Set packages
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

        // Set vault address
        await contract.connect(owner).setVaultAddress(vault.address);
        expect(await contract.vaultAddress()).to.equal(vault.address);

        // Buy packages and add funds to contract
        const packageList = Array(pkgSize).fill(0);
        const packageQty = Array(pkgSize).fill(0);
        packageList[0] = 0;
        packageList[1] = 1;
        packageList[2] = 2;
        packageQty[0] = 3;
        packageQty[1] = 2;
        packageQty[2] = 1;

        await contract.connect(buyer).purchasePackages(
            packageList, packageQty,
            { value: 10, from: buyer.address }
        );

        // Get balances before withdrawal
        const beforeWithdraw = await contract.contractBalance();
        const beforeWithdrawVault = await ethers.provider.getBalance(vault.address);
        expect(beforeWithdraw).to.equal(10);

        // Withdraw 10 units
        await contract.connect(owner).withdraw(5);
        expect(await contract.contractBalance()).to.equal(5);

        // Verify amounts
        const afterWithdrawVault = await ethers.provider.getBalance(vault.address);
        expect(afterWithdrawVault).to.equal(beforeWithdrawVault + 5n);
    });

    it("🔥 Should verify withdrawal of all funds", async function () {
        // Define vault address
        const vault = addr2;
        const buyer = addr1;

        // Set packages
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

        // Set vault address
        await contract.connect(owner).setVaultAddress(vault.address);
        expect(await contract.vaultAddress()).to.equal(vault.address);

        // Buy packages and add funds to contract
        const packageList = Array(pkgSize).fill(0);
        const packageQty = Array(pkgSize).fill(0);
        packageList[0] = 0;
        packageList[1] = 1;
        packageList[2] = 2;
        packageQty[0] = 3;
        packageQty[1] = 2;
        packageQty[2] = 1;

        await contract.connect(buyer).purchasePackages(
            packageList, packageQty,
            { value: 10, from: buyer.address }
        );

        const beforeWithdraw = await contract.contractBalance();
        const beforeWithdrawVault = await ethers.provider.getBalance(vault.address);
        expect(beforeWithdraw).to.equal(10);
        await contract.withdrawAll();
        expect(await contract.contractBalance()).to.equal(0);
        const afterWithdrawVault = await ethers.provider.getBalance(vault.address);
        expect(afterWithdrawVault).to.equal(beforeWithdrawVault + 10n);
    });
});