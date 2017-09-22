var express = require('express');
var bodyParser = require('body-parser');

var app = express();

var request = require('request');
var expressLayouts = require('express-ejs-layouts');

app.set("view engine", "ejs");

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.use('/css', express.static('css'));
app.use('/js', express.static('js'));
app.use('/assets', express.static('assets'));
app.use('/contracts', express.static('contracts'));
app.use('/html', express.static('html'));

app.use(expressLayouts);

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.get('/', function (req, res) {
    res.sendFile('index.html', {"root": __dirname});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log("Running on port: " + PORT);
});

