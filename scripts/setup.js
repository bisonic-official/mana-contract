// Import ethers.js library
const { ethers } = require('ethers');
var fs = require('fs');

async function main() {
    // Contract address and ABI
    const contractAddress = '0x0000000000000000000000000000000000000000';
    const jsonFile = 'artifacts/contracts/ManaVendingMachine.sol/ManaVendingMachine.json';
    const parsed = JSON.parse(fs.readFileSync(jsonFile));
    const contractABI = parsed.abi;

    // Create an ethers.js provider
    const provider = new ethers.providers.JsonRpcProvider('https://saigon-testnet.roninchain.com/rpc');
    const signer = new ethers.Wallet(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        provider
    );

    // Create a contract instance
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    // Verify vault address before setting it
    console.log("Mana vault address:", await contract.vaultAddress());

    // Set vault address
    const contractWithSigner = contract.connect(signer);
    const vaultAddress = '0x0000000000000000000000000000000000000000';
    // let transaction = await contractWithSigner.setVaultAddress(vaultAddress);
    // await transaction.wait();
    // console.log("Mana new vault address:", await contract.vaultAddress());

    // Get packages
    console.log("Mana packages:", await contract.getPackages());

    // Set packages
    // const manaQty = [1000, 2000, 3000];
    // const manaPrice = [
    //     ethers.utils.parseEther('0.01'),
    //     ethers.utils.parseEther('0.02'),
    //     ethers.utils.parseEther('0.03')
    // ];
    // transaction = await contractWithSigner.setPackages(manaQty, manaPrice);
    // await transaction.wait();
    // console.log("Mana new packages (after setup):", await contract.getPackages());

    // Purchase packages
    transaction = await contractWithSigner.purchasePackages(
        [2, 1, 1], // 100 * 3 + 200 * 2 + 300 * 1 = 1000
        { value: ethers.utils.parseEther('0.07'), from: signer.address }
    );
    await transaction.wait();

    // Get mana balance
    console.log("Mana balance for buyer:", await contract.getManaBalance(signer.address));
    console.log("Contract balance:", await contract.contractBalance());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
