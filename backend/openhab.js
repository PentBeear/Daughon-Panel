//{"fan":"toggle"} 
itemState = this.event.toString();
itemState = itemState.substr(itemState.indexOf("{"),itemState.length());
var jsonObject=JSON.parse(itemState);    
var HSBType = Java.type('org.openhab.core.library.types.HSBType');
// Converts on and off to 0 and 1
function convertState(state){
  if (state.toLowerCase()=="on"){
    return "1";
  } else {
    return "0";
  }
}

*/


// Handles page requests (Note how its else if still so the script doesn't have to search for every possibility)
// Checks for "request": instead of just request to make sure that the json actually contais the key.
if (jsonObject["request"] == "page"){ // Sends pages  
  switch (jsonObject["data"]["value"]){
    case "1": // Page one page  
      actions.get("mqtt", "mqtt:broker:x").publishMQTT("cmnd/somepanel/nextion", `{"action":"page","data":{"type":"0","name":"Bedroom","info":["btn=0,type=5,name=Fan,icon=,state=${convertState(items.getItem('BedroomFan_Power').state.toString())}","btn=1,type=5,name=Closet,icon=,state=${convertState(items.getItem('BedroomClosetLight_Power').state.toString())}","btn=2,type=1,name=Light,icon=,state=${convertState(items.getItem('BedroomLightOne_Power').state.toString())}","btn=3,type=1,name=hidden,icon=0,state=0","btn=4,type=4,name=hidden,icon=2","btn=5,type=2,name=hidden,icon=0,state=0"]}}`,false); 

    case "2":


      break;
    case "3": 

      break;
    default:
  }
} else if (jsonObject["update"] == "message"){ // Handles item updates
  
  // Checks for a message update before a page one (Messages can have user input that says page, but pages cannot send the word message)
  // Handles message requests using a telegram bot (Gets the message from the panel and then routes it based on the receiver)
  switch (jsonObject["receiver"]){
    case "x": 
     
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
        break;

      case "2":


        break;
      case "3": 

        break;
      default:
    } 
  }
