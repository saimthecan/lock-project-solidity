const { expect } = require('chai');
const { ethers, network } = require('hardhat');
const provider = ethers.provider;

const TOKEN_ADDRESS = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";

const TOKEN_ABI = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address owner) view returns (uint256)"
];

function ethToNum(val) {
    return Number(ethers.utils.formatEther(val));
}

async function getBlockTimestamp() {
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    return block.timestamp;
}

async function increaseTime(value) {
    await provider.send('evm_increaseTime', [value]);
    await provider.send('evm_mine');
}

describe("Timelock", function() {
    let owner, user;
    let userBalance;
    let Lock, lock;
    let token;

    let timestamp, initialTimestamp;

    before(async function() {
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x6b3Ebd3430A7672bA34d4266334Eb35f6071C963"],
        });

        owner = await ethers.getSigner("0x6b3Ebd3430A7672bA34d4266334Eb35f6071C963");
        [user] = await ethers.getSigners();

        token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);

        Lock = await ethers.getContractFactory("Lock");
        lock = await Lock.connect(owner).deploy(token.address);

        await token.connect(owner).transfer(user.address, ethers.utils.parseUnits("10", 18));
        await token.connect(user).approve(lock.address, ethers.constants.MaxUint256);

        await network.provider.send("evm_setAutomine", [false]);

        initialTimestamp = await getBlockTimestamp();

        await provider.send('evm_setNextBlockTimestamp', [initialTimestamp + 1]);
        await provider.send('evm_mine');
    });

    beforeEach(async function() {
        userBalance = ethToNum(await token.balanceOf(user.address));
        timestamp = await getBlockTimestamp();
    });

    it("Forks", async function() {
        expect(owner.address).to.be.properAddress;
        expect(user.address).to.be.properAddress;
        expect(token.address).to.be.properAddress;
        expect(lock.address).to.be.properAddress;
    });

    it("Funds user", async function() {
        expect(userBalance).to.be.greaterThan(0);
    });

    describe("Contract Interaction", function() {
        it("t = 2 - Locks for 5 seconds", async function() {
            await provider.send('evm_setNextBlockTimestamp', [initialTimestamp + 2]);
            await lock.connect(user).lockTokens(ethers.utils.parseEther("10"), "5");
            await provider.send("evm_mine");
        });

        it("t >= 7 - Can withdraw", async function() {
            await provider.send('evm_setNextBlockTimestamp', [initialTimestamp + 8]);
            await lock.connect(user).withdrawTokens();
            await provider.send("evm_mine");

            const newBalance = ethToNum(await token.balanceOf(user.address));
            expect(newBalance).to.be.equal(userBalance + 10);
        });

        it("Skips time", async function() {
            await network.provider.send("evm_setAutomine", [true]);
            await increaseTime(1000);

            const newTimestamp = await getBlockTimestamp();
            expect(newTimestamp).to.be.greaterThan(timestamp);
            console.log("timestamps ->", timestamp, newTimestamp);
        });
    });
});
