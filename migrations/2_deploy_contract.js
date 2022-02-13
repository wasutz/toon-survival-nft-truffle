const ToonSurvival = artifacts.require('./ToonSurvival.sol');

module.exports = (deployer, network, accounts) => {
  // IPFS URI should have '/' at the end.
  const baseUri = 'ipfs://xxxxx/';
  const hiddenUri = 'ipfs:/xxxxx/';

  deployer.deploy(ToonSurvival, baseUri, hiddenUri);
};
