//{"fan":"toggle"} 
itemState = this.event.toString();
itemState = itemState.substr(itemState.indexOf("{"),itemState.length());
var jsonObject=JSON.parse(itemState);    
var HSBType = Java.type('org.openhab.core.library.types.HSBType');
// The item that stores the last submenu accesses
var submenuList = items.getItem('BedroomNSPanel_SubmenuList').state.toString()
var submenuJson = ""
if (submenuList.includes("{")){
  submenuJson = JSON.parse(submenuList.toString());
}

// Converts on and off to 0 and 1
function convertState(state){
  if (state.toLowerCase()=="on"){
    return "1";
  } else {
    return "0";
  }
}

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
			"depths": ["page0btn0depth-1", "page0btn0depth0", "{-action-:-page-,-data-:{-type-:-0-,-name-:-gawd-,-info-:[-btn=0,type=7,name=Blue,icon=,state=0-,-btn=1,type=6,name=Off,icon=,state=-,-btn=7,type=1,name=e,icon=,state=0-,-btn=3,type=7,name=hidden,icon=,state=0-,-btn=4,type=4,name=hidden,icon=2-,-btn=5,type=2,name=hidden,icon=0,state=0-]}}"] 
		}, { 
			"depths": ["page0btn1depth-1", "page0btn1depth0", "page0btn1depth1"] 
		}, { 
			"depths": ["e", "{-action-:-page-,-data-:{-type-:-0-,-name-:-cheese-,-info-:[-btn=0,type=7,name=nest,icon=,state=0-,-btn=1,type=6,name=Off,icon=,state=-,-btn=7,type=1,name=e,icon=,state=0-,-btn=3,type=7,name=hidden,icon=,state=0-,-btn=4,type=4,name=hidden,icon=2-,-btn=5,type=2,name=hidden,icon=0,state=0-]}}", "e"] 
		}, { 
			"depths": ["{-action-:-page-,-data-:{-type-:-0-,-name-:-Bedroom-,-info-:[-btn=0,type=6,name=Blue,icon=,state=0-,-btn=1,type=6,name=Off,icon=,state=-,-btn=2,type=7,name=e,icon=,state=0-,-btn=3,type=7,name=hidden,icon=,state=0-,-btn=4,type=4,name=hidden,icon=2-,-btn=5,type=2,name=hidden,icon=0,state=0-]}}", "e", "e"] 
		}] 
	}, { 
		"default":"", 
		"btns": [{ 
			"depths": ["page0btn0depth-1", "page0btn0depth0", "page0btn0depth1"] 
		}, { 
			"depths": ["page0btn1depth-1", "page0btn1depth0", "page0btn1depth1"] 
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

function nestReset(){
  items.getItem('BedroomNSPanel_SubmenuList').sendCommand("");
}

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

function nestSubtraction(){
  if (!(submenuList.includes("{"))){ // If submenulist does not contain a { begin the json
      nestReset() // If we subtract and theres no json just reset it
    } else { // If we subtract and there is json we can *pop* the top element otherwise known as depth + 1
      delete submenuJson[(parseInt(jsonObject["data"]["depth"]) + 1)]
      items.getItem('BedroomNSPanel_SubmenuList').sendCommand(JSON.stringify(submenuJson));
   }
}

function sendPage(pageNum,btn,depth,force){
  console.log("Sending Page based on: " + "page:" + pageNum + " btn:" + btn + " depth:" + depth + " force:" + force)
  if(depth<0){
    actions.get("mqtt", "mqtt:broker:x").publishMQTT("cmnd/tasmota_bedroom_nspanel/nextion", eval("`" + pageJSONParsed["pages"][pageNum]["default"].replaceAll("-","\"") + "`") ,false); 
  } else {
    // Selects page, btn number, and depth
    actions.get("mqtt", "mqtt:broker:x").publishMQTT("cmnd/tasmota_bedroom_nspanel/nextion", eval("`" + pageJSONParsed["pages"][pageNum]["btns"][btn]["depths"][depth].replaceAll("-","\"") + "`") ,false);  
  }
}

function pageHandler(){
  var nest = false;
  var back = false
  console.log("Request: " + JSON.stringify(jsonObject));
  if(jsonObject["request"] == "page"){ // On regular page so reset nesting
    console.log("Requested regular page")
    nestReset();
    nest=false;
  } else if(jsonObject["update"] == "btn" && jsonObject["data"]["btn"] == "server"){ // Back btn is selected so we know to subtract 
    console.log("Requested nest back")
    nestSubtraction();
    nest=true;
    back=true;
  } else if (jsonObject["update"] == "btn" && parseInt(jsonObject["data"]["depth"]) > -1){  // Depth is greater than -1 so we know we are adding to the nest
    console.log("Requested nest up")
    nestAddition();
    nest=true;
  }
  // Nest portion we know we have depth here
  if(nest==true){
    if(back==true){
      // When we want to go back we go to the submenu json storage, select our depth, and then parse the result
      // Then we can 'replay' the page
      console.log("Previous Nest: " + submenuJson[jsonObject["data"]["depth"]].replaceAll("\\",""))
      var previousSubmenu = JSON.parse(submenuJson[jsonObject["data"]["depth"]].replaceAll("\\","")); 
      sendPage(parseInt(previousSubmenu["data"]["page"]),parseInt(previousSubmenu["data"]["btn"]),parseInt(previousSubmenu["data"]["depth"]),false);
    } else {
      sendPage(parseInt(jsonObject["data"]["page"]),parseInt(jsonObject["data"]["btn"]),parseInt(jsonObject["data"]["depth"]),false);
    }
    
  } else { // Regular page handling
    sendPage(parseInt(jsonObject["data"]["page"]),-1,-1,false);
  }
  
  
  
}

// This will all be split into functions later

// {"update":"btn","data":{"btn":"0","action":"nesting","page":"1","depth":"0"}}
// Handles page requests (Note how its else if still so the script doesn't have to search for every possibility)
// Checks for "request": instead of just request to make sure that the json actually contais the key.
// {"request":"page","data":{"page":"1"}}
if (jsonObject["request"] == "page" || jsonObject["update"] == "btn" && jsonObject["data"]["action"] == "nesting" ){ // Sends pages on request and nesting
  pageHandler();
} else if (jsonObject["update"] == "message"){ // Handles item updates
  
  // Checks for a message update before a page one (Messages can have user input that says page, but pages cannot send the word message)
  // Handles message requests using a telegram bot (Gets the message from the panel and then routes it based on the receiver)
  switch (jsonObject["receiver"]){
    case "x": 
      actions.get("telegram", "telegram:telegramBot:x").sendTelegram(`Message from ${jsonObject["sender"]}:\n${jsonObject["message"]}`)
      break;
    case "x":


      break;
    case "x": 

      break;
    default:
  } 
} else if(jsonObject["update"] == "btn"){ // Handles user input from a page
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
