/*
#
# Copyright (c) 2024 Numurus <https://www.numurus.com>.
#
# This file is part of nepi rui (nepi_rui) repo
# (see https://github.com/nepi-engine/nepi_rui)
#
# License: NEPI RUI repo source-code and NEPI Images that use this source-code
# are licensed under the "Numurus Software License", 
# which can be found at: <https://numurus.com/wp-content/uploads/Numurus-Software-License-Terms.pdf>
#
# Redistributions in source code must retain this top-level comment block.
# Plagiarizing this software to sidestep the license obligations is illegal.
#
# Contact Information:
# ====================
# - mailto:nepi@numurus.com
#
 */
import React, { Component } from "react"
import { Route, Switch, withRouter } from "react-router-dom"
import { observer, inject } from "mobx-react"



import Page from "./Page"
import Nav from "./Nav"
import HorizontalDivider from "./HorizontalDivider"
//import PageLock from "./PageLock"


import Dashboard from "./NepiDashboard"

import MainMenuDevelop from "./MainMenuDevelop"
import MainMenuDeploy from "./MainMenuDeploy"


//const IS_LOCAL = window.location.hostname === "localhost"

@inject("ros")
@withRouter
@observer
class App extends Component {

  componentDidMount() {
    this.props.ros.checkROSConnection()
  }

  render() {
    const systemMgrStatus = this.props.ros.systemMgrStatus
    const systemDevelopEnabled = this.props.ros.systemDevelopEnabled

    if (systemMgrStatus == null) {

      const { license_valid, license_server, license_type } = this.props.ros
      const unlicensed = (license_server !== null) && 
        (license_server.readyState === 1) && 
        (license_valid === false) 
      return (
      <Page>
        <Nav
          unlicensed={unlicensed}
          license_type={license_type}
          pages={[
            { path: "/", label: "Connecting" },
          ]}
        />
        <HorizontalDivider />
        <Switch>
          <Route exact path="/" component={Dashboard} />
          
        </Switch>
      </Page>
      )
    }
    else if (systemDevelopEnabled === false){
      return (
      <React.Fragment>
        <MainMenuDeploy/>
      </React.Fragment>
      )
    }
    else {
      return (
      <React.Fragment>
        <MainMenuDevelop/>
      </React.Fragment>
      )
    }
  }
}

export default App
