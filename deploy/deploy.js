const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();
    console.log("[INFO] Deploying contract with the account:", deployer);

    try {
        // const mockUSDCContract = await deploy('ERC20Mock', {
        //     from: deployer,
        //     args: [],
        //     log: true,
        //     gasPrice: 30000000000
        // });

        await deploy('ManaVendingMachine', {
            from: deployer,
            args: [
                "0xEbe57e8045F2F230872523bbff7374986E45C486", // SAIGON
                // "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21", // SEPOLIA
                // "0x2880aB155794e7179c9eE2e38200202908C17B43", // RONIN
                // "0x4305FB66699C3B2702D4d05CF36551390A4c69C6", // ETHEREUM
                // mockUSDCContract.address
                "0x0b7007c13325c48911f73a2dad5fa5dcbf808adc", // RONIN USDC
                // "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // ETHEREUM USDC
                "0x253ef7651433ca9ca5de487e1661a27080e85a83" // SAIGON PIXEL 
                // "0x7eae20d11ef8c779433eb24503def900b9d28ad7" // RONIN PIXEL 
            ],
            log: true,
            gasPrice: 30000000000
        });

    } catch (error) {
        console.error("[ERROR] Error deploying contract:", error);
    }
};

module.exports = func;
func.tags = ['ManaVendingMachine'];
