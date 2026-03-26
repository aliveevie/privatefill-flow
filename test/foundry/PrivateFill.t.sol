// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import {Test} from "forge-std/Test.sol";
import {InEbool, InEuint64} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";

import {PrivateFill} from "../../contracts/PrivateFill.sol";
import {SettlementVault} from "../../contracts/SettlementVault.sol";
import {IPrivateFill} from "../../contracts/interfaces/IPrivateFill.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MockPriceFeed} from "./mocks/MockPriceFeed.sol";
import {MockTaskManager} from "./mocks/MockTaskManager.sol";

contract PrivateFillTest is Test {
    address internal constant TASK_MANAGER_ADDRESS = 0xeA30c4B8b44078Bbf8a6ef5b9f1eC1626C7848D9;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    MockTaskManager internal taskManager;
    MockERC20 internal baseToken;
    MockERC20 internal quoteToken;
    MockPriceFeed internal priceFeed;
    SettlementVault internal vault;
    PrivateFill internal privateFill;

    function setUp() external {
        MockTaskManager implementation = new MockTaskManager();
        vm.etch(TASK_MANAGER_ADDRESS, address(implementation).code);
        taskManager = MockTaskManager(TASK_MANAGER_ADDRESS);

        baseToken = new MockERC20("Wrapped Ether", "WETH", 18);
        quoteToken = new MockERC20("USD Coin", "USDC", 6);
        priceFeed = new MockPriceFeed(8, 3_500e8);

        vault = new SettlementVault(address(this));
        privateFill = new PrivateFill(address(baseToken), address(quoteToken), address(priceFeed), address(vault));
        vault.setProtocol(address(privateFill));

        baseToken.mint(bob, 10e18);
        quoteToken.mint(alice, 20_000e6);

        vm.startPrank(alice);
        quoteToken.approve(address(vault), type(uint256).max);
        vault.deposit(address(quoteToken), 20_000e6);
        vm.stopPrank();

        vm.startPrank(bob);
        baseToken.approve(address(vault), type(uint256).max);
        vault.deposit(address(baseToken), 10e18);
        vm.stopPrank();
    }

    function testSubmitOrderStoresEncryptedHandlesAndMetadata() external {
        (InEuint64 memory amount, InEuint64 memory price, InEbool memory sideProof) =
            _encryptOrder(2e18, 3_600e8, true);

        vm.prank(alice);
        (uint256 orderId, uint256 bookId) =
            privateFill.submitOrder(IPrivateFill.Side.Buy, amount, price, sideProof);

        (
            IPrivateFill.Side side,
            uint256 storedBookId,
            address trader,
            uint256 submittedAt,
            bool cancelled
        ) = privateFill.getOrderMeta(orderId);

        (bytes32 amountHandle, bytes32 priceHandle, bytes32 sideHandle) = privateFill.getEncryptedOrder(orderId);

        assertEq(uint256(side), uint256(IPrivateFill.Side.Buy));
        assertEq(storedBookId, bookId);
        assertEq(trader, alice);
        assertEq(cancelled, false);
        assertGt(submittedAt, 0);
        assertEq(taskManager.peek(uint256(amountHandle)), 2e18);
        assertEq(taskManager.peek(uint256(priceHandle)), 3_600e8);
        assertEq(taskManager.peek(uint256(sideHandle)), 1);
    }

    function testMatchAndPublishSettlesEscrowedBalances() external {
        uint256 buyOrderId = _submitOrder(alice, IPrivateFill.Side.Buy, 2e18, 3_600e8, true);
        uint256 sellOrderId = _submitOrder(bob, IPrivateFill.Side.Sell, 2e18, 3_400e8, false);

        uint256 matchId = privateFill.matchOrders(1, 1, 3_500e8);
        (, , bytes32 fillAmountHandle, uint256 settlementPrice, , bool published,,) =
            privateFill.getMatchRecord(matchId);

        assertEq(taskManager.peek(uint256(fillAmountHandle)), 2e18);
        assertEq(settlementPrice, 3_500e8);
        assertEq(published, false);

        uint256 quoteAmount = privateFill.publishFill(matchId, uint64(2e18), hex"");

        assertEq(quoteAmount, 7_000e6);
        assertEq(vault.deposits(alice, address(quoteToken)), 13_000e6);
        assertEq(vault.deposits(alice, address(baseToken)), 2e18);
        assertEq(vault.deposits(bob, address(baseToken)), 8e18);
        assertEq(vault.deposits(bob, address(quoteToken)), 7_000e6);

        (, , , , , bool wasPublished, uint64 revealedFillAmount, uint256 revealedQuoteAmount) =
            privateFill.getMatchRecord(matchId);

        assertEq(wasPublished, true);
        assertEq(revealedFillAmount, uint64(2e18));
        assertEq(revealedQuoteAmount, 7_000e6);

        // Silence warnings and assert the orders resolved correctly through global ids.
        assertEq(buyOrderId, 1);
        assertEq(sellOrderId, 2);
    }

    function testMatchRejectsSettlementOutsideOracleBand() external {
        _submitOrder(alice, IPrivateFill.Side.Buy, 2e18, 3_700e8, true);
        _submitOrder(bob, IPrivateFill.Side.Sell, 2e18, 3_300e8, false);

        vm.expectRevert();
        privateFill.matchOrders(1, 1, 4_000e8);
    }

    function testCancelledOrderCannotBeMatched() external {
        uint256 buyOrderId = _submitOrder(alice, IPrivateFill.Side.Buy, 2e18, 3_600e8, true);
        _submitOrder(bob, IPrivateFill.Side.Sell, 2e18, 3_400e8, false);

        vm.prank(alice);
        privateFill.cancelOrder(buyOrderId);

        vm.expectRevert();
        privateFill.matchOrders(1, 1, 3_500e8);
    }

    function _submitOrder(
        address trader,
        IPrivateFill.Side side,
        uint64 amountValue,
        uint64 priceValue,
        bool sideValue
    ) internal returns (uint256 orderId) {
        (InEuint64 memory amount, InEuint64 memory price, InEbool memory sideProof) =
            _encryptOrder(amountValue, priceValue, sideValue);

        vm.prank(trader);
        (orderId,) = privateFill.submitOrder(side, amount, price, sideProof);
    }

    function _encryptOrder(
        uint64 amountValue,
        uint64 priceValue,
        bool sideValue
    ) internal returns (InEuint64 memory amount, InEuint64 memory price, InEbool memory sideProof) {
        amount = taskManager.encryptUint64(amountValue);
        price = taskManager.encryptUint64(priceValue);
        sideProof = taskManager.encryptBool(sideValue);
    }
}
