const hre = require("hardhat");
const { Deployer, Reporter } =require("@solarity/hardhat-migrate");
require('dotenv').config();

// Comment toolbox and uncomment migrate and waffle inside hardhat.config.js
module.exports = async (deployer) => {
  const Factory = await hre.ethers.getContractFactory("UniswapV3Factory");
  const SwapRouter = await hre.ethers.getContractFactory("SwapRouter");
  const NonfungibleTokenPositionDescriptor = await hre.artifacts.readArtifact(
    "contracts/v3-periphery/NonfungibleTokenPositionDescriptor.sol:NonfungibleTokenPositionDescriptor"
  );
  const NonfungiblePositionManager = await hre.ethers.getContractFactory("NonfungiblePositionManager");
  const TickLens = await hre.ethers.getContractFactory("TickLens");
  const Quoter = await hre.ethers.getContractFactory("Quoter");
  const QuoterV2 = await hre.ethers.getContractFactory("QuoterV2");

  const factory = await deployer.deploy(Factory);

  const WETH = process.env.WETH;
  const ncl = process.env.NATIVE_CURRENCY_LABEL;

  const tokenDescriptor = await deployer.deploy(
    NonfungibleTokenPositionDescriptor, 
    [WETH, hre.ethers.utils.formatBytes32String(ncl)]
  );

  await deployer.deploy(
    NonfungiblePositionManager, 
    [factory.address, WETH, tokenDescriptor.address]
  );

  await deployer.deploy(SwapRouter, [factory.address, WETH]);

  await deployer.deploy(TickLens);

  await deployer.deploy(Quoter, [factory.address, WETH]);
  await deployer.deploy(QuoterV2, [factory.address, WETH]);

  // console.log(hre.artifacts.getArtifactPaths())

};
