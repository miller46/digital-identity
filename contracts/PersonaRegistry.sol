pragma solidity ^0.4.9;

contract PersonaRegistry {

    struct Persona {
        mapping(address => string) ipfsPointer; //entity => pointer
    }

    mapping(address => Persona) personas;

    function PersonaRegistry() {

    }

    function getPersonaData(address entity, address personaAddress) constant returns (string) {
        return personas[personaAddress].ipfsPointer[entity];
    }

    function createPersona(string ipfsPointer) {
        personas[msg.sender].ipfsPointer[msg.sender] = ipfsPointer;
    }

    function shareDataWithEntity(address entityAddress, string ipfsPointer) {
        personas[msg.sender].ipfsPointer[entityAddress] = ipfsPointer;
    }

    function revokeDataWithEntity(address entityAddress) {
        delete personas[msg.sender].ipfsPointer[entityAddress];
    }

    function() payable {
        //anyone can fund this contract
    }
}