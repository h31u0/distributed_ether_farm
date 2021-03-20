// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Friend.sol";
import "./SlotUpgrade.sol";
contract SlotManagement is Friend, SlotUpgrade{
    event updateSlot(address indexed owner, uint slotID,uint cropID,uint grow_time,uint price,uint dry_time,uint grass_time,bool stealed, uint exp, uint balance);
    event updateCropList(uint cropID,uint grow_time, uint price, uint exp);
    event deleteCropList(uint cropID);
    event deleteLevelList(uint level);
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
        levelList.push(levelList);
        emit updateLevelList(levelList.length-1, _exp);
    }
    function delLastInLevelList() external onlyOwner {
        levelList.length--;
        emit updateLevelList(levelList.length-1, 0);
    }
    
    function getLevel(uint exp) public pure returns (uint) {
        for (uint i=0; i<levelList.length; i++) {
            if(exp>levelList[i]){
                return i;
            }
        }
        return 0;
    }

    function _triggerGrow(Slot storage _slot) internal {
        _slot.grow_time = uint32(block.timestamp + (cropsList[_slot.cropID].grow_time));
    }
    function _triggerDry(Slot storage _slot) internal {
        _slot.dry_time = uint32(block.timestamp + _randomNumber(_slot.grow_time - block.timestamp) + 100);
    }
    function _triggerGrass(Slot storage _slot) internal {
        _slot.grass_time = uint32(block.timestamp + _randomNumber(_slot.grow_time - block.timestamp) + 100);
    }
    function _isReady(Slot storage _slot) internal view returns (bool) {
        return (_slot.grow_time <= block.timestamp);
    }
    function _isDry(Slot storage _slot) internal view returns (bool) {
        return (_slot.dry_time <= block.timestamp);
    }
    function _isGrass(Slot storage _slot) internal view returns (bool) {
        return (_slot.grass_time <= block.timestamp);
    }

    function plant(uint _cropID, uint _slotID) external onlyOwnerOf(_slotID){
        Slot storage mySlot = slots[_slotID];
        require(mySlot.cropID == 0 && OwnerMoneyCount[msg.sender] >= cropsList[_cropID].price && (mySlot.exp + 10) >= cropsList[_cropID].exp);
        uint remainingBalance = OwnerMoneyCount[msg.sender] - (cropsList[_cropID].price);
        OwnerMoneyCount[msg.sender] = remainingBalance;
        mySlot.cropID = cropsList[_cropID].cropID;
        mySlot.grow_time = cropsList[_cropID].grow_time;
        mySlot.price = cropsList[_cropID].price;
        mySlot.stealed = false;
        _triggerGrow(mySlot);
        _triggerDry(mySlot);
        _triggerGrass(mySlot);
        emit updateSlot(msg.sender, _slotID, _cropID, mySlot.grow_time, mySlot.price, mySlot.dry_time, mySlot.grass_time, false, mySlot.exp, remainingBalance);
    }
    function harvest(uint _slotID) public onlyOwnerOf(_slotID){
        Slot storage mySlot = slots[_slotID];
        require(_isReady(mySlot));
        uint _tag = 2;
        if(mySlot.dry_time > mySlot.grow_time){
            _tag ++;
        }
        if(mySlot.grass_time > mySlot.grow_time){
            _tag ++;
        }
        if(!mySlot.stealed){
            _tag ++;
        }
        uint remainingBalance = OwnerMoneyCount[msg.sender] + (mySlot.price * _tag);
        OwnerMoneyCount[msg.sender] = remainingBalance;
        mySlot.cropID = 0;
        if(_tag == 5){
           //mySlot.exp +=cropsList[mySlot.cropID].exp;
            mySlot.exp ++;

        }
        emit updateSlot(msg.sender, _slotID, 0, 0, 0, 0, 0, false, mySlot.exp, remainingBalance);

    }

    function watering(uint _slotID) external onlyOwnerOf(_slotID){
        Slot storage mySlot = slots[_slotID];
        require(! _isReady(mySlot) && _isDry(mySlot));
        _triggerDry(mySlot);
        emit updateSlot(msg.sender, _slotID, mySlot.cropID, mySlot.grow_time, mySlot.price, mySlot.dry_time, mySlot.grass_time, false, mySlot.exp, OwnerMoneyCount[msg.sender]);

    }
    function weeding(uint _slotID) external onlyOwnerOf(_slotID){
        Slot storage mySlot = slots[_slotID];
        require(! _isReady(mySlot) && _isGrass(mySlot));
        _triggerGrass(mySlot);
        emit updateSlot(msg.sender, _slotID, mySlot.cropID, mySlot.grow_time, mySlot.price, mySlot.dry_time, mySlot.grass_time, false, mySlot.exp, OwnerMoneyCount[msg.sender]);

    }
    function steal(uint _slotID) external {
        require(isFriend(msg.sender, slotToOwner[_slotID]));
        Slot storage mySlot = slots[_slotID];
        require(_isReady(mySlot));
        require(!mySlot.stealed);
        OwnerMoneyCount[msg.sender] = OwnerMoneyCount[msg.sender] + (mySlot.price);
        mySlot.stealed = true;
        emit updateSlot(msg.sender, _slotID, mySlot.cropID, mySlot.grow_time, mySlot.price, mySlot.dry_time, mySlot.grass_time, true, mySlot.exp, OwnerMoneyCount[msg.sender]);
    }
}
