const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🔥 Contract deployment", function () {
    it("Verify contract owner", async function () {
        const [signer] = await ethers.getSigners();

        const ManaVendingMachine = await ethers.getContractFactory("ManaVendingMachine");
        const contract = await ManaVendingMachine.deploy();

        expect(await contract.owner()).to.equal(signer.address);
    });

    it("Verify packages initial quantity", async function () {
        const ManaVendingMachine = await ethers.getContractFactory("ManaVendingMachine");
        const contract = await ManaVendingMachine.deploy();

        const pkgQty = await contract.getPkgQty();
        const pkgs = await contract.getPackages();
        const n_elements = Object.keys(pkgs).length;
        expect(pkgQty).to.equal(n_elements);
    });

    it("Verify getter of packages", async function () {
        const ManaVendingMachine = await ethers.getContractFactory("ManaVendingMachine");
        const contract = await ManaVendingMachine.deploy();

        expect(await contract.getPackages()).to.not.be.empty;
        const pkgs = await contract.getPackages();

        for (const values in pkgs) {
            expect(pkgs[values]['price']).to.equal(BigInt(Math.pow(2, 256)) - BigInt(1));
            expect(pkgs[values]['manaQty']).to.equal(0);
        }

        // Get packages from Id
        await expect(
            contract.getPackageFromId(10)
        ).to.be.revertedWith("The pkgId must be in the size of the packages array");

        const pkg = await contract.getPackageFromId(0);
        expect(pkg['price']).to.equal(BigInt(Math.pow(2, 256)) - BigInt(1));
        expect(pkg['manaQty']).to.equal(0);
    });

    it("Verify setter of packages", async function () {
        const ManaVendingMachine = await ethers.getContractFactory("ManaVendingMachine");
        const contract = await ManaVendingMachine.deploy();

        // Set vault address
        contract.setVaultAddress("0x0d72fD549214Eb53cC241f400B147364e926E15B");
        expect(await contract.vaultAddress()).to.equal("0x0d72fD549214Eb53cC241f400B147364e926E15B");

        // Set packages and verify modified values
        const manaQty1 = [100, 200, 300];
        const manaPrice1 = [1, 2, 3];

        await contract.setPackages(manaQty1, manaPrice1);
        const pkgs = await contract.getPackages();

        for (const values in pkgs) {
            expect(pkgs[values]['manaQty']).to.equal(manaQty1[values]);
            expect(pkgs[values]['price']).to.equal(manaPrice1[values]);
        }

        // Revert with unmatching arrays
        const manaQty2 = [100, 200, 300, 400];
        const manaPrice2 = [1, 2, 3];

        await expect(
            contract.setPackages(manaQty2, manaPrice2)
        ).to.be.revertedWith("Mana quantity and prices arrays must have the same length");

        // Revert with unmatching sizes with pkgQty
        const manaQty3 = [100, 200, 300, 400];
        const manaPrice3 = [1, 2, 3, 400];

        await expect(
            contract.setPackages(manaQty3, manaPrice3)
        ).to.be.revertedWith("Mana quantity and prices arrays must be same length as pkgQty");
    });
});

describe("🔥 Mana purchase", function () {
    it("Purchase should rever with bad qty input", async function () {
        const [signer] = await ethers.getSigners();

        const ManaVendingMachine = await ethers.getContractFactory("ManaVendingMachine");
        const contract = await ManaVendingMachine.deploy();

        await expect(
            contract.purchasePackages([0, 1], { value: 1, from: signer.address })
        ).to.be.revertedWith("The length of the array is not the same as the number of packages");

    });

    it("Verify purchase", async function () {
        const [signer] = await ethers.getSigners();

        const ManaVendingMachine = await ethers.getContractFactory("ManaVendingMachine");
        const contract = await ManaVendingMachine.deploy();

        // Set packages
        const manaQty = [100, 200, 300];
        const manaPrice = [1, 2, 3];
        await contract.setPackages(manaQty, manaPrice);

        await contract.purchasePackages(
            [0, 2, 4],
            { value: 16, from: signer.address }
        );

        const expectedBalance = 2 * 200 + 4 * 300;
        expect(await contract.getManaBalance(signer.address)).to.equal(expectedBalance);

        expect(await contract.provider.getBalance(contract.address)).to.equal(16);
    });
});


describe("🔥 Withdrawal tests", function () {
    it("Verify withdrawal of an amount", async function () {
        const [signer, buyer, vault] = await ethers.getSigners();

        const ManaVendingMachine = await ethers.getContractFactory("ManaVendingMachine");
        const contract = await ManaVendingMachine.deploy();

        // Set packages
        const manaQty = [100, 200, 300];
        const manaPrice = [1, 2, 3];
        await contract.setPackages(manaQty, manaPrice);

        // Set vault address
        await contract.setVaultAddress(vault.address);
        expect(await contract.vaultAddress()).to.equal(vault.address);

        // Buy packages and add funds to contract
        await contract.connect(buyer).purchasePackages(
            [4, 4, 4],
            { value: 24, from: buyer.address }
        );

        const beforeWithdraw = await contract.provider.getBalance(contract.address);
        const beforeWithdrawVault = await contract.provider.getBalance(vault.address);
        expect(beforeWithdraw).to.equal(24);
        await contract.withdraw(10);
        expect(await contract.provider.getBalance(contract.address)).to.equal(14);
        const afterWithdrawVault = await contract.provider.getBalance(vault.address);
        expect(afterWithdrawVault).to.equal(beforeWithdrawVault.add(10));
    });

    it("Verify withdrawal of all funds", async function () {
        const [signer, buyer, vault] = await ethers.getSigners();

        const ManaVendingMachine = await ethers.getContractFactory("ManaVendingMachine");
        const contract = await ManaVendingMachine.deploy();

        // Set packages
        const manaQty = [100, 200, 300];
        const manaPrice = [1, 2, 3];
        await contract.setPackages(manaQty, manaPrice);

        // Set vault address
        await contract.setVaultAddress(vault.address);
        expect(await contract.vaultAddress()).to.equal(vault.address);

        // Buy packages and add funds to contract
        await contract.connect(buyer).purchasePackages(
            [4, 4, 4],
            { value: 24, from: buyer.address }
        );

        const beforeWithdraw = await contract.provider.getBalance(contract.address);
        const beforeWithdrawVault = await contract.provider.getBalance(vault.address);
        expect(beforeWithdraw).to.equal(24);
        await contract.withdrawAll();
        expect(await contract.provider.getBalance(contract.address)).to.equal(0);
        const afterWithdrawVault = await contract.provider.getBalance(vault.address);
        expect(afterWithdrawVault).to.equal(beforeWithdrawVault.add(24));
    });
});