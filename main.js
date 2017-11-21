var Web3Utility = require('./js/Web3Utility.js');
var Config = require('./js/Config.js');
var Buffer = Web3Utility.Buffer;
var async = require('async');
var CookieUtility = require("./js/CookieUtility.js");
var Crypto = require("./js/Crypto.js");
var NetworkUtility = require("./js/NetworkUtility.js");
var IpfsHelper = require("./js/IpfsHelper.js");

//** Globals ** //

var web3 = Web3Utility.initWeb3(window.web3);
var ipfs = Web3Utility.initIpfs();
var registryContract;
var userAccount;
var scanner;
var ownIpfsHash;

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
        parseScannedContent(content, function(error, result) {
            if (error) {
                showErrorMessage(error)
            } else {
                showSuccessMessage("Shared data successfully!")
            }
        });
    });

    Instascan.Camera.getCameras().then(function (cameras) {
        if (cameras.length > 0) {
            console.log(cameras.length + ' cameras found.');
            scanner.start(cameras[0]);
        } else {
            console.error('No cameras found.');
        }
    }).catch(function (e) {
        console.error(e);
    });
}

function parseScannedContent(content, callback) {
    var data = JSON.parse(content);
    if (data.publicKey && data.hash && data.permissions) {
        showAuthorizationDialog(data, function(data) {

            var fileContents = buildFileContents(data.permissions);
            var encryptedData = Crypto.encrypt(data.publicKey, userAccount.privateKey, fileContents);

            NetworkUtility.post(Config.identityRouterUrl + "/" + data.hash, {}, {"data": encryptedData}, function (error, response) {
                if (error) {
                    console.error(error);
                    callback(error, undefined);
                } else {
                    console.log(response);
                    callback(undefined, response);
                }
            });
        });
    } else {
        console.log("invalid format");
    }
}

function createRecordInSmartContract(publicKey, ipfsPointer, callback) {
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
}

function stopScanner() {
    scanner.stop();
}

function showAuthorizationDialog(data, callback) {
    var permissionsTableHtml = "<table>"
    for (var i = 0; i < data.permissions.length; i++) {
        permissionsTableHtml += "<tr><td>"
        if (data.permissions[i] === "name") {
            permissionsTableHtml += '<i class="fa fa-user"></i>'
        } else if (data.permissions[i] === "email") {
            permissionsTableHtml += '<i class="fa fa-envelope"></i>'
        } else if (data.permissions[i] === "city") {
            permissionsTableHtml += '<i class="fa fa-building"></i>'
        } else if (data.permissions[i] === "country") {
            permissionsTableHtml += '<i class="fa fa-flag"></i>'
        }
        permissionsTableHtml += "</td><td>&nbsp;</td><td>" + data.permissions[i] + "</td>";
        permissionsTableHtml += "</tr>"
    }
    permissionsTableHtml += "</table>";

    alertify.confirm("Confirm Transaction",
        "<h2><b>" + data.name + "</b> is requesting access to the following data</h2>" +
        "</br>" +
        "</br>" +
        permissionsTableHtml +
        "</br>" +
        "</br>", function (closeEvent) {
            callback(data);
    }, function() {
        showErrorMessage("App not authorized");
    }).set('labels', {ok:'Confirm', cancel:'Cancel'})
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
    $('#user-public-key').text(Crypto.createPublicKey(userAccount.privateKey).toString());
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
            ownIpfsHash = result;
            console.log(result);
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
    savePersonaForSelf(function(error, result) {
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

function savePersonaForSelf(callback) {
    var publicKey = Crypto.createPublicKey(userAccount.privateKey).toString();

    var fileContents = buildFileContents(["name", "email", "city", "country"]);
    var encryptedData = Crypto.encrypt(publicKey, userAccount.privateKey, fileContents);

    saveIpfsFile(publicKey + "-" + publicKey, encryptedData, function(error, response) {
        if (error) {
            console.log(error);
            callback(error, undefined);
        } else {
            var ipfsPointer = response[0].hash;

            if (ownIpfsHash !== ipfsPointer) {
                alertify.confirm("Confirm Transaction", "<h2>Save record in smart contract.</h2>" +
                    "</br>" +
                    "<table>" +
                    "<tr><td><b>From:</b></td><td>&nbsp;</td><td>" + userAccount.address + "</td></tr>" +
                    "<tr><td><b>To:</b></td><td>&nbsp;</td><td>" + Config.personaRegistryAddress + "</td></tr>" +
                    "<tr><td><b>Gas Cost:</b></td><td>&nbsp;</td><td>(Estimated) 0.00134 - 0.00344 ETH</td></tr>" +
                    "</table>" +
                    "</br>", function (closeEvent) {
                        var publicKey = Crypto.createPublicKey(userAccount.privateKey);

                        createRecordInSmartContract(publicKey, ipfsPointer, function (functionError, result) {
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

function buildFileContents(fields) {
    var data = {};
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        data[field] = $('input[name="' + field + '"]').val();
    }

    return JSON.stringify(data);
}

function fetchIpfsFile(ipfsPointer, callback) {
    if (!ipfsPointer) {
        callback("No pointer found", undefined);
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
    IpfsHelper.saveIpfsFile(name, data, function(error, response) {
        if (error) {
            callback(error.message, undefined);
        } else {
            callback(undefined, response);
        }
    });
}
