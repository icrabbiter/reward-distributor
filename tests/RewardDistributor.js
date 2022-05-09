const { expect } = require("chai");
const { ethers } = require("hardhat");

const units = (value) => ethers.utils.parseUnits(value.toString());

describe("RewardDistributor", () => {
  let owner, alice, bob;
  let tkn, distributor;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    owner = accounts[0];
    alice = accounts[1];
    bob = accounts[2];

    const TestToken = await ethers.getContractFactory("TestToken");
    tkn = await TestToken.deploy(1000000); // 1M tokens
    await tkn.deployed();

    await tkn.transfer(alice.address, units(1000));
    await tkn.transfer(bob.address, units(1000));

    const RewardDistributor = await ethers.getContractFactory(
      "RewardDistributor"
    );
    distributor = await RewardDistributor.deploy(tkn.address);
    await distributor.deployed();

    await tkn.connect(alice).approve(distributor.address, units(1000));
    await tkn.connect(bob).approve(distributor.address, units(1000));
  });

  it("integration", async () => {
    // at start
    expect(await distributor.balanceOf(alice.address)).to.equal(0);
    expect(await distributor.balanceOf(bob.address)).to.equal(0);
    expect(await distributor.totalSupply()).to.equal(0);

    // alice deposit 100
    await distributor.connect(alice).deposit(units(100));

    expect(await distributor.balanceOf(alice.address)).to.equal(units(100));
    expect(await distributor.balanceOf(bob.address)).to.equal(0);
    expect(await distributor.totalSupply()).to.equal(units(100));

    // alice deposit 50
    await distributor.connect(alice).deposit(units(50));

    expect(await distributor.balanceOf(alice.address)).to.equal(units(150));
    expect(await distributor.balanceOf(bob.address)).to.equal(0);
    expect(await distributor.totalSupply()).to.equal(units(150));

    // bob deposit 100
    await distributor.connect(bob).deposit(units(50));

    expect(await distributor.balanceOf(alice.address)).to.equal(units(150));
    expect(await distributor.balanceOf(bob.address)).to.equal(units(50));
    expect(await distributor.totalSupply()).to.equal(units(200));

    // distribute 100
    await tkn.transfer(distributor.address, units(100));

    expect(await distributor.balanceOf(alice.address)).to.equal(units(225));
    expect(await distributor.balanceOf(bob.address)).to.equal(units(75));
    expect(await distributor.totalSupply()).to.equal(units(300));

    // alice withdraw 50
    await distributor.connect(alice).withdraw(units(50));

    expect(await distributor.balanceOf(alice.address)).to.closeTo(
      units(175),
      1
    );
    expect(await distributor.balanceOf(bob.address)).to.closeTo(units(75), 1);
    expect(await distributor.totalSupply()).to.closeTo(units(250), 1);

    // bob withdraw 50
    await distributor.connect(bob).withdraw(units(50));

    expect(await distributor.balanceOf(alice.address)).to.closeTo(
      units(175),
      1
    );
    expect(await distributor.balanceOf(bob.address)).to.closeTo(units(25), 1);
    expect(await distributor.totalSupply()).to.closeTo(units(200), 1);

    // bob withdraws all
    await distributor.connect(bob).withdraw(distributor.balanceOf(bob.address));

    expect(await distributor.balanceOf(alice.address)).to.closeTo(
      units(175),
      1
    );
    expect(await distributor.balanceOf(bob.address)).to.equal(0);
    expect(await distributor.totalSupply()).to.closeTo(units(175), 1);

    // alice try to withdraw more than his balance
    await expect(distributor.connect(bob).withdraw(units(200))).to.revertedWith(
      "invalid amount"
    );

    // alice withdraws all
    await distributor
      .connect(alice)
      .withdraw(distributor.balanceOf(alice.address));

    expect(await distributor.balanceOf(alice.address)).to.equal(0);
    expect(await distributor.balanceOf(bob.address)).to.equal(0);
    expect(await distributor.totalSupply()).to.equal(0);
  });
});
