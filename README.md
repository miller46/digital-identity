# digital-identity
Identity system based on Ethereum

**Kovan Contract Address**

Registry contract can be found here

0x8a5C9ca6d66c63cB17a3Ec21cedE5EeEa52EEd97

**Demo** 

This demo requires 2 devices, 1 to display the application's QR code and one to scan the QR code.

Go to this link on smart phone - https://digital-identity-app.herokuapp.com/

Go to this link in a browser - https://identity-test-application.herokuapp.com/

NOTE: you will need gas in your client app for this to fully function

**Features** 

* Securely store identity data
* Associate Ethereum account with identity data
* Securely share approved data with applications, granular down to the individual data point
* Scanner for sharing with applications
* Revoke sharing permissions

**How It Works**

The works by creating personas which are a mapping of data to an Ethereum address.  The data is stored in IPFS and encrypted so only you can decrypt it.  The IPFS file paths are stored in the blockchain.  You can share data with applications on an attribute by attribute basis, and encrypt the dataset with the public key of the entity you'd like to share with, so that only they can decrypt it.  Sharing can occur by the client scanning a QR with data following an expected format which allows the client to approve the request to share data, and submit the transaction to the blockchain so that the application can get the files from IPFS and decrypt the data. 

<img alt="Scanner" src="https://raw.githubusercontent.com/miller46/digital-identity/master/screenshots/Screen%20Shot%202017-07-31%20at%206.22.36%20PM.png" width=500 />
<img alt="Approval" src="https://raw.githubusercontent.com/miller46/digital-identity/master/screenshots/Screen%20Shot%202017-10-22%20at%2011.21.01%20PM.png" width=500 />
<img alt="Profile" src="https://raw.githubusercontent.com/miller46/digital-identity/master/screenshots/Screen%20Shot%202017-10-23%20at%2010.31.59%20AM.png" width=500 />
<img alt="Profile" src="https://raw.githubusercontent.com/miller46/digital-identity/master/screenshots/Screen%20Shot%202017-10-23%20at%2010.32.12%20AM.png" width=500 />
<img alt="Profile" src="https://raw.githubusercontent.com/miller46/digital-identity/master/screenshots/Screen%20Shot%202017-10-22%20at%2011.22.35%20PM.png" width=500 />

**NOTES**

* The public key used to encryption is derived from the private key and is NOT the public key of the Ethereum address.
* This deploys data to a single IPFS node at the moment.  I plan to move to Infura shortly.
* This is still a little raw, and I plan to move it to a library

**To run** 

    npm install
    browserify main.js > js/bundle.js
