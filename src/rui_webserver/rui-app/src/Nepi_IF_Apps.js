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
import { observer, inject } from "mobx-react"

import { Columns, Column } from "./Columns"

//ADD APP FILE IMPORTS


//ADD APP FILE MAPPINGS
const appsClassMap = new Map([

]);

@inject("ros")
@observer

// Pointcloud Application page
class AppRender extends Component {
  constructor(props) {
    super(props)

    this.state = {
      dummy: null
    }

  }

  render() {
    const sel_app = this.props.sel_app
    const {appsNameList, appsStatusList} = this.props.ros
    const appInd = appsNameList.indexOf(sel_app)
    var appStatusMsg = null
    if (appInd !== -1){
      appStatusMsg =appsStatusList[appInd]
    }
    var rui_main_class = ""
    var rui_menu_name = ""
    if (appStatusMsg !== null){
      rui_main_class = appStatusMsg.rui_main_class
      rui_menu_name = appStatusMsg.rui_menu_name
    }
  
    if (appsNameList.indexOf(sel_app) !== -1){
      const AppToRender = appsClassMap.get(rui_main_class);
      return (
        <div>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {rui_menu_name}
            </label>

          {AppToRender && <AppToRender />} 
        </div>
      );
    }
    else {
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app + " NOT AVAILABLE"}
          </label>

          <Columns>
          <Column>

          </Column>
          </Columns> 
        </React.Fragment>
      )
    }


  }

}

export default AppRender
