import React, { Component } from 'react';
import def from './def';
import ClientLib from './clientlib';
const clientlib = new ClientLib();

/*
 def has "name" "label" and "instructions"
  plus "fields", which is an array of field definitions like:
              {
                 "name": "...",
                 "label": "...",
                 "instructions": "......",
                 "longtext": true|false,
                 "isarrayfield": true|false,
                 "hints": [
                    {"label": "...", "description": "......"},
                    {"label": "...", "description": "......"}
                 ]            
              },
*/

//"model" is the application state

//model.campaignList is an array of
//  {username:"thename", campaigns: [campMeta, campMeta, campMeta,...]}

//model.campaign is the campaign currently being displayed [and edited].

//Other properties represent the state of the GUI.

let model_0 = {
  user: {username:"", password:"", isLoggedIn:false},
  campaignList: [],
  campaign: null,
  editMode: false,
  creatingAccount: false,
  changingPassword: false,
  anonymousEditing: false
}

//------------------Constroller---------------------
//Constructor takes the React root component
function Controller(comp) {
  
  this.createAccount = (n,p) => {
    clientlib.createUser(n,p).then((r)=>{
        comp.setState({
          user: {
            username: n,
            password: p,
            isLoggedIn: true
          },
          creatingAccount:false
        });
        this.checkTakeOwnership();
    }).catch((e)=>{
        alert(e);
    });
  };

  this.changePassword = (n,p, newp1) => {
    clientlib.changePassword(n,p, newp1).then((r)=>{
    	alert('Password has been changed.');
        comp.setState({
          user: {
            username: n,
            password: newp1,
            isLoggedIn: true
          },
          changingPassword:false
        });
    }).catch((e)=>{
        alert(e);
    });
  };

  this.login = (n,p) => {
    clientlib.checkUser(n,p).then((r)=>{
        comp.setState({
          user: {
            username: n,
            password: p,
            isLoggedIn: true
          }
        });
        this.checkTakeOwnership();
    }).catch((e)=>{
    	if (e.status == 401) {
    		alert('Bad username and/or password.');
    	} else {
    		alert('Error durring login: ' + JSON.stringify(e));
    	}
    });
  }

  this.logout = () => {
    comp.setState({user:{username: "", password: "", isLoggedIn: false}}); 
  };

  //Show the UI for creating a new account
  this.gotoCreateAccount = ()=> {
    comp.setState({creatingAccount:true});
  }

  this.cancelCreateAccount = ()=> {
    comp.setState({creatingAccount:false});
  }

  this.gotoChangePassword = ()=> {
    comp.setState({changingPassword:true});
  }

  this.cancelChangePassword = ()=> {
    comp.setState({changingPassword:false});
  }

  this.deleteUser = ()=>{
    if (confirm('Click OK if you really want to delete your account. Otherwise, click "Cancel". Thanks.')) {
      let n = comp.state.user.username;
      let p = comp.state.user.password;
      clientlib.deleteUser(n, p).then((r)=>{
        alert('User deleted.');
        comp.setState({user:{username: "", password: "", isLoggedIn: false}});
        this.updateCampaignList();
      }).catch((e)=>{
        alert('controller.deleteUser:' + e);
      });
    }
  };

  this.checkTakeOwnership = ()=>{
    if (comp.state.anonymousEditing) {
      let nstate = {anonymousEditing: false};
      if (comp.state.campaign) {
        nstate.campaign = comp.state.campaign;
        nstate.campaign.username = comp.state.user.username;
      }
      comp.setState(nstate);
      this.saveCampaign();
      updateUrl(nstate.campaign);
    }
  };

  this.updateCampaignList = ()=>{
    clientlib.listCampaigns({}).then((campList)=>{
      comp.setState({campaignList:_organizeCampaigns(campList)});
    });
  };
  //Take an array of campaigns 
  //  and return an array of user objects of the form
  //  {username:"name", campaigns:[campMeta, campMeta, campMeta]}
  function _organizeCampaigns(campArr) {
    //Make an associative array (i.e. JavaScript object)
    //   mapping username to user objects.
    let users = {};
    campArr.forEach((camp)=>{
      if (!(camp.username in users)) {
        users[camp.username] = {username:camp.username, campaigns:[]};
      }
      users[camp.username].campaigns.push(camp);
    });
    //Make array of user objects sorted by username
    let usersArr= [];
    Object.keys(users).sort().forEach((nextName)=>{
      //Sort a user's campaingMeta's and add him to the array
      let aUser = users[nextName];
      aUser.campaigns.sort((a,b)=>{return a.title > b.title;});
      usersArr.push(aUser);
    });
    return usersArr;
  }
  //function _organizeCampaignsForUser(campArr, username) {
  //
  //}
  this.selectCampaign = (campMeta)=>{
  	if (comp.state.editMode && !confirm('Discard changes?')) {
  		return;
  	}
    clientlib.loadCampaign(campMeta.campaignId).then((camp)=>{
    	if (camp) {
    		updateUrl(camp);
            comp.setState({campaign:camp, editMode:false});
        }
    });
  };

  function updateUrl(campaign) {
  	window.history.pushState({}, campaign.title, window.location.pathname+'?campaign='+campaign.campaignId);
  }

  this.editCampaign = ()=>{
    comp.setState({editMode:true});
  };

  this.saveCampaign = ()=>{
    let s = comp.state;
    if (!s.user.isLoggedIn) {
    	alert('Please log in or create an account that will own this campaign.');
    	return;
    }
    clientlib.updateCampaign(s.campaign, s.user.password)
    .then(()=>{
    	alert('Campaign has been saved.');
        comp.setState({editMode:false});
        this.updateCampaignList();
    })
    .catch((e)=>alert(e));
  };

  this.newCampaign = ()=>{
  	let nstate = {};
  	nstate.campaign = {campaignId:'campId'+Math.random()};
  	nstate.editMode = true;
  	if (comp.state.user.isLoggedIn) {
      nstate.campaign.username = comp.state.user.username;
      nstate.anonymousEditing = false;
    } else {
      nstate.anonymousEditing = true;
    }
    comp.setState(nstate);
  };

  this.deleteCampaign = ()=>{
  	if (confirm('Click OK if you really want to delete this campaign. Otherwise, click "Cancel". Thanks.')) {
  		clientlib.deleteCampaign(comp.state.user.username, 
  			                     comp.state.user.password, 
  			                     comp.state.campaign.campaignId)
  		.then(()=>{
  			comp.setState({campaign:null});
  			this.updateCampaignList();
  		})
  		.catch((err)=>{
  			alert(JSON.stringify(err));
  		});
  	}
  };

  this.cloneCampaign = ()=>{
  	let camp = comp.state.campaign;
  	camp.username = comp.state.user.username;
  	camp.campaignId ='campId'+Math.random();
  	camp.title = 'CLONE OF ' + camp.title;
  	comp.setState({editMode: true, campaign: camp});
  };

  this.simpleFieldChanged = (e)=>{
    let fieldName = e.target.name;
    let fieldValue = e.target.value;
    let campy = comp.state.campaign;
    campy[fieldName] = fieldValue;
    let mergeMe = {};
    mergeMe.campaign = campy;
    comp.setState(mergeMe);
  };

  this.arrayFieldChanged = (e)=>{
    let fieldName = e.target.name;
    let fieldValue = e.target.value;
    let fieldIndex = e.target.dataset.rpgwbIndex;
    console.log('CHNGED name:'+fieldName+' value:'+fieldValue+' index:'+fieldIndex);
    let campy = comp.state.campaign;
    let arr = campy[fieldName].slice();
    arr[fieldIndex] = fieldValue;
    let mergeMe = {};
    mergeMe.campaign = campy;
    mergeMe.campaign[fieldName] = arr;
    comp.setState(mergeMe);
  };

  this.arrayFieldAdd = (e)=>{
    //Add a new last element to edit with a text input
    //and record that we are editing that fieldname.
    let fieldName = e.target.name;
    let campy = comp.state.campaign;

    //Add an empty element to the new editingField
    if (!campy[fieldName]) campy[fieldName] = [];
    campy[fieldName].push('');
    let mergeMe = {};
    mergeMe.campaign = campy;
    mergeMe.editingField = fieldName;
    comp.setState(mergeMe);
  };

  //This isn't called directly with an event.
  //Instead we create event handling functions that know name and index.
  this.arrayFieldDelete = (fieldName, index)=>{
    let campy = comp.state.campaign;
    //Add an empty element to the new editingField
    campy[fieldName].splice(index, 1);
    let mergeMe = {};
    mergeMe.campaign = campy;
    comp.setState(mergeMe);
  };
  
}

//-------------------Components-------------------------
class App extends Component {
  constructor() {
    super();
    this.state = model_0;
    this.controller = new Controller(this);
    this.controller.updateCampaignList();
  }
  render() {
    return (
    <div className="app">
      <div className="row">
        <div className="col-sm-9">
          <h1>Campaign Creator</h1>
        </div>
        <div className="col-sm-3">
          <Login model={this.state} controller={this.controller} />
        </div>
      </div>
      <div className="row">
        <div className="col-sm-3">
          <CampaignList model={this.state} controller={this.controller} />
        </div>
        <div className="col-sm-9">
          <Campaign model={this.state} controller={this.controller} />
        </div>
      </div>
    </div>
  )}
  componentDidMount() {
  	//Select a campaign if it was part of the URL that brought the user here.
  	this.selectCampaignFromCurrentUrl();
  	//TODO: MAKE THE BACK BUTTON SELECT PREVIOUS CAMPAIGNS
  	//window.addEventListener('popstate', (evnt)=>{
  		//Arrow function gets the component as "this".
        //this.selectCampaignFromCurrentUrl();
  	//});
  }
  //Select a campaign if it was part of the URL that brought the user here.
  selectCampaignFromCurrentUrl() {
  	let search = window.location.search;
  	if (search && (search.length > '?campaign='.length) && search.startsWith('?campaign=')) { 
  	  let campaignId = search.substring('?campaign='.length);
  	  this.controller.selectCampaign({campaignId:campaignId});
  	}
  }
}
//Add to App for debugging: <DevStatus model={this.state} />
function DevStatus(props) {
	let stt = props.model;
	return (<div>
	         user: {JSON.stringify(stt.user)}<br/>
	         campaignList.length: '{stt.campaignList.length}<br/>
	         campaign exists: {!!stt.campaign?'true':'false'}<br/>
             editingField: {stt.editingField}
             editMode: {stt.editMode}<br/>
             editingField: {stt.editingField}<br/>
             creatingAccount: {stt.creatingAccount}<br/>
             changingPassword: {stt.changingPassword}<br/>
             anonymousEditing: {stt.anonymousEditing.toString()}<br/>
           </div>);
}

class Login extends Component {
  constructor(props) {
    super(props);    this.state = {username:"", password:""};
    this.handleChange = (e)=>{
      let x = {};
      x[e.target.name] = e.target.value;
      this.setState(x);
    };
    this.login = (e)=>{
      e.preventDefault();
      this.props.controller.login(this.state.username, this.state.password);
    };
    this.logout = ()=>{
      this.setState({username:"", password:""});
      this.props.controller.logout();
    };
    this.createAccount = (e)=>{
      e.preventDefault();
      if (this.state.password == this.state.passwordconf) {
        this.props.controller.createAccount(this.state.username, this.state.password);
      } else {
      	alert("Password fields don't match. Please retype new passwords.");
      }
    };
    this.gotoCreateAccount = (e)=>{
      this.props.controller.gotoCreateAccount();
    };
    this.cancelCreateAccount = (e)=>{
      props.controller.cancelCreateAccount();
    };
    this.gotoChangePassword = (e)=>{
      this.setState({
      	password: null,
        newpassword: null,
        newpasswordconf: null
      });
      this.props.controller.gotoChangePassword();
    };
    this.cancelChangePassword = (e)=>{
      props.controller.cancelChangePassword();
    };
    this.changePassword = (e)=>{
      e.preventDefault();
      if (this.state.newpassword == this.state.newpasswordconf) {
        this.props.controller.changePassword(this.state.username, this.state.password, this.state.newpassword);
      } else {
      	alert("Password fields don't match. Please retype new passwords.");
      }
    };
    this.deleteUser = (e)=>{
      e.preventDefault();
      this.props.controller.deleteUser();
    };
  }
  
  render() { 
    if (!this.props.model.user.isLoggedIn) {
      if (!this.props.model.creatingAccount) {
        return (
          <div className="Login">
            <form onSubmit={this.login} >
              <input name="username" placeholder="username" onChange={this.handleChange} value={this.state.username} />
              <br/>
              <input type="password" name="password" placeholder="password" onChange={this.handleChange} value={this.state.password} />
              <br/>
              <button type="submit">Login</button>
              <button type="button" onClick={this.gotoCreateAccount}>Create Account</button>
            </form>
          </div>
        );
      } else {
        //creating an account
        return (
          <div className="Login">
            <form onSubmit={this.createAccount} >
              <input name="username" placeholder="Choose a username" onChange={this.handleChange} value={this.state.username} />
              <br/>
              <input type="password" name="password" placeholder="Choose a password" onChange={this.handleChange} value={this.state.password} />
              <br/>
              <input type="password" name="passwordconf" placeholder="Confirm password" onChange={this.handleChange} value={this.state.passwordconf} />
              <br/>
              <button type="submit">Create</button>
              <button type="button" onClick={this.cancelCreateAccount}>Cancel</button>
            </form>
          </div>
        );
      }
    } else { //is logged in
      if (this.props.model.changingPassword) {
        return (
          <div className="Login">
          Change password:
            <form onSubmit={this.changePassword} >
              <input type="password" name="password" placeholder="Current password" onChange={this.handleChange} value={this.state.password} />
              <br/>
              <input type="password" name="newpassword" placeholder="New password" onChange={this.handleChange} value={this.state.newpassword} />
              <br/>
              <input type="password" name="newpasswordconf" placeholder="Confirm new password" onChange={this.handleChange} value={this.state.newpasswordconf} />
              <br/>
              <button type="submit">Change Password</button>
              <button type="button" onClick={this.cancelChangePassword}>Cancel</button>
            </form>
          </div>
        );
      } else {
        return (
          <div className="login">
          logged in
            <div className="logged-in-username">{this.props.model.user.username}</div>
            <button onClick={this.logout}>Logout</button>
            <button type="button" onClick={this.gotoChangePassword}>Change Password</button>
            <button onClick={this.deleteUser}>Delete my account</button>
          </div>
        );
      }
    }
  }
}

function CampaignList(props) {
  let model = props.model;
  let controller = props.controller;
  //Work with a copy of the array of {username:...,campaigns:[campMeta,...]}
  let campList = model.campaignList.slice();

  //If logged in, put logged in user's object at the start of the array
  if (model.user.isLoggedIn) {
    let myCamps = {username:model.user.username, campaigns:[]};
    for (let i = 0; i < campList.length; i++) {
      if (campList[i].username == model.user.username) {
        myCamps = campList[i];
        campList.splice(i, 1);
      }
    }
    campList.unshift(myCamps);
  }
	return (
	  <div>
	    <h2>Campaigns</h2>
	    {campList.map((campUser)=>{
	     return <CampaignListUserComponent key={campUser.username} campUser={campUser} controller={controller} />;
	    })}
	  </div>
	);
}

function CampaignListUserComponent(props) {
  let campUser = props.campUser;
  let controller = props.controller;
  return (
    <div className="campUser">
      <h3>{campUser.username}</h3>
      <ul>
      {campUser.campaigns.map((campMeta)=>{
        return <li className="campaignlistitem" onClick={()=>{controller.selectCampaign(campMeta)}} key={campMeta.campaignId}>{campMeta.title}</li>;
      })}
      </ul>
    </div>
  );
}

//The large campaign display/editing section on the right side of the screen
function Campaign(props) {
  let model = props.model;
  let controller = props.controller;
  if (model.campaign) {
    if (model.editMode && isMyCampaign(model)) {
      return <div id="campaign">
        <CampaignControls model={model} controller={controller} />
        <CampaignEditor model={model} controller={controller} />
      </div>
    } else {
      return <div id="campaign">
        <CampaignControls model={model} controller={controller} />
        <CampaignViewer model={model} controller={controller} />
      </div>
    }
  } else {
    return <div id="campaign">
      <CampaignControls model={model} controller={controller} />
        <br/><br/><i>Select a campaign</i>
      </div>
  }
}

function CampaignControls(props) {
  let model = props.model;
  let controller = props.controller;
  return <div id="campaignViewerControls">
    <button type="button"
            disabled={!isMyCampaign(model) || model.editMode} 
            onClick={controller.editCampaign}>Edit</button>
    <button type="button" 
            disabled={!isMyCampaign(model)} 
            onClick={controller.saveCampaign}>Save</button>
    <button type="button" 
            disabled={!(model.user.isLoggedIn && model.campaign)} 
            onClick={controller.cloneCampaign}>Clone</button>
    <button type="button"  
            onClick={controller.newCampaign}>New</button>
    <button type="button" 
            disabled={!isMyCampaign(model)} 
            onClick={controller.deleteCampaign}>Delete</button>
            &nbsp;&nbsp;
    {!!model.campaign && (<a target="_blank" href={'api/v01/campaignpage/'+model.campaign.campaignId}>printable view</a>)}
  </div>
}

function isMyCampaign(model) {
  /* return ('user' in model) && ('isLoggedIn' in model.user) && ('username' in model.user) &&
         ('campaign' in model) && ('username' in model.campaign) &&
         (model.campaign.username === model.user.username); */
     return ('user' in model) && ('isLoggedIn' in model.user) && ('username' in model.user) &&
         ('campaign' in model) && model.campaign && ('username' in model.campaign) &&
         (model.campaign.username === model.user.username) ||
         ('campaign' in model) && ('anonymousEditing' in model) && model.campaign && model.anonymousEditing;
}

function CampaignViewer(props) {
  let model = props.model;
  let controller = props.controller;
  if (model.campaign) {
    let fieldDefs = def.fields.slice();//We will remove the first element. So use a copy.
    fieldDefs.shift();//Remove title
    return (
    <div id="campaign">
      <h2 className="campaignviewtitle">{model.campaign.title}</h2>
      {fieldDefs.map((fieldDef)=>{
        return <StaticField key={fieldDef.name}
                   fieldDef={fieldDef} 
                   fieldData={model.campaign[fieldDef.name]} 
                   controller={controller} />;
      })}
    </div>
    )
  } else {
     return <div id="campaign">None selected</div>
  }
}

function StaticField(props) {
  let fieldDef = props.fieldDef;
  let fieldData = props.fieldData;
  let controller = props.controller;
  if (fieldDef.isarrayfield) {
    return <ArrayStaticField fieldDef={fieldDef} fieldData={fieldData} controller={controller} />;
  } else {
    return <SimpleStaticField fieldDef={fieldDef} fieldData={fieldData} controller={controller} />;
  }
}

function SimpleStaticField(props) {
  let fieldDef = props.fieldDef;
  let fieldData = props.fieldData;
  let controller = props.controller;
  return (
    <div className="staticfield"><h3>{fieldDef.label}</h3>
      <div className="static-campaign-field-value">{fieldData}</div>
    </div>
  );
}

function ArrayStaticField(props) {
  let fieldDef = props.fieldDef;
  let fieldData = props.fieldData || [];
  let controller = props.controller;
  return <div className="staticfield">
    <h3>{fieldDef.label}</h3>
    <ul>
    {fieldData.map((arrayElement)=>{
      return <li className="static-campaign-arrayfield-item" key={arrayElement}>{arrayElement}</li>
    })}
    </ul>
  </div>;
}

//---------------campaign-editing-----------------------

function CampaignEditor(props) {
  let model = props.model;
  let controller = props.controller;
  if (model.campaign) {
    let fieldDefs = def.fields;
    return (
    <div id="campaign">
      {fieldDefs.map((fieldDef)=>{
        return <EditableField key={fieldDef.name}
                   fieldDef={fieldDef} 
                   fieldData={model.campaign[fieldDef.name]} 
                   model={model}
                   controller={controller} />;
      })}
    </div>
    )
  } else {
     return <div id="campaign">None selected for editing</div>
  }
}


function EditableField(props) {
  let fieldDef = props.fieldDef;
  let fieldData = props.fieldData;
  let model = props.model;
  let controller = props.controller;
  if (fieldDef.isarrayfield) {
    return <ArrayEditableField fieldDef={fieldDef} fieldData={fieldData} model={model} controller={controller} />;
  } else {
    return <SimpleEditableField fieldDef={fieldDef} fieldData={fieldData} model={model} controller={controller} />;
  }
}

function SimpleEditableField(props) {
  let fieldDef = props.fieldDef;
  let fieldData = props.fieldData;
  let model = props.model;
  let controller = props.controller;
  if (fieldDef.longtext) {
    return <SimpleEditableTextareaField fieldDef={fieldDef} fieldData={fieldData} model={model} controller={controller} />;
  } else {
    return <SimpleEditableTextinputField fieldDef={fieldDef} fieldData={fieldData} model={model} controller={controller} />;
  }
}

function SimpleEditableTextareaField(props) {
    let fieldDef = props.fieldDef;
    let fieldData = props.fieldData || '';
    let model = props.model;
    let controller = props.controller;
    return <div className="simpleEditableField editablefield">
        <h3>{fieldDef.label}</h3>
        <div className="fieldInstructions">{fieldDef.instructions}</div>
        <textarea name={fieldDef.name} onChange={controller.simpleFieldChanged} rows="5" cols="50">
          {fieldData}
         </textarea>
    </div>
}

function SimpleEditableTextinputField(props) {
    let fieldDef = props.fieldDef;
    let fieldData = props.fieldData || '';
    let model = props.model;
    let controller = props.controller;
    return <div className="simpleEditableField editablefield">
        <h3>{fieldDef.label}</h3>
        <div className="fieldInstructions">{fieldDef.instructions}</div>
        <input type="text" name={fieldDef.name} value={fieldData}
          onChange={controller.simpleFieldChanged}  />
    </div>
}

function ArrayEditableField(props) {
  let fieldDef = props.fieldDef;
  let fieldData = props.fieldData || [];
  let model = props.model;
  let controller = props.controller;
  return (<div className="editablefield">
    <h3>{fieldDef.label}</h3>
    <div className="fieldInstructions">{fieldDef.instructions}</div>
    <div className="hints">
      {fieldDef.hints.map((hint)=>{
        return <CollapsingHint label={hint.label} description={hint.description} />
      })}
    </div>
    <ul>
      {fieldData.map((arrayElement,index)=>{
        return (
    	  <li key={fieldDef.name+index}>
    	    <input type="text" 
    	           className="campaign-arrayfield-item" 
    	           data-rpgwb-index={index}
                   name={fieldDef.name} 
                   value={arrayElement} 
                   onChange={controller.arrayFieldChanged}
    	    />
    	    <button data-rpgwb-index={index} className="campaign-arrayfield-item-delete" onClick={()=>{controller.arrayFieldDelete(fieldDef.name,index);}}>X</button>
    	  </li>
        )
      })}
      <li key="button">
        <button className="campaign-arrayfield-addbutton" type="button" name={fieldDef.name} onClick={controller.arrayFieldAdd}>+</button>
      </li>
    </ul>
  </div>);
}

//takes props: label, description
class CollapsingHint extends Component {
  constructor(props) {
    super(props);
    this.state = {isOpen:false};
    this.toggleOpen = (e)=>{
      this.setState({isOpen: !this.state.isOpen});
    };
  }
  render() { 
    if (this.state.isOpen) {
      return (
        <div className="hint">
          <h4 className="hintlabel hintlink" onClick={this.toggleOpen}>{this.props.label} (-)</h4>
          <div className="hintdescription">{this.props.description}</div>
        </div>
       );
     } else {
       return (
         <div className="hint">
           <h4 className="hintlabel" onClick={this.toggleOpen}>{this.props.label} (+)</h4>
         </div>
       );
     }
  }
}


export default App;
