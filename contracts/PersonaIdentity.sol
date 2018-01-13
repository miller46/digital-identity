pragma solidity ^0.4.19;

import "./ERC725.sol";
import "./ERC735.sol";

contract PersonaIdentity is ERC725, ERC735 {

    mapping (address => uint256) keys;
    mapping (uint256 => address[]) keysByType;
    mapping (bytes32 => Claim) claims;
    mapping (uint256 => bytes32[]) claimsByType;
    mapping (bytes32 => uint256) claimPositions;
    mapping (bytes32 => Transaction) transactions;

    uint nonce = 0;

    struct Transaction {
        address to;
        uint256 value;
        bytes32 data;
        uint256 nonce;
    }

    modifier managerOnly {
        require(keys[msg.sender] == MANAGEMENT_KEY);
        _;
    }

    modifier managerOrSelf {
        require(keys[msg.sender] == MANAGEMENT_KEY || msg.sender == address(this));
        _;
    }

    modifier actorOnly {
        require(keys[msg.sender] == ACTION_KEY);
        _;
    }

    modifier claimSignerOnly {
        require(keys[msg.sender] == CLAIM_SIGNER_KEY);
        _;
    }

    function PersonaIdentity() public {
        _addKey(msg.sender, MANAGEMENT_KEY);
    }

    // Adds a _key to the identity. The _purpose specifies the purpose of key. Initially we propose four purposes:
        // 1: MANAGEMENT keys, which can manage the identity
        // 2: ACTION keys, which perform actions in this identities name (signing, logins, transactions, etc.)
        // 3: CLAIM signer keys, used to sign claims on other identities which need to be revokable.
        // 4: ENCRYPTION keys, used to encrypt data e.g. hold in claims.
        // MUST only be done by keys of purpose 1, or the identity itself. If its the identity itself, the approval process will determine its approval.

    // Triggers Event KeyAdded
    function addKey(address _key, uint256 _type) public managerOrSelf returns (bool success) {
        _addKey(_key, _type);

        KeyAdded(_key, _type);
    }

    // Replaces key by adding new key then removing old key
    // Triggers Event KeyAdded
    // Triggers Event KeyRemoved
    function replaceKey(address _oldKey, address _newKey) public managerOrSelf returns (bool success) {
        _addKey(_newKey, getKeyType(_oldKey));
        _removeKey(_oldKey);
        return true;
    }

    //Removes _key from the identity.
    //MUST only be done by keys of purpose 1, or the identity itself. If its the identity itself, the approval process will determine its approval.
    function removeKey(address _key) public managerOrSelf returns (bool success) {
        _removeKey(_key);

        KeyRemoved(_key, getKeyType(_key));
    }

    // Executes an action on other contracts, or itself, or a transfer of ether.
    // SHOULD require approve to be called with one or more keys of purpose 1 or 2 to approve this execution.
    // Triggers Event ExecutionRequested
    // Triggers on direct execution Event: Executed
    function execute(address _to, uint256 _value, bytes32 _data) public returns (bytes32 executionId) {
        uint256 senderKey = keys[msg.sender];
        require(senderKey == MANAGEMENT_KEY || senderKey == ACTION_KEY);
        executionId = keccak256(_to, _value, _data, nonce);
        transactions[executionId] = Transaction (
            {
                to: _to,
                value: _value,
                data: _data,
                nonce: nonce
            });

        if (senderKey == MANAGEMENT_KEY) {
            approve(executionId, true);
        }

        ExecutionRequested(executionId, _to, _value, _data);
    }

    // Approves an execution or claim addition.
    // This SHOULD require n of m approvals of keys purpose 1, if the _to of the execution is the identity contract itself, to successfull approve an execution.
    // And COULD require n of m approvals of keys purpose 2, if the _to of the execution is another contract, to successfull approve an execution.

    // Triggers Event: Approved
    // Triggers on successfull execution Event: Executed
    // Triggers on successfull claim addition Event: ClaimAdded
    function approve(bytes32 _id, bool _approve) public managerOnly returns (bool success) {
        require(transactions[_id].nonce == nonce);
        nonce++;
        if (_approve) {
            success = transactions[_id].to.call.value(transactions[_id].value)(transactions);

            if (success) {
                Executed(_id, transactions[_id].to, transactions[_id].value, transactions[_id].data);
            }
        }

        Approved(_id, _approve);
    }

    function addClaim(uint256 _claimType, address _issuer, uint256 _signatureType,
        bytes32 _signature, bytes32 _claim, string _uri) public claimSignerOnly
        returns (bytes32 claimId) {
        claimId = keccak256(_issuer, _claimType);
        claims[claimId] = Claim(
            {
                claimType: _claimType,
                issuer: _issuer,
                signatureType: _signatureType,
                signature: _signature,
                claim: _claim,
                uri: _uri
            }
        );
        claimPositions[keccak256(_issuer, _claimType)] = claimsByType[_claimType].length;
        claimsByType[_claimType].push(claimId);
    }

    function removeClaim(bytes32 _claimId) public returns (bool success) {
        Claim memory claim = claims[_claimId];
        require(msg.sender == claim.issuer || keys[msg.sender] == MANAGEMENT_KEY || msg.sender == address(this));

        uint claimIdTypePos = claimPositions[_claimId];
        delete claimPositions[_claimId];

        bytes32[] storage claimsTypeArr = claimsByType[claim.claimType];
        bytes32 replacer = claimsTypeArr[claimsTypeArr.length-1];
        claimsTypeArr[claimIdTypePos] = replacer;
        claimPositions[replacer] = claimIdTypePos;
        delete claims[_claimId];
        claimsTypeArr.length--;

        return true;
    }

    function _addKey(address _key, uint256 _type) private {
        require(keys[_key] == 0);
        keys[_key] = _type;
        claimPositions[keccak256(_key, _type)] = keysByType[_type].length;
        keysByType[_type].push(_key);

        KeyAdded(_key, _type);
    }

    function _removeKey(address _key) private {
        uint256 keyType = keys[_key];
        address[] storage keyArr = keysByType[keyType];
        if (msg.sender != address(this) && keyType == MANAGEMENT_KEY && keyArr.length == 1) {
            revert();
        }
        bytes32 oldIndex = keccak256(_key, keyType);
        uint index = claimPositions[oldIndex];
        delete claimPositions[oldIndex];

        address replacer = keyArr[keyArr.length - 1];
        keyArr[index] = replacer;
        claimPositions[keccak256(replacer, keys[replacer])] = index;
        keyArr.length--;
        delete keys[_key];

        KeyRemoved(_key, keyType);
    }

    // Return the purpose of the key if held by this Identity
    // If not held, return 0
    function getKeyType(address _key) public constant returns(uint256 keyType) {
        return keys[_key];
    }

    // Return the purpose of the key if held by this Identity
    // If not held, return 0
    function getKeysByType(uint256 _type) public constant returns(address[] _keys) {
        return keysByType[_type];
    }

    function getClaim(bytes32 _claimId) public constant  returns(uint256 claimType,
        address issuer, uint256 signatureType, bytes32 signature, bytes32 claim, string uri) {
        Claim memory _claim = claims[_claimId];
        return (_claim.claimType, _claim.issuer, _claim.signatureType, _claim.signature, _claim.claim, _claim.uri);
    }

    function getClaimsIdByType(uint256 _claimType) public constant returns(bytes32[]) {
        return claimsByType[_claimType];
    }
}