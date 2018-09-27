
class ClientLib {

    //Utility for making http requests. Expects the http response body to be a JSON object.
    //Returns a promise.
    //Promise resolves with the JSON body object.
    //If the body can't be parsed, reject with the {status:resp.status, text:<description_of_parse_error>}
    //If the request fails with an HTTP status, reject with {status:resp.status, text:resp.statusText}
    //If the request fails without receiving an HTTP status, reject with {status:999, text:error.message}
    restRequest(method, path, auth, body) {
        let myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        if (auth) {
            myHeaders.append(
                "Authorization", 
                "Basic "+btoa(auth.username + ":" + auth.password)
            );
            myHeaders.append('pragma', 'no-cache');
            myHeaders.append('cache-control', 'no-cache');
        }
        let init = {
            headers: myHeaders,
            method: method,
        };
        if (body) {
            init.body = JSON.stringify(body)
        }
        let rv = {status:null, body:null};
        return new Promise(function(resolve, reject) {
            fetch(path, init).then(function(resp) {
                if (resp.ok) {
                    resp.json().then(function(obj) {
                        //All happy
                        resolve(obj);
                    }).catch(function(err) {
                        //HTTP happy, but response body didn't parse
                        reject({status:resp.status, text:'Error parsing JSON body:'+JSON.stringify(err)});
                    });
                } else {
                    //Non-2xx HTTP status
                    reject({status:resp.status, text:resp.statusText})
                }
            }).catch(function(err) {
                //Error. Didn't get an HTTP response.
                reject(status:999, text:err.message);
            });
        });
    }

    /*
     * Create a new user. 
     * Returns a promise indicating success or failure.
     * Fails if user with the given name already exists.
     */
    createUser(username, password) {
        let postBody = {};
        postBody.username = username;
        postBody.password = password;
        return this.restRequest('post', 'api/v01/users', false, postBody);
    }

    /* 
     * Check if username+password is valid.
     * Returns a promise which is fulfilled if they are.
     * Note: This doesn't perform a login which creates state somewhere.
     *       Requests which change a user's stuff will still require credentials.
     */
    checkUser(username, password) {
        let auth = {username:username, password:password};
        return this.restRequest('get', 'api/v01/checkauth', auth);
    } 

    /*
     * Change password. Returns a promise indicating success or failure.
     */
    changePassword(username, oldPassword, newPassword) {
     	let auth = {username:username, password:oldPassword};
        let body = {username:username, password:newPassword};
        return this.restRequest('put', 'api/v01/users', auth, body);
    }

    /*
     * Delete's a user object. Does not affect the user's campaigns. 
     * Returns a promise indicating success or failure.
     */
    deleteUser(username, password) {
        let auth = {username:username, password};
        return this.restRequest('delete', 'api/v01/users', auth);
    }

    /*
     * Returns a promise which fulfills with an array of username's.
     */
    listUsers() {
        return this.restRequest('get', 'api/v01/users');
    }

    /*
     * Get all the campaigns belonging to the given user.
     * Returns a promise which fulfills with an array of campaign objects.
     */
    listUserCampaigns(username) {
        return this.restRequest('get', 'api/v01/users/' + username + '/campaigns');
    }

    /*
     * Stores a campaign object. Uses the username in the args, if it's different from the
     * one on the campaign object. (i.e. creates a copy owned by the new user.)
     * Returns a promise which indicating success or failure.
     */
    createCampaign(username, password, campaign) {
        let auth = {username:username, password:password};
        return this.restRequest('post','api/v01/campaigns', auth, campaign);
    }

    /*
     * Updates an existing campaign object on the server.
     * Requires the password of the campaign's username.
     * Returns a promise which indicating success or failure.
     */
    updateCampaign(campaign, password) {
        let auth = {username:campaign.username, password:password};
        return this.restRequest('put','api/v01/campaigns', auth, campaign);
    }

    /*
     * Returns a promise which fulfills with an array 
     * of {campaignId:..., title:...} objects.
     */
    listCampaigns() {
        return this.restRequest('get','api/v01/campaigns');
    }

    /*
     * Returns a promise which fulfills with the campaign object
     */
    loadCampaign(campaignId) {
        return this.restRequest('get','api/v01/campaigns/' + campaignId);
    }

    /*
     * Remove a campaign. It must belong to the authorizing user.
     * Returns a promise which will signal success or failure.
     */
    deleteCampaign(username, password, campaignId) {
        let auth = {username:username, password:password};
        return this.restRequest('delete','api/v01/campaigns/' + campaignId, auth);
    }

}

export default ClientLib;
