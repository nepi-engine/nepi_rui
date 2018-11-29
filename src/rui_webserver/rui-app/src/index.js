import React from "react"
import ReactDOM from "react-dom"
import { BrowserRouter } from "react-router-dom"
import { Provider } from "mobx-react"

import stores from "./Store"
import App from "./App"

import "react-toggle/style.css"
import "react-circular-progressbar/dist/styles.css"

ReactDOM.render(
  <BrowserRouter>
    <Provider {...stores}>
      <App />
    </Provider>
  </BrowserRouter>,
  document.getElementById("root")
)
