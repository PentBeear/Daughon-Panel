class Person { // just a person
    constructor(name, id) {
        this.name = name;
        this.id = id;
    }   
    getName(){
        return this.name;
    }

    getID(){
        return this.id;
    }
}

class MessageHandler {
    constructor(telegram) {
        this.telegram = telegram;
    } 

    sendMessage(update,personArray){  // Searchs through all people and then sends a message
        var _telegram = this.telegram;
        personArray.forEach(function(person) { // still lazy
            if(update["receiver"] == person.getName()){
                actions.get("telegram", _telegram).sendTelegram(person.getID(),`Message from ${update["sender"]}:\n${update["message"]}`);
            }
        });  
    }
}

exports.Person = Person;
exports.MessageHandler = MessageHandler;
