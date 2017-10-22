var Web3Utility = require('./js/Web3Utility.js');
var Config = require('./js/Config.js');
var Buffer = Web3Utility.Buffer;
var async = require('async');
var CookieUtility = require("./js/CookieUtility.js");
var Crypto = require("./js/Crypto.js");
var NetworkUtility = require("./js/NetworkUtility.js");


//** Globals ** //

var web3 = Web3Utility.initWeb3(window.web3);
var ipfs = Web3Utility.initIpfs();
var registryContract;
var userAccount;
var scanner;
var hasContractRecord = false;

//**  ** //

main();

function main() {
    initUi();

    initClickListeners();

    loadData();
}

function initUi() {
    initScanner();
    initProfile();
}

function initProfile() {
    loadTemplate(Config.baseUrl + '/html/' + 'profile.ejs', 'profileContainer', {});
    initUserInfo();
}

function initScanner() {
    loadTemplate(Config.baseUrl + '/html/' + 'scanner.ejs', 'scannerContainer', {});
}

function initUserInfo() {
    if (userExists()) {
        userAccount = initUserAccount();
    } else {
        initNewAccount();
    }
    showUserAccountInfo(userAccount);
}

function loadData() {
    async.waterfall([
        loadContract,
        fetchPersona,
        fetchIpfsFile
    ], function (error, result) {
        if (error) {
            showErrorState(error);
        } else {
            populateFormWithPersonaData(result);
        }
    });
}

function beginScanner() {
    scanner = new Instascan.Scanner({ video: document.getElementById('preview') });
    scanner.addListener('scan', function (content) {
        console.log(content);
        parseScannedContent(content);
    });

    Instascan.Camera.getCameras().then(function (cameras) {
        if (cameras.length > 0) {
            scanner.start(cameras[0]);
        } else {
            console.error('No cameras found.');
        }
    }).catch(function (e) {
        console.error(e);
    });
}

function parseScannedContent(content) {
    if (content.publicKey && content.hash && content.permissions) {
        showAuthorizationDialog(content, function() {
            savePersonaForApp(content.publicKey, function(error, result) {
                if (error) {
                    showErrorMessage(error);
                } else {
                    NetworkUtility.post(Config.identityRouterUrl + "/" + content.hash, {}, {"publicKey": Crypto.createPublicKey(userAccount.privateKey)}, function (error, response) {
                        if (error) {
                            console.error(error);
                        } else {

                        }
                    });
                }
            });
        });
    } else {
        console.log("invalid format");
    }
}

function stopScanner() {
    scanner.stop();
}

function showAuthorizationDialog(authorizationData, callback) {
    loadTemplate(Config.baseUrl + '/html/' + 'authorize.ejs', 'authorizeContainer', {data: authorizationData});
    $('#authorize_modal').modal('show');

    $('#tfa_send_modal_confirm').click(function() {
        callback();
    });
}

function showErrorState(error) {

}

function loadTemplate(url, element, data) {
    if ($('#' + element).length) {
        new EJS({url: url}).update(element, data);
    } else {
        console.log(element + ' template found')
    }
}

function showScannerTab() {
    beginScanner();
    $('#scannerContainer').show();
    $('#profileContainer').hide();
}

function showProfileTab() {
    stopScanner();
    $('#scannerContainer').hide();
    $('#profileContainer').show();
}

function userExists() {
    return CookieUtility.readCookie("account");
}

function initUserAccount() {
    return JSON.parse(CookieUtility.readCookie("account"));
}

function initNewAccount() {
    userAccount = Web3Utility.createAccount();
    CookieUtility.saveCookie("account", JSON.stringify(userAccount));
}

function showUserAccountInfo(account) {
    $('#user-address').text(account.address);
    $('#user-public-key').text(account.publicKey);
    $('#user-private-key').text(account.privateKey);

    document.getElementById('icon').style.backgroundImage = 'url(' + blockies.create({
        seed: account.address, size: 8, scale: 16
    }).toDataURL()+')'
}

function loadContract(callback) {
    Web3Utility.loadContract(web3, Config.personaRegistryContract, Config.personaRegistryAddress,
        function(error, contract) {
        if (error) {
            console.log(error);
            callback(error, undefined);
        } else {
            registryContract = contract;
            callback(null, contract);
        }
    });
}

function fetchPersona(contract, callback) {
    Web3Utility.callContractFunction(web3, contract, Config.personaRegistryAddress, 'getIpfsPointer',
        [userAccount.address, userAccount.address], function(error, result) {
        if (error) {
            console.log(error);
            callback(error, undefined);
        } else {
            hasContractRecord = true;

            callback(undefined, result);
        }
    });
}

function populateFormWithPersonaData(fileContents) {
    console.log(fileContents);
    try {
        var decrypted = JSON.parse(Crypto.decrypt(userAccount.privateKey, fileContents));
        for (var field in decrypted) {
            if (decrypted.hasOwnProperty(field)) {
                $('input[name="' + field + '"]').val(decrypted[field]);
            }
        }
    } catch(error) {
        console.log(error);
    }
}

function showNewAccountPrompt(account) {
    var message = "Here is your new Ethereum account: " + account.address +
        "<br /><br />Please BACKUP the private key for this account: " + account.privateKey +
        "<br /><br />and DO NOT share it with anybody. ";

    alertify.alert("New Keys Created", message);
}

function initClickListeners() {
    $('#create-button').click(function() {
        createPersona();
    });

    $('#public-key-toggle').click(function() {
        $('#user-public-key').show();
    });

    $('#private-key-toggle').click(function() {
        $('#user-private-key').show();
    });

    $('#tab-scanner').click(function() {
        showScannerTab();
    });

    $('#tab-profile').click(function() {
        showProfileTab();
    });
}

function createPersona() {
    var publicKey = Crypto.createPublicKey(userAccount.privateKey).toString();
    savePersonaForApp(publicKey, function(error, result) {
        if (error) {
            showErrorMessage(error);
        } else {
            showSuccessMessage("Information updated successfully")
        }
    });
}

function showErrorMessage(message) {
    alertify.error(message);
}

function showSuccessMessage(message) {
    alertify.success(message);
}

function savePersonaForApp(publicKey, callback) {
    var fileContents = buildFileContents();
    var encryptedData = Crypto.encrypt(publicKey, userAccount.privateKey, fileContents);

    saveIpfsFile(userAccount.address + "-" + userAccount.address, encryptedData, function(error, response) {
        if (error) {
            console.log(error);
            callback(error, undefined);
        } else {
            if (!hasContractRecord) {
                alertify.confirm("Confirm Transaction", "<h2>Creating your record the first time costs gas.</h2>" +
                    "<h4>Later you may update it for free. </h4>" +
                    "</br>" +
                    "<table>" +
                    "<tr><td><b>From:</b></td><td>&nbsp;</td><td>" + userAccount.address + "</td></tr>" +
                    "<tr><td><b>To:</b></td><td>&nbsp;</td><td>" + Config.personaRegistryAddress + "</td></tr>" +
                    "<tr><td><b>Gas Cost:</b></td><td>&nbsp;</td><td>(Estimated) 0.00134 - 0.00344 ETH</td></tr>" +
                    "</table>" +
                    "</br>", function (closeEvent) {
                        var publicKey = Crypto.createPublicKey(userAccount.privateKey);
                        var responseJson = JSON.parse(response);
                        var ipfsPointer = responseJson.data[0].hash;

                        Web3Utility.send(web3, registryContract, Config.personaRegistryAddress, 'createPersona', [publicKey, ipfsPointer, {
                            gas: 250000,
                            value: 0
                        }], userAccount.address, userAccount.privateKey, undefined, function (functionError, result) {
                            if (functionError) {
                                console.log(functionError);
                                callback(functionError, undefined);
                            } else {
                                console.log(result);
                                callback(undefined, result);
                            }
                        });
                }, function() {
                    showErrorMessage("Record not created");
                }).set('labels', {ok:'Confirm', cancel:'Cancel'})
            } else {
                callback(undefined, response);
            }
        }
    });
}

function buildFileContents() {
    var fields = ["name", "email", "city", "country"];

    var data = {};
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        data[field] = $('input[name="' + field + '"]').val();
    }

    return JSON.stringify(data);
}

function fetchIpfsFile(ipfsPointer, callback) {
    if (!ipfsPointer) {
        callback(undefined, "{}");
    } else {
        NetworkUtility.get(Config.ipfsFetchUrl + "/" +  ipfsPointer, {}, function (error, response) {
            if (error) {
                callback(error.message, undefined);
            } else if (response.error) {
                callback(response.error, undefined);
            } else {
                callback(undefined, response);
            }
        })
    }
}

function saveIpfsFile(name, data, callback) {
    var body = {
        "name": name,
        "data": data
    };
    NetworkUtility.post(Config.ipfsWriteUrl, {'Content-Type': 'application/json'}, body, function(error, response) {
        if (error) {
            callback(error.message, undefined);
        } else if (response.error) {
            callback(response.error, undefined);
        } else {
            callback(undefined, response);
        }
    });
}