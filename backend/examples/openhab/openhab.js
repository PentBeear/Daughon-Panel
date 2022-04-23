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
  messages = new daughon.messageHandler.messageHandler("telegram:telegramBot:x")
  
  // Make a list of your people that can be messaged here with their telegram chat id.
  var people = [new daughon.messageHandler.Person("x",x)];
  
  // submenuItem, depthItem, pageItem, submenuArrayItem, mqttBroker, commandTopic
  // Create a page handler with your required items and mqtt broker
  var page = new daughon.pageHandler.pageHandler("BedroomNSPanel_Submenu","BedroomNSPanel_Depth","BedroomNSPanel_Page","BedroomNSPanel_SubmenuList","mqtt:broker:x","cmnd/tasmota_bedroom_nspanel/nextion")
  
  // Page List Modify to display what page you want, Don't change the home defaults (page 0)
  // type, name, page, btn, depth, info
  // Create your pages with your types names and etc
  var pages = [new daughon.pageHandler.page(0,"Bedroom",1,-1,-1,"{-action-:-page-,-data-:{-type-:-0-,-name-:-Bedroom-,-info-:[-btn=0,type=5,name=Fan,icon=,state=\${this.#convertState(items.getItem('BedroomFan_Power').state.toString())}-,-btn=1,type=5,name=Closet,icon=,state=\${this.#convertState(items.getItem('BedroomClosetLight_Power').state.toString())}-,-btn=2,type=1,name=Light,icon=,state=\${this.#convertState(items.getItem('BedroomLightOne_Power').state.toString())}-,-btn=3,type=7,name=Scenes,icon=,state=0-,-btn=4,type=4,name=hidden,icon=2-,-btn=5,type=2,name=hidden,icon=0,state=0-]}}"),
              new daughon.pageHandler.page(0,"Bedroom",1,3,0,"{-action-:-page-,-data-:{-type-:-0-,-name-:-Bedroom-,-info-:[-btn=0,type=6,name=Blue,icon=,state=0-,-btn=1,type=6,name=Off,icon=,state=-,-btn=2,type=7,name=hidden,icon=,state=0-,-btn=3,type=7,name=hidden,icon=,state=0-,-btn=4,type=4,name=hidden,icon=2-,-btn=5,type=2,name=hidden,icon=0,state=0-]}}"),
              ];
  
  // submenuItem, depthItem, pageItem
  // Create your indicator parser with your required items
  var indicator = new daughon.indicatorHandler.indicatorHandler("BedroomNSPanel_Submenu","BedroomNSPanel_Depth","BedroomNSPanel_Page");

  
  // Creates an actionHandler for every button on every page
  // btn, page, depth
  // Create your actions for every button press (Page and depth specific)
  var definedActions = [new daughon.actionHandler.actionHandler("0","1","-1"), 
                        new daughon.actionHandler.actionHandler("1","1","-1"),
                        new daughon.actionHandler.actionHandler("2","1","-1"),
                        new daughon.actionHandler.actionHandler("3","1","-1"),
                        new daughon.actionHandler.actionHandler("4","1","-1"),
                        new daughon.actionHandler.actionHandler("5","1","-1")];

  // Set the actions for each button here
  definedActions[0].toggle = function(){
    if(items.getItem('BedroomFan_Power').state.toString() == "ON"){
      items.getItem('BedroomFan_Power').sendCommand("OFF");
      } else {
        items.getItem('BedroomFan_Power').sendCommand("ON"); 
     }   
  }
  

   definedActions[1].toggle = function(){
    if(items.getItem('BedroomClosetLight_Power').state.toString() == "ON"){
      items.getItem('BedroomClosetLight_Power').sendCommand("OFF");
      } else {
        items.getItem('BedroomClosetLight_Power').sendCommand("ON"); 
     }   
  }

  definedActions[2].color = function(){
      console.log("2")
  }

  definedActions[3].color = function(){
      console.log("3")
  }

  definedActions[4].color = function(){
      console.log("4")
  }

  definedActions[5].color = function(){
      console.log("5")
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
