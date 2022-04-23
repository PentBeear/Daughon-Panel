module.exports = {
    get actionHandler() { return require('./actionHandler.js') },
    get pageHandler() { return require('./pageHandler.js') },
    get indicatorHandler() { return require('./indicatorHandler.js') },
    get messageHandler() { return require('./messageHandler.js') },
}

