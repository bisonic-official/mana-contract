const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();
    console.log("[INFO] Deploying contract with the account:", deployer);

    try {
        const mockUSDCContract = await deploy('ERC20Mock', {
            from: deployer,
            args: [],
            log: true,
            gasPrice: 30000000000
        });

        await deploy('ManaVendingMachine', {
            from: deployer,
            args: [
                // "0xEbe57e8045F2F230872523bbff7374986E45C486", // Saigon
                "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729", // Sepolia
                mockUSDCContract.address
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
