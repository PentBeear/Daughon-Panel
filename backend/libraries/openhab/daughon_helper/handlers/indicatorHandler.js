class indicatorHandler {
    constructor(submenuItem, depthItem, pageItem) {
        this.submenuItem = submenuItem;
        this.depthItem = depthItem;
        this.pageItem = pageItem;
    }

    indicatorParser(update){
        // Parses every indicator and sends commands to update the items
        if(update["indicator"] == "home"){
            console.log("Successfully read indicator: " + update["indicator"]);
            items.getItem(this.submenuItem).sendCommand("-1");
            items.getItem(this.pageItem).sendCommand("0"); // Home Page
            items.getItem(this.depthItem).sendCommand("-1"); // -1 when disabled (No Nesting)
            } else if (update["indicator"] == "sleep"){
            console.log("Successfully read indicator: " + update["indicator"]);
            items.getItem(this.submenuItem).sendCommand("-1"); // -1 when disabled (No Submenu)
            items.getItem(this.pageItem).sendCommand("-1"); // -1 when disabled (Sleep)
            items.getItem(this.depthItem).sendCommand("-1"); // -1 when disabled (No Nesting)
            } else if (update["indicator"] == "page_success"){
            console.log("Successfully read indicator: " + update["indicator"]);
            items.getItem(this.submenuItem).sendCommand("-1"); // -1 when disabled (No Submenu)
            items.getItem(this.pageItem).sendCommand(update["data"]["page"]); // Always Page
            items.getItem(this.depthItem).sendCommand(update["data"]["depth"]); // Always Depth
            } else if (update["indicator"] == "submenu"){
            console.log("Successfully read indicator: " + update["indicator"]);
            items.getItem(this.submenuItem).sendCommand(update["data"]["btn"]); // Submenu is -1 when disabled or btn when enabled
            items.getItem(this.pageItem).sendCommand(update["data"]["page"]); // Always Page
            items.getItem(this.depthItem).sendCommand(update["data"]["depth"]); // Always Depth
            } else if (update["indicator"] == "exit_submenu"){
            console.log("Successfully read indicator: " + update["indicator"]);
            items.getItem(this.submenuItem).sendCommand("-1"); // -1 when disabled (No Submenu)
        }
    }
}

exports.indicatorHandler = indicatorHandler;