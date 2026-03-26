// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SettlementVault is Ownable {
    using SafeERC20 for IERC20;

    error ZeroAddress();
    error ZeroAmount();
    error UnauthorizedProtocol(address caller);
    error InsufficientBalance(address trader, address token, uint256 requested, uint256 available);

    address public protocol;

    mapping(address trader => mapping(address token => uint256 balance)) public deposits;

    event ProtocolUpdated(address indexed protocol);
    event Deposited(address indexed trader, address indexed token, uint256 amount);
    event Withdrawn(address indexed trader, address indexed token, uint256 amount);
    event InternalTransfer(address indexed from, address indexed to, address indexed token, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyProtocol() {
        if (msg.sender != protocol) {
            revert UnauthorizedProtocol(msg.sender);
        }
        _;
    }

    function setProtocol(address newProtocol) external onlyOwner {
        if (newProtocol == address(0)) {
            revert ZeroAddress();
        }

        protocol = newProtocol;
        emit ProtocolUpdated(newProtocol);
    }

    function deposit(address token, uint256 amount) external {
        if (token == address(0)) {
            revert ZeroAddress();
        }
        if (amount == 0) {
            revert ZeroAmount();
        }

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        deposits[msg.sender][token] += amount;

        emit Deposited(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount) external {
        if (token == address(0)) {
            revert ZeroAddress();
        }
        if (amount == 0) {
            revert ZeroAmount();
        }

        _debit(msg.sender, token, amount);
        IERC20(token).safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, token, amount);
    }

    function protocolTransfer(address from, address to, address token, uint256 amount) external onlyProtocol {
        if (from == address(0) || to == address(0) || token == address(0)) {
            revert ZeroAddress();
        }
        if (amount == 0) {
            revert ZeroAmount();
        }

        _debit(from, token, amount);
        deposits[to][token] += amount;

        emit InternalTransfer(from, to, token, amount);
    }

    function _debit(address trader, address token, uint256 amount) internal {
        uint256 available = deposits[trader][token];
        if (available < amount) {
            revert InsufficientBalance(trader, token, amount, available);
        }

        deposits[trader][token] = available - amount;
    }
}

