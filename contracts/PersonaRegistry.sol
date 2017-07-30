pragma solidity ^0.4.9;

contract PersonaRegistry {

    struct Persona {
        address[] readers;
        bytes32[] dataTypes;
        mapping(address => bytes32[]) ipfsPointers;
        bool isCreated;
    }

    mapping(address => Persona) personas;
    mapping(address => mapping(address => mapping(bytes32 => bool))) personaAllowances; //persona => reader => dataType => isAllowed

    function PersonaRegistry() {

    }

    function getPersona(address entity, address personaAddress) constant returns (bytes32[], bytes32[]) {
        Persona persona = personas[personaAddress];
        return (persona.dataTypes, persona.ipfsPointers[entity]);
    }

    function addPersona(address entity, bytes32[] dataTypes, bytes32[] dataPointers) {
        Persona storage persona = personas[msg.sender];
        persona.dataTypes = dataTypes;
        persona.ipfsPointers[entity] = dataPointers;
        persona.isCreated = true;

        for (uint i = 0; i < dataTypes.length; i++) {
            personaAllowances[msg.sender][msg.sender][dataTypes[i]] = true;
        }
    }

    function addAllowance(address personaAddress, bytes32[] dataTypes) {
        for (uint i = 0; i < dataTypes.length; i++) {
            personaAllowances[msg.sender][personaAddress][dataTypes[i]] = true;
        }
    }

    function revokeAllowance(address personaAddress, bytes32[] dataTypes) {
        for (uint i = 0; i < dataTypes.length; i++) {
            personaAllowances[msg.sender][personaAddress][dataTypes[i]] = false;
        }
    }

    function stringToBytes32(string memory source) internal returns (bytes32 result) {
        assembly {
            result := mload(add(source, 32))
        }
    }

    function() payable {
        //anyone can fund this contract
    }
}