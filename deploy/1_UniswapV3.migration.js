const hre = require("hardhat");
const { Deployer, Reporter } =require("@solarity/hardhat-migrate");

// Comment toolbox and uncomment migrate and waffle inside hardhat.config.js
module.exports = async (deployer) => {
  const Factory = await hre.ethers.getContractFactory("UniswapV3Factory");

  await deployer.deploy(Factory);
};
