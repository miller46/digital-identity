pragma solidity ^0.4.9;

contract PersonaRegistry {

    struct Persona {
        address[] readers;
        bytes32[] dataTypes;
        bytes32[] ipfsPointers;
        bool isCreated;
    }

    mapping(address => Persona) personas;
    mapping(address => mapping(address => mapping(bytes32 => bool))) personaAllowances; //persona => reader => dataType => isAllowed

    function PersonaRegistry() {

    }

    function getMyPersona() constant returns (bytes32[], bytes32[]) {
        Persona memory persona = personas[msg.sender];
        return (persona.dataTypes, persona.ipfsPointers);
    }

    function getPersona(address personaAddress) constant returns (bytes32[], bytes32[]) {
        bytes32[] storage allowedDataPointers;
        bytes32[] storage allowedDataTypes;

        Persona memory persona = personas[personaAddress];
        for (uint i = 0; i < persona.dataTypes.length; i++) {
            bytes32 dataType = persona.dataTypes[i];
            if (personaAddress == msg.sender || personaAllowances[personaAddress][msg.sender][dataType]) {
                allowedDataTypes.push(dataType);
                allowedDataPointers.push(dataType);
            }
        }

        return (allowedDataTypes, allowedDataPointers);
    }

    function addPersona(bytes32[] dataTypes, bytes32[] dataPointers) returns (bool) {
        if (!personas[msg.sender].isCreated) {
            Persona memory persona;
            persona.dataTypes = dataTypes;
            persona.ipfsPointers = dataPointers;
            persona.isCreated = true;
            personas[msg.sender] = persona;
            return true;
        }

        return false;
    }

    function updatePersona(bytes32[] dataTypes, bytes32[] dataPointers) {
        if (personas[msg.sender].isCreated) {
            Persona storage persona = personas[msg.sender];
            persona.dataTypes = dataTypes;
            persona.ipfsPointers = dataPointers;
        }
    }

    function getDataPointerForType(address personaAddress, bytes32 dataTypeHash) constant returns (bytes32) {
        Persona memory persona = personas[personaAddress];
        for (uint i = 0; i < persona.dataTypes.length; i++) {
            if (persona.dataTypes[i] == dataTypeHash) {
                return persona.ipfsPointers[i];
            }
        }

        revert();
    }

    function stringToBytes32(string memory source) returns (bytes32 result) {
        assembly {
            result := mload(add(source, 32))
        }
    }

    function() payable {
        //anyone can fund this contract
    }
}