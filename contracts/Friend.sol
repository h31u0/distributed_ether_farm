// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Friend {

    mapping (address => address[]) public friendsDict;

    function contains(address owner, address friend) internal view returns (bool) {
        for (uint i = 0; i < friendsDict[owner].length; i++) {
            if (friend == friendsDict[owner][i]) {
                return true;
            }
        }
        return false;
    }
    function getIndex(address owner, address friend) internal view returns (uint) {
        uint idx;
        for (uint i = 0; i < friendsDict[owner].length; i++) {
            if (friend == friendsDict[owner][i]) {
                idx = i;
            }
        }
        return idx;
    }

    function removeFriend(address owner, address friend) internal returns (bool) {
        if (!contains(owner, friend)) {
            return false;
        }
        uint idx = getIndex(owner, friend);
        uint len = friendsDict[owner].length;
        friendsDict[owner][idx] = friendsDict[owner][len - 1];
        friendsDict[owner].pop();
        return true;
    }

    function addFriend(address owner, address friend) external returns (bool) {
        // if owner and friend are already friends, return;
        if (contains(owner, friend)) {
            return false;
        }

        friendsDict[owner].push(friend);
        friendsDict[friend].push(owner);
        return true;
    }

    function deleteFriend(address owner, address friend) external returns (bool) {
        if (!contains(owner, friend)) {
            return false;
        }
        removeFriend(owner, friend);
        removeFriend(friend, owner);
        return true;
    }

    function getFriendsByOwner(address owner) external view returns (address [] memory) {
        return friendsDict[owner];
    }

    function isFriend(address f1, address f2) external view returns (bool) {
        if (contains(f1, f2)) {
            return true;
        }

        return false;
    }

}
