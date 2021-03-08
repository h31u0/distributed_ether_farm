pragma solidity ^0.8.0;
import "./SlotFactory.sol";
contract SlotManagement is SlotFactory {
    mapping (uint => Slot) public cropsList;

    modifier ownerOf(uint _slotID) {
        require(msg.sender == slotToOwner[_slotID]);
        _;
    }
    // TODO: find a way to change 100 to some random number
    function _randomNumber(uint _limit) internal view returns (uint) {
        return 100 % _limit;
    }
    function modInCropsList(uint _cropID, uint _grow_time, uint _price) external {
        cropsList[_cropID] = Slot(_cropID, _grow_time, _price, 0, 0, false, 1);
    }
    function delInCropsList(uint _cropID) external {
        cropsList[_cropID] = Slot(0, 0, 0, 0, 0, false, 1);
    }
    function _triggerGrow(Slot storage _slot) internal {
        _slot.grow_time = uint32(block.timestamp + (cropsList[_slot.cropID].grow_time * (10-_slot.level)));
    }
    function _triggerDry(Slot storage _slot) internal {
        _slot.dry_time = uint32(block.timestamp + _randomNumber(_slot.grow_time - block.timestamp) + 10);
    }
    function _triggerGrass(Slot storage _slot) internal {
        _slot.grass_time = uint32(block.timestamp + _randomNumber(_slot.grow_time - block.timestamp) + 10);
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
    function plant(uint _cropID, uint _slotID) public ownerOf(_slotID){
        Slot storage mySlot = slots[_slotID];
        require(mySlot.cropID == 0 && OwnerMoneyCount[msg.sender] > (cropsList[_cropID].price));
        OwnerMoneyCount[msg.sender] = OwnerMoneyCount[msg.sender] - (cropsList[_cropID].price);
        mySlot.cropID = cropsList[_cropID].cropID;
        mySlot.grow_time = cropsList[_cropID].grow_time;
        mySlot.price = cropsList[_cropID].price;
        _triggerGrow(mySlot);
        _triggerDry(mySlot);
        _triggerGrass(mySlot);
    }
    function harvest(uint _slotID) public ownerOf(_slotID){
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
    }

    function watering(uint _slotID) public ownerOf(_slotID){
        Slot storage mySlot = slots[_slotID];
        require(! _isReady(mySlot) && _isDry(mySlot));
        _triggerDry(mySlot);
    }
    function weeding(uint _slotID) public ownerOf(_slotID){
        Slot storage mySlot = slots[_slotID];
        require(! _isReady(mySlot) && _isGrass(mySlot));
        _triggerGrass(mySlot);
    }
    function steal(uint _slotID) public {
        Slot storage mySlot = slots[_slotID];
        require(_isReady(mySlot));
        require(!mySlot.stealed);
        OwnerMoneyCount[msg.sender] = OwnerMoneyCount[msg.sender] + (mySlot.price);
        mySlot.stealed = true;
    }
}
