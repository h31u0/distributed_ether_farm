// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./SlotFactory.sol";
contract SlotUtils is SlotFactory, Ownable{

    event updateCropList(uint cropID,uint grow_time, uint price, uint exp);
    event deleteCropList(uint cropID);
    // event deleteLevelList(uint level);
    mapping (uint => Slot) public cropsList;
    uint[] public levelList;    

    function modInCropsList(uint _cropID, uint _grow_time, uint _price, uint _exp) external onlyOwner{
        cropsList[_cropID] = Slot(_cropID, _grow_time, _price, 0, 0, false, _exp);
        emit updateCropList(_cropID, _grow_time, _price, _exp);
    }
    function delInCropsList(uint _cropID) external onlyOwner {
        cropsList[_cropID] = Slot(0, 0, 0, 0, 0, false, 0);
        emit deleteCropList(_cropID);
    }
    
    function addInLevelList(uint _exp) external onlyOwner{
        require(_exp > levelList[levelList.length-1]);
        levelList.push(_exp);
        // emit updateLevelList(levelList.length-1, _exp);
    }
    function getLevel(uint exp) public view returns (uint) {
        for (uint i=0; i<levelList.length; i++) {
            if(exp>levelList[i]){
                return i;
            }
        }
        return 0;
    }

    modifier onlyOwnerOf(uint _slotID) {
        require(msg.sender == slotToOwner[_slotID]);
        _;
    }
    
    function _randomNumber(uint _limit) internal view returns (uint) {
        return uint(keccak256(abi.encodePacked(msg.sender, block.timestamp))) % _limit;
    }

}