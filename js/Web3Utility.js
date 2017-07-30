var Web3 = require('web3');
var SolidityFunction = require('web3/lib/web3/function.js');
var IpfsAPI = require('ipfs-api');
var Buffer = IpfsAPI().Buffer;
var keythereum = require('keythereum');
var ethUtil = require('ethereumjs-util');
var utils = require('web3/lib/utils/utils.js');
var sha3 = require('web3/lib/utils/sha3.js');
var coder = require('web3/lib/solidity/coder.js');
var Tx = require('ethereumjs-tx');

var Config = require('./Config.js');
var FileUtility = require('./FileUtility.js');
var NetworkUtility = require('./NetworkUtility.js');

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

function call(web3, contract, address, functionName, args, callback) {
    function proxy(retries) {
        var web3 = new Web3();
        var data = contract[functionName].getData.apply(null, args);
        var result = undefined;
        var url = 'https://'+(Config.isTestNet ? 'kovan' : 'api')+'.etherscan.io/api?module=proxy&action=eth_Call&to='+address+'&data='+data;
        if (Config.etherscanApiKey) url += '&apikey=' + Config.etherscanApiKey;
        NetworkUtility.get(url, {}, function(err, body){
            if (!err) {
                try {
                    result = JSON.parse(body);
                    var functionAbi = contract.abi.find(function(element, index, array) {return element.name==functionName});
                    var solidityFunction = new SolidityFunction(web3.Eth, functionAbi, address);
                    var result = solidityFunction.unpackOutput(result['result']);
                    callback(undefined, result);
                } catch (err) {
                    if (retries>0) {
                        setTimeout(function(){
                            proxy(retries-1);
                        }, 1000);
                    } else {
                        callback(err, undefined);
                    }
                }
            } else {
                callback(err, undefined);
            }
        });
    }
    try {
        if (false) {
            var data = contract[functionName].getData.apply(null, args);
            web3.eth.call({to: address, data: data}, function(err, result){
                if (!err) {
                    var functionAbi = contract.abi.find(function(element, index, array) {return element.name==functionName});
                    var solidityFunction = new SolidityFunction(web3.Eth, functionAbi, address);
                    try {
                        var result = solidityFunction.unpackOutput(result);
                        callback(undefined, result);
                    } catch (err) {
                        proxy(1);
                    }
                } else {
                    proxy(1);
                }
            });
        } else {
            proxy(1);
        }
    } catch(err) {
        proxy(1);
    }
}

function callContractFunction(contract, address, functionName, args, callback) {
    function proxy(retries) {
        const web3 = new Web3();
        const data = contract[functionName].getData.apply(null, args);
        var url;
        if (Config.isTestNet) {
            url = "https://" + Config.networkName + ".etherscan.io/api";
        } else {
            url = "https://etherscan.io/api";
        }
        url += "?module=proxy&action=eth_Call&to=" + address + "&data=" + data;
        if (Config.etherscanApiKey) url += "&apikey=" + Config.etherscanApiKey;
        NetworkUtility.get(url, {}, function(err, body) {
            if (!err) {
                try {
                    var result = JSON.parse(body);
                    var functionAbi = contract.abi.find(function(element, index, array) {return element.name==functionName});
                    var solidityFunction = new SolidityFunction(web3.Eth, functionAbi, address);
                    var resultUnpacked = solidityFunction.unpackOutput(result.result);
                    callback(undefined, resultUnpacked);
                } catch (errJson) {
                    if (retries > 0) {
                        setTimeout(function() {
                            proxy(retries - 1);
                        }, 1000);
                    } else {
                        callback(err, undefined);
                    }
                }
            } else {
                callback(err, undefined);
            }
        });
    }
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

function callWithApiProxy() {
    var web3 = new Web3();
    var data = contract[functionName].getData.apply(null, args);
    var result = undefined;
    var url = 'https://' + (Config.isTestNet ? Config.networkName : 'api') + '.etherscan.io/api?module=proxy&action=eth_Call&to=' + address + '&data=' + data;
    if (Config.etherscanApiKey) url += '&apikey='+ Config.etherscanApiKey;
    NetworkUtility.get(url, {}, function(err, body) {
        if (!err) {
            try {
                result = JSON.parse(body);
                var functionAbi = contract.abi.find(function(element, index, array) {return element.name==functionName});
                var solidityFunction = new SolidityFunction(web3.Eth, functionAbi, address);
                var result = solidityFunction.unpackOutput(result['result']);
                callback(undefined, result);
            } catch (err) {
                callback(err, undefined);
            }
        } else {
            callback(err, undefined);
        }
    });
}

function send(contract, address, functionName, args, fromAddress, privateKey, nonce, callback) {
    var web3 = window.web3;
    if (privateKey && privateKey.substring(0,2) === '0x') {
        privateKey = privateKey.substring(2,privateKey.length);
    }
    function encodeConstructorParams(abi, params) {
        return abi.filter(function (json) {
            return json.type === 'constructor' && json.inputs.length === params.length;
        }).map(function (json) {
            return json.inputs.map(function (input) {
                return input.type;
            });
        }).map(function (types) {
            return coder.encodeParams(types, params);
        })[0] || '';
    }
    args = Array.prototype.slice.call(args).filter(function (a) {return a !== undefined; });
    var options = {};
    if (typeof(args[args.length - 1]) == 'object' && args[args.length - 1].gas != undefined) {
        args[args.length - 1].gasPrice = Config.defaultGasPrice;
        args[args.length - 1].gasLimit = args[args.length - 1].gas;
        delete args[args.length - 1].gas;
    }
    if (utils.isObject(args[args.length - 1])) {
        options = args.pop();
    }
    getNextNonce(fromAddress, function(err, nextNonce) {
        if (nonce == undefined || nonce < nextNonce) {
            nonce = nextNonce;
        }
        // console.log("Nonce:", nonce);
        options.nonce = nonce;
        if (functionName == "constructor") {
            if (options.data.slice(0,2) != "0x") {
                options.data = '0x' + options.data;
            }
            var encodedParams = encodeConstructorParams(contract.abi, args);
            console.log(encodedParams);
            options.data += encodedParams;
        } else if (contract == undefined || functionName == undefined) {
            options.to = address;
        } else {
            options.to = address;
            var functionAbi = contract.abi.find(function(element, index, array) {
                return element.name == functionName
            });
            var inputTypes = functionAbi.inputs.map(function(x) {return x.type});
            var typeName = inputTypes.join();
            options.data = '0x' + sha3(functionName + '(' + typeName+')').slice(0, 8) + coder.encodeParams(inputTypes, args);
        }
        var tx;
        try {
            tx = new Tx(options);
            function proxy() {
                if (privateKey) {
                    signTx(fromAddress, tx, privateKey, function (errSignTx, txSigned) {
                        if (!errSignTx) {
                            var serializedTx = txSigned.serialize().toString('hex');
                            var url;
                            if (Config.isTestNet) {
                                url = "https://" + Config.networkName + ".etherscan.io/api";
                            } else {
                                url = "https://etherscan.io/api";
                            }
                            var formData = {module: 'proxy', action: 'eth_sendRawTransaction', hex: serializedTx};
                            if (Config.etherscanApiKey) formData.apikey = Config.etherscanApiKey;
                            NetworkUtility.post(url, {}, formData, function (errPostURL, body) {
                                if (!errPostURL) {
                                    try {
                                        const result = JSON.parse(body);
                                        if (result.result) {
                                            callback(undefined, {txHash: result.result, nonce: nonce + 1});
                                        } else if (result.error) {
                                            callback(result.error.message, {txHash: undefined, nonce: nonce});
                                        }
                                    } catch (errTry) {
                                        callback(errTry, {txHash: undefined, nonce: nonce});
                                    }
                                } else {
                                    callback(err, {txHash: undefined, nonce: nonce});
                                }
                            });
                        } else {
                            console.log(err);
                            callback('Failed to sign transaction', {txHash: undefined, nonce: nonce});
                        }
                    });
                } else {
                    callback('Failed to sign transaction', {txHash: undefined, nonce: nonce});
                }
            }
        } catch (err) {
            callback(err, undefined);
        }
        try {
            if (web3.currentProvider) {
                options.from = fromAddress;
                options.gas = options.gasLimit;
                delete options.gasLimit;
                web3.eth.sendTransaction(options, function(err, hash) {
                    if (!err) {
                        callback(undefined, {txHash: hash, nonce: nonce + 1});
                    } else {
                        console.log(err);
                        proxy();
                    }
                })
            } else {
                proxy();
            }
        } catch (err) {
            proxy();
        }
    });
}

function signTx(address, tx, privateKey, callback) {
    var web3 = window.web3;
    if (privateKey) {
        tx.sign(new Buffer(privateKey, 'hex'));
        callback(undefined, tx);
    } else {
        var msgHash = '0x' + tx.hash(false).toString('hex');
        web3.eth.sign(address, msgHash, function(err, sig) {
            if (!err) {
                try {
                    function hexToUint8array(s) {
                        if (s.slice(0,2)=='0x') s=s.slice(2)
                        var ua = new Uint8Array(s.length);
                        for (var i = 0; i < s.length; i++) {
                            ua[i] = s.charCodeAt(i);
                        }
                        return ua;
                    }
                    var r = sig.slice(0, 66);
                    var s = '0x' + sig.slice(66, 130);
                    var v = web3.toDecimal('0x' + sig.slice(130, 132));
                    if (v != 27 && v != 28) v += 27;
                    sig = {r: hexToUint8array(r), s: hexToUint8array(s), v: hexToUint8array(v.toString(16))};
                    tx.r = r;
                    tx.s = s;
                    tx.v = v;
                    callback(undefined, tx);
                } catch (err) {
                    callback(err, undefined);
                }
            } else {
                callback(err, undefined);
            }
        });
    }
}

function sign(address, value, privateKey, callback) {
    var web3 = window.web3;
    if (privateKey) {
        if (privateKey.substring(0,2) == '0x') {
            privateKey = privateKey.substring(2,privateKey.length);
        }
        if (value.substring(0,2) == '0x') {
            value = value.substring(2, value.length);
        }
        try {
            var sig = ethUtil.ecsign(new Buffer(value, 'hex'), new Buffer(privateKey, 'hex'));
            var r = '0x'+sig.r.toString('hex');
            var s = '0x'+sig.s.toString('hex');
            var v = sig.v;
            var result = {r: r, s: s, v: v};
            callback(undefined, result);
        } catch (err) {
            callback(err, undefined);
        }
    } else {
        web3.eth.sign(address, value, function(err, sig) {
            if (err && value.slice(0,2) != '0x') {
                sign(address, '0x'+value, privateKey, callback);
            } else if (!err) {
                try {
                    var r = sig.slice(0, 66);
                    var s = '0x' + sig.slice(66, 130);
                    var v = web3.toDecimal('0x' + sig.slice(130, 132));
                    if (v!=27 && v!=28) v+=27;
                    callback(undefined, {r: r, s: s, v: v});
                } catch (err) {
                    callback(err, undefined);
                }
            } else {
                callback(err, undefined);
            }
        });
    }
}

function getNextNonce(address, callback) {
    function proxy() {
        var url = 'https://' + (Config.isTestNet ? Config.networkName : 'api') + '.etherscan.io/api?module=proxy&action=eth' +
            'GetTransactionCount&address=' + address + '&tag=latest';
        if (Config.etherscanApiKey) url += '&apikey=' + Config.etherscanApiKey;
        NetworkUtility.get(url, {}, function(err, body) {
            if (!err) {
                var result = JSON.parse(body);
                var nextNonce = Number(result['result']);
                callback(undefined, nextNonce);
            } else {
                callback(err, undefined);
            }
        });
    }
    var web3 = window.web3;
    try {
        if (web3.currentProvider) {
            web3.eth.getTransactionCount(address, function(err, result) {
                if (!err) {
                    var nextNonce = Number(result);
                    //Note. initial nonce is 2^20 on testnet, but getTransactionCount already starts at 2^20.
                    callback(undefined, nextNonce);
                } else {
                    proxy();
                }
            });
        } else {
            proxy();
        }
    } catch(err) {
        proxy();
    }
}

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
exports.call = call;
exports.send = send;
exports.createAccount = createAccount;