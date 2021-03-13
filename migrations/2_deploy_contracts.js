var SlotFactory = artifacts.require("./SlotFactory.sol");
var SlotManagement = artifacts.require("./SlotManagement.sol");
var SlotUpgrade = artifacts.require("./SlotUpgrade.sol");

module.exports = function(deployer) {
  deployer.deploy(SlotFactory);
  deployer.deploy(SlotManagement);
  deployer.deploy(SlotUpgrade);
};
