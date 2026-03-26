// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import {InEbool, InEuint64} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";

interface IPrivateFill {
    enum Side {
        Buy,
        Sell
    }

    event OrderSubmitted(
        uint256 indexed orderId,
        uint256 indexed bookId,
        address indexed trader,
        Side side
    );

    event OrderCancelled(uint256 indexed orderId, address indexed trader);

    event OrderMatched(
        uint256 indexed matchId,
        uint256 indexed buyOrderId,
        uint256 indexed sellOrderId,
        bytes32 fillAmountHandle,
        uint256 settlementPrice,
        address matcher
    );

    event FillPublished(
        uint256 indexed matchId,
        uint64 fillAmount,
        uint256 quoteAmount,
        address indexed revealer
    );

    function submitOrder(
        Side side,
        InEuint64 memory encAmount,
        InEuint64 memory encPrice,
        InEbool memory encSideProof
    ) external returns (uint256 orderId, uint256 bookId);

    function cancelOrder(uint256 orderId) external;

    function matchOrders(
        uint256 buyBookId,
        uint256 sellBookId,
        uint256 settlementPrice
    ) external returns (uint256 matchId);

    function publishFill(
        uint256 matchId,
        uint64 fillAmount,
        bytes calldata signature
    ) external returns (uint256 quoteAmount);
}

