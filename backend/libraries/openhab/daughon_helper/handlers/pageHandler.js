class Page { // Page class, defines a page by type, name, number, btn, depth, info
  constructor(type, name, btn, page, depth) {
      this.type = type; // Page Type
      this.page = page; // Page Number
      this.depth = depth; // Page Depth
      this.name = name; // Page Name
      this.btn=btn; // Page Nest Btn (If this page is a nesting page this is the button that activates it else make it -1)
  }
  // "{-action-:-page-,-data-:{-type-:-0-,-name-:-Bedroom-,-info-:[-btn=0,type=5,name=Fan,icon=,state=\${this.#convertState(items.getItem('BedroomFan_Power').state.toString())}-,-btn=1,type=5,name=Closet,icon=,state=\${this.#convertState(items.getItem('BedroomClosetLight_Power').state.toString())}-,-btn=2,type=1,name=Light,icon=,state=\${this.#convertState(items.getItem('BedroomLightOne_Power').state.toString())}-,-btn=3,type=7,name=Scenes,icon=,state=0-,-btn=4,type=4,name=hidden,icon=2-,-btn=5,type=2,name=hidden,icon=0,state=0-]}}"
  #convertState(state){
      if (state.toLowerCase()=="on"){
        return "1";
      } else {
        return "0";
      }
  }

  // -btn=0,type=5,name=Fan,icon=,state=\${this.#convertState(items.getItem('BedroomFan_Power').state.toString())}-,-btn=1,type=5,name=Closet,icon=,state=\${this.#convertState(items.getItem('BedroomClosetLight_Power').state.toString())}-,-btn=2,type=1,name=Light,icon=,state=\${this.#convertState(items.getItem('BedroomLightOne_Power').state.toString())}-,-btn=3,type=7,name=Scenes,icon=,state=0-,-btn=4,type=4,name=hidden,icon=2-,-btn=5,type=2,name=hidden,icon=0,state=0-
  toString(){ // User defined
    // `{"action":"page","data":{"type":"${this.type.toString()}","name":"${this.name.toString()}","info":[${eval("`" + this.info + "`")}]}}`
    return "null"
  }

  getType(){
      return this.type;
  }

  getBtn(){
      return this.btn;
  }

  getInfo(){
      return this.info;
  }

  getPage(){
      return this.page;
  }

  getDepth(){
      return this.depth;
  }

  getName(){
      return this.name;
  }

}

// Works somehow
class PageHandler {
  #submenuJSON = "" // Private JSON Object
  constructor(submenuItem, depthItem, pageItem, submenuArrayItem, mqttBroker, commandTopic) {
      this.submenuItem = submenuItem;
      this.depthItem = depthItem;
      this.pageItem = pageItem;
      this.submenuArrayItem = submenuArrayItem;
      this.commandTopic = commandTopic;
      this.mqttBroker = mqttBroker;
  }

  // Handles adding and subtracting nest's from the item
  // Nesting uses strings to store depths
  #parseSubmenuJSON(){ // Parses the submenu array item result into the submenuJSON
      this.#submenuJSON = JSON.parse(items.getItem(this.submenuArrayItem).state.toString())
  }

  #nestReset(){ // Clears the nest array
      items.getItem(this.submenuArrayItem).sendCommand("");
  }

  // In theory you don't need to subtract from the nest, just add or reset it. as you can overwrite values
  #nestSubtraction(update){
      //console.log(this.submenuArrayItem)
      if (update["data"]["depth"].toString() == "-1" || !(items.getItem(this.submenuArrayItem).state.toString().includes("{")) ){ // If submenulist does not contain a { begin the json
          this.nestReset() // If we subtract and theres no json just reset it
          console.log("Reset Nest Array");
        } else { // If we subtract and there is json we can *pop* the top element otherwise known as depth + 1
          this.#parseSubmenuJSON();
          delete this.#submenuJSON[(parseInt(update["data"]["depth"]) + 1)]
          items.getItem(this.submenuArrayItem).sendCommand(JSON.stringify(this.#submenuJSON));
          console.log(`Subtracted depth ${parseInt(update["data"]["depth"]) + 1} from Nest Array`);
       }
  }

  #nestAddition(update){ // Adds a depth to the nest array and stores the received update
      //console.log(this.submenuArrayItem)
      if (!(items.getItem(this.submenuArrayItem).state.toString().includes("{"))){ // If submenulist does not contain a { begin the json
          this.#submenuJSON = JSON.parse("{}");
          this.#submenuJSON["0"] = JSON.stringify(update)
          items.getItem(this.submenuArrayItem).sendCommand(JSON.stringify(this.#submenuJSON));
          console.log("Began Nest Array");
        } else {
          this.#parseSubmenuJSON(); // Parses data if we know its safe to parse
          //console.log(JSON.stringify(this.#submenuJSON))
          this.#submenuJSON[(update["data"]["depth"]).toString()] = JSON.stringify(update)
          //console.log(JSON.stringify(this.#submenuJSON))
          items.getItem(this.submenuArrayItem).sendCommand(JSON.stringify(this.#submenuJSON));
          console.log(`Added depth ${parseInt(update["data"]["depth"])} to Nest Array`);
       }
  }

  // Regular page parsing
  pageParser(update,pageArray){ // Takes a page array argument and then passes it to sendPage to be proccesed
      var nest = false;
      var back = false;
      console.log("Request: " + JSON.stringify(update));
      if(update["request"] == "page"){ // Regular page request
        console.log("Parsed Request is a regular page");
        this.#nestReset();
        nest=false;
      } else if(update["update"] == "btn" && update["data"]["action"] == "nesting" && update["data"]["btn"] == "server" && parseInt(update["data"]["depth"]) > -1){ // Nesting back request
        console.log("Parsed Request is a nest down page")
        this.#nestSubtraction(update);
        nest=true;
        back=true;
      } else if (update["update"] == "btn" && update["data"]["action"] == "nesting" && update["data"]["btn"] != "server" && parseInt(update["data"]["depth"]) > -1){  // Nesting up request
        console.log("Parsed Request is a nest up page")
        this.#nestAddition(update); // Sends command to nestAddition to parse the result and add it to the array
        nest=true;
      }
      if(nest==true){ // If nesting use depth
        if(back==true){ // If going back use the submenuJSON to replay stored nests
          console.log("Sending stored nest: " + this.#submenuJSON[update["data"]["depth"]].replaceAll("\\",""));
          var previousSubmenu = JSON.parse(this.#submenuJSON[update["data"]["depth"]].replaceAll("\\","")); // Gets the page at depth x and parses it
          this.sendPage(parseInt(previousSubmenu["data"]["page"]),parseInt(previousSubmenu["data"]["btn"]),parseInt(previousSubmenu["data"]["depth"]),pageArray,false); // Gets previous Page
        } else { // Just use depth to specify what nest to use in sendPage
          this.sendPage(parseInt(update["data"]["page"]),parseInt(update["data"]["btn"]),parseInt(update["data"]["depth"]),pageArray,false); // Grabs the page and sends it off
        }
      } else { // Just send a regular page
        this.sendPage(parseInt(update["data"]["page"]),-1,-1,pageArray,false);
      }
  }

  sendPage(page,btn,depth,pageArray){ // This also processes the page array to get the required page
      console.log("Sending Page based on: " + "page:" + page + " btn:" + btn + " depth:" + depth);
      var mqttMessage = "";

      // Loops through all the pages for the correct one to send (Lazy)
      pageArray.forEach(function(item) {
          //console.log("running page reader");
          if(item.getDepth() == depth && item.getPage() == page && item.getBtn() == btn)
          {
            mqttMessage=item.toString();   
          }
      });
      console.log(mqttMessage);
      actions.get("mqtt", this.mqttBroker).publishMQTT(this.commandTopic, mqttMessage ,false);  
  }
}

exports.Page = Page;
exports.PageHandler = PageHandler;
