const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();
    console.log("[INFO] Deploying contract with the account:", deployer);

    try {
        await deploy('ManaVendingMachine', {
            from: deployer,
            args: [],
            log: true,
            gasPrice: 30000000000
        });
    } catch (error) {
        console.error("[ERROR] Error deploying contract:", error);
    }
};

module.exports = func;
func.tags = ['ManaVendingMachine'];
