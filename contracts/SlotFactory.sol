// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
contract SlotFactory{
    
    event createSlotEvent(address indexed addr);

    struct Slot {
        uint cropID;
        uint grow_time;
        uint price;
        uint dry_time;
        uint grass_time;
        bool stealed;
        uint exp;
    }

    Slot[] public slots;

    mapping (uint => address) public slotToOwner;
    mapping (address => uint) public OwnerMoneyCount;
    mapping (address => uint) public OwnerSlotCount;
    // mapping (address => string) public OwnerName;

    function _createFarm() internal {
        _createCrops(6);
        OwnerMoneyCount[msg.sender] = 100;
        // OwnerName[msg.sender] = _name;
        
    }
    function _createCrops(uint num) internal {
        for (uint256 index = 0; index < num; index++) {
            uint id = slots.length;
            slots.push(Slot(0, 0, 0, 0, 0, false, 1));
            slotToOwner[id] = msg.sender;
            OwnerSlotCount[msg.sender]++;
        }
        emit createSlotEvent(msg.sender);
    }
    function createFarm() public{
        require(OwnerSlotCount[msg.sender] == 0);
        _createFarm();
    }
    function getFarmByOwner(address _owner) external view returns(uint[] memory) {
        uint[] memory result = new uint[](OwnerSlotCount[_owner]);
        uint counter = 0;
        for (uint i = 0; i < slots.length; i++) {
            if (slotToOwner[i] == _owner) {
                result[counter] = i;
                counter++;
            }
        }
        return result;
    }
    // function getLevel(uint exp) public pure returns (uint) {
    //     uint a = exp;
    //     uint res = 0;
    //     while(a != 0){
    //         a = a/10;
    //         res++;
    //     }
    //     return res;
    // }
}