class button { // Button class that holds its specific location on the panel
    constructor(btn, page, depth) {
        this.btn = btn;
        this.page = page;
        this.depth = depth;
    }

    getBtn(){
        return this.btn;
    }

    getPage(){
        return this.page;
    }

    getDepth(){
        return this.depth;
    }

    execute(type,update){ // Takes the update and based on the action runs a user defined function while passing the json the panel sent.
        switch (type) {
            case 'color':
                this.color(update);
                break;
            case 'kelvin':
                this.kelvin(update);
                break;
            case 'white':
                this.white(update);
                break;
            case 'dimmer':
                this.dimmer(update);
                break;  
            case 'toggle':
                this.toggle(update);
                break;  
            case 'run':
                this.run(update);
                break;
            default:
                console.log("Error reading type");
        }
    }

    color(){

    }

    kelvin(){

    }

    white(){

    }

    dimmer(){

    }

    toggle(){

    }

    run(){

    }
}

class buttonHandler { 
    constructor() {
        
    }

    buttonParser(update,btnArray){ // Another lazy way of checking which button is correct
        btnArray.forEach(function(item) {
            if(item.getDepth() == parseInt(update["data"]["depth"]) && item.getPage() == parseInt(update["data"]["page"]) && item.getBtn() == parseInt(update["data"]["btn"]))
            {
              item.execute(update["data"]["action"],update); // Runs action
            }
          });
    }
}

exports.button = button;
exports.buttonHandler = buttonHandler;
