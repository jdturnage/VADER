//--------------------------------------------------------------------------------------------------
// Dependencies
var http = require('http');
var fs = require('fs');
var S = require('string');
var util = require('util');
var querystring = require('querystring');
var sqlite3 = require('sqlite3').verbose();
var mkdirp = require('mkdirp');
var path = require('path');
var findit = require('findit2');

//--------------------------------------------------------------------------------------------------
// Constants
var DATABASE = "C:\\DigitalSignage\\media\\piDee.db";
//Location on machine running Node.js server
var ORG_ROOT = "C:\\DigitalSignage\\media\\piFilling\\Org";
var LOC_ROOT = "C:\\DigitalSignage\\media\\piFilling\\Location";
var NASA_LOGO = "C:\\DigitalSignage\\media\\piFilling\\nasameatball.png";
//this holds the folders with the symlinks the pi accesses  
var PIFOLDERS_ROOT = "C:\\DigitalSignage\\media\\piFolders";
//Location where the Pi can access the folders above, either SMB share or NFS
//	If NFS, the share must be mounted
var NFS_MNT_ROOT = "/media"

//--------------------------------------------------------------------------------------------------
// Database Initialization
var db = new sqlite3.Database(DATABASE);
var exists = fs.existsSync(DATABASE);
//Try to open the database file for appending (or creation)
try {
    console.log('Opening Pidentities Database.');
    fs.openSync(DATABASE, 'a');

    //create Pidentities table if it doesn't exist
    //	pID  		INTEGER PRIMARY KEY		keeps the rowids unique and persistent through a VACUUM
    //	timestamp	TEXT					timestamp the last time the Pi called in
    //	ipaddress	TEXT					IP address of the Pi
    //	location	TEXT					Room Location of the Pi (set in XBMC)
    //	orgcode		TEXT					Organization the Pi should display images for (set in XBMC)
    //	filelink	TEXT					
    db.run("CREATE TABLE IF NOT EXISTS Pidentities (pID INTEGER PRIMARY KEY, timestamp TEXT, ipaddress TEXT, location TEXT, orgcode TEXT, filelink TEXT)");
} catch (err) {
    console.log('Error creating database, potentially a permissions issue');
    console.log(err);
}

/*--------------------------------------------------------------------------------------------------	
// addNewPi : string, string, string -> integer
// Sends a notification to the given address with the given message and timeouts
// INPUT: loc - The location of the Pi
// INPUT: org - The organization whom owns the Pi
// INPUT: piip - IP address of the Pi
// CALLS: createNewFolder
// Examples:
//		createPidentity("30A","DD","192.168.0.1") -> Returns an integer representing the new row id in the database */
function addNewPi(loc, org, piip) {
	db.run("INSERT INTO Pidentities (IP_address, Location, Orgcode, timestamp, filelink) VALUES ('" + piip + "', '" + loc + "', '" + org + "', Time('now'), 'c:/blahblahblah')", function (error) {
		id = this.lastID;
		console.log('New Row ID '+id);
		createNewFolder(id, loc, org, piip);
	});
}
/*--------------------------------------------------------------------------------------------------
// createNewFolder : integer -> integer
// Creates a new folder in the PIFOLDERS_ROOT with the given piDee and updates the database to reflect the change
// INPUT: piDee - the UUID of the Pi, generated by createPidentity
// INPUT: loc - The location of the Pi
// INPUT: org - The organization whom owns the Pi
// INPUT: piip - IP address of the Pi
// CALLS: populateFolder
// Examples:
//		createNewFolder(5, "30A", "DD", "192.168.0.1") -> A folder PIFOLDERS_ROOT\5 should exist and the 5th row filelink will point to that entry */
function createNewFolder(piDee, loc, org, piip) {
	var folder_loc = PIFOLDERS_ROOT + path.sep + piDee;
    //Create the folder for the Pi symlinks, mkdirp
	console.log("Creating folder for "+piDee);
    mkdirp(folder_loc, function (error) {
		if(error){
			console.log(error);
		} else{
			console.log(folder_loc+' was created succesfully');
			populateFolder(piDee, loc, org, piip);
		}
    });
    //Update the DB to show where the pi is looking for media 
    db.run("UPDATE Pidentities SET filelink = '" + folder_loc + "' WHERE rowid = " + piDee);
}
/*--------------------------------------------------------------------------------------------------	
// populateFolder : string, string, string
// Adds a new Pi to the Database, creates it's folder in PIFOLDERS_ROOT, and populates the folders
// INPUT: pidee - the UUID of the Pi, generated by createPidentity
// INPUT: loc - The location of the Pi
// INPUT: org - The organization whom owns the Pi
// INPUT: piip - IP address of the Pi
// CALLS: sendPiDee
// Examples:
//		populateFolder("7","30A","DD","192.168.0.1") -> Populates the given Pi's folders with the media */
function populateFolder(piDee,location, org, piip) {
	//put in NASA Logo
	fs.symlink(NASA_LOGO, PIFOLDERS_ROOT + path.sep + piDee + path.sep + "nasameatball.png", 'file', function(err){
	   if (err) console.error('Error in symlinking NASA logo for '+piDee+':'+err)
	   });

	//Symlink the hierarchial media
    traverseFolders('org', piDee, org);
    traverseFolders('loc', piDee, location);
	
	sendPiDee(piip, piDee); 
	playPi(piip, piDee);
}
function traverseFolders(traverseBy, piDee, target) {
    var thisRoot = '';
    thisRoot = (traverseBy == "org") ? ORG_ROOT : LOC_ROOT;

    console.log("Traversing by " + thisRoot);
    var finder = require('findit2').find(thisRoot);
    finder.on('directory', function (dir, stat) {
        if (path.basename(dir) == target) {
            console.log("Matched with the : " + dir);
            var innerFinder = require('findit2').find(thisRoot);
            innerFinder.on('file', function (file, stat) {
                if (dir.indexOf(path.dirname(file)) > -1) {
                    //console.log(file);
                    //Parse out any improper path separators **WINDOWS SPECIFIC CODE**
                    var pathArray = file.replace(/\//g, '\\').split("\\");
                    var length = pathArray.length;
                    //Create a unique filename for each symlink by using the path
                    if (length > 3) {
                        filename = pathArray[length - 3] + "." + pathArray[length - 2] + "." + pathArray[length - 1];
                    } else {
                        filename = pathArray[pathArray.length - 1];
                    }
                    fs.symlink(file.replace(/\//g, '\\'), PIFOLDERS_ROOT + path.sep + piDee + path.sep + filename, function (err) {
                        console.log("Trying ze link: " + PIFOLDERS_ROOT + path.sep + piDee + path.sep + filename);
                        if (err) console.error(err);
                    });
				}
            });
        }
    });
}

function playPi(piip, piDee){
	var data = {
        jsonrpc: "2.0",
        id: "0",
        method: "Addons.ExecuteAddon",
        params: {
            wait: true,
            addonid: "service.digital.signage",
            params: ["play"]
        }
    };

	dataString = JSON.stringify(data);
	
    var headers = {
        "Content-Type": "application/json",
        "Content-Length": dataString.length
    };

    var options = {
        host: piip,
        port: 80,
        path: "/jsonrpc",
        method: "POST",
        headers: headers
    };

	//Create the outgoing request object
    var outreq = http.request(options, function (res) {
        res.setEncoding('utf-8');
        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            var resultObject = JSON.parse(responseString);
        });
    });

    outreq.on('error', function (e) {
        // TODO: handle error. 
    });

	//Write the request
    outreq.write(dataString);
    outreq.end();
}
/*--------------------------------------------------------------------------------------------------	
// sendPiDee : string, string
// Sends the id the Pi should write to settings.xml 
//	It is up to the Pi to properly implement this, overrides.py currently handles it
// INPUT: piip - IP address of the Pi running XBMC
// INPUT: piDee - the piDee to reset the Pi to
// Examples:
//		sendPiDeeSetting("192.168.0.1","9") -> Sends a piDee of 9 to the Pi at 192.168.0.1 */
function sendPiDee(piip, piDee) {
    var data = {
        jsonrpc: "2.0",
        id: "0",
        method: "Addons.ExecuteAddon",
        params: {
            wait: true,
            addonid: "service.digital.signage",
            params: ["piDee", piDee.toString()]
        }
    };

	dataString = JSON.stringify(data);
	
    var headers = {
        "Content-Type": "application/json",
        "Content-Length": dataString.length
    };

    var options = {
        host: piip,
        port: 80,
        path: "/jsonrpc",
        method: "POST",
        headers: headers
    };

	//Create the outgoing request object
    var outreq = http.request(options, function (res) {
        res.setEncoding('utf-8');
        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            var resultObject = JSON.parse(responseString);
        });
    });

    outreq.on('error', function (e) {
        // TODO: handle error. 
    });

	//Write the request
    outreq.write(dataString);
    outreq.end();
}
/*--------------------------------------------------------------------------------------------------	
// sendNotification : string, string, integer -> boolean
// Sends a notification to the given address with the given message and timeouts
// INPUT: piip - IP address of the Pi running XBMC
// INPUT: message - [OPTIONAL] message to be displayed in the notification
// INPUT: timeout - [OPTIONAL] duration of notification on screen
// OUTPUT: returns true on succesful JSONRPC call, returns false on error
// Examples:
//		sendNotification("192.168.0.1") -> Sends default notification to IP with default timeout
//		sendNotification("192.168.0.1","Testing") -> Sends "Testing" as the notification to Pi at IP 192.168.0.1
//		sendNotification("192.168.0.1","Testing",500) -> Sends "Testing" as the notification with a timeout of .5 second */
function sendNotification(piip, message, duration) {
    var defaultMessage = "Please change your settings and restart your pi";
	var defaultDuration = 10000;
	var user = {
        jsonrpc: '2.0',
        id: '1',
        method: 'GUI.ShowNotification',
        params: {
            title: 'Error',
            message: message || defaultMessage,
            displaytime: duration || defaultDuration
        }
    };

    var userString = JSON.stringify(user);
    console.log(userString);
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': userString.length
    };

    var options = {
        host: piip,
        port: 80,
        path: '/jsonrpc',
        method: 'POST',
        headers: headers
    };

    var outreq = http.request(options, function (res) {
        console.log('start of outgoing request');

        res.setEncoding('utf-8');
        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            var resultObject = JSON.parse(responseString);
        });
    });

    outreq.on('error', function (e) {
        // TODO: handle error. 
    });

    outreq.write(userString);
    outreq.end();
}

http.createServer(function (inreq, res) {
	var body = '';
	
	console.log('Created server listening on port 8124');

	//Append all incoming data to 'body' which is flushed on inreq.end
    inreq.on('data', function (data) {
        body += data;
    });
	//When the Pi is doing sending it's pidentity, send back any changes or OK
    inreq.on('end', function () {
        var piChunk = '';
		var piDee = '';
		console.log('Server received Pi');
		piChunk = JSON.parse(body);
		body = ''; //Clear the HTML Request contents for incoming requests !!Not sure if this is necessary
        console.log(piChunk);
		
		//If the sent in piDee is the default -1, it needs a new piDee
		if(piChunk.piDee == -1){
			piDee = addNewPi(piChunk.location, piChunk.org, piChunk.piip); 
		}
		
		res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.end();

        console.log('Wrote new piDee of '+piDee+' to Pi"');
    });
}).listen(8124);