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

    it('should on Stage.Paused by default', async () => {
        const stage = (await toonSurvival.stage()).toString();

        expect(stage).to.equal(ToonSurvival.Stages.Paused.toString());
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

    it('should mint failed when over max supply', async () => {
        await toonSurvival.setStage(ToonSurvival.Stages.PublicSale);
        await toonSurvival.setMaxMintAmount(100);
        await toonSurvival.setMaxMintAmountPerTx(100);
        await toonSurvival.mint(100, {from: accounts[0], value: web3.utils.toWei('10', 'ether')});

        await expectRevert(toonSurvival.mint(1, {
            from: accounts[0],
            value:  web3.utils.toWei('0.1', 'ether')
        }), "Max supply exceeded!");
    });

    it('should mint failed when address mint amount is greater than maxMintAmount', async () => {
        await toonSurvival.setStage(ToonSurvival.Stages.PublicSale);
        await toonSurvival.mint(2, {from: accounts[0], value: web3.utils.toWei('0.2', 'ether')});
        await toonSurvival.mint(2, {from: accounts[0], value: web3.utils.toWei('0.2', 'ether')});
        await toonSurvival.mint(1, {from: accounts[0], value: web3.utils.toWei('0.1', 'ether')});

        await expectRevert(toonSurvival.mint(1, {
            from: accounts[0],
            value:  web3.utils.toWei('0.1', 'ether')
        }), "Mint over max mint amount!");
    });

    it('should mint failed when insufficient fund', async () => {
        await toonSurvival.setStage(ToonSurvival.Stages.PublicSale);
        await expectRevert(toonSurvival.mint(1, {from: accounts[0]}), "Insufficient funds!");
    });

    it('should mint failed when contract is Paused', async () => {
        await expectRevert(toonSurvival.mint(1, {
            from: accounts[0],
            value:  web3.utils.toWei('0.1', 'ether')
        }), "The contract is paused!");
    });

    it('should be able mintForAddress even the contract is Paused', async () => {
        await toonSurvival.mintForAddress(1, accounts[1], {from: accounts[0]});

        const supply = await toonSurvival.totalSupply();
        const walletOfOwner = await toonSurvival.walletOfOwner(accounts[1]);

        expect(supply.toNumber()).to.equal(1);
        expect(walletOfOwner.length).to.equal(1);
    });

    it('should mint failed when on Presale stage and the user doese not in whitelisted', async () => {
        await toonSurvival.setStage(ToonSurvival.Stages.Presale);
        await expectRevert(toonSurvival.mint(1, {
            from: accounts[1],
            value:  web3.utils.toWei('0.1', 'ether')
        }), "User is not whitelisted!");
    });

    it('should have token when mint on Presale and the user is in whitelisted', async () => {
        await toonSurvival.addToWhitelist([accounts[1]]);
        await toonSurvival.setStage(ToonSurvival.Stages.Presale);
        await toonSurvival.mint(1, {from: accounts[1], value: web3.utils.toWei('0.1', 'ether')});

        const supply = await toonSurvival.totalSupply();
        const walletOfOwner = await toonSurvival.walletOfOwner(accounts[1]);
        const isWhitelist = await toonSurvival.isWhitelist(accounts[1]);

        expect(isWhitelist).to.equal(true);
        expect(supply.toNumber()).to.equal(1);
        expect(walletOfOwner.length).to.equal(1);
    });

    it('should have token when mint on public sale success', async () => {
        await toonSurvival.setStage(ToonSurvival.Stages.PublicSale);
        await toonSurvival.mint(2, {from: accounts[2], value: web3.utils.toWei('0.2', 'ether')});

        const supply = await toonSurvival.totalSupply();
        const walletOfOwner = await toonSurvival.walletOfOwner(accounts[2]);
        const isWhitelist = await toonSurvival.isWhitelist(accounts[1]);

        expect(isWhitelist).to.equal(false);
        expect(supply.toNumber()).to.equal(2);
        expect(walletOfOwner.length).to.equal(2);
    });

    it('should get hiddenBaseURI with token id when get tokenURI and revealed is false', async () => {
        await toonSurvival.setStage(ToonSurvival.Stages.PublicSale);
        await toonSurvival.mint(2, {from: accounts[0], value: web3.utils.toWei('0.2', 'ether')});

        const tokenUri = await toonSurvival.tokenURI(1);

        expect(tokenUri).to.equal(hiddenBaseUri + "1");
    });

    it('should get baseUri with token id when get tokenURI and revealed is true', async () => {
        await toonSurvival.setStage(ToonSurvival.Stages.PublicSale);
        await toonSurvival.setRevealed(true);
        await toonSurvival.mint(2, {from: accounts[0], value: web3.utils.toWei('0.2', 'ether')});

        const tokenUri = await toonSurvival.tokenURI(1);

        expect(tokenUri).to.equal(baseUri + "1");
    });
});