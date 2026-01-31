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
import Select, { Option } from "./Select"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"


import DriversMgr from "./NepiSystemDrivers"
import AppRender from "./Nepi_IF_Apps"

import IDX from "./NepiDeviceIDX"
import PTX from "./NepiDevicePTX"
import LSX from "./NepiDeviceLSX"
import RBX from "./NepiDeviceRBX"
import NPX from "./NepiDeviceNPX"



@inject("ros")
@observer

class DevicesSelector extends Component {
  constructor(props) {
    super(props)

    this.state = {

      connectedToNepi: false,
      selected_app: 'NONE',

      appsMgrName: "apps_mgr",
      appsMgrNamespace: null,
      appsMgrListener: null,
      apps_connected: false,

      apps_list: ['NONE'],
      apps_group_list: [],
      apps_rui_list: null,
      apps_active_list: [],



      drvsMgrName: "drivers_mgr",
      drvsMgrNamespace: null,
      drvsListener: null,
      drvs_connected: null,

      drvs_list: ['NONE'],
      last_drvs_list: [],
      drvs_active_list: [],
      drvs_active_type_list: [],
      drvs_install_path: null,
      drvs_install_list: [],

      drvs_rui_list: null,
      drvs_type_list: [],

      drv_name: 'NONE',
      drv_description: null,
      drvs_path: null,
      drv_options_menu: null,
      active_state: null,


      needs_update: false
    }


    this.getDrvsMgrNamespace = this.getDrvsMgrNamespace.bind(this)
    this.updateDrvsMgrStatusListener = this.updateDrvsMgrStatusListener.bind(this)
    this.drvsStatusListener = this.drvsStatusListener.bind(this)

    this.checkConnection = this.checkConnection.bind(this)

    this.getAppsMgrNamespace = this.getAppsMgrNamespace.bind(this)

    this.updateAppsMgrStatusListener = this.updateAppsMgrStatusListener.bind(this)
    this.appsStatusListener = this.appsStatusListener.bind(this)

    this.onToggleAppSelection = this.onToggleAppSelection.bind(this)  

    
  }


  async checkConnection() {
    const { connectedToNepi } = this.props.ros
    if (this.state.connectedToNepi !== connectedToNepi){
      this.setState({connectedToNepi: connectedToNepi,
                    appsMgrNamespace: null, apps_connected: false,
                    selected_app: 'NONE', needs_update: true})
    }

    setTimeout(async () => {
      await this.checkConnection()
    }, 1000)
  }

  getAppsMgrNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var appsMgrNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      appsMgrNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.appsMgrName
    }
    return appsMgrNamespace
  }




  componentDidMount(){
    this.checkConnection()
  }


  getDrvsMgrNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var drvsMgrNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      drvsMgrNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.drvsMgrName
    }
    return drvsMgrNamespace
  }

  // Callback for handling ROS Status messages
  appsStatusListener(message) {
    this.setState({
      apps_list: message.apps_ordered_list,
      apps_group_list: message.apps_group_list,
      apps_active_list: message.apps_active_list,
      apps_rui_list: message.apps_rui_list,

      apps_connected: true
    })    

    this.props.ros.appNames = message.apps_ordered_list

  }

  // Function for configuring and subscribing to Status
  updateAppsMgrStatusListener() {
    const statusNamespace = this.getAppsMgrNamespace() + '/status'
    if (this.state.appsMgrListener) {
      this.state.appsMgrListener.unsubscribe()
    }
    var appsMgrListener = this.props.ros.setupStatusListener(
          statusNamespace,
          "nepi_interfaces/MgrAppsStatus",
          this.appsStatusListener
        )
    this.setState({ appsMgrListener: appsMgrListener,
      needs_update: false})
  }


  // Callback for handling ROS Status messages
  drvsStatusListener(message) {
    this.setState({
      drvs_list: message.pkg_list,
      drvs_type_list: message.type_list,
      drvs_active_list: message.active_pkg_list,
      drvs_active_type_list: message.active_type_list,
      drvs_connected: true
    })    

  }

  // Function for configuring and subscribing to Status
  updateDrvsMgrStatusListener() {
    const statusNamespace = this.getDrvsMgrNamespace() + '/status'
    if (this.state.drvsListener) {
      this.state.drvsListener.unsubscribe()
    }
    var drvsListener = this.props.ros.setupStatusListener(
          statusNamespace,
          "nepi_interfaces/MgrDriversStatus",
          this.drvsStatusListener
        )
    this.setState({ drvsListener: drvsListener,
      needs_update: false})
  }



  componentDidMount(){
    this.checkConnection()
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace = this.getAppsMgrNamespace()
    const namespace_updated = (prevState.appsMgrNamespace !== namespace && namespace !== null)
    const needs_update = (this.state.needs_update && namespace !== null)
    if (namespace_updated || needs_update) {
      if (namespace.indexOf('null') === -1){
        this.setState({
          appsMgrNamespace: namespace,
        })
        this.updateAppsMgrStatusListener()
      } 
    }

    const drvsNamespace = this.getDrvsMgrNamespace()
    const drvsNamespace_updated = (prevState.drvsNamespace !== drvsNamespace && drvsNamespace !== null)
    if (namespace_updated ) {
      if (drvsNamespace.indexOf('null') === -1){
        this.setState({
          drvsNamespace: drvsNamespace,
        })
        this.updateDrvsMgrStatusListener()
      } 
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.drvsListener) {
      this.state.drvsListener.unsubscribe()
    }
    if (this.state.appsMgrListener) {
      this.state.appsMgrListener.unsubscribe()
    }
  }


  renderNoneApp() {
    return (
      <Columns>
        <Column>

      </Column>
      </Columns>
    )
  }


  
  renderDriversMgr() {
    return (
      <Columns>
        <Column>

        <DriversMgr
         title={"Drivers Manager"}
         />

      </Column>
      </Columns>
    )
  }




  renderIdxDev() {
    return (
      <Columns>
        <Column>

        <IDX
         title={"IdxDevice"}
         />

      </Column>
      </Columns>
    )
  }

  renderPtxDev() {
    return (
      <Columns>
        <Column>

        <PTX
         title={"PtxDevice"}
         />

      </Column>
      </Columns>
    )
  }


  renderLsxDev() {
    return (
      <Columns>
        <Column>

        <LSX
         title={"LsxDevice"}
         />

      </Column>
      </Columns>
    )
  }

  renderRbxDev() {
    return (
      <Columns>
        <Column>

        <RBX
         title={"RbxDevice"}
         />

         </Column>
         </Columns>
       )
     }

  renderNpxDev() {
    return (
      <Columns>
        <Column>

        <NPX
         title={"NpxDevice"}
         />
      </Column>
      </Columns>
    )
  }

  




  renderApplication() {
    const sel_app = this.state.selected_app
    const {appNameList, appStatusList} = this.props.ros

    if (sel_app === "NONE"){
      return (
        <React.Fragment>
          {this.renderNoneApp()}    
        </React.Fragment>
      )
    }
    else if (sel_app === "Imaging"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {this.state.selected_app}
            </label>
            {this.renderIdxDev()}    
        </React.Fragment>
      )
    }
    else if (sel_app === "PanTilts"){
      return (
        <React.Fragment>
          <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {this.state.selected_app}
          </label>
          {this.renderPtxDev()}    
        </React.Fragment>
      )
    }
    else if (sel_app === "Lights"){
      return (
        <React.Fragment>
          <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {this.state.selected_app}
          </label>
          {this.renderLsxDev()}    
        </React.Fragment>
      )
    }
    else if (sel_app === "Robots"){
      return (
        <React.Fragment>
          <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {this.state.selected_app}
          </label>
          {this.renderRbxDev()}    
        </React.Fragment>
      )
    }
    else if (sel_app === "NavPose"){
      return (
        <React.Fragment>
          <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {this.state.selected_app}
          </label>
          {this.renderNpxDev()}    
        </React.Fragment>
      )
    }
    else if (appNameList.indexOf(sel_app) !== -1){
      return (
         <AppRender
         sel_app={sel_app}
         />
       );
     }
    else if (sel_app === "Driver Mgr"){
      return (
        <React.Fragment>
          <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
          </label>
          {this.renderDriversMgr()}    
        </React.Fragment>
      )
    }
    else {
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
          </label>

          <Columns>
          <Column>

          </Column>
          </Columns> 
        </React.Fragment>
      )
    }


  }




  onToggleAppSelection(event){
    const app_name = event.target.value
    if (app_name !== 'Connecting'){
      this.setState({selected_app: app_name})
    }
  }


  // Function for creating image topic options.
  getAppOptions() {
    const {idxDevices,lsxDevices,ptxDevices,rbxDevices,npxDevices} = this.props.ros
    const typeList = this.state.drvs_active_type_list
    var items = []
    const connected = this.state.drvs_connected && this.state.apps_connected
    const appsList = this.state.apps_list
    const ruiList = this.state.apps_rui_list 
    const groupList = this.state.apps_group_list
    const activeAppList = this.state.apps_active_list
    const activeModelTypes = this.state.active_models_types

    if (connected !== true){
      items.push(<Option value={'Connecting'}>{'Connecting'}</Option>)
    }
    else {


      if (typeList) {
        if (typeList.length > 0){
            if (Object.keys(idxDevices).length > 0){
              items.push(<Option value={"Imaging"}>{"Imaging"}</Option>)
            }
            if (Object.keys(ptxDevices).length > 0){
              items.push(<Option value={"PanTilts"}>{"PanTilts"}</Option>)
            }
            if (Object.keys(lsxDevices).length > 0){
              items.push(<Option value={"Lights"}>{"Lights"}</Option>)
            }
            if (Object.keys(rbxDevices).length > 0){
              items.push(<Option value={"Robots"}>{"Robots"}</Option>)
            }
            if (Object.keys(npxDevices).length > 0){
              items.push(<Option value={"NavPose"}>{"NavPose"}</Option>)
            }
        }
      }

      if (appsList.length > 0){
        for (var i = 0; i < ruiList.length; i++) {
          if (groupList[i] === "DEVICE" && ruiList[i] !== "None" && activeAppList.indexOf(appsList[i]) !== -1 ){
            items.push(<Option value={appsList[i]}>{ruiList[i]}</Option>)
          }
        }
      }
      items.push(<Option value={"Driver Mgr"}>{"Driver Mgr"}</Option>)
    }
    //items.push(<Option value={'TEST1'}>{'TEST1'}</Option>)
    //items.push(<Option value={'TEST2'}>{'TEST2'}</Option>)
    return items
  }


    renderSelection() {
    const app_options = this.getAppOptions()

    return (
      <React.Fragment>

      <Columns>
        <Column>

        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Select Device App"}
         </label>

        <div style={{backgroundColor: Styles.vars.colors.grey0}}>
            <Select style={{width: "10px"}}/>
            {app_options.map((app) =>
            <div onClick={this.onToggleAppSelection}
              style={{
                textAlign: "center",
                padding: `${Styles.vars.spacing.xs}`,
                color: Styles.vars.colors.black,
                backgroundColor: (app.props.value === this.state.selected_app) ? Styles.vars.colors.blue : Styles.vars.colors.grey0,
                cursor: "pointer",
                }}>
                <body app-topic ={app} style={{color: (app === 'Connecting') ? Styles.vars.colors.blue : Styles.vars.colors.black}}>{app}</body>
            </div>
            )}
         
        </div>
      </Column>
      </Columns>

      </React.Fragment>
    )
  }



  render() {
    const full_screen = (this.state.selected_app !== 'NONE')
    const hide_full_screen = this.state.selected_app === 'NONE'

    if (full_screen === true){
      return(
          <React.Fragment>

               {this.renderApplication()}
          </React.Fragment>
      )
    }
    else {
      return (


        <div style={{ display: 'flex' }}>
          <div style={{ width: '10%' }}>


            {this.renderSelection()}
          </div>

     
          <div style={{ width: '90%' }}>

          </div>
        </div>

      )
    }
  }

}

export default DevicesSelector
