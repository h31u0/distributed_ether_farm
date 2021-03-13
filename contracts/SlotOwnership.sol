pragma solidity ^0.8.0;
import "./SlotUpgrade.sol";
import "./SlotUtils.sol";
// import "./erc721.sol";
contract SlotOwnership is SlotFactory, SlotUtils /*erc721*/ {
    mapping (uint => address) slotApprovals;
    
    function balanceOf(address _owner) public view returns (uint256 _balance) {
        return OwnerSlotCount[_owner];
    }
    function ownerOf(uint256 _slotID) public view returns (address _owner) {
        return slotToOwner[_slotID];
    }
    function _transfer(address _from, address _to, uint256 _slotID) private {
        OwnerSlotCount[_to]++;
        OwnerSlotCount[_from]--;
        slotToOwner[_slotID] = _to;
        // emit Transfer(_from, _to, _tokenId);
    }
    function transfer(address _to, uint256 _slotID) public onlyOwnerOf(_slotID) {
        _transfer(msg.sender, _to, _slotID);
    }
    function approve(address _to, uint256 _slotID) public onlyOwnerOf(_slotID) {
        slotApprovals[_slotID] = _to;
        //emit Approval(msg.sender, _to, _slotID);
    }
    function takeOwnership(uint256 _slotID) public {
        require(slotApprovals[_slotID] == msg.sender);
        address owner = ownerOf(_slotID);
        _transfer(owner, msg.sender, _slotID);
    }

}