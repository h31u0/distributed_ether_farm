// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./SlotOwnership.sol";

/**
 * @title Classifieds
 * @notice Implements the classifieds board market. The market will be governed
 * by an ERC20 token as currency, and an ERC721 token that represents the
 * ownership of the items being traded. Only ads for selling items are
 * implemented. The item tokenization is responsibility of the ERC721 contract
 * which should encode any item details.
 */
contract SlotMarket is SlotOwnership{
    event TradeStatusChange(uint256 ad, bytes32 status);

    // IERC721 itemToken;

    struct Trade {
        address poster;
        uint256 item;
        uint256 price;
        bool status; // Open, Executed, Cancelled
    }

    mapping(uint256 => Trade) public trades;

    uint256 tradeCounter = 0;

    // constructor(address _itemTokenAddress) public {
    //     itemToken = IERC721(_itemTokenAddress);
    //     tradeCounter = 0;
    // }

    function getTradeCounter() public view returns(uint){
        return tradeCounter;
    }

    /**
     * @dev Returns the details for a trade.
     * @param _trade The id for the trade.
     */
    function getTrade(uint256 _trade)
        public
        view
        virtual
        returns (
            address,
            uint256,
            uint256,
            bool
        )
    {
        Trade memory trade = trades[_trade];
        return (trade.poster, trade.item, trade.price, trade.status);
    }

    /**
     * @dev Opens a new trade. Puts _item in escrow.
     * @param _item The id for the item to trade.
     * @param _price The amount of currency for which to trade the item.
     */
    function openTrade(uint256 _item, uint256 _price) public onlyOwnerOf(_item) {
        require(OwnerSlotCount[msg.sender] > 6);
        transferFrom(msg.sender, address(this), _item);
        trades[tradeCounter] = Trade({
            poster: msg.sender,
            item: _item,
            price: _price,
            status: true
        });
        tradeCounter += 1;
        emit TradeStatusChange(tradeCounter - 1, "Open");
    }

    /**
     * @dev Executes a trade. Must have approved this contract to transfer the
     * amount of currency specified to the poster. Transfers ownership of the
     * item to the filler.
     * @param _trade The id of an existing trade
     */
    function executeTrade(uint256 _trade) public payable {
        Trade memory trade = trades[_trade];
        require(trade.status == true, "Trade is not Open");
        require(msg.value == trade.price * (1 ether));
        payable(trade.poster).transfer(trade.price);
        transferFrom(address(this), msg.sender, trade.item);
        trades[_trade].status = false;
        emit TradeStatusChange(_trade, "Executed");
    }

    /**
     * @dev Cancels a trade by the poster.
     * @param _trade The trade to be cancelled.
     */
    function cancelTrade(uint256 _trade) public  {
        Trade memory trade = trades[_trade];
        require(
            msg.sender == trade.poster,
            "Trade can be cancelled only by poster."
        );
        require(trade.status == true, "Trade is not Open.");
        transferFrom(address(this), trade.poster, trade.item);
        trades[_trade].status = false;
        emit TradeStatusChange(_trade, "Cancelled");
    }
}