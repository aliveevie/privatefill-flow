// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import {
    EncryptedInput,
    FunctionId,
    ITaskManager,
    InEbool,
    InEuint64,
    Utils
} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";

contract MockTaskManager is ITaskManager {
    mapping(uint256 ctHash => uint256 value) public plaintexts;
    mapping(uint256 ctHash => mapping(address account => bool allowed)) public permissions;
    mapping(uint256 ctHash => bool isPublic) public publicPermissions;

    uint256 public nextHandle;

    function encryptBool(bool value) external returns (InEbool memory input) {
        uint256 handle = _store(value ? 1 : 0);
        input = InEbool({
            ctHash: handle,
            securityZone: 0,
            utype: Utils.EBOOL_TFHE,
            signature: bytes("")
        });
    }

    function encryptUint64(uint64 value) external returns (InEuint64 memory input) {
        uint256 handle = _store(value);
        input = InEuint64({
            ctHash: handle,
            securityZone: 0,
            utype: Utils.EUINT64_TFHE,
            signature: bytes("")
        });
    }

    function peek(uint256 ctHash) external view returns (uint256) {
        return plaintexts[ctHash];
    }

    function createTask(
        uint8,
        FunctionId funcId,
        uint256[] memory encryptedInputs,
        uint256[] memory extraInputs
    ) external returns (uint256) {
        uint256 result;

        if (funcId == FunctionId.trivialEncrypt) {
            result = extraInputs[0];
        } else if (funcId == FunctionId.cast) {
            result = plaintexts[encryptedInputs[0]];
        } else if (funcId == FunctionId.select) {
            result = plaintexts[encryptedInputs[0]] != 0
                ? plaintexts[encryptedInputs[1]]
                : plaintexts[encryptedInputs[2]];
        } else {
            uint256 lhs = plaintexts[encryptedInputs[0]];
            uint256 rhs = plaintexts[encryptedInputs[1]];

            if (funcId == FunctionId.add) {
                result = lhs + rhs;
            } else if (funcId == FunctionId.sub) {
                result = lhs >= rhs ? lhs - rhs : 0;
            } else if (funcId == FunctionId.and) {
                result = (lhs != 0 && rhs != 0) ? 1 : 0;
            } else if (funcId == FunctionId.or) {
                result = (lhs != 0 || rhs != 0) ? 1 : 0;
            } else if (funcId == FunctionId.eq) {
                result = lhs == rhs ? 1 : 0;
            } else if (funcId == FunctionId.ne) {
                result = lhs != rhs ? 1 : 0;
            } else if (funcId == FunctionId.gte) {
                result = lhs >= rhs ? 1 : 0;
            } else if (funcId == FunctionId.lte) {
                result = lhs <= rhs ? 1 : 0;
            } else if (funcId == FunctionId.lt) {
                result = lhs < rhs ? 1 : 0;
            } else if (funcId == FunctionId.gt) {
                result = lhs > rhs ? 1 : 0;
            } else if (funcId == FunctionId.min) {
                result = lhs < rhs ? lhs : rhs;
            } else if (funcId == FunctionId.max) {
                result = lhs > rhs ? lhs : rhs;
            } else {
                revert("unsupported-op");
            }
        }

        return _store(result);
    }

    function createRandomTask(uint8, uint256 seed, int32) external returns (uint256) {
        return _store(seed);
    }

    function createDecryptTask(uint256, address) external {}

    function verifyInput(EncryptedInput memory input, address sender) external returns (uint256) {
        permissions[input.ctHash][sender] = true;
        return input.ctHash;
    }

    function allow(uint256 ctHash, address account) external {
        permissions[ctHash][account] = true;
    }

    function isAllowed(uint256 ctHash, address account) external returns (bool) {
        return permissions[ctHash][account] || publicPermissions[ctHash];
    }

    function isPubliclyAllowed(uint256 ctHash) external view returns (bool) {
        return publicPermissions[ctHash];
    }

    function allowGlobal(uint256 ctHash) external {
        publicPermissions[ctHash] = true;
    }

    function allowTransient(uint256 ctHash, address account) external {
        permissions[ctHash][account] = true;
    }

    function getDecryptResultSafe(uint256 ctHash) external view returns (uint256, bool) {
        return (plaintexts[ctHash], true);
    }

    function getDecryptResult(uint256 ctHash) external view returns (uint256) {
        return plaintexts[ctHash];
    }

    function publishDecryptResult(uint256 ctHash, uint256 result, bytes calldata) external view {
        require(result == plaintexts[ctHash], "invalid-result");
    }

    function publishDecryptResultBatch(
        uint256[] calldata ctHashes,
        uint256[] calldata results,
        bytes[] calldata
    ) external view {
        require(ctHashes.length == results.length, "length-mismatch");

        for (uint256 i = 0; i < ctHashes.length; ++i) {
            require(results[i] == plaintexts[ctHashes[i]], "invalid-result");
        }
    }

    function verifyDecryptResult(uint256 ctHash, uint256 result, bytes calldata) external view returns (bool) {
        return result == plaintexts[ctHash];
    }

    function verifyDecryptResultSafe(uint256 ctHash, uint256 result, bytes calldata) external view returns (bool) {
        return result == plaintexts[ctHash];
    }

    function _store(uint256 value) internal returns (uint256 handle) {
        handle = ++nextHandle;
        plaintexts[handle] = value;
    }
}

