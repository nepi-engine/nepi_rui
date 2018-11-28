import React from "react"
import ReactDOM from "react-dom"
import { BrowserRouter } from "react-router-dom"

import store from "./Store"
import App from "./App"

import "react-toggle/style.css"
import "react-circular-progressbar/dist/styles.css"

ReactDOM.render(
  <BrowserRouter>
    <App store={store} />
  </BrowserRouter>,
  document.getElementById("root")
)
