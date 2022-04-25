module.exports = {
    get buttons() { return require('./handlers/buttonHandler.js') },
    get pages() { return require('./handlers/pageHandler.js') },
    get indicators() { return require('./handlers/indicatorHandler.js') },
    get messages() { return require('./handlers/messageHandler.js') },
    get submenus() { return require('./handlers/submenuHandler.js') },
    get actions() { return require('./actions/panelActions.js') },
    get main() { return main }, // daughon.main.runPanel()
}

class main {
    static runPanel(update,messageHandler,people,pageHandler,pages,indicatorHandler,buttonHandler,buttons,submenuHandler,submenus){ // Takes all the user defined handlers, pages, buttons and etc and sends it off to the required place
        if(update["indicator"] == "submenu" ){
            console.log("Refreshing submenu")
            submenuHandler.submenuParser(update,submenus);
        } if(update["indicator"] != null){
            indicatorHandler.indicatorParser(update);
        }  else if (update["request"] == "page" || update["update"] == "btn" && update["data"]["action"] == "nesting"){ // Sends pages on request and nesting
            pageHandler.pageParser(update,pages);
        } else if (update["update"] == "message"){ // Handles item updates
            messageHandler.sendMessage(update,people); //    
        } else if(update["update"] == "btn"){ // Handles user input from a page
            console.log("Item Update: " + JSON.stringify(update));
            buttonHandler.buttonParser(update,buttons);       
        }
    }
}


