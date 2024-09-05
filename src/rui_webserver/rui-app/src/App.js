/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */
import React, { Component } from "react"
import { Route, Switch, withRouter } from "react-router-dom"
import { observer, inject } from "mobx-react"

import Page from "./Page"
import Nav from "./Nav"
import HorizontalDivider from "./HorizontalDivider"
//import PageLock from "./PageLock"


import Dashboard from "./NepiDashboard"
import SensorIDX from "./NepiSensorsImaging"
import PointcloudApp from "./NepiAppPointcloud"
import NEPIConnect from "./NepiSystemConnect"
import AiManager from "./NepiSystemAiDetector"
import AiTargetingApp from "./NepiAppAiTargeting"
import MultiImageViewer from "./NepiAppImageViewer"
import NavPoseMgr from "./NepiMgrNavPose"
import Settings from "./NepiSystemDevice"
import SoftwareUpdate from "./NepiSystemSoftware"
import NepiDriversmgr from "./Nepi_Drivers_mgr"
import Automation from "./NepiAppAutomation"
import ImageSequencer from "./NepiAppImageSequencer"
import PTX from "./NepiControlsPanTilt"
import OnvifManager from "./NepiSystemOnvif"
import LSX from "./NepiControlsLights"
import RBX from "./NepiControlsRobots"

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
    const unlicensed = (license_server !== null) && 
                               (license_server.readyState === 1) && 
                               (commercial_licensed === false) 
    return (
      <Page>
        <Nav
          unlicensed={unlicensed}
          pages={[
            { path: "/", label: "Dashboard" },
            {
              path: "/sensors",
              label: "Sensors",
              subItems: [
                { path: "/sensor_idx", label: "Imaging"}
              ]
            },
            {
              path: "/controls",
              label: "Controls",
              subItems: [
			          { path: "/lsx", label: "Lights" },
                { path: "/ptx", label: "Pan&Tilts" },
                { path: "/rbx", label: "Robots" }
              ]
            },
            { path: "/navPose", label: "NavPose" },
            
            {
              path: "/applications",
              label: "Applications",
              subItems: [
                { path: "/imagery", label: "Image Viewer" },
                { path: "/image_sequencer", label: "Imgage Sequencer" },
                { path: "/pointcloud_app", label: "Pointcloud Viewer" },
                { path: "/ai_targeting_app", label: " AI Targeting" },
                { path: "/automation", label: "Automation" }
              ]
            },
            {
              path: "/system",
              label: "System",
              subItems: [
                { path: "/system_config", label: "Device" },
                { path: "/software_update", label: "Software"},
                { path: "/Nepi_Drivers_mgr", label: "Driver Manager"},

                { path: "/onvif_mgr", label: "ONVIF"},
                { path: "/ai_mgr", label: " AI Manager" },
                { path: "/nepi_connect", label: "Connect" },
              ]
            },
            {
              path: "/help",
              label: "Help",
              subItems: [
                { path: "/docs", label: "Docs" },
                { path: "/tuts", label: "Tutorials" },
                { path: "/vids", label: "Videos" },
              ]
            }
          ]}
        />
        <HorizontalDivider />
        <Switch>
          <Route exact path="/" component={Dashboard} />
          <Route path="/imagery" component={MultiImageViewer} />
          <Route path="/sensor_idx" component={SensorIDX} />
          <Route path="/pointcloud_app" component={PointcloudApp} />
          <Route path="/navPose" component={NavPoseMgr} />
          <Route path="/ai_targeting_app" component={AiTargetingApp} />
          <Route path="/automation" component={Automation} />
          <Route path="/onvif_mgr" component={OnvifManager} />
          <Route path="/image_sequencer" component={ImageSequencer} />
          <Route path="/system_config" component={Settings} />
          <Route path="/software_update" component={SoftwareUpdate} />
          <Route path="/ai_mgr" component={AiManager} />
          <Route path="/nepi_connect" component={NEPIConnect} />
          <Route path="/Nepi_Drivers_mgr" component={NepiDriversmgr} />
          <Route path="/ptx" component={PTX} />
          <Route path="/rbx" component={RBX} />
          <Route path='/docs' component={() => {
             window.location.href = 'https://nepi.com/documentation/';
             return null;
            }}/>
          <Route path='/tuts' component={() => {
             window.location.href = 'https://nepi.com/tutorials/';
             return null;
            }}/>
          <Route path='/vids' component={() => {
             window.location.href = 'https://nepi.com/videos/';
             return null;
            }}/>
          <Route path="/lsx" component={LSX} />
        </Switch>
      </Page>
    )
  }
}

export default App
