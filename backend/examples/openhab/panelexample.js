wrapper(); // To let the garbage collector actually collect...

// Add refresh handler
function wrapper(){
  const daughon = require("./daughon_helper") // Helper library
  // Gets the request
  var jsonObject = JSON.parse(this.event.toString().substr(this.event.toString().indexOf("{"),this.event.toString().length()));
  
  // User MODIFIABLE!
    
  // Create a new message handler with your openhab telegram thing
  var messageHandler = new daughon.messages.messageHandler("telegram:telegramBot:x")
  
  // Make a list of your people that can be messaged here with their telegram chat id.
  var people = [new daughon.messages.Person("x",x)];
  
  // submenuItem, depthItem, pageItem, submenuArrayItem, mqttBroker, commandTopic
  // Create a page handler with your required items and mqtt broker
  var pageHandler = new daughon.pages.pageHandler("BedroomNSPanel_Submenu","BedroomNSPanel_Depth","BedroomNSPanel_Page","BedroomNSPanel_SubmenuList","mqtt:broker:x","cmnd/tasmota_bedroom_nspanel/nextion")
  
  // Page List Modify to display what page you want, Don't change the home defaults (page 0)
  // type, name, page, btn, depth, info
  // Create your pages with your types names and etc
  var pages = [new daughon.pages.page(0,"Bedroom",1,-1,-1,'"btn=0,type=5,name=Fan,icon=,state=\${this.#convertState(items.getItem("BedroomFan_Power").state.toString())}","btn=1,type=5,name=Closet,icon=,state=\${this.#convertState(items.getItem("BedroomClosetLight_Power").state.toString())}","btn=2,type=1,name=Light,icon=,state=\${this.#convertState(items.getItem("BedroomLightOne_Power").state.toString())}","btn=3,type=7,name=Scenes,icon=,state=0","btn=4,type=4,name=hidden,icon=2","btn=5,type=2,name=hidden,icon=0,state=0"'),
              new daughon.pages.page(0,"Bedroom",1,3,0,'"btn=0,type=6,name=Blue,icon=,state=0","btn=1,type=6,name=Off,icon=,state=","btn=2,type=7,name=hidden,icon=,state=0","btn=3,type=7,name=hidden,icon=,state=0","btn=4,type=4,name=hidden,icon=2","btn=5,type=2,name=hidden,icon=0,state=0"'),
              ];
  
  // submenuItem, depthItem, pageItem
  // Create your indicator parser with your required items
  var indicatorHandler = new daughon.indicators.indicatorHandler("BedroomNSPanel_Submenu","BedroomNSPanel_Depth","BedroomNSPanel_Page");

  // Creates an actionHandler for every button on every page
  // btn, page, depth
  // Create your actions for every button press (Page and depth specific)
  
  var buttonHandler = new daughon.buttons.buttonHandler();

  // Has to be in an array to be parsed
  var definedActions = [new daughon.buttons.button(0,1,-1), 
                        new daughon.buttons.button(1,1,-1),
                        new daughon.buttons.button(2,1,-1),
                        new daughon.buttons.button(0,1,0),
                        new daughon.buttons.button(1,1,0),
                        new daughon.buttons.button(5,1,-1)];

   // Update is the information from the panel, you can parse it to get things like color and other data
  definedActions[0].toggle = function(update){ // Bedroom Fan
    if(items.getItem('BedroomFan_Power').state.toString() == "ON"){
      items.getItem('BedroomFan_Power').sendCommand("OFF");
      } else {
        items.getItem('BedroomFan_Power').sendCommand("ON"); 
     }   
  }
  
  definedActions[1].toggle = function(update){ // Closet Light
    if(items.getItem('BedroomClosetLight_Power').state.toString() == "ON"){
      items.getItem('BedroomClosetLight_Power').sendCommand("OFF");
      } else {
        items.getItem('BedroomClosetLight_Power').sendCommand("ON"); 
     }   
  }
  
  definedActions[2].toggle = function(update){ // RGBW Lights
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
  
  definedActions[2].color = function(update){
    var HSBType = Java.type('org.openhab.core.library.types.HSBType');
    var r,g,b;
    r = Math.round(parseInt(update["data"]["r"]));
    g = Math.round(parseInt(update["data"]["g"]));
    b = Math.round(parseInt(update["data"]["b"]));
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
  
  definedActions[2].white = function(update){
    items.getItem('BedroomLightOne_White').sendCommand(update["data"]["w"]);
    items.getItem('BedroomLightThree_White').sendCommand(update["data"]["w"]);
    items.getItem('BedroomLightTwo_White').sendCommand(update["data"]["w"]);
    items.getItem('BedroomLightOne_Power').sendCommand("ON");
    items.getItem('BedroomLightThree_Power').sendCommand("ON");
    items.getItem('BedroomLightTwo_Power').sendCommand("ON");
  }

  definedActions[3].run = function(update){ // Static Blue
    items.getItem('BedroomLightOne_Color').sendCommand("250,100,100");
    items.getItem('BedroomLightTwo_Color').sendCommand("250,100,100");
    items.getItem('BedroomLightThree_Color').sendCommand("250,100,100");
    items.getItem('BedroomDeskStrip_Color').sendCommand("250,100,100");
  }

  definedActions[4].run = function(update){ // Static All Off
    items.getItem('BedroomLightOne_Power').sendCommand("OFF");
    items.getItem('BedroomLightThree_Power').sendCommand("OFF");
    items.getItem('BedroomLightTwo_Power').sendCommand("OFF");
    items.getItem('BedroomClosetLight_Power').sendCommand("OFF");
    items.getItem('BedroomFan_Power').sendCommand("OFF");
    items.getItem('BedroomDeskStrip_Power').sendCommand("OFF");
  }


  // update,messageHandler,people,pageHandler,pages,indicatorHandler,buttonHandler,definedActions
  daughon.main.runPanel(jsonObject,messageHandler,people,pageHandler,pages,indicatorHandler,buttonHandler,definedActions);
  
}
