import React, { Component } from "react"
import { Route, Switch, withRouter } from "react-router-dom"
import { observer, inject } from "mobx-react"

import Page from "./Page"
import Nav from "./Nav"
import HorizontalDivider from "./HorizontalDivider"
//import PageLock from "./PageLock"

import NEPIConnect from "./NEPIConnect"
import Dashboard from "./Dashboard"
import DetectionApp from "./DetectionApp"
import Sensor3DX from "./Sensor3DX"
import NavPose from "./NavPose"
import Files from "./Files"
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
              path: "/applications",
              label: "Applications",
              subItems: [
                { path: "/detection", label: "Detection" },
                { path: "/sensor3DX", label: "3DX" },
                { path: "/navPose", label: "Nav/Pose" }
              ]
            },
            { path: "/settings", label: "Settings" },
            { path: "/software_update", label: "Software"},
            { path: "/nepi_connect", label: "NEPI Connect" }
          ]}
        />
        <HorizontalDivider />
        <Switch>
          <Route exact path="/" component={Dashboard} />
          <Route path="/detection" component={DetectionApp} />
          <Route path="/sensor3DX" component={Sensor3DX} />
          <Route path="/navPose" component={NavPose} />
          <Route
            path="/files/:path*"
            component={props => <Files {...props} />}
          />
          <Route path="/settings" component={Settings} />
          <Route path="/nepi_connect" component={NEPIConnect} />
          <Route path="/software_update" component={SoftwareUpdate} />
        </Switch>
      </Page>
    )
  }
}

export default App
