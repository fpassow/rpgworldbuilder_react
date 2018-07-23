'use strict';

let mongoUrl = process.env.RPGWORLDBUILDER_DB;

/*
 * REST API for rpgworldbuilder spa.
 * Also serves static files.
 *
 * Rest calls optionally accept a JSON body.
 * All responses include a JSON object in their body, 
 *     even if it's just {} or {"error":.....}
 *
 * Expects MongoDB connection string in environement variable RPGWORLDBUILDER_DB
 */

var def = require('./public/def.json');

var winston = require('winston');
winston.level = 'debug';

var log = new (winston.Logger)({
    transports: [
        new ( winston.transports.Console )({ 
            timestamp: true,
        })
    ]
});

//Require my db access module
let connect = require('./store');
connect(mongoUrl, 'rpgworldbuilder').then(serveSomeWebs);

function serveSomeWebs(store) {
    var express = require('express');
    var app = express();

    app.disable('etag');//Recompute and resend. Disable sending HTTP 304s.

    var bodyParser = require('body-parser');
    app.use(bodyParser.json());

    var basicAuth = require('basic-auth');

    var morgan = require('morgan');
    app.use(morgan('common'));

// 400 "Bad request" = Syntax wrong, missing parts, etc.
// 401 "Unauthorized" = MISSING AUTH
// 403 "Forbidden" = BAD PASSWORD OR USER NOT ALLOWED THAT RESOURCE.
// 204 No content
// 201 Created

// ***ALLWAYS**** SEND A JSON RESPONSE BODY!!!!!!. (EVEN IF JUST {}.)

    // Create user if name isn't already used.
    app.post('/api/v01/users', (req, res)=>{
        let postedUser = req.body;
        console.log('Create user:' + JSON.stringify(postedUser));
        if (postedUser && postedUser.username && postedUser.password) {
            let newUser = {username: postedUser.username, password:postedUser.password};
            store.createOnly(newUser, 'users', 'username')
            .then(()=>{
                //return 201 "Created" 
                //  and a Location header with /api/v01/users/:username
                res.location('/api/v01/users/' + postedUser.username);
                res.status(201).json({});
            })
            .catch(()=>{
                res.status(403).json({error:'User already exists'});
                console.log('User already exists:' + postedUser.username);
            });
        } else {
            res.status(400).json({error:'Incomplete POST data.'});
        }
    });

    // Auth required. You can put a new password
    app.put('/api/v01/users', (req, res)=>{
        let postedUser = req.body;
        console.log('PUT user:' + JSON.stringify(postedUser));
        if (!postedUser || !postedUser.username || !postedUser.password) {
            res.status(400).json({error: 'POSTed incomplete user.'});
        } else {
            authCheck(req, res, postedUser.username).then((authUser)=>{
                if (postedUser.username === authUser.username) {
                    store.crupdate(postedUser, 'users', 'username');
                    res.status(200).json({});
                } else {
                    res.status(403).json({error:'Auth for different user.'});
                }
            });
        }
    });

    // Return an array of usernames
    app.get('/api/v01/users', (req, res)=>{
        store.readAll('users').then((users)=>{
            let usernames = users.map((user)=>{return user.username;});
            res.json(usernames);
        });
    });

    // Get one user object, without password
    app.get('/api/v01/users/:username', (req, res)=>{
        store.findAll('users', 'username', req.params.username)
        .then((users)=>{
            users.forEach((user)=>{delete user.password;})
            res.json(users);
        })
    });

    // Auth required. For checking password. 
    //  Doesn't actually grant access to anything.
    app.get('/api/v01/checkauth', (req, res)=>{
        authCheck(req, res).then((authUser)=>{
            res.status(200).json({});
        });
    });

    // For just one user, get the complete campaign objects
    app.get('/api/v01/users/:username/campaigns',  (req, res)=>{
        //search the campaigns collection for the given username.
        store.findAll('campaigns', 'username', req.params.username)
        .then((campaigns)=>{res.json(campaigns);});
    });

    // Requires auth
    app.delete('/api/v01/users',  (req, res)=>{
        authCheck(req, res)
        .then((authUser)=>{
            console.log('Deleting:' + authUser.username);
            store.deleteOne('users', 'username', authUser.username)
            .then(()=>{
                console.log('Deleted user: ' + authUser.username);
                res.json({});
                //store.deleteAll('campaigns', 'username', authUser.username)
                //.then(()=>{
                //    try {
                //      console.log("Deleted user's campaigns.");
                //      res.json({});
                //  } catch (errr) {
                //    console.log("Catch block:" + JSON.stringify(errr));
                //  }
                //})
                //.catch((err)=>{
                //    console.log("Error deleting deleted user's campaigns:"+JSON.stringify(err));
                //    res.status(500).json(err);
                //});
            })
            .catch((err)=>{
                console.log('DB DELETE ERROR: ' + JSON.stringify(err));
                res.status(500).json(err);
            });
        })
        .catch((err)=>{
            console.log('MYSTERY ERR: '+JSON.stringify(err));
            res.status(500).json({error:'Auth failed.'});
        });
    });

    // Create a new campaign. Owned by you. Needs auth.
    app.post('/api/v01/campaigns',  (req, res)=>{
        let campaign = req.body;
        authCheck(req, res).then((user)=>{
            //Set user to whoever authenticated.
            campaign.username = user.username;
            campaign.campaignId = 'ID' + Math.random();
            //Remove _id that's leftover from where-ever
            delete campaign.id;
            store.createOnly(campaign, 'campaigns', 'campaignId').then(()=>{
                res.json(campaign);
            }).catch((err)=>{
                res.status(500).json(err);
            });
        });
    });

    // Update a campaign. You must own it
    app.put('/api/v01/campaigns', (req, res)=>{
        let campaign = req.body;
        console.log('PUTting campaign: ['+campaign.title+'] ID:' + campaign.campaignId);
        authCheck(req, res).then((authUser)=>{
            console.log('authUser:'+JSON.stringify(authUser));
            //check if campaign exists
            store.findAll('campaigns', 'campaignId', campaign.campaignId)
            .then((arr)=>{
                console.log('db contains:'+JSON.stringify(arr));
                if (!arr.length || arr[0].username === authUser.username) {
                    store.crupdate(campaign, 'campaigns', 'campaignId')
                    .then((x)=>{res.json({});})
                    .catch((err)=>{res.status(500).json(err);});
                } else {
                    //Campaign exists but doesn't belong to this user
                    res.status(403).json({error:'Campaign belongs to someone else.'});
                }
            })
            .catch((err)=>{
                console.log('Error from findAll in put-campaign:' + JSON.stringify(err));
            });
        });
    });

    // List all campaigns.Return objects with campaignId, title, and username
    app.get('/api/v01/campaigns', (req, res)=>{
        store.readAll('campaigns').then((campaigns)=>{
            res.json(
                campaigns.map((camp)=>{
                    let camp2 = {};
                    camp2.username = camp.username;
                    camp2.title = camp.title;
                    camp2.campaignId = camp.campaignId;
                    return camp2;
                })
            );
        });  
    });

    // Get one campaign object
    app.get('/api/v01/campaigns/:camp_id', (req, res)=>{
        store.findAll('campaigns', 'campaignId', req.params.camp_id).then((camp)=>{
            if (camp.length) {
                res.json(camp[0]);
            } else {
                res.status(404).json({error:'Campaign not found.'});
            }
        })
    });

    // Auth required. And you must own it.
    app.delete('/api/v01/campaigns/:camp_id', (req, res)=>{
        store.findAll('campaigns', 'campaignId', req.params.camp_id).then((campaigns)=>{
            if (campaigns.length) {
                let campaign = campaigns[0];
                authCheck(req, res, campaign.username).then((authUser)=>{
                    store.deleteOne('campaigns', 'campaignId', req.params.camp_id);
                    res.json({});
                }).catch((error)=>{
                    res.status(500).json(error);
                });
            } else {
                res.status(404).json({error:'Campaign not found.'});
            }
        });
    });

    app.get('/api/v01/campaignpage/:camp_id', (req, res)=>{
        store.findAll('campaigns', 'campaignId', req.params.camp_id).then((camp)=>{
            if (camp.length) {
                res.send(makeWebPage(camp[0]));
            } else {
                res.status(404).json({error:'Campaign not found.'});
            }
        })
    });

    function makeWebPage(camp) {
        let fieldDefs = def.fields.slice();//We will remove the first element. So use a copy.
        fieldDefs.shift();//Remove title
        let outArr = [];
        outArr.push('<html><head><title>' + camp.title + '</title></head><body>');
        outArr.push('<h2>' + camp.title + '</h2>');
        for (let fieldDef of fieldDefs) {
            outArr.push('<h3>' + fieldDef.name + '</h3>');
            let fieldData = camp[fieldDef.name];
            if (Array.isArray(fieldData)) {
                outArr.push('<ul>');
                for (let arrItem of fieldData) {
                    outArr.push('<li>' + arrItem + '</li>');
                }
                outArr.push('</ul>')
            } else {
                outArr.push(fieldData);
            }
        }
        outArr.push('</body></html>');
        return outArr.join('');
    }

    //Serve the index page when someone makes a new request for an URL 
    //  with a campaignId in it.
    //Client-side code will look at the URL and actually select and load the campaign.
    app.get('/route/:campaignId',(req, res)=>{
        res.sendFile(__dirname + '/public/rpgworldbuilder.html');
    });

    //Serve the static files
    app.use('/', express.static('public'));
    
    const port = process.env.PORT || 3000;
    app.listen(port);
    console.log('Listening on port ' + port + '.');

    /* Utility function.
     * Returns a promise with the user object if passed.
     * Sends a status 401 and an error object and rejects the promise 
     *    if credentials are bad.
     * username is optional. If included, we check that it matches the user in the auth header.
     */
    function authCheck(req, res, username) {
        return new Promise(function(resolve, reject) {
            var authUser = basicAuth(req);//has name and pass
            if (username && (username !== authUser.name)) {
                reject({error: 'Auth for different name.'});
            } else {
                if (authUser && authUser.name && authUser.pass) {
                    store.findAll('users', 'username', authUser.name).then((users)=> {
                        if (users.length && users[0].password === authUser.pass) {
                            resolve(users[0]);
                        } else {
                            res.status(401).json({error: 'Auth failed in authCheck'});
                            reject({error:'Auth failed with username ['+authUser.name+'] and password ['+authUser.pass+']'});
                        }
                    });
                } else {
                    res.status(401).json({error: 'Missing username/password'});
                    reject({error:'Missing auth'});
                }
            }
        });
    }

    //I think this won't be used on the server side for an API.
    //What we return isn't displayed directly in a browser. And the client isn't
    //   going to cross-site attack himself.
    function escapeHtml(unsafe) {
        if (!unsafe) {
            return '';
        }
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
//TODO: PUT THIS ON GITHUP
    function obj2html(obj) {
        let propNames = Object.keys(obj);
        let propName = false;
        let outArr = [];
        for (let i = 0; i < propNames.length; i++) {
            propName = propNames[i];
            outArr.push('<div class="prop"><span class="propname">'+propName
                +'</span><div class="value">');
            if (typeof obj[propName] == 'object') {
                outArr.push(obj2html(obj[propName]));
            } else {
                outArr.push(obj[propName].toString());
            }
            outArr.push('</div></div>');
        }
        return outArr.join('');
    }

}