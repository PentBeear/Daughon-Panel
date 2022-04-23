module.exports = {
    get buttons() { return require('./buttonHandler.js') },
    get pages() { return require('./pageHandler.js') },
    get indicators() { return require('./indicatorHandler.js') },
    get messages() { return require('./messageHandler.js') },
    get actions() { return require('./actions.js') },
}