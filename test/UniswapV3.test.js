require('dotenv').config();
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

describe("Test template", function () {

  let admin, alice, bob;

  before(async () => {
    [admin, alice, bob] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const MockToken = await ethers.getContractFactory("MockToken");
    const WETH9 = await ethers.getContractFactory("WETH9");
    const UniswapV3Factory = await ethers.getContractFactory("UniswapV3Factory");
    const SwapRouter = await ethers.getContractFactory("SwapRouter");
    const NFTDescriptor = await ethers.getContractFactory("NFTDescriptor");
    const nftDescriptor = await NFTDescriptor.deploy();
    const NonfungibleTokenPositionDescriptor = await ethers.getContractFactory(
      "NonfungibleTokenPositionDescriptor", {
        libraries: {
          NFTDescriptor: nftDescriptor.address,
        },
      });
    const NonfungiblePositionManager = await ethers.getContractFactory("NonfungiblePositionManager");
    const TickLens = await ethers.getContractFactory("TickLens");
    const Quoter = await ethers.getContractFactory("Quoter");
    const QuoterV2 = await ethers.getContractFactory("QuoterV2");
    
    factoryV3 = await UniswapV3Factory.deploy();
    token0 = await MockToken.deploy("Mock Token 0", "MCK0", "1000000000000000000000000000");
    token1 = await MockToken.deploy("Mock Token 1", "MCK1", "1000000000000000000000000000");

    weth = await WETH9.deploy();

    const ncl = process.env.NATIVE_CURRENCY_LABEL;
    tokenDescriptor = await NonfungibleTokenPositionDescriptor.deploy(weth.address, ethers.utils.formatBytes32String(ncl));

    positionManager = await NonfungiblePositionManager.deploy(factoryV3.address, weth.address, tokenDescriptor.address);

    swapRouter = await SwapRouter.deploy(factoryV3.address, weth.address);

    tickLens = await TickLens.deploy();

    quoter = await Quoter.deploy(factoryV3.address, weth.address);
    quoterV2 = await QuoterV2.deploy(factoryV3.address, weth.address);
  });

  describe("Tokens", function () {
    it("balance", async () => {
      expect(await token0.balanceOf(admin.address)).to.equal("1000000000000000000000000000");
      expect(await token1.balanceOf(admin.address)).to.equal("1000000000000000000000000000");
    });

    it("initialize", async () => {
      await factoryV3.createPool(token0.address, token1.address, 500);
      [token0, token1] = token0.address < token1.address ? [token0, token1] : [token1, token0];

      const poolAddress = await factoryV3.getPool(token0.address, token1.address, 500);
      const pool = await ethers.getContractAt("UniswapV3Pool", poolAddress);

      // 1:1 ratio
      await pool.initialize("0x01000000000000000000000000");

      const tickSpacing = await pool.tickSpacing();
      const maxTick = 887272 - (887272 % tickSpacing);

      const amount = ethers.utils.parseEther("1");

      await token0.approve(positionManager.address, amount);
      await token1.approve(positionManager.address, amount);

      await positionManager.mint([
        token0.address,
        token1.address,
        500,
        -maxTick,
        maxTick,
        amount,
        amount,
        0,
        0,
        admin.address,
        9999999999
      ]);

      let expected = await quoter.callStatic.quoteExactOutputSingle(
        token0.address,
        token1.address,
        500,
        1000000,
        0
      );

      let expected2 = await quoterV2.callStatic.quoteExactOutputSingle([
        token0.address,
        token1.address,
        1000000,
        500,
        0
      ]);

      expect(expected).to.equal(expected2[0]);

      await token0.approve(swapRouter.address, 1100000);

      await swapRouter.exactOutputSingle([
        token0.address,
        token1.address,
        500,
        alice.address,
        9999999999,
        1000000,
        1100000,
        0
      ]);
    });
  });
});