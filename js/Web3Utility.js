var Web3 = require('web3');
var SolidityFunction = require('web3/lib/web3/function.js');
var IpfsAPI = require('ipfs-api');
var Buffer = IpfsAPI().Buffer;
var keythereum = require('keythereum');
var ethUtil = require('ethereumjs-util');

var Config = require('./Config.js');
var FileUtility = require('./FileUtility.js');

function initWeb3() {
    var web3 = window.web3;
    if (typeof web3 !== 'undefined' && typeof Web3 !== 'undefined') {
        //is MetaMask
        web3 = new Web3(web3.currentProvider);
    } else if (typeof Web3 !== 'undefined' && window.location.protocol !== "https:") {
        //is Ethereum Client (e.g. Mist)
        web3 = new Web3(new Web3.providers.HttpProvider(Config.ethProvider));
    } else {
        //no web3 provider
        web3 = new Web3();
    }
    return web3;
}

function initIpfs() {
    return IpfsAPI({host: 'localhost', port: '5001', protocol: 'http'});
}

function loadContract(name, address, callback) {
    FileUtility.readLocalFile(name + '.json', function(readError, abi) {
        if (readError) {
            callback(readError, undefined);
        } else {
            try {
                var contract = window.web3.eth.contract(JSON.parse(abi)).at(address);
                callback(undefined, contract);
            } catch (contractError) {
                callback(contractError, undefined);
            }
        }
    });
}

function callContractFunction(contract, address, functionName, args, callback) {
    var web3 = window.web3;
    try {
        if (web3.currentProvider) {
            var data = contract[functionName].getData.apply(null, args);
            web3.eth.call({to: address, data: data}, function(callError, result) {
                if (!callError) {
                    var functionAbi = contract.abi.find(function(element, index, array) {
                        return element.name == functionName
                    });
                    var solidityFunction = new SolidityFunction(web3.Eth, functionAbi, address);
                    try {
                        callback(undefined, solidityFunction.unpackOutput(result));
                    } catch (resultError) {
                        callback(resultError, undefined);
                    }
                } else {
                    callback(callError, undefined);
                }
            });
        } else {
            callWithApiProxy();
        }
    } catch(contractError) {
        callback(contractError, undefined);
    }
}

// function callWithApiProxy() {
//     var web3 = new Web3();
//     var data = contract[functionName].getData.apply(null, args);
//     var result = undefined;
//     var url = 'https://'+(config.ethTestnet ? 'testnet' : 'api')+'.etherscan.io/api?module=proxy&action=eth_Call&to='+address+'&data='+data;
//     if (config.etherscanAPIKey) url += '&apikey='+config.etherscanAPIKey;
//     getURL(url, null, function(err, body){
//         if (!err) {
//             try {
//                 result = JSON.parse(body);
//                 var functionAbi = contract.abi.find(function(element, index, array) {return element.name==functionName});
//                 var solidityFunction = new SolidityFunction(web3.Eth, functionAbi, address);
//                 var result = solidityFunction.unpackOutput(result['result']);
//                 callback(undefined, result);
//             } catch (err) {
//                 if (retries>0) {
//                     setTimeout(function(){
//                         proxy(retries-1);
//                     }, 1000);
//                 } else {
//                     callback(err, undefined);
//                 }
//             }
//         } else {
//             callback(err, undefined);
//         }
//     });
// }

function createAccount() {
    var privateKey = keythereum.create().privateKey;
    var publicKey = ethUtil.privateToPublic(privateKey);
    var address = ethUtil.privateToAddress(privateKey);
    address = ethUtil.toChecksumAddress(address.toString('hex'));
    publicKey = publicKey.toString('hex');
    privateKey = privateKey.toString('hex');
    return {
        address: address,
        publicKey: publicKey,
        privateKey: privateKey
    };
}


exports.initWeb3 = initWeb3;
exports.initIpfs = initIpfs;
exports.Buffer = Buffer;
exports.loadContract = loadContract;
exports.callContractFunction = callContractFunction;
exports.createAccount = createAccount;