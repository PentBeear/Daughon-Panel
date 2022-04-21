// Gets the request
itemState = this.event.toString();
itemState = itemState.substr(itemState.indexOf("{"),itemState.length());
var jsonObject=JSON.parse(itemState);    

// Gets the submenu list
var submenuList = items.getItem('BedroomNSPanel_SubmenuList').state.toString()
var submenuJson = ""
if (submenuList.includes("{")){
  submenuJson = JSON.parse(submenuList.toString());
}

// Maybe make this into a commonjs library?

var HSBType = Java.type('org.openhab.core.library.types.HSBType');

// Page List
var pageJSON = `{ 
	"pages": [{ 
        "default":"home", 
		"btns": [{ 
			"depths": ["home", "home", "home"] 
		}, { 
			"depths": ["home", "home", "home"] 
		}] 
	}, { 
		"default":"{-action-:-page-,-data-:{-type-:-0-,-name-:-Bedroom-,-info-:[-btn=0,type=5,name=Fan,icon=,state=\${convertState(items.getItem('BedroomFan_Power').state.toString())}-,-btn=1,type=5,name=Closet,icon=,state=\${convertState(items.getItem('BedroomClosetLight_Power').state.toString())}-,-btn=2,type=1,name=Light,icon=,state=\${convertState(items.getItem('BedroomLightOne_Power').state.toString())}-,-btn=3,type=7,name=Scenes,icon=,state=0-,-btn=4,type=4,name=hidden,icon=2-,-btn=5,type=2,name=hidden,icon=0,state=0-]}}", 
		"btns": [{ 
			"depths": ["page1btn0depth0", "page1btn0depth1", "page1btn0depth2"] 
		}, { 
			"depths": ["page1btn1depth0", "page1btn1depth1", "page1btn1depth2"] 
		}, { 
			"depths": ["page1btn2depth0", "page1btn2depth1", "page1btn2depth2"] 
		}, { 
			"depths": ["{-action-:-page-,-data-:{-type-:-0-,-name-:-Bedroom-,-info-:[-btn=0,type=6,name=Blue,icon=,state=0-,-btn=1,type=6,name=Off,icon=,state=-,-btn=2,type=7,name=hidden,icon=,state=0-,-btn=3,type=7,name=hidden,icon=,state=0-,-btn=4,type=4,name=hidden,icon=2-,-btn=5,type=2,name=hidden,icon=0,state=0-]}}", "e", "e"] 
		}] 
	}, { 
		"default":"", 
		"btns": [{ 
			"depths": ["page2btn0depth-1", "page2btn0depth0", "page2btn0depth1"] 
		}, { 
			"depths": ["page2btn1depth-1", "page2btn1depth0", "page2btn1depth1"] 
		}] 
	}, { 
		"default":"", 
		"btns": [{ 
			"depths": ["page0btn0depth-1", "page0btn0depth0", "page0btn0depth1"] 
		}, { 
			"depths": ["page0btn1depth-1", "page0btn1depth0", "page0btn1depth1"] 
		}] 
	}] 
} 
`

var pageJSONParsed = JSON.parse(pageJSON);

// General Helper Section

// Converts on and off to 0 and 1
function convertState(state){
  if (state.toLowerCase()=="on"){
    return "1";
  } else {
    return "0";
  }
}

// End General Helper Section

// Page Function Section

// Resets the nesting helper
function nestReset(){
  items.getItem('BedroomNSPanel_SubmenuList').sendCommand("");
}

// Adds a depth to the nesting helper
function nestAddition(){
  if (!(submenuList.includes("{"))){ // If submenulist does not contain a { begin the json
      submenuJson = JSON.parse("{}");
      submenuJson["0"] = JSON.stringify(jsonObject)
      items.getItem('BedroomNSPanel_SubmenuList').sendCommand(JSON.stringify(submenuJson));
    } else {
      submenuJson[(jsonObject["data"]["depth"]).toString()] = JSON.stringify(jsonObject)
      items.getItem('BedroomNSPanel_SubmenuList').sendCommand(JSON.stringify(submenuJson));
   }
}

// Subtracts a depth to the nesting helper
function nestSubtraction(){
  if (!(submenuList.includes("{"))){ // If submenulist does not contain a { begin the json
      nestReset() // If we subtract and theres no json just reset it
    } else { // If we subtract and there is json we can *pop* the top element otherwise known as depth + 1
      delete submenuJson[(parseInt(jsonObject["data"]["depth"]) + 1)]
      items.getItem('BedroomNSPanel_SubmenuList').sendCommand(JSON.stringify(submenuJson));
   }
}

// Sends a page stored from pageJSON 
function sendPage(pageNum,btn,depth,force){
  console.log("Sending Page based on: " + "page:" + pageNum + " btn:" + btn + " depth:" + depth + " force:" + force)
  if(force==true)
  {
    if(depth<0){ // Make this do the force_disp instead of page action
      actions.get("mqtt", "mqtt:broker:x").publishMQTT("cmnd/tasmota_bedroom_nspanel/nextion", eval("`" + pageJSONParsed["pages"][pageNum]["default"].replaceAll("-","\"") + "`").replace('"action":"page"','"action":"force_disp"') ,false); 
    } else {
      // Selects page, btn number, and depth
      actions.get("mqtt", "mqtt:broker:x").publishMQTT("cmnd/tasmota_bedroom_nspanel/nextion", eval("`" + pageJSONParsed["pages"][pageNum]["btns"][btn]["depths"][depth].replaceAll("-","\"") + "`") ,false);  
    }  
  } else {
    if(depth<0){ // If depth is less than 0 we know we are wanting the default page else we know to grab a specific nest
      actions.get("mqtt", "mqtt:broker:x").publishMQTT("cmnd/tasmota_bedroom_nspanel/nextion", eval("`" + pageJSONParsed["pages"][pageNum]["default"].replaceAll("-","\"") + "`").replace('"action":"page"','"action":"force_disp"') ,false); 
    } else {
      // Selects page, btn number, and depth
      actions.get("mqtt", "mqtt:broker:x").publishMQTT("cmnd/tasmota_bedroom_nspanel/nextion", eval("`" + pageJSONParsed["pages"][pageNum]["btns"][btn]["depths"][depth].replaceAll("-","\"") + "`") ,false);  
    }
  }
}

// Reads the page requests and chooses which page to send
function pageHandler(){
  var nest = false;
  var back = false
  console.log("Request: " + JSON.stringify(jsonObject));
  if(jsonObject["request"] == "page"){ // Regular page request
    console.log("Requested regular page")
    nestReset();
    nest=false;
  } else if(jsonObject["update"] == "btn" && jsonObject["data"]["action"] == "nesting" && jsonObject["data"]["btn"] == "server" && parseInt(jsonObject["data"]["depth"]) > -1){ // Nesting back request
    console.log("Requested nest back")
    nestSubtraction();
    nest=true;
    back=true;
  } else if (jsonObject["update"] == "btn" && jsonObject["data"]["action"] == "nesting" && jsonObject["data"]["btn"] != "server" && parseInt(jsonObject["data"]["depth"]) > -1){  // Nesting up request
    console.log("Requested nest up")
    nestAddition();
    nest=true;
  }
  if(nest==true){ // If nesting use depth
    if(back==true){ // If going back use the submenuJSON to replay stored nests
      console.log("Previous Nest: " + submenuJson[jsonObject["data"]["depth"]].replaceAll("\\",""))
      var previousSubmenu = JSON.parse(submenuJson[jsonObject["data"]["depth"]].replaceAll("\\","")); 
      sendPage(parseInt(previousSubmenu["data"]["page"]),parseInt(previousSubmenu["data"]["btn"]),parseInt(previousSubmenu["data"]["depth"]),false);
    } else { // Just use depth to specify what nest to use in sendPage
      sendPage(parseInt(jsonObject["data"]["page"]),parseInt(jsonObject["data"]["btn"]),parseInt(jsonObject["data"]["depth"]),false);
    }
  } else { // Just send a regular page
    sendPage(parseInt(jsonObject["data"]["page"]),-1,-1,false);
  }
}

// End Page Function Section

// {"update":"btn","data":{"btn":"0","action":"nesting","page":"1","depth":"0"}}
// Handles page requests (Note how its else if still so the script doesn't have to search for every possibility)
// Checks for "request": instead of just request to make sure that the json actually contais the key.
// {"request":"page","data":{"page":"1"}}

// Status Handlers
/*
This section reads indicators from the panel to set the required information in the variables
Ex. Home page=0 submenu=-1 depth=-1
A value of -1 means disabled
Submenu stores the button used to enter the submenu
Page stores the current page
Depth stores the current depth
All of these allow for full customization of the panel in every screen and also lets you update the panel on a specific screen using the
refresh command.
*/
if(jsonObject["indicator"] == "home"){
  items.getItem('BedroomNSPanel_Submenu').sendCommand("-1");
  items.getItem('BedroomNSPanel_Page').sendCommand("0"); // Home Page
  items.getItem('BedroomNSPanel_Depth').sendCommand("-1"); // -1 when disabled (No Nesting)
} else if (jsonObject["indicator"] == "sleep"){
  items.getItem('BedroomNSPanel_Submenu').sendCommand("-1"); // -1 when disabled (No Submenu)
  items.getItem('BedroomNSPanel_Page').sendCommand("-1"); // -1 when disabled (Sleep)
  items.getItem('BedroomNSPanel_Depth').sendCommand("-1"); // -1 when disabled (No Nesting)
} else if (jsonObject["indicator"] == "page_success"){
  items.getItem('BedroomNSPanel_Submenu').sendCommand("-1"); // -1 when disabled (No Submenu)
  items.getItem('BedroomNSPanel_Page').sendCommand(jsonObject["data"]["page"]); // Always Page
  items.getItem('BedroomNSPanel_Depth').sendCommand(jsonObject["data"]["depth"]); // Always Depth
} else if (jsonObject["indicator"] == "submenu"){
  items.getItem('BedroomNSPanel_Submenu').sendCommand(jsonObject["data"]["btn"]); // Submenu is -1 when disabled or btn when enabled
  items.getItem('BedroomNSPanel_Page').sendCommand(jsonObject["data"]["page"]); // Always Page
  items.getItem('BedroomNSPanel_Depth').sendCommand(jsonObject["data"]["depth"]); // Always Depth
} else if (jsonObject["indicator"] == "exit_submenu"){
  items.getItem('BedroomNSPanel_Submenu').sendCommand("-1"); // -1 when disabled (No Submenu)
// End State Handlers
// I/O Handlers
} else if (jsonObject["request"] == "page" || jsonObject["update"] == "btn" && jsonObject["data"]["action"] == "nesting"){ // Sends pages on request and nesting
  pageHandler(); // Page handler reads jsonObject and submenuJson on its own. Might convert this to a library that takes an argument
} else if (jsonObject["update"] == "message"){ // Handles item updates
  
  // Checks for a message update before a page one (Messages can have user input that says page, but pages cannot send the word message)
  // Handles message requests using a telegram bot (Gets the message from the panel and then routes it based on the receiver)
  switch (jsonObject["receiver"]){
    case "x": 
      actions.get("telegram", "telegram:telegramBot:x").sendTelegram(x,`Message from ${jsonObject["sender"]}:\n${jsonObject["message"]}`)
      break;
    case "x":


      break;
    case "x": 

      break;
    default:
  } 
} else if(jsonObject["update"] == "btn"){ // Handles user input from a page TODO: add callback system for this
    switch (jsonObject["data"]["page"]){
      case "1": // Page one page  
        if(jsonObject["data"]["depth"] == "-1"){
          if(jsonObject["data"]["btn"] == "0"){ // Button Zero
            if(jsonObject["data"]["action"] == "toggle"){ // Toggle Update
              if(items.getItem('BedroomFan_Power').state.toString() == "ON"){
              items.getItem('BedroomFan_Power').sendCommand("OFF");
              } else {
                items.getItem('BedroomFan_Power').sendCommand("ON"); 
              }   
            } 
            // End Button Zero
          } else if(jsonObject["data"]["btn"] == "1"){ // Button One
            if(jsonObject["data"]["action"] == "toggle"){  // Toggle Update
              if(items.getItem('BedroomClosetLight_Power').state.toString() == "ON"){
              items.getItem('BedroomClosetLight_Power').sendCommand("OFF");
              } else {
                items.getItem('BedroomClosetLight_Power').sendCommand("ON"); 
              }   
            }
            // End Button One
          } else if(jsonObject["data"]["btn"] == "2"){ // Button Two
              if(jsonObject["data"]["action"] == "toggle"){ // Toggle Update
                if(items.getItem('BedroomLightOne_Power').state.toString() == "ON"){
                  items.getItem('BedroomLightOne_Power').sendCommand("OFF");
                  items.getItem('BedroomLightThree_Power').sendCommand("OFF");
                  items.getItem('BedroomLightTwo_Power').sendCommand("OFF");
                } else {
                  items.getItem('BedroomLightOne_Power').sendCommand("ON");
                  items.getItem('BedroomLightThree_Power').sendCommand("ON");
                  items.getItem('BedroomLightTwo_Power').sendCommand("ON");
                }   
              } else if (jsonObject["data"]["action"] == "color"){
                  var HSBType = Java.type('org.openhab.core.library.types.HSBType');
                  var r,g,b;
                  r = Math.round(parseInt(jsonObject["data"]["r"]));
                  g = Math.round(parseInt(jsonObject["data"]["g"]));
                  b = Math.round(parseInt(jsonObject["data"]["b"]));
                  //console.log(r + "," + g + "," + b);
                  var storedHSB = HSBType.fromRGB(r,g,b);
                  //console.log(storedHSB)
                  items.getItem('BedroomLightOne_Color').sendCommand(storedHSB.toString());
                  items.getItem('BedroomLightThree_Color').sendCommand(storedHSB.toString());
                  items.getItem('BedroomLightTwo_Color').sendCommand(storedHSB.toString());
                  items.getItem('BedroomLightOne_Power').sendCommand("ON");
                  items.getItem('BedroomLightThree_Power').sendCommand("ON");
                  items.getItem('BedroomLightTwo_Power').sendCommand("ON");
              } else if (jsonObject["data"]["action"] == "white"){
                  var HSBType = Java.type('org.openhab.core.library.types.HSBType');
                  items.getItem('BedroomLightOne_White').sendCommand(jsonObject["data"]["w"]);
                  items.getItem('BedroomLightThree_White').sendCommand(jsonObject["data"]["w"]);
                  items.getItem('BedroomLightTwo_White').sendCommand(jsonObject["data"]["w"]);
                  items.getItem('BedroomLightOne_Power').sendCommand("ON");
                  items.getItem('BedroomLightThree_Power').sendCommand("ON");
                  items.getItem('BedroomLightTwo_Power').sendCommand("ON");
              }
            // End Button Two
            }
        } else if (jsonObject["data"]["depth"] == "0"){
          console.log(jsonObject.toString());
        }
        
        break;

      case "2":


        break;
      case "3": 

        break;
      default:
    } 
  }
