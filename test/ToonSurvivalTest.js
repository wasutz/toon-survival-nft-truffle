const {expect} = require('chai');
const {expectRevert} = require('@openzeppelin/test-helpers');
const web3 = require('web3');

const ToonSurvival = artifacts.require("ToonSurvival");

contract("ToonSurvival", accounts => {
    let toonSurvival = null;
    const baseUri = "ipfs://baseUri/";
    const hiddenBaseUri = "ipfs://hiddenBaseUri/";

    beforeEach(async () => {
        toonSurvival = await ToonSurvival.new(baseUri, hiddenBaseUri);
    });

    it('should has 0 totalSupply with no minted token', async () => {
        const supply = await toonSurvival.totalSupply();

        expect(supply.toNumber()).to.equal(0);
    });

    it('should paused by default', async () => {
        const paused = await toonSurvival.paused();

        expect(paused).to.equal(false);
    });

    it('should return empty walletOfOwner with no minted token', async () => {
        const ids = await toonSurvival.walletOfOwner(accounts[0]);

        expect(ids.length).to.equal(0);
    });

    it('should mint failed when mint amount is 0', async () => {
        await expectRevert(toonSurvival.mint(0, {from: accounts[0]}), "Invalid mint amount!");
    });

    it('should mint failed when mintAmount is greater than maxMintAmountPerTx', async () => {
        await expectRevert(toonSurvival.mint(6, {
            from: accounts[0],
            value:  web3.utils.toWei('0.1', 'ether')
        }), "Invalid mint amount!");
    });

    it('should mint failed when address mint amount is greater than maxMintAmount', async () => {
        await toonSurvival.mint(2, {from: accounts[0], value: web3.utils.toWei('0.2', 'ether')});
        await toonSurvival.mint(2, {from: accounts[0], value: web3.utils.toWei('0.2', 'ether')});
        await toonSurvival.mint(1, {from: accounts[0], value: web3.utils.toWei('0.1', 'ether')});

        await expectRevert(toonSurvival.mint(1, {
            from: accounts[0],
            value:  web3.utils.toWei('0.1', 'ether')
        }), "Mint over max mint amount!");
    });

    it('should mint failed when insufficient fund', async () => {
        await expectRevert(toonSurvival.mint(1, {from: accounts[0]}), "Insufficient funds!");
    });

    it('should mint failed when contract is paused', async () => {
        await toonSurvival.setPaused(true);
        await expectRevert(toonSurvival.mint(1, {
            from: accounts[0],
            value:  web3.utils.toWei('0.1', 'ether')
        }), "The contract is paused!");
    });

    it('should be able mintForAddress even the contract is paused', async () => {
        await toonSurvival.setPaused(true);
        await toonSurvival.mintForAddress(1, accounts[1], {from: accounts[0]});

        const supply = await toonSurvival.totalSupply();
        const walletOfOwner = await toonSurvival.walletOfOwner(accounts[1]);

        expect(supply.toNumber()).to.equal(1);
        expect(walletOfOwner.length).to.equal(1);
    });

    it('should have token when mint success', async () => {
        await toonSurvival.mint(2, {from: accounts[0], value: web3.utils.toWei('0.2', 'ether')});

        const supply = await toonSurvival.totalSupply();
        const walletOfOwner = await toonSurvival.walletOfOwner(accounts[0]);

        expect(supply.toNumber()).to.equal(2);
        expect(walletOfOwner.length).to.equal(2);
    });

    it('should get hiddenBaseURI with token id when get tokenURI and revealed is false', async () => {
        await toonSurvival.mint(2, {from: accounts[0], value: web3.utils.toWei('0.2', 'ether')});

        const tokenUri = await toonSurvival.tokenURI(1);

        expect(tokenUri).to.equal(hiddenBaseUri + "1");
    });

    it('should get baseUri with token id when get tokenURI and revealed is tru', async () => {
        await toonSurvival.setRevealed(true);
        await toonSurvival.mint(2, {from: accounts[0], value: web3.utils.toWei('0.2', 'ether')});

        const tokenUri = await toonSurvival.tokenURI(1);

        expect(tokenUri).to.equal(baseUri + "1");
    });
});