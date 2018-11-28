const { compose } = require("react-app-rewired")
const rewireMobX = require("react-app-rewire-mobx")

module.exports = compose(rewireMobX)
