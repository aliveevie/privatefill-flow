// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";

abstract contract OracleGuard {
    error ZeroAddress();
    error InvalidOraclePrice();
    error StaleOraclePrice();
    error OracleNotFresh();
    error PriceOutsideBand(uint256 candidatePrice, uint256 lowerBound, uint256 upperBound);

    uint256 public constant PRICE_BAND_BPS = 200;
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MAX_ORACLE_STALENESS = 1 hours;
    uint256 public constant CACHE_FRESHNESS = 5 minutes;

    AggregatorV3Interface public immutable priceFeed;
    uint8 public immutable oracleDecimals;

    uint256 public lastOraclePrice;
    uint256 public lastOracleUpdate;

    constructor(address priceFeed_) {
        if (priceFeed_ == address(0)) {
            revert ZeroAddress();
        }

        priceFeed = AggregatorV3Interface(priceFeed_);
        oracleDecimals = priceFeed.decimals();
    }

    function refreshOracle() public returns (uint256 oraclePrice) {
        (, int256 answer,, uint256 updatedAt,) = priceFeed.latestRoundData();

        if (answer <= 0) {
            revert InvalidOraclePrice();
        }
        if (block.timestamp - updatedAt > MAX_ORACLE_STALENESS) {
            revert StaleOraclePrice();
        }

        oraclePrice = uint256(answer);
        lastOraclePrice = oraclePrice;
        lastOracleUpdate = updatedAt;
    }

    function isOracleFresh() public view returns (bool) {
        return lastOracleUpdate != 0 && block.timestamp - lastOracleUpdate <= CACHE_FRESHNESS;
    }

    function priceBandBounds() public view returns (uint256 lowerBound, uint256 upperBound) {
        uint256 referencePrice = lastOraclePrice;
        uint256 delta = (referencePrice * PRICE_BAND_BPS) / BPS_DENOMINATOR;

        lowerBound = referencePrice - delta;
        upperBound = referencePrice + delta;
    }

    function isWithinPriceBand(uint256 candidatePrice) public view returns (bool) {
        if (!isOracleFresh()) {
            return false;
        }

        (uint256 lowerBound, uint256 upperBound) = priceBandBounds();
        return candidatePrice >= lowerBound && candidatePrice <= upperBound;
    }

    function _requireFreshOracle() internal view {
        if (!isOracleFresh()) {
            revert OracleNotFresh();
        }
    }

    function _enforcePriceBand(uint256 candidatePrice) internal view {
        (uint256 lowerBound, uint256 upperBound) = priceBandBounds();
        if (candidatePrice < lowerBound || candidatePrice > upperBound) {
            revert PriceOutsideBand(candidatePrice, lowerBound, upperBound);
        }
    }
}

