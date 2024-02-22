/*
 * NEPI Dual-Use License
 * Project: nepi_rui
 *
 * This license applies to any user of NEPI Engine software
 *
 * Copyright (C) 2023 Numurus, LLC <https://www.numurus.com>
 * see https://github.com/numurus-nepi/nepi_rui
 *
 * This software is dual-licensed under the terms of either a NEPI software developer license
 * or a NEPI software commercial license.
 *
 * The terms of both the NEPI software developer and commercial licenses
 * can be found at: www.numurus.com/licensing-nepi-engine
 *
 * Redistributions in source code must retain this top-level comment block.
 * Plagiarizing this software to sidestep the license obligations is illegal.
 *
 * Contact Information:
 * ====================
 * - https://www.numurus.com/licensing-nepi-engine
 * - mailto:nepi@numurus.com
 *
 */
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
import OnvifManager from "./OnvifManager"
import LSX from "./LSX"


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
                { path: "/sensor_idx", label: "Imaging"},
                { path: "/navPose", label: "NavPose" }
              ]
            },
            {
              path: "/applications",
              label: "Applications",
              subItems: [
                { path: "/imagery", label: "Image Viewer" },
                { path: "/ai", label: "AI" },
                { path: "/automation", label: "Automation"},
                { path: "/onvif_mgr", label: "ONVIF"},
                { path: "/image_sequencer", label: "Sequencer" },
                { path: "/nepi_connect", label: "Connect" }
              ]
            },
            {
              path: "/controls",
              label: "Controls",
              subItems: [
			    { path: "/lsx", label: "Lights" },
                { path: "/ptx", label: "Pan&Tilts" }
              ]
            },
            {
              path: "/system",
              label: "System",
              subItems: [
                { path: "/admin", label: "Admin" },
                { path: "/software_update", label: "Software"}
              ]
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
          <Route path="/onvif_mgr" component={OnvifManager} />
          <Route path="/image_sequencer" component={ImageSequencer} />
          <Route path="/admin" component={Settings} />
          <Route path="/software_update" component={SoftwareUpdate} />
          <Route path="/nepi_connect" component={NEPIConnect} />
          <Route path="/ptx" component={PTX} />
          <Route path="/help" component={Help} />
          <Route path="/lsx" component={LSX} />
        </Switch>
      </Page>
    )
  }
}

export default App
