const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();
    console.log("[INFO] Deploying contract with the account:", deployer);

    try {
        await deploy('ManaVendingMachine', {
            from: deployer,
            args: [
                "0xEbe57e8045F2F230872523bbff7374986E45C486",
                "0x0b7007c13325c48911f73a2dad5fa5dcbf808adc"
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
