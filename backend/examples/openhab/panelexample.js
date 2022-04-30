wrapper(); // To let the garbage collector actually collect...

// Add refresh handler
function wrapper(){
  const daughon = require("./daughon_helper") // Helper library
  // Gets the request
  var update = JSON.parse(this.event.toString().substr(this.event.toString().indexOf("{"),this.event.toString().length()));
  
  // User MODIFIABLE!
    
  // Create a new message handler with your openhab telegram thing
  //var messageHandler = new daughon.messages.messageHandler("telegram:telegramBot:5e8e4ebfc6")
  
  // Make a list of your people that can be messaged here with their telegram chat id.
  var people = [new daughon.messages.Person("x",x)];
  
  // submenuItem, depthItem, pageItem, submenuArrayItem, mqttBroker, commandTopic
  // Create a page handler with your required items and mqtt broker
  //var pageHandler = new daughon.pages.pageHandler("BedroomNSPanel_Submenu","BedroomNSPanel_Depth","BedroomNSPanel_Page","BedroomNSPanel_SubmenuList","mqtt:broker:9882e1ef27","cmnd/tasmota_bedroom_nspanel/nextion")
  
  // Page List Modify to display what page you want, Don't change the home defaults (page 0)
  // type, name, page, btn, depth, info
  // Create your pages with your types names and etc
  var pages = [new daughon.pages.Page(0,"Bedroom",-1,1,-1),
              new daughon.pages.Page(0,"Bedroom",3,1,0),
              new daughon.pages.Page(1,"amogus",-1,2,-1),
              ]; // btn -1 page 1 depth -1, btn 3 page 1 depth 0
  
  // These dont have to be one liners, it just has to return a valid json message
  // Page 1
  pages[0].toString = function(){ // User defined function that setups what is sent to the panel
    return `{"action":"page","data":{"type":"${this.type.toString()}","name":"${this.name.toString()}","info":[${eval("`" + '"btn=0,type=5,name=Fan,icon=,state=\${items.getItem("BedroomFan_Power").state.toString() == "ON" ? "1" : "0"}","btn=1,type=5,name=Closet,icon=,state=\${items.getItem("BedroomClosetLight_Power").state.toString() == "ON" ? "1" : "0"}","btn=2,type=1,name=Light,icon=,state=\${items.getItem("BedroomLightOne_Power").state.toString() == "ON" ? "1" : "0"}","btn=3,type=7,name=Scenes,icon=,state=0","btn=4,type=4,name=hidden,icon=2","btn=5,type=2,name=hidden,icon=0,state=0"' + "`")}]}}`
  }
  
  
  pages[1].toString = function(){ // User defined function that setups what is sent to the panel
    return `{"action":"page","data":{"type":"${this.type.toString()}","name":"${this.name.toString()}","info":[${eval("`" + '"btn=0,type=6,name=Blue,icon=,state=0","btn=1,type=6,name=Off,icon=,state=0","btn=2,type=7,name=hidden,icon=,state=0","btn=3,type=7,name=hidden,icon=,state=0","btn=4,type=4,name=hidden,icon=2","btn=5,type=2,name=hidden,icon=0,state=0"' + "`")}]}}`
  }
  
  // Page 2
  pages[2].toString = function(){ // User defined function that setups what is sent to the panel
    return `{"action":"page","data":{"type":"${this.type.toString()}","name":"${this.name.toString()}","info":["btn=0,type=0,name=aaaaabbbb,icon=,state=1","btn=1,type=1,name=b,icon=,state=1","btn=2,type=2,name=c,icon=,state=1","btn=3,type=3,name=d,icon=0,state=1","btn=4,type=4,name=e,icon=2,state=1","btn=5,type=5,name=f,icon=0,state=1","btn=6,type=6,name=g,icon=0,state=static","btn=7,type=8,name=temp,icon=0,state=73F"]}}`
  }
  

  // submenuItem, depthItem, pageItem
  // Create your indicator parser with your required items
  //var indicatorHandler = new daughon.indicators.indicatorHandler("BedroomNSPanel_Submenu","BedroomNSPanel_Depth","BedroomNSPanel_Page");
  
  // Submenu handler sends command to refresh submenu on entry
  //var submenuHandler = new daughon.submenus.submenuHandler("mqtt:broker:9882e1ef27","cmnd/tasmota_bedroom_nspanel/nextion");
  
  // '{"action":"refresh","data":{"r":"1","g":"1","b":"1","brightness":"\${items.getItem("BedroomLightOne_Color").state.toString().substring(items.getItem("BedroomLightOne_Color").state.toString().lastIndexOf(",") +1)}","w":"\${(items.getItem("BedroomLightOne_White").state.toString())}","t0":"D","t1":"W"}}'
  // Submenu for Button 2, page 1, depth -1 so if i press and hold button 2 at page 1 depth -1 it sends this command to update the submenu entered
  var submenus = [new daughon.submenus.Submenu(2,1,-1)] // Submenu for btn 2 page 1 depth -1
  
  // Submenu btn 2 page 1 depth -1 is defined as what is returned in the toString function like how pages are handled
  submenus[0].toString = function(){ // User defined function that setups what is sent to the panel
    var HSBType = Java.type('org.openhab.core.library.types.HSBType'); // Pulls in HSB type so you can do color conversions
    return eval("`" + '{"action":"refresh","data":{"r":"\${Math.round(new HSBType(items.getItem("BedroomLightOne_Color").state.toString()).getRed()*2.55).toString()}","g":"\${Math.round(new HSBType(items.getItem("BedroomLightOne_Color").state.toString()).getGreen()*2.55).toString()}","b":"\${Math.round(new HSBType(items.getItem("BedroomLightOne_Color").state.toString()).getBlue()*2.55).toString()}","state":"\${items.getItem("BedroomLightOne_Power").state.toString() == "ON" ? "1" : "0"}","slider0":"\${Math.round(parseInt(items.getItem("BedroomLightOne_Color").state.toString().substring(items.getItem("BedroomLightOne_Color").state.toString().lastIndexOf(",") +1))*2.55).toString() }","slider1":"\${(items.getItem("BedroomLightOne_White").state.toString())}","t0":"B","t1":"W"}}' + "`");
  }
  

  
  // Creates an actionHandler for every button on every page
  // btn, page, depth
  // Create your actions for every button press (Page and depth specific)
  
  //var buttonHandler = new daughon.buttons.buttonHandler();

  // Has to be in an array to be parsed
  var buttons = [new daughon.buttons.Button(0,1,-1), 
                        new daughon.buttons.Button(1,1,-1),
                        new daughon.buttons.Button(2,1,-1),
                        new daughon.buttons.Button(0,1,0),
                        new daughon.buttons.Button(1,1,0),
                        new daughon.buttons.Button(5,1,-1)];

   // Update is the information from the panel, you can parse it to get things like color and other data
  buttons[0].toggle = function(update){ // Bedroom Fan
    if(items.getItem('BedroomFan_Power').state.toString() == "ON"){
      items.getItem('BedroomFan_Power').sendCommand("OFF");
      } else {
        items.getItem('BedroomFan_Power').sendCommand("ON"); 
     }   
  }
  
  buttons[1].toggle = function(update){ // Closet Light
    if(items.getItem('BedroomClosetLight_Power').state.toString() == "ON"){
      items.getItem('BedroomClosetLight_Power').sendCommand("OFF");
      } else {
        items.getItem('BedroomClosetLight_Power').sendCommand("ON"); 
     }   
  }
  
  buttons[2].toggle = function(update){ // RGBW Lights
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
  
  buttons[2].color = function(update){
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
  
  // Its a plea bargain to have all slider active under one umbrellla..
  // I setup slider 1 to be white so i grab that value and set it here
  buttons[2].slider1 = function(update){
    items.getItem('BedroomLightOne_White').sendCommand(update["data"]["slider1"]);
    items.getItem('BedroomLightThree_White').sendCommand(update["data"]["slider1"]);
    items.getItem('BedroomLightTwo_White').sendCommand(update["data"]["slider1"]);
    items.getItem('BedroomLightOne_Power').sendCommand("ON");
    items.getItem('BedroomLightThree_Power').sendCommand("ON");
    items.getItem('BedroomLightTwo_Power').sendCommand("ON");
  }

  buttons[3].run = function(update){ // Static Blue
    items.getItem('BedroomLightOne_Color').sendCommand("250,100,100");
    items.getItem('BedroomLightTwo_Color').sendCommand("250,100,100");
    items.getItem('BedroomLightThree_Color').sendCommand("250,100,100");
    items.getItem('BedroomDeskStrip_Color').sendCommand("250,100,100");
  }

  buttons[4].run = function(update){ // Static All Off
    items.getItem('BedroomLightOne_Power').sendCommand("OFF");
    items.getItem('BedroomLightThree_Power').sendCommand("OFF");
    items.getItem('BedroomLightTwo_Power').sendCommand("OFF");
    items.getItem('BedroomClosetLight_Power').sendCommand("OFF");
    items.getItem('BedroomFan_Power').sendCommand("OFF");
    items.getItem('BedroomDeskStrip_Power').sendCommand("OFF");
  }
  // mqttBroker,commandTopic,submenuItem,depthItem,pageItem,submenuArrayItem,telegram,submenus,pages,people,buttons
  var Panel = new daughon.Panel("mqtt:broker:x","cmnd/tasmota_bedroom_nspanel/nextion","BedroomNSPanel_Submenu","BedroomNSPanel_Depth","BedroomNSPanel_Page","BedroomNSPanel_SubmenuList","telegram:telegramBot:x",submenus,pages,people,buttons)
  Panel.runPanel(update);


  
}
