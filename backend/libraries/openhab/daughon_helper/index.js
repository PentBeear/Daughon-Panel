module.exports = {
    get buttons() { return require('./handlers/buttonHandler.js') },
    get pages() { return require('./handlers/pageHandler.js') },
    get indicators() { return require('./handlers/indicatorHandler.js') },
    get messages() { return require('./handlers/messageHandler.js') },
    get submenus() { return require('./handlers/submenuHandler.js') },
    get actions() { return require('./actions/panelActions.js') },
    get Panel() { return Panel }, // daughon.main.runPanel()
}

// Imports for creating the panel objects
var buttonsI = require('./handlers/buttonHandler.js');
var pagesI = require('./handlers/pageHandler.js');
var indicatorsI = require('./handlers/indicatorHandler.js');
var messagesI = require('./handlers/messageHandler.js');
var submenusI = require('./handlers/submenuHandler.js');
var actionsI = require('./actions/panelActions.js');

class Panel {
    constructor(mqttBroker,commandTopic,submenuItem,depthItem,pageItem,submenuArrayItem,telegram,submenus,pages,people,buttons) {
        // General info
        this.telegram = telegram;
        this.mqttBroker = mqttBroker;
        this.commandTopic = commandTopic;
        this.submenuArrayItem = submenuArrayItem;
        this.submenuItem = submenuItem;
        this.depthItem = depthItem;
        this.pageItem = pageItem;
        // User defined arrays
        this.submenus = submenus;
        this.pages = pages;
        this.people = people;
        this.buttons = buttons;
        // Handlers
        this.messageHandler = new messagesI.MessageHandler(this.telegram);
        this.pageHandler = new pagesI.PageHandler(this.submenuItem,this.depthItem,this.pageItem,this.submenuArrayItem,this.mqttBroker,this.commandTopic);
        this.indicatorHandler = new indicatorsI.IndicatorHandler(this.submenuItem,this.depthItem,this.pageItem);
        this.submenuHandler = new submenusI.SubmenuHandler(this.mqttBroker,this.commandTopic);
        this.buttonHandler = new buttonsI.ButtonHandler();
    } 
    // messageHandler,people,pageHandler,pages,indicatorHandler,buttonHandler,buttons,submenuHandler,submenus
     runPanel(update){ // Takes all the user defined handlers, pages, buttons and etc and sends it off to the required place
        if(update["indicator"] == "submenu" ){
            console.log("Refreshing submenu")
            this.submenuHandler.submenuParser(update,this.submenus);
        } if(update["indicator"] != null){
            this.indicatorHandler.indicatorParser(update);
        }  else if (update["request"] == "page" || update["update"] == "btn" && update["data"]["action"] == "nesting"){ // Sends pages on request and nesting
            this.pageHandler.pageParser(update,this.pages);
        } else if (update["update"] == "message"){ // Handles item updates
            this.messageHandler.sendMessage(update,this.people); //    
        } else if(update["update"] == "btn"){ // Handles user input from a page
            console.log("Item Update: " + JSON.stringify(update));
            this.buttonHandler.buttonParser(update,this.buttons);       
        }
    }
}


