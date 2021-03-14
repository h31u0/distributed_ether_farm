var SlotFactory = artifacts.require("./SlotFactory.sol");
var SlotUtils = artifacts.require("./SlotUtils.sol");
var Friend = artifacts.require("./Friend.sol");
var SlotManagement = artifacts.require("./SlotManagement.sol");
var SlotUpgrade = artifacts.require("./SlotUpgrade.sol");
var SlotOwnership = artifacts.require("./SlotOwnership.sol");
module.exports = function(deployer) {
  deployer.deploy(SlotFactory);
  deployer.deploy(SlotUtils);
  deployer.deploy(Friend);
  deployer.deploy(SlotManagement);
  deployer.deploy(SlotUpgrade);
  deployer.deploy(SlotOwnership);
};
