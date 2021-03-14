// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./SlotFactory.sol";
contract SlotUtils is SlotFactory{

    modifier onlyOwnerOf(uint _slotID) {
        require(msg.sender == slotToOwner[_slotID]);
        _;
    }
    
    function _randomNumber(uint _limit) internal view returns (uint) {
        return uint(keccak256(abi.encodePacked(msg.sender, block.timestamp))) % _limit;
    }

}