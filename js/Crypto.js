var bitcore = require('bitcore-lib');
var ECIES = require('bitcore-ecies');

function encrypt(publicKey, privateKey, message) {
    var privateKey = new bitcore.PrivateKey(privateKey);
    var alice = ECIES().privateKey(privateKey).publicKey(new bitcore.PublicKey(publicKey));
    var encrypted = alice.encrypt(message);
    return encrypted.toString('hex');
}

function decrypt(privateKey, encrypted) {
    var privateKey = new bitcore.PrivateKey(privateKey);
    var alice = ECIES().privateKey(privateKey);
    var decrypted = alice.decrypt(new Buffer(encrypted, 'hex'));
    return decrypted.toString('ascii');
}

function createPublicKey(privateKey) {
    return new bitcore.PublicKey.fromPrivateKey(new bitcore.PrivateKey(privateKey)).toString();
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
exports.createPublicKey = createPublicKey;
