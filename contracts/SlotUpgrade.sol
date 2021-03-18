// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./SlotUtils.sol";
contract SlotUpgrade is SlotUtils, Ownable{
    uint levelUpFee = 0.001 ether;
    function buySlot(uint _num) external payable {
        require(msg.value == levelUpFee *_num);
        _createCrops(_num);
    }
    function UpgradeSlot(uint _slotID) external payable {
        require(msg.value == levelUpFee);
        Slot storage mySlot = slots[_slotID];
        mySlot.exp += 10*getLevel(mySlot.exp+1);
        emit createSlotEvent(msg.sender);
    }
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    function setLevelUpFee(uint _fee) external onlyOwner {
        levelUpFee = _fee;
    }
}