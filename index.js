const express = require('express'); // import express js library
const app = express(); //create express js instance 
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
const cors = require('cors');
var oracledb = require('oracledb');
oracledb.outFormat = oracledb.OBJECT;
oracledb.autoCommit = true;
var dbConfig = require('./dbconfig.js');

app.use(cors());
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/home/:demand(*)', function (req, res) {
    req.session.demand = req.params.demand;
    res.sendFile(path.join(__dirname + '/views.html'));
});

app.post('/home/auth', function (request, response) {
    var username = request.session.demand;
    var password = request.body.password;
	/*if (password) {
		connection.query('SELECT * from accounts where username = ? and password = ?', [username, password], function(error, results, fields) {
            console.log(error);
            console.log(results);
			if (results && results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/download/019J354473270009.pdf');
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
        });
        // response.redirect('/download/019J354473270009.pdf');
	} else {
		response.send('Please enter Username and Password!');
		response.end();
    }*/
    var sql = "select * from lettersdownload where demand = '"+username+"' and password = '" + password +"'"
    oracledb.getConnection(
        {
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString
        }, function (err, connection) {
            if (err) {
                console.error(err.message);
                return;
            }
            connection.execute( sql, [], {}, function (err, result) {
                    if (err) {
                        console.error(err.message);
                        doRelease(connection);
                        return;
                    }
                    if (result.rows.length > 0) {
                        response.redirect('/download/019J354473270009.pdf');
                    } else {
                        response.send('Incorrect Username and/or Password!');
                    }
                    doRelease(connection);
                }
            )
        }
    )
    function doRelease(connection) {
        connection.close(
            function (err) {
                if (err)
                    console.error(err.message);
            });
    }

    function bail(err) {
        console.error(err);
        process.exit(1);
    }
});

// define a route to download a file 
app.get('/download/:file(*)', (req, res) => {
    // auth
    const auth = true;
    if (auth) {
        var file = req.params.file;
        var fileLocation = path.join('./uploads', file);
        console.log(fileLocation);
        res.download(fileLocation, file);
    } else {
        // error
    }
});


app.get('*', function (req, res) {
    res.redirect('/home/sample');
});

app.listen(9000, () => {
    console.log(`application is running at: http://localhost:9000`);
});