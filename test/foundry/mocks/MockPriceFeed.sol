// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import {AggregatorV3Interface} from "../../../contracts/interfaces/AggregatorV3Interface.sol";

contract MockPriceFeed is AggregatorV3Interface {
    uint8 public immutable override decimals;
    int256 private currentAnswer;
    uint256 private currentUpdatedAt;

    constructor(uint8 decimals_, int256 initialAnswer) {
        decimals = decimals_;
        currentAnswer = initialAnswer;
        currentUpdatedAt = block.timestamp;
    }

    function setAnswer(int256 newAnswer) external {
        currentAnswer = newAnswer;
        currentUpdatedAt = block.timestamp;
    }

    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        return (0, currentAnswer, currentUpdatedAt, currentUpdatedAt, 0);
    }
}

