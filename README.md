# digital-identity
Self-sovereign identity system based on Ethereum

This contract is available on the Kovan testnet.  

0xd8fab77b7125de6d1a17dfacbdc0062837949a11

**Features**

* Securely store identity data
* Associate Ethereum account with identity data
* Securely share approved data with applications, granular down to the individual data point
* Scanner for sharing with applications
* Revoke sharing permissions

**How It Works**

The works by creating personas which are a mapping of data to an Ethereum address.  The data is stored in IPFS and encrypted so only you can decrypt it.  The IPFS file paths are stored in the blockchain.  You can share data with applications on an attribute by attribute basis, and encrypt the dataset with the public key of the entity you'd like to share with, so that only they can decrypt it.  Sharing can occur by the client scanning a QR with data following an expected format which allows the client to approve the request to share data, and submit the transaction to the blockchain so that the application can get the files from IPFS and decrypt the data. 

<img alt="Scanner" src="https://raw.githubusercontent.com/miller46/digital-identity/master/screenshots/Screen%20Shot%202017-07-31%20at%206.22.36%20PM.png" width=500 />
<img alt="Approval" src="https://raw.githubusercontent.com/miller46/digital-identity/master/screenshots/Screen%20Shot%202017-07-31%20at%206.21.29%20PM.png" width=500 />
<img alt="Profile" src="https://raw.githubusercontent.com/miller46/digital-identity/master/screenshots/Screen%20Shot%202017-07-31%20at%206.23.12%20PM.png" width=500 />

**NOTES**
* The public key used to encryption is derived from the private key and is NOT the public key of the Ethereum address.
* This only deploys data to local IPFS nodes at the moment.
* This is still a little raw, and I plan to move it to a library

**Prerequisites**
This app requires node and uses IPFS to store files.  You must first install IPFS https://ipfs.io/docs/install/

**To run** 

    npm install
    ipfs daemon
    browserify main.js > js/bundle.js
    node app
