var fs = require('fs');
var NetworkUtility = require('./NetworkUtility.js');
var Config = require('./Config.js');

function readLocalFile(filename, callback) {
    try {
        if (typeof(window) === 'undefined') {
            fs.readFile(filename, { encoding: 'utf8' }, function(error, data) {
                if (error) {
                    callback(error, undefined);
                } else {
                    callback(undefined, data);
                }
            });
        } else {
            NetworkUtility.get(Config.baseUrl + "/" + filename, {}, function(error, body) {
                if (error) {
                    callback(error, undefined);
                } else {
                    callback(undefined, body);
                }
            });
        }
    } catch (err) {
        callback(err, undefined);
    }
}

exports.readLocalFile = readLocalFile;
