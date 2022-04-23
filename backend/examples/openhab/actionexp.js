hello();
function hello(){
  const daughon = require("./daughon_helper")
  var test = new amazon.pages.page(0,"Bedroom",1,-1,-1,'"btn=0,type=5,name=Fan,icon=,state=\${this.#convertState(items.getItem("BedroomFan_Power").state.toString())}","btn=1,type=5,name=Closet,icon=,state=\${this.#convertState(items.getItem("BedroomClosetLight_Power").state.toString())}","btn=2,type=1,name=Light,icon=,state=\${this.#convertState(items.getItem("BedroomLightOne_Power").state.toString())}","btn=3,type=7,name=Scenes,icon=,state=0","btn=4,type=4,name=hidden,icon=2","btn=5,type=2,name=hidden,icon=0,state=0"');

//actions.get("mqtt", "mqtt:broker:x").publishMQTT("cmnd/tasmota_bedroom_nspanel/nextion", daughon.actions.panelActions.wake() ,false);  
  actions.get("mqtt", "mqtt:broker:x").publishMQTT("cmnd/tasmota_bedroom_nspanel/nextion", daughon.actions.panelActions.vis(3,1) ,false);  
}
