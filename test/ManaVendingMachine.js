const { expect } = require("chai");

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
            expect(pkgs[values]['price']).to.equal(0);
            expect(pkgs[values]['manaQty']).to.equal(0);
        }
    });

    it("Verify setter of packages", async function () {
        const ManaVendingMachine = await ethers.getContractFactory("ManaVendingMachine");
        const contract = await ManaVendingMachine.deploy();

        // Set packages
        const manaQty = [100, 200, 300, 400, 500];
        const manaPrice = [1, 2, 3, 4, 5];
        await contract.setPackages(manaQty, manaPrice);

        const pkgs = await contract.getPackages();

        for (const values in pkgs) {
            if (values < manaQty.length) {
                expect(pkgs[values]['manaQty']).to.equal(manaQty[values]);
                expect(pkgs[values]['price']).to.equal(manaPrice[values]);
            } else {
                expect(pkgs[values]['manaQty']).to.equal(0);
                expect(pkgs[values]['price']).to.equal(0);
            }
        }
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
        const manaQty = [100, 200, 300, 400, 500];
        const manaPrice = [1, 2, 3, 4, 5];
        await contract.setPackages(manaQty, manaPrice);

        await contract.purchasePackages(
            [0, 2, 4, 0, 0, 0, 0, 0, 0, 0],
            { value: 16, from: signer.address }
        );

        const expectedBalance = 2 * 200 + 4 * 300;

        expect(await contract.getManaBalance(signer.address)).to.equal(expectedBalance);

    });
});