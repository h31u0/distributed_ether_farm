pragma solidity ^0.8.0;
import "./SlotFactory.sol";
import "./SlotUtils.sol";
contract SlotManagement is SlotFactory, SlotUtils{
    event updateSlot(address indexed owner, uint slotID,uint cropID,uint grow_time,uint price,uint dry_time,uint grass_time,bool stealed, uint level);
    event updateCropList(uint cropID,uint grow_time, uint price, uint level);
    event deleteCropList(uint cropID);
    mapping (uint => Slot) public cropsList;

    
    function modInCropsList(uint _cropID, uint _grow_time, uint _price, uint _level) external {
        cropsList[_cropID] = Slot(_cropID, _grow_time, _price, 0, 0, false, _level);
        emit updateCropList(_cropID, _grow_time, _price, _level);
    }
    function delInCropsList(uint _cropID) external {
        cropsList[_cropID] = Slot(0, 0, 0, 0, 0, false, 1);
        emit deleteCropList(_cropID);
    }

    function _triggerGrow(Slot storage _slot) internal {
        _slot.grow_time = uint32(block.timestamp + (cropsList[_slot.cropID].grow_time * (10-_slot.level)));
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

    function plant(uint _cropID, uint _slotID) public onlyOwnerOf(_slotID){
        Slot storage mySlot = slots[_slotID];
        require(mySlot.cropID == 0 && OwnerMoneyCount[msg.sender] >= cropsList[_cropID].price && getLevel(mySlot.level) >=cropsList[_cropID].level);
        OwnerMoneyCount[msg.sender] = OwnerMoneyCount[msg.sender] - (cropsList[_cropID].price);
        mySlot.cropID = cropsList[_cropID].cropID;
        mySlot.grow_time = cropsList[_cropID].grow_time;
        mySlot.price = cropsList[_cropID].price;
        mySlot.stealed = false;
        _triggerGrow(mySlot);
        _triggerDry(mySlot);
        _triggerGrass(mySlot);
        emit updateSlot(msg.sender, _slotID, _cropID, mySlot.grow_time, mySlot.price, mySlot.dry_time, mySlot.grass_time, false, mySlot.level);
    }
    function harvest(uint _slotID) public onlyOwnerOf(_slotID){
        Slot storage mySlot = slots[_slotID];
        require(_isReady(mySlot));
        uint _tag = 5;
        if(mySlot.dry_time > mySlot.grow_time){
            _tag --;
        }
        if(mySlot.grass_time > mySlot.grow_time){
            _tag --;
        }
        if(mySlot.stealed){
            _tag --;
        }
        OwnerMoneyCount[msg.sender] = OwnerMoneyCount[msg.sender] + (mySlot.price * _tag);
        mySlot.cropID = 0;
        if(_tag == 5){
            mySlot.level ++;
        }
        emit updateSlot(msg.sender, _slotID, 0, 0, 0, 0, 0, false, mySlot.level);

    }

    function watering(uint _slotID) public onlyOwnerOf(_slotID){
        Slot storage mySlot = slots[_slotID];
        require(! _isReady(mySlot) && _isDry(mySlot));
        _triggerDry(mySlot);
        emit updateSlot(msg.sender, _slotID, mySlot.cropID, mySlot.grow_time, mySlot.price, mySlot.dry_time, mySlot.grass_time, false, mySlot.level);

    }
    function weeding(uint _slotID) public onlyOwnerOf(_slotID){
        Slot storage mySlot = slots[_slotID];
        require(! _isReady(mySlot) && _isGrass(mySlot));
        _triggerGrass(mySlot);
        emit updateSlot(msg.sender, _slotID, mySlot.cropID, mySlot.grow_time, mySlot.price, mySlot.dry_time, mySlot.grass_time, false, mySlot.level);

    }
    function steal(uint _slotID) public {
        Slot storage mySlot = slots[_slotID];
        require(_isReady(mySlot));
        require(!mySlot.stealed);
        OwnerMoneyCount[msg.sender] = OwnerMoneyCount[msg.sender] + (mySlot.price);
        mySlot.stealed = true;
        emit updateSlot(msg.sender, _slotID, mySlot.cropID, mySlot.grow_time, mySlot.price, mySlot.dry_time, mySlot.grass_time, true, mySlot.level);

    }
}