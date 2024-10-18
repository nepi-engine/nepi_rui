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
import IDX from "./NepiSensorsImaging"
import PTX from "./NepiControlsPanTilt"
import LSX from "./NepiControlsLights"
import RBX from "./NepiControlsRobots"

import AppsSelector from "./NepiAppsSelector"
import AppsDataSelector from "./NepiAppsDataSelector"
import AppsNavPoseSelector from "./NepiAppsNavPoseSelector"
import AppsAiSelector from "./NepiAppsAiSelector"


import DeviceMgr from "./NepiSystemDevice"
import NavPoseMgr from "./NepiMgrNavPose"
import SoftwareMgr from "./NepiSystemSoftware"
import AutomationMgr from "./NepiSystemAutomation"
import DriversMgr from "./NepiSystemDrivers"
import AisMgr from "./NepiSystemAis"
import AppsMgr from "./NepiSystemApps"


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
                { path: "/idx", label: "Imaging"},
                { path: "/lsx", label: "Lights" },
                { path: "/ptx", label: "Pan&Tilts" },
                { path: "/rbx", label: "Robots" },
                { path: "/drivers_mgr", label: "Driver Mgr"}
              ]
            },
            { path: "/apps_data_selector", label: "Data"},
            { path: "/apps_navpose_selector", label: "NavPose"},
            { path: "/apps_ai_selector", label: "AI_System"},
            { path: "/apps_selector", label: "Other_Apps"},
            {
              path: "/system",
              label: "System",
              subItems: [
                { path: "/device_config", label: "Device" },
                { path: "/software_update", label: "Software"},
                { path: "/navPose", label: "NavPose" },
                { path: "/drivers_mgr", label: "Drivers"},
                { path: "/apps_mgr", label: "Apps"},
                { path: "/ais_mgr", label: "AI Models"},
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

          <Route path="/idx" component={IDX} />
          <Route path="/ptx" component={PTX} />
          <Route path="/rbx" component={RBX} />
          <Route path="/lsx" component={LSX} />

          <Route path="/apps_selector" component={AppsSelector} />
          <Route path="/apps_data_selector" component={AppsDataSelector} />
          <Route path="/apps_navpose_selector" component={AppsNavPoseSelector} />
          <Route path="/apps_ai_selector" component={AppsAiSelector} />

          <Route path="/navPose" component={NavPoseMgr} />
          <Route path="/automation" component={AutomationMgr} />
          <Route path="/device_config" component={DeviceMgr} />
          <Route path="/software_update" component={SoftwareMgr} />
          <Route path="/drivers_mgr" component={DriversMgr} />
          <Route path="/apps_mgr" component={AppsMgr} />
          <Route path="/ais_mgr" component={AisMgr} />



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
          
        </Switch>
      </Page>
    )
  }
}

export default App
