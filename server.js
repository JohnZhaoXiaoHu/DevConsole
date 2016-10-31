"user strict";

const express    = require('express');
const bodyParser = require('body-parser');

let app = express();

/*--- Middlewares ---*/
// Server static files
app.use(express.static("static"));
// Parse application/json requests
app.use(bodyParser.json());


/***** Routers *****/
require('./webcliAPI.js')(app);


// Start server
let server = app.listen(5000, function() {
    console.log("Server running on port ", server.address().port);
});
