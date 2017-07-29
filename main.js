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

web3.version.getWhisper(function(whisperError, version) {
    if (whisperError) {
        console.log("Whisper error: " + whisperError);
    } else {
        console.log("Whisper version: " + version);
    }
});

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
            console.log(contract);
            registryContract = contract;

            Web3Utility.call(web3, contract, Config.personaRegistryAddress, 'getMeTest', [{from: userAccount.address, gas: Config.defaultGasPrice}], function(functionError, result) {
                if (functionError) {
                    console.log(functionError);
                } else {
                    console.log(result);
                    if (result[0].length > 0) {

                        // decode data and show in form
                    }
                }
            });

            // Web3Utility.callContractFunction(contract, Config.personaRegistryAddress, 'getMyPersona', [{from: userAccount.address}], function(functionError, result) {
            //     if (functionError) {
            //         console.log(functionError);
            //     } else {
            //         if (result[0].length > 0) {
            //
            //             // decode data and show in form
            //         }
            //     }
            // });
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
                        ipfsPointers.push(response[0].hash);
                    }
                    callback(undefined);
                });
            });
        }, function(errpr) {
            if (typeof error !== 'undefined') {
                console.log(errpr);
            } else {
                Web3Utility.send(registryContract, Config.personaRegistryAddress, 'addPersona', [dataTypeNames, ipfsPointers, {
                    gas: 250000,
                    value: 0
                }], userAccount.address, userAccount.privateKey, undefined, function (functionError, result) {
                    if (functionError) {
                        console.log(functionError);
                    } else {
                        console.log(result);
                    }
                });
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

        var buffer = buffer = Buffer.from(reader.result);
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

