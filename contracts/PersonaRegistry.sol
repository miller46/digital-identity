pragma solidity ^0.4.17;

contract PersonaRegistry {

    mapping(address => mapping(address => mapping(bytes32 => bytes))) public claims;

    event ClaimSet(address indexed issuer, address indexed subject,
        bytes32 indexed key, bytes value, uint updatedAt);

    event ClaimRemoved(address indexed issuer, address indexed subject,
        bytes32 indexed key, uint removedAt);

    function setClaim(address subject, bytes32 key, bytes value) public {
        claims[msg.sender][subject][key] = value;
        ClaimSet(msg.sender, subject, key, value, now);
    }

    function setSelfClaim(bytes32 key, bytes value) public {
        setClaim(msg.sender, key, value);
    }

    function getClaim(address issuer, address subject, bytes32 key) public constant returns(bytes) {
        return claims[issuer][subject][key];
    }

    function removeClaim(address issuer, address subject, bytes32 key) public {
        require(msg.sender == issuer || msg.sender == subject);
        delete claims[issuer][subject][key];
        ClaimRemoved(msg.sender, subject, key, now);
    }
}