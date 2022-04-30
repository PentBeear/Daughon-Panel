class Button { // Button class that holds its specific location on the panel
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
            case 'slider0':
                this.slider0(update);
                break;
            case 'slider1':
                this.slider1(update);
                break; 
            case 'slider2':
                this.slider2(update);
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

    color(update){

    }

    slider0(update){

    }

    slider1(update){

    }

    slider2(update){

    }

    toggle(update){

    }

    run(update){

    }
}

class ButtonHandler { 
    constructor() {
        
    }

    buttonParser(update,btnArray){ // Another lazy way of checking which button is correct
        btnArray.forEach(function(item) {
            // This uses string as to allow for the possibility of having buttons be named with a string, for special pages like Music Players
            if(item.getDepth().toString() == update["data"]["depth"] && item.getPage().toString() ==update["data"]["page"] && item.getBtn().toString() == update["data"]["btn"])
            {
              item.execute(update["data"]["action"],update); // Runs action
            }
          });
    }
}

exports.Button = Button;
exports.ButtonHandler = ButtonHandler;
