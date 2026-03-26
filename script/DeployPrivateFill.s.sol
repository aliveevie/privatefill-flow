// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import {Script} from "forge-std/Script.sol";

import {PrivateFill} from "../contracts/PrivateFill.sol";
import {SettlementVault} from "../contracts/SettlementVault.sol";

contract DeployPrivateFill is Script {
    function run() external returns (SettlementVault vault, PrivateFill privateFill) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address baseToken = vm.envAddress("BASE_TOKEN");
        address quoteToken = vm.envAddress("QUOTE_TOKEN");
        address priceFeed = vm.envAddress("PRICE_FEED");

        vm.startBroadcast(deployerPrivateKey);

        vault = new SettlementVault(deployer);
        privateFill = new PrivateFill(baseToken, quoteToken, priceFeed, address(vault));
        vault.setProtocol(address(privateFill));

        vm.stopBroadcast();
    }
}

