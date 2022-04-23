wrapper(); // To let the garbage collector actually collect...

function wrapper(){
  const daughon = require("./daughon_helper") // Helper library
  // Gets the request
  itemState = this.event.toString();
  itemState = itemState.substr(itemState.indexOf("{"),itemState.length());
  var jsonObject=JSON.parse(itemState);    

  var HSBType = Java.type('org.openhab.core.library.types.HSBType');
  
  // User MODIFIABLE!
    
  // Create a new message handler with your openhab telegram thing
  var messages = new daughon.messageHandler.messageHandler("telegram:telegramBot:x")
  
  // Make a list of your people that can be messaged here with their telegram chat id.
  var people = [new daughon.messageHandler.Person("x",x)];
  
  // submenuItem, depthItem, pageItem, submenuArrayItem, mqttBroker, commandTopic
  // Create a page handler with your required items and mqtt broker
  var page = new daughon.pageHandler.pageHandler("BedroomNSPanel_Submenu","BedroomNSPanel_Depth","BedroomNSPanel_Page","BedroomNSPanel_SubmenuList","mqtt:broker:x","cmnd/tasmota_bedroom_nspanel/nextion")
  
  // Page List Modify to display what page you want, Don't change the home defaults (page 0)
  // type, name, page, btn, depth, info
  // Create your pages with your types names and etc
  var pages = [new daughon.pageHandler.page(0,"Bedroom",1,-1,-1,'"btn=0,type=5,name=Fan,icon=,state=\${this.#convertState(items.getItem("BedroomFan_Power").state.toString())}","btn=1,type=5,name=Closet,icon=,state=\${this.#convertState(items.getItem("BedroomClosetLight_Power").state.toString())}","btn=2,type=1,name=Light,icon=,state=\${this.#convertState(items.getItem("BedroomLightOne_Power").state.toString())}","btn=3,type=7,name=Scenes,icon=,state=0","btn=4,type=4,name=hidden,icon=2","btn=5,type=2,name=hidden,icon=0,state=0"'),
              new daughon.pageHandler.page(0,"Bedroom",1,3,0,'"btn=0,type=6,name=Blue,icon=,state=0","btn=1,type=6,name=Off,icon=,state=","btn=2,type=7,name=hidden,icon=,state=0","btn=3,type=7,name=hidden,icon=,state=0","btn=4,type=4,name=hidden,icon=2","btn=5,type=2,name=hidden,icon=0,state=0"'),
              ];
  
  // submenuItem, depthItem, pageItem
  // Create your indicator parser with your required items
  var indicator = new daughon.indicatorHandler.indicatorHandler("BedroomNSPanel_Submenu","BedroomNSPanel_Depth","BedroomNSPanel_Page");

  
  // Creates an actionHandler for every button on every page
  // btn, page, depth
  // Create your actions for every button press (Page and depth specific)
  
  // Actions are run as the script not as the library!
  // So you have to use jsonObject to get the data received from the command
  var definedActions = [new daughon.actionHandler.actionHandler("0","1","-1"), 
                        new daughon.actionHandler.actionHandler("1","1","-1"),
                        new daughon.actionHandler.actionHandler("2","1","-1"),
                        new daughon.actionHandler.actionHandler("0","1","0"),
                        new daughon.actionHandler.actionHandler("1","1","0"),
                        new daughon.actionHandler.actionHandler("5","1","-1")];

  // Set the actions for each button here
  definedActions[0].toggle = function(){ // Bedroom Fan
    if(items.getItem('BedroomFan_Power').state.toString() == "ON"){
      items.getItem('BedroomFan_Power').sendCommand("OFF");
      } else {
        items.getItem('BedroomFan_Power').sendCommand("ON"); 
     }   
  }
  

  definedActions[1].toggle = function(){ // Closet Light
    if(items.getItem('BedroomClosetLight_Power').state.toString() == "ON"){
      items.getItem('BedroomClosetLight_Power').sendCommand("OFF");
      } else {
        items.getItem('BedroomClosetLight_Power').sendCommand("ON"); 
     }   
  }
  
  definedActions[2].toggle = function(){ // RGBW Lights
    if(items.getItem('BedroomLightOne_Power').state.toString() == "ON"){
        items.getItem('BedroomLightOne_Power').sendCommand("OFF");
        items.getItem('BedroomLightThree_Power').sendCommand("OFF");
        items.getItem('BedroomLightTwo_Power').sendCommand("OFF");
      } else {
        items.getItem('BedroomLightOne_Power').sendCommand("ON");
        items.getItem('BedroomLightThree_Power').sendCommand("ON");
        items.getItem('BedroomLightTwo_Power').sendCommand("ON");
       }   
  }
  
  definedActions[2].color = function(){
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
  }
  
  definedActions[2].white = function(){
    items.getItem('BedroomLightOne_White').sendCommand(jsonObject["data"]["w"]);
    items.getItem('BedroomLightThree_White').sendCommand(jsonObject["data"]["w"]);
    items.getItem('BedroomLightTwo_White').sendCommand(jsonObject["data"]["w"]);
    items.getItem('BedroomLightOne_Power').sendCommand("ON");
    items.getItem('BedroomLightThree_Power').sendCommand("ON");
    items.getItem('BedroomLightTwo_Power').sendCommand("ON");
  }

  definedActions[3].run = function(){ // Static Blue
    items.getItem('BedroomLightOne_Color').sendCommand("250,100,100");
    items.getItem('BedroomLightTwo_Color').sendCommand("250,100,100");
    items.getItem('BedroomLightThree_Color').sendCommand("250,100,100");
    items.getItem('BedroomDeskStrip_Color').sendCommand("250,100,100");
  }

  definedActions[4].run = function(){ // Static All Off
    items.getItem('BedroomLightOne_Power').sendCommand("OFF");
    items.getItem('BedroomLightThree_Power').sendCommand("OFF");
    items.getItem('BedroomLightTwo_Power').sendCommand("OFF");
    items.getItem('BedroomClosetLight_Power').sendCommand("OFF");
    items.getItem('BedroomFan_Power').sendCommand("OFF");
    items.getItem('BedroomDeskStrip_Power').sendCommand("OFF");
  }



  // DONT MODIFY AFTER HERE!
  if(jsonObject["indicator"] != null){
    indicator.indicatorParser(jsonObject);
  }  else if (jsonObject["request"] == "page" || jsonObject["update"] == "btn" && jsonObject["data"]["action"] == "nesting"){ // Sends pages on request and nesting
    page.pageParser(jsonObject,pages);
  } else if (jsonObject["update"] == "message"){ // Handles item updates
    messages.sendMessage(jsonObject,people); //    
  } else if(jsonObject["update"] == "btn"){ // Handles user input from a page TODO: add callback system for this
    console.log("Item Update: " + JSON.stringify(jsonObject));

    definedActions.forEach(function(item) {
      if(item.getDepth() == jsonObject["data"]["depth"] && item.getPage() == jsonObject["data"]["page"] && item.getBtn() == jsonObject["data"]["btn"])
      {
        item.execute(jsonObject["data"]["action"]); // Runs action
      }
    });
  }
  
}
