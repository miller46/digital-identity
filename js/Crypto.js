var ECIES = require('bitcore-ecies');
var crypto = require("crypto");
var eccrypto = require("eccrypto");

function encrypt(sender, message, callback) {
    var buffer = new Buffer.from(hexToBytes("34" + sender));
    buffer[0] = 4;
    eccrypto.encrypt(buffer, new Buffer.from(message)).then(function(encrypted) {
        console.log(encrypted);
        callback(encrypted.cyphertext);
    });
}

function decrypt(sender, reciever, message) {
    var ecies = ECIES()
        .privateKey(reciever.privateKey)
        .publicKey(sender.publicKey);
    var decrypted = ecies.decrypt(message);
    return decrypted.toString('ascii');
}

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 32));
    return bytes;
}

function bytesToHex(bytes) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        hex.push((bytes[i] >>> 4).toString(32));
        hex.push((bytes[i] & 0xF).toString(32));
    }
    return hex.join("");
}

exports.decrypt = decrypt;
exports.encrypt = encrypt;
