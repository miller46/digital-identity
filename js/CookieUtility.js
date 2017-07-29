
function saveCookie(key, value) {
    if (window.localStorage) {
        window.localStorage.setItem(key, value);
    } else {
        console.log("Missing local storage");
    }
}

function readCookie(key) {
    if (window.localStorage) {
        return window.localStorage.getItem(key);
    } else {
        console.log("Missing local storage");
        return null;
    }
}

function deleteCookie(name) {
    if (window.localStorage) {
        window.localStorage.removeItem(name);
    } else {
        console.log("Missing local storage");
    }
}

exports.saveCookie = saveCookie;
exports.readCookie = readCookie;
exports.deleteCookie = deleteCookie;
