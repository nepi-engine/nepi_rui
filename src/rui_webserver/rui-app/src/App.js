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
import AiManager from "./NepiSystemAiDetector"
import AiTargetingApp from "./NepiAppAiTargeting"
import ImageViewerApp from "./NepiAppImageViewer"
import NavPoseMgr from "./NepiMgrNavPose"
import Settings from "./NepiSystemDevice"
import SoftwareUpdate from "./NepiSystemSoftware"
import AutomationMgr from "./NepiSystemAutomation"
import ImageSequencer from "./NepiAppImageSequencer"
import PTX from "./NepiControlsPanTilt"
import OnvifApp from "./NepiAppOnvif"
import DriversMgr from "./NepiSystemDrivers"
import AppsMgr from "./NepiSystemApps"
import LSX from "./NepiControlsLights"
import RBX from "./NepiControlsRobots"
import AppsSelector from "./NepiAppsSelector"

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
              path: "/devices",
              label: "Devices",
              subItems: [
                { path: "/sensor_idx", label: "Imaging"},
                { path: "/lsx", label: "Lights" },
                { path: "/ptx", label: "Pan&Tilts" },
                { path: "/rbx", label: "Robots" },
                { path: "/drivers_mgr", label: "Driver Mgr"},
              ]
            },
            {
              path: "/applications",
              label: "Applications",
              subItems: [
                { path: "/apps_selector", label: "Applications"},
                { path: "/apps_mgr", label: "App Mgr"}
              ]
            },
            {
              path: "/system",
              label: "System",
              subItems: [
                { path: "/system_config", label: "Device" },
                { path: "/software_update", label: "Software"},
                { path: "/navPose", label: "NavPose" },
                { path: "/drivers_mgr", label: "Drivers"},
                { path: "/apps_mgr", label: "Apps"},
                { path: "/ai_mgr", label: " AI" },
                { path: "/automation", label: "Automation" }
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
          <Route path="/imagery" component={ImageViewerApp} />
          <Route path="/sensor_idx" component={SensorIDX} />
          <Route path="/pointcloud_app" component={PointcloudApp} />
          <Route path="/navPose" component={NavPoseMgr} />
          <Route path="/ai_targeting_app" component={AiTargetingApp} />
          <Route path="/automation" component={AutomationMgr} />
          <Route path="/onvif_app" component={OnvifApp} />
          <Route path="/image_sequencer" component={ImageSequencer} />
          <Route path="/system_config" component={Settings} />
          <Route path="/software_update" component={SoftwareUpdate} />
          <Route path="/ai_mgr" component={AiManager} />
          <Route path="/drivers_mgr" component={DriversMgr} />
          <Route path="/apps_mgr" component={AppsMgr} />
          <Route path="/apps_selector" component={AppsSelector} />
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
