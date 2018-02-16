module.exports = {
    isTestNet: true,
    networkName: "kovan",
    baseUrl: "http://localhost:8080",
    // baseUrl: "https://digital-identity-app.herokuapp.com",
    identityRouterUrl: "https://identity-router.herokuapp.com", //centralized "router" for the demo that maps unique QR guid -> address. should switch back to smart contract
    ipfsWriteUrl: "https://ipfs.infura.io:5001",
    ipfsFetchUrl: "https://ipfs.io/ipfs",
    ipfsIpAddress: "ipfs.infura.io",
    ipfsPort: "5001",
    ipfsProtocol: "https",
    ethProvider: 'https://kovan.infura.io/ZvAVVAIuiWAtOL7GKjEv',
    etherscanApiKey: 'D3PZWYNWARKN73MCVWFGX1QZ6EWMJE7J45',
    personaRegistryContract: 'contracts/PersonaRegistry',
    personaRegistryAddress: '0x6d94fd7e0f422a42a23c026467b9d00d436bf4e6',
    defaultGasPrice: 20000000000,
    defaultGasValue: 250000
};