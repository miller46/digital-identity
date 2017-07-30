var Web3Utility = require('./js/Web3Utility.js');
var Config = require('./js/Config.js');
var Buffer = Web3Utility.Buffer;
var async = require('async');
var CookieUtility = require("./js/CookieUtility.js");
var Crypto = require("./js/Crypto.js");

//** Globals ** //

var web3 = Web3Utility.initWeb3();
var ipfs = Web3Utility.initIpfs();
var registryContract;
var userAccount;

//**  ** //

web3.version.getNetwork(function(networkError, version) {
    if (networkError) {
        console.log("Network error: " + networkError);
    } else {
        console.log("Network version: " + version);
    }

    initClickListeners();

    userAccount = CookieUtility.readCookie("account");
    if (userAccount) {
        userAccount = JSON.parse(userAccount);
    } else {
        userAccount = Web3Utility.createAccount();
        CookieUtility.saveCookie("account", JSON.stringify(userAccount));
        showNewAccountPrompt(userAccount);
    }

    $('#user-address').text(userAccount.address);
    $('#user-private-key').text(userAccount.privateKey);

    Web3Utility.loadContract(Config.personaRegistryContract, Config.personaRegistryAddress, function(contractError, contract) {
        if (contractError) {
            console.log(contractError);
        } else {
            registryContract = contract;

            Web3Utility.callContractFunction(contract, Config.personaRegistryAddress, 'getPersona', [userAccount.address, userAccount.address], function(functionError, result) {
                if (functionError) {
                    console.log(functionError);
                } else {
                    if (result[0].length > 0) {
                        var dataTypes = result[0];
                        var ipfsPointers = result[1];
                        for (var i = 0; i < dataTypes.length; i++) {
                            var field = web3.toAscii(dataTypes[i]);
                            var pointer = web3.toAscii(ipfsPointers[i]);
                            ipfs.files.cat(Buffer.from(pointer), function(error, result) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    $('input[name="' + field + '"]').val(result);
                                }
                            });
                        }
                    }
                }
            });
        }
    });
});

function showNewAccountPrompt(account) {
    var message = "Here is your new Ethereum account: " + account.address +
        "<br /><br />Please BACKUP the private key for this account: " + account.privateKey +
        "<br /><br />and DO NOT share it with anybody. ";

    alertify.alert("New Keys Created", message);
}

function initClickListeners() {
    $('#create-button').click(function() {
        var fields = ["name", "email", "city", "country"];

        var nonEmptyFields = [];

        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            var value = $('input[name="' + field + '"]').val();
            if (value) {
                nonEmptyFields.push({field: field, value: value});
            }
        }

        var ipfsPointers = [];
        var dataTypeNames = [];
        async.each(nonEmptyFields, function(item, callback) {
            var field = item.field;
            // var value = Crypto.encryptWithPublicKey(userAccount, userAccount, item.value);
            Crypto.encrypt(userAccount.publicKey, web3.fromAscii(item.value, 32), function(value) {
                saveIpfsFile(userAccount.address + "-" + field + ".txt", value, function(error, response) {
                    if (!error) {
                        // TODO verify you use hash, not path on the mainnet
                        dataTypeNames.push(web3.fromAscii(field, 32));
                        ipfsPointers.push(web3.fromAscii(response[0].path, 32));
                    } else {
                        console.log("IFPS Error: " + error);
                    }
                    callback(undefined);
                });
            });
        }, function(errpr) {
            if (typeof error !== 'undefined') {
                console.log(errpr);
            } else {
                if (ipfsPointers.length > 0) {
                    Web3Utility.send(registryContract, Config.personaRegistryAddress, 'addPersona', [userAccount.address, dataTypeNames, ipfsPointers, {
                        gas: 250000,
                        value: 0
                    }], userAccount.address, userAccount.privateKey, undefined, function (functionError, result) {
                        if (functionError) {
                            console.log(functionError);
                        } else {
                            console.log(result);
                        }
                    });
                } else {
                    console.log("ipfs pointers empty");
                }
            }
        });
    });

    $('#private-key-toggle').click(function() {
        $('#user-private-key').show();
    });
}

function saveIpfsFile(name, data, callback) {
    var reader = new FileReader();
    reader.onloadend = function(event) {
        console.log(event.target.result);

        var buffer = Buffer.from(reader.result);
        ipfs.files.add(buffer, function(error, response) {
            if (error) {
                console.log(error);
                callback(error, undefined);
            } else {
                console.log(response);
                callback(undefined, response);
            }
        });
    };

    var file = new File([data], name, {
        type: "text/plain",
    });
    reader.readAsText(file);
}

