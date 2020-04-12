// taken from https://medium.com/ghostcoder/using-es6-modules-in-the-browser-5dce9ca9e911

const express = require('express');
var path = require("path");
const app = express();

app.use( '/src', express.static( __dirname ));

app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '..', req.path));
});

express.static.mime.define({'application/javascript': ['js']});

app.listen(8080, () => console.log('Listening on port 8080!'));