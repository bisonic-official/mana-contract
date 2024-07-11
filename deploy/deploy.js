const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();
    console.log("Deploying contract with the account:", deployer);

    try {
        await deploy('ManaVendingMachine', {
            from: deployer,
            args: [],
            log: true,
            gasPrice: 30000000000
        });
    } catch (error) {
        console.error("Error deploying contracts:", error);
    }
};

module.exports = func;
func.tags = ['ManaVendingMachine'];
