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
import SensorIDX from "./SensorIDX"
import MultiImageViewer from "./MultiImageViewer"
import NavPose from "./NavPose"
import Settings from "./Settings"
import SoftwareUpdate from "./SoftwareUpdate"
import Help from "./Help"
import Automation from "./Automation"
import ImageSequencer from "./ImageSequencer"
import PTX from "./PTX"

//const IS_LOCAL = window.location.hostname === "localhost"

@inject("ros")
@withRouter
@observer
class App extends Component {

  componentDidMount() {
    this.props.ros.checkROSConnection()
  }

  render() {
    const { commercial_licensed, license_server } = this.props.ros
    const developer_licensed = (license_server !== null) && 
                               (license_server.readyState === 1) && 
                               (commercial_licensed === false) 
    return (
      <Page>
        <Nav
          developer_licensed={developer_licensed}
          pages={[
            { path: "/", label: "Dashboard" },
            {
              path: "/sensors",
              label: "Sensors",
              subItems: [
                { path: "/imagery", label: "Imagery" },
                { path: "/sensor_idx", label: "IDX Sensor"},
                { path: "/image_sequencer", label: "Sequencer" },
                { path: "/navPose", label: "NavPose" }
              ]
            },
            {
              path: "/applications",
              label: "Applications",
              subItems: [
                { path: "/ai", label: "AI" },
                { path: "/automation", label: "Automation"},
                { path: "/nepi_connect", label: "Connect" }
              ]
            },
            {
              path: "/controls",
              label: "Controls",
              subItems: [
                { path: "/ptx", label: "Pan/Tilt" }
              ]
            },
            {
              path: "/system",
              label: "System",
              subItems: [
                { path: "/admin", label: "Admin" },
                { path: "/software_update", label: "Software"}
              ]
            },
            { 
              path: "/help", 
              label: "Help",
            }
          ]}
        />
        <HorizontalDivider />
        <Switch>
          <Route exact path="/" component={Dashboard} />
          <Route path="/imagery" component={MultiImageViewer} />
          <Route path="/sensor_idx" component={SensorIDX} />
          <Route path="/navPose" component={NavPose} />
          <Route path="/ai" component={DetectionApp} />
          <Route path="/automation" component={Automation} />
          <Route path="/image_sequencer" component={ImageSequencer} />
          <Route path="/admin" component={Settings} />
          <Route path="/software_update" component={SoftwareUpdate} />
          <Route path="/nepi_connect" component={NEPIConnect} />
          <Route path="/ptx" component={PTX} />
          <Route path="/help" component={Help} />
        </Switch>
      </Page>
    )
  }
}

export default App
