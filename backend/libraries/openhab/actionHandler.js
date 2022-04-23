class actionHandler {
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

    execute(type){
        switch (type) {
            case 'color':
                this.color();
                break;
            case 'kelvin':
                this.kelvin();
                break;
            case 'white':
                this.white();
                break;
            case 'dimmer':
                this.dimmer();
                break;  
            case 'toggle':
                this.toggle();
                break;  
            case 'run':
                this.run();
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

exports.actionHandler = actionHandler;