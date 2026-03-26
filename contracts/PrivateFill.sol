// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import {FHE, ebool, euint64} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {InEbool, InEuint64} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {IPrivateFill} from "./interfaces/IPrivateFill.sol";
import {OracleGuard} from "./OracleGuard.sol";
import {SettlementVault} from "./SettlementVault.sol";

contract PrivateFill is IPrivateFill, OracleGuard {
    error InvalidOrder(uint256 orderId);
    error InvalidBookEntry(uint256 bookId);
    error InvalidMatch(uint256 matchId);
    error Unauthorized(address caller);
    error OrderCancelledAlready(uint256 orderId);
    error SelfMatch(address trader);

    struct Order {
        uint256 id;
        euint64 remainingAmount;
        euint64 limitPrice;
        ebool sideProof;
        address trader;
        uint40 submittedAt;
        bool cancelled;
    }

    struct OrderPointer {
        Side side;
        uint256 bookId;
    }

    struct MatchRecord {
        uint256 buyOrderId;
        uint256 sellOrderId;
        bytes32 fillAmountHandle;
        uint256 settlementPrice;
        uint40 matchedAt;
        bool published;
        uint64 revealedFillAmount;
        uint256 revealedQuoteAmount;
    }

    address public immutable baseToken;
    address public immutable quoteToken;
    uint8 public immutable baseTokenDecimals;
    uint8 public immutable quoteTokenDecimals;
    SettlementVault public immutable settlementVault;

    uint256 public orderCount;
    uint256 public buyCount;
    uint256 public sellCount;
    uint256 public matchCount;

    mapping(uint256 orderId => OrderPointer pointer) public orderPointers;
    mapping(uint256 bookId => Order order) private buyOrders;
    mapping(uint256 bookId => Order order) private sellOrders;
    mapping(uint256 matchId => MatchRecord record) private matchRecords;

    euint64 private zeroAmount;
    ebool private encryptedTrue;
    ebool private encryptedFalse;

    constructor(
        address baseToken_,
        address quoteToken_,
        address priceFeed_,
        address settlementVault_
    ) OracleGuard(priceFeed_) {
        if (baseToken_ == address(0) || quoteToken_ == address(0) || settlementVault_ == address(0)) {
            revert ZeroAddress();
        }

        baseToken = baseToken_;
        quoteToken = quoteToken_;
        baseTokenDecimals = IERC20Metadata(baseToken_).decimals();
        quoteTokenDecimals = IERC20Metadata(quoteToken_).decimals();
        settlementVault = SettlementVault(settlementVault_);

        zeroAmount = FHE.asEuint64(0);
        encryptedTrue = FHE.asEbool(true);
        encryptedFalse = FHE.asEbool(false);

        FHE.allowThis(zeroAmount);
        FHE.allowThis(encryptedTrue);
        FHE.allowThis(encryptedFalse);
    }

    function submitOrder(
        Side side,
        InEuint64 memory encAmount,
        InEuint64 memory encPrice,
        InEbool memory encSideProof
    ) external returns (uint256 orderId, uint256 bookId) {
        euint64 amount = FHE.asEuint64(encAmount);
        euint64 price = FHE.asEuint64(encPrice);
        ebool sideProof = FHE.asEbool(encSideProof);

        orderId = ++orderCount;

        Order memory order = Order({
            id: orderId,
            remainingAmount: amount,
            limitPrice: price,
            sideProof: sideProof,
            trader: msg.sender,
            submittedAt: uint40(block.timestamp),
            cancelled: false
        });

        if (side == Side.Buy) {
            bookId = ++buyCount;
            buyOrders[bookId] = order;
        } else {
            bookId = ++sellCount;
            sellOrders[bookId] = order;
        }

        orderPointers[orderId] = OrderPointer({side: side, bookId: bookId});

        _grantOrderPermissionsFor(order.remainingAmount, order.limitPrice, order.sideProof, order.trader);
        emit OrderSubmitted(orderId, bookId, msg.sender, side);
    }

    function cancelOrder(uint256 orderId) external {
        Order storage order = _resolveOrder(orderId);
        if (order.trader != msg.sender) {
            revert Unauthorized(msg.sender);
        }
        if (order.cancelled) {
            revert OrderCancelledAlready(orderId);
        }

        order.cancelled = true;
        emit OrderCancelled(orderId, msg.sender);
    }

    function matchOrders(
        uint256 buyBookId,
        uint256 sellBookId,
        uint256 settlementPrice
    ) external returns (uint256 matchId) {
        Order storage buyOrder = buyOrders[buyBookId];
        Order storage sellOrder = sellOrders[sellBookId];

        if (buyOrder.trader == address(0)) {
            revert InvalidBookEntry(buyBookId);
        }
        if (sellOrder.trader == address(0)) {
            revert InvalidBookEntry(sellBookId);
        }
        if (buyOrder.cancelled) {
            revert OrderCancelledAlready(buyOrder.id);
        }
        if (sellOrder.cancelled) {
            revert OrderCancelledAlready(sellOrder.id);
        }
        if (buyOrder.trader == sellOrder.trader) {
            revert SelfMatch(buyOrder.trader);
        }

        refreshOracle();
        _requireFreshOracle();
        _enforcePriceBand(settlementPrice);

        euint64 settlementPriceEncrypted = FHE.asEuint64(settlementPrice);
        FHE.allowThis(settlementPriceEncrypted);

        ebool buyDirectionValid = FHE.eq(buyOrder.sideProof, encryptedTrue);
        ebool sellDirectionValid = FHE.eq(sellOrder.sideProof, encryptedFalse);
        ebool directionsValid = FHE.and(buyDirectionValid, sellDirectionValid);

        ebool buyAcceptsPrice = FHE.gte(buyOrder.limitPrice, settlementPriceEncrypted);
        ebool sellAcceptsPrice = FHE.lte(sellOrder.limitPrice, settlementPriceEncrypted);
        ebool priceMatch = FHE.and(FHE.and(buyAcceptsPrice, sellAcceptsPrice), directionsValid);

        euint64 rawFillAmount = FHE.min(buyOrder.remainingAmount, sellOrder.remainingAmount);
        euint64 executableFillAmount = FHE.select(priceMatch, rawFillAmount, zeroAmount);

        euint64 buyUpdatedAmount = FHE.select(
            priceMatch,
            FHE.sub(buyOrder.remainingAmount, rawFillAmount),
            buyOrder.remainingAmount
        );
        euint64 sellUpdatedAmount = FHE.select(
            priceMatch,
            FHE.sub(sellOrder.remainingAmount, rawFillAmount),
            sellOrder.remainingAmount
        );

        buyOrder.remainingAmount = buyUpdatedAmount;
        sellOrder.remainingAmount = sellUpdatedAmount;

        _grantOrderPermissions(buyOrder);
        _grantOrderPermissions(sellOrder);

        FHE.allowThis(executableFillAmount);
        FHE.allowPublic(executableFillAmount);

        matchId = ++matchCount;
        matchRecords[matchId] = MatchRecord({
            buyOrderId: buyOrder.id,
            sellOrderId: sellOrder.id,
            fillAmountHandle: euint64.unwrap(executableFillAmount),
            settlementPrice: settlementPrice,
            matchedAt: uint40(block.timestamp),
            published: false,
            revealedFillAmount: 0,
            revealedQuoteAmount: 0
        });

        emit OrderMatched(
            matchId,
            buyOrder.id,
            sellOrder.id,
            euint64.unwrap(executableFillAmount),
            settlementPrice,
            msg.sender
        );
    }

    function publishFill(
        uint256 matchId,
        uint64 fillAmount,
        bytes calldata signature
    ) external returns (uint256 quoteAmount) {
        MatchRecord storage matchRecord = matchRecords[matchId];
        if (matchRecord.buyOrderId == 0) {
            revert InvalidMatch(matchId);
        }
        if (matchRecord.published) {
            revert InvalidMatch(matchId);
        }

        euint64 fillCiphertext = euint64.wrap(matchRecord.fillAmountHandle);
        FHE.publishDecryptResult(fillCiphertext, fillAmount, signature);

        Order storage buyOrder = _resolveOrder(matchRecord.buyOrderId);
        Order storage sellOrder = _resolveOrder(matchRecord.sellOrderId);

        quoteAmount = quoteAmountForFill(fillAmount, matchRecord.settlementPrice);

        settlementVault.protocolTransfer(sellOrder.trader, buyOrder.trader, baseToken, fillAmount);
        settlementVault.protocolTransfer(buyOrder.trader, sellOrder.trader, quoteToken, quoteAmount);

        matchRecord.published = true;
        matchRecord.revealedFillAmount = fillAmount;
        matchRecord.revealedQuoteAmount = quoteAmount;

        emit FillPublished(matchId, fillAmount, quoteAmount, msg.sender);
    }

    function quoteAmountForFill(uint64 fillAmount, uint256 settlementPrice) public view returns (uint256) {
        uint256 baseScale = 10 ** uint256(baseTokenDecimals);
        uint256 quoteScale = 10 ** uint256(quoteTokenDecimals);
        uint256 oracleScale = 10 ** uint256(oracleDecimals);

        uint256 quoteInOracleDecimals = Math.mulDiv(uint256(fillAmount), settlementPrice, baseScale);
        return Math.mulDiv(quoteInOracleDecimals, quoteScale, oracleScale);
    }

    function getOrderMeta(
        uint256 orderId
    )
        external
        view
        returns (
            Side side,
            uint256 bookId,
            address trader,
            uint256 submittedAt,
            bool cancelled
        )
    {
        OrderPointer memory pointer = orderPointers[orderId];
        Order storage order = _resolveOrder(orderId);

        return (pointer.side, pointer.bookId, order.trader, order.submittedAt, order.cancelled);
    }

    function getEncryptedOrder(
        uint256 orderId
    ) external view returns (bytes32 remainingAmountHandle, bytes32 limitPriceHandle, bytes32 sideProofHandle) {
        Order storage order = _resolveOrder(orderId);
        return (euint64.unwrap(order.remainingAmount), euint64.unwrap(order.limitPrice), ebool.unwrap(order.sideProof));
    }

    function getMatchRecord(
        uint256 matchId
    )
        external
        view
        returns (
            uint256 buyOrderId,
            uint256 sellOrderId,
            bytes32 fillAmountHandle,
            uint256 settlementPrice,
            uint256 matchedAt,
            bool published,
            uint64 revealedFillAmount,
            uint256 revealedQuoteAmount
        )
    {
        MatchRecord storage record = matchRecords[matchId];
        if (record.buyOrderId == 0) {
            revert InvalidMatch(matchId);
        }

        return (
            record.buyOrderId,
            record.sellOrderId,
            record.fillAmountHandle,
            record.settlementPrice,
            record.matchedAt,
            record.published,
            record.revealedFillAmount,
            record.revealedQuoteAmount
        );
    }

    function _resolveOrder(uint256 orderId) internal view returns (Order storage order) {
        OrderPointer memory pointer = orderPointers[orderId];
        if (pointer.bookId == 0) {
            revert InvalidOrder(orderId);
        }

        if (pointer.side == Side.Buy) {
            order = buyOrders[pointer.bookId];
        } else {
            order = sellOrders[pointer.bookId];
        }

        if (order.trader == address(0)) {
            revert InvalidOrder(orderId);
        }
    }

    function _grantOrderPermissions(Order storage order) internal {
        _grantOrderPermissionsFor(order.remainingAmount, order.limitPrice, order.sideProof, order.trader);
    }

    function _grantOrderPermissionsFor(
        euint64 remainingAmount,
        euint64 limitPrice,
        ebool sideProof,
        address trader
    ) internal {
        FHE.allowThis(remainingAmount);
        FHE.allowThis(limitPrice);
        FHE.allowThis(sideProof);

        FHE.allow(remainingAmount, trader);
        FHE.allow(limitPrice, trader);
        FHE.allow(sideProof, trader);
    }
}
