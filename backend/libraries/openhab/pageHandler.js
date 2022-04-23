// Just stores pages i guess
class page {
    constructor(type, name, page, btn, depth, info) {
        this.type = type;
        this.info = info;
        this.page = page;
        this.depth = depth;
        this.name = name;
        this.btn=btn;
    }

    #convertState(state){
        if (state.toLowerCase()=="on"){
          return "1";
        } else {
          return "0";
        }
    }
   
    toString(){   
        return eval("`" + this.info.replaceAll("-","\"") + "`"); // Creates a template literal and evaluates it (Ha eval)
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
class pageHandler {
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

    #nestReset(){
        items.getItem(this.submenuArrayItem).sendCommand("");
    }

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

    #nestAddition(update){
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
    pageParser(update,pageArray){ // Takes a page array argument and then sends it to sendPage to be proccesed
        var nest = false;
        var back = false
        console.log("Request: " + JSON.stringify(update));
        if(update["request"] == "page"){ // Regular page request
          console.log("Parsed Request is a regular page")
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
            console.log("Sending stored nest: " + this.#submenuJSON[update["data"]["depth"]].replaceAll("\\","")) 
            var previousSubmenu = JSON.parse(this.#submenuJSON[update["data"]["depth"]].replaceAll("\\","")); // Gets the page at depth x and parses it
            this.sendPage(parseInt(previousSubmenu["data"]["page"]),parseInt(previousSubmenu["data"]["btn"]),parseInt(previousSubmenu["data"]["depth"]),pageArray,false); // Gets previous Page
          } else { // Just use depth to specify what nest to use in sendPage
            this.sendPage(parseInt(update["data"]["page"]),parseInt(update["data"]["btn"]),parseInt(update["data"]["depth"]),pageArray,false); // Grabs the page and sends it off
          }
        } else { // Just send a regular page
          this.sendPage(parseInt(update["data"]["page"]),-1,-1,pageArray,false);
        }
    }

    sendPage(page,btn,depth,pageArray,force){ // This also processes the page array to get the required page
        console.log("Sending Page based on: " + "page:" + page + " btn:" + btn + " depth:" + depth + " force:" + force)
        var mqttMessage = "";

        // Loops through all the pages for the correct one to send (Lazy)
        pageArray.forEach(function(item) {
            //console.log("running page reader");
            if(item.getDepth() == depth && item.getPage() == page && item.getBtn() == btn)
            {
              console.log(item.toString());
              mqttMessage=item.toString();
            }
        });

        if(force==true)
        {
          if(depth<0){ // Make this do the force_disp instead of page action
            actions.get("mqtt", this.mqttBroker).publishMQTT(this.commandTopic, mqttMessage ,false); 
          } else {
            // Selects page, btn number, and depth
            actions.get("mqtt", this.mqttBroker).publishMQTT(this.commandTopic, mqttMessage ,false);  
          }  
        } else {
          if(depth<0){ // If depth is less than 0 we know we are wanting the default page else we know to grab a specific nest
            actions.get("mqtt", this.mqttBroker).publishMQTT(this.commandTopic, mqttMessage ,false); 
          } else {
            // Selects page, btn number, and depth
            actions.get("mqtt", this.mqttBroker).publishMQTT(this.commandTopic, mqttMessage ,false);  
          }
        }
      }


}



exports.page = page;
exports.pageHandler = pageHandler;