import React, { Component } from "react"
import { Route, Switch, withRouter, Link } from "react-router-dom"
import { observer, inject } from "mobx-react"

import Page from "./Page"
import Nav from "./Nav"
import HorizontalDivider from "./HorizontalDivider"
//import PageLock from "./PageLock"

import NEPIConnect from "./NEPIConnect"
import Dashboard from "./Dashboard"
import DetectionApp from "./DetectionApp"
import SensorIDX from "./SensorIDX"
import NavPose from "./NavPose"
import Settings from "./Settings"
import SoftwareUpdate from "./SoftwareUpdate"

//const IS_LOCAL = window.location.hostname === "localhost"

@inject("ros")
@withRouter
@observer
class App extends Component {

  componentDidMount() {
    this.props.ros.checkROSConnection()
  }

  render() {
    return (
      <Page>
        <Nav
          pages={[
            { path: "/", label: "Dashboard" },
            {
              path: "/input",
              label: "Input",
              subItems: [
                { path: "/imagery", label: "Imagery" },
                { path: "/navPose", label: "NavPose" }
              ]
            },
            {
              path: "/applications",
              label: "Applications",
              subItems: [
                { path: "/ai", label: "AI" },
                { path: "/automation", label: "Automation"},
              ]
            },
            {
              path: "/setup",
              label: "Setup",
              subItems: [
                { path: "/settings", label: "Settings" },
                { path: "/software_update", label: "Software"}
              ]
            },
            { path: "/nepi_connect", label: "Connect" },
            {
              path: "/help",
              label: "Help",
              subItems: [
                { path: "/faq", label: "FAQ" },
                { path: "/youtube", label: "Youtube" },
                { path: "/manuals", label: "Manuals" },
                { path: "/systemLogs", label: "System Logs" },
                { path: "/license", label: "License"}
              ]
            }
          ]}
        />
        <HorizontalDivider />
        <Switch>
          <Route exact path="/" component={Dashboard} />
          <Route path="/imagery" component={SensorIDX} />
          <Route path="/navPose" component={NavPose} />
          <Route path="/ai" component={DetectionApp} />
          { /*<Route path="/automation" component={Automation} />*/ }
          <Route path="/settings" component={Settings} />
          <Route path="/software_update" component={SoftwareUpdate} />
          <Route path="/nepi_connect" component={NEPIConnect} />

          <Route path="/faq">
            <Link to={{ pathname: "http://numurus.com" }} target="_blank">
              Click for Online FAQ (will open in new tab)
            </Link>
          </Route>
          <Route path="/youtube">
            <Link to={{ pathname: "http://youtube.com" }} target="_blank">
              Click for Numurus YouTube Channel (will open in new tab)
            </Link>
          </Route>
          <Route path="/manuals">
            <Link to={{ pathname: "http://numurus.com" }} target="_blank">
              Click for Online Manuals (will open in new tab)
            </Link>
          </Route>
        </Switch>
      </Page>
    )
  }
}

export default App
