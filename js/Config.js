module.exports = {
    isTestNet: true,
    networkName: "kovan",
    // baseUrl: "http://localhost:3000",
    baseUrl: "https://digital-identity-app.herokuapp.com",
    identityRouterUrl: "https://identity-router.herokuapp.com",
    ipfsWriteUrl: "https://ipfs.infura.io:5001",
    ipfsFetchUrl: "https://ipfs.io/ipfs",
    ipfsIpAddress: "ipfs.infura.io",
    ipfsPort: "5001",
    ipfsProtocol: "https",
    ethProvider: 'http://localhost:8545',
    etherscanApiKey: 'D3PZWYNWARKN73MCVWFGX1QZ6EWMJE7J45',
    personaRegistryContract: 'contracts/PersonaRegistry',
    personaRegistryAddress: '0xd8fab77b7125de6d1a17dfacbdc0062837949a11',
    defaultGasPrice: 20000000000,
    defaultGasValue: 250000
}