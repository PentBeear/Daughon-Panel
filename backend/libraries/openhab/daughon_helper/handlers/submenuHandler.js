/*
{"action":"refresh","data":{"r":"1","g":"1","b":"1","brightness":"50","t0":"D"}}
{"action":"refresh","data":{"r":"1","g":"1","b":"1","brightness":"50","w":"50","t0":"D","t1":"W"}}
{"action":"refresh","data":{"r":"1","g":"1","b":"1","brightness":"50","w":"50","k":"50","t0":"D","t1":"W","t2":"K"}}
{"action":"refresh","data":{"w":"50","k":"50","t0":"W","t1":"K"}}
{"action":"refresh","data":{"d":"50","t0":"D"}}
*/

// {"indicator":"submenu","data":{"btn":"1","page":"1","depth":"-1"}}
// {"indicator":"exit_submenu"}
class Submenu { // Button class that holds its specific location on the panel

    constructor(btn, page, depth) {
        this.btn = btn;
        this.page = page;
        this.depth = depth;
    }

    toString(){ // User defined
        return "null";
    }

    getBtn(){
        return this.btn;
    }

    getDepth(){
        return this.depth;
    }

    getPage(){
        return this.page;
    }
}

class SubmenuHandler { 
    constructor(mqttBroker,commandTopic) {
        this.mqttBroker = mqttBroker;
        this.commandTopic = commandTopic;
    }

    submenuParser(update,refreshes){ // Another lazy way of checking which button is correct
        var mqttMessage = "";
        refreshes.forEach(function(item) {
            if(item.getDepth() == parseInt(update["data"]["depth"]) && item.getPage() == parseInt(update["data"]["page"]) && item.getBtn() == parseInt(update["data"]["btn"]))
            {
                mqttMessage = item.toString();
            }
        });
        console.log("Submenu Update: " + mqttMessage);
        actions.get("mqtt", this.mqttBroker).publishMQTT(this.commandTopic, mqttMessage ,false);
    }

}


exports.Submenu = Submenu;
exports.SubmenuHandler = SubmenuHandler;
