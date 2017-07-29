var request = require('request');

function get(url, headers, callback) {
    var options = {
        url: url,
        headers: headers
    };
    request.get(options, function(error, httpResponse, body) {
        if (error) {
            callback(error, undefined);
        } else {
            callback(undefined, body);
        }
    });
}

function post(url, headers, data, callback) {
    var options = {
        url: url,
        headers: headers,
        form: data
    };
    request.post(options, function(error, httpResponse, body) {
        if (error) {
            callback(err, undefined);
        } else {
            callback(undefined, body);
        }
    });
}

function put(url, headers, data, callback) {
    var options = {
        url: url,
        headers: headers,
        form: data
    };
    request.put(options, function(error, httpResponse, body) {
        if (error) {
            callback(error, undefined);
        } else {
            callback(undefined, body);
        }
    });
}

exports.get = get;
exports.post = post;
exports.put = put;
