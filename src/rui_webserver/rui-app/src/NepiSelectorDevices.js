/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */
import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import { Columns, Column } from "./Columns"
import Select, { Option } from "./Select"
import Styles from "./Styles"

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
      show_delete_app: false,

      appsMgrName: "apps_mgr",
      appsMgrNamespace: null,

      drvsMgrName: "drivers_mgr",
      drvsMgrNamespace: null,

      viewableApps: false,

      apps_list: ['NONE'],
      last_apps_list: [],
      apps_active_list: [],
      apps_active_type_list: [],
      apps_install_path: null,
      apps_install_list: [],


      apps_rui_list: null,
      apps_type_list: [],

      app_name: 'NONE',
      app_description: null,
      apps_path: null,
      app_options_menu: null,
      active_state: null,

      backup_removed_apps: true,


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

      backup_removed_drvs: true,


      selected_app: 'NONE',

      apps_connected: false,
      drvs_connected: false,

      appsListener: null,
      appListener: null,

      drvsListener: null,
      drvListener: null,

      needs_update: false
    }

    this.checkConnection = this.checkConnection.bind(this)

    this.getDrvsMgrNamespace = this.getDrvsMgrNamespace.bind(this)
    this.getAppsMgrNamespace = this.getAppsMgrNamespace.bind(this)

    this.updateMgrAppsStatusListener = this.updateMgrAppsStatusListener.bind(this)
    this.appsStatusListener = this.appsStatusListener.bind(this)

    this.updateDrvsMgrStatusListener = this.updateDrvsMgrStatusListener.bind(this)
    this.drvsStatusListener = this.drvsStatusListener.bind(this)

    this.toggleViewableApps = this.toggleViewableApps.bind(this)  
    this.onToggleAppSelection = this.onToggleAppSelection.bind(this)  

  }

  getDrvsMgrNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var drvsMgrNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      drvsMgrNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.drvsMgrName
    }
    return drvsMgrNamespace
  }

  getAppsMgrNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var appsMgrNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      appsMgrNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.appsMgrName
    }
    return appsMgrNamespace
  }


  // Callback for handling ROS Status messages
  appsStatusListener(message) {
    this.setState({
      apps_path: message.apps_path,
      apps_list: message.apps_ordered_list,
      apps_group_list: message.apps_group_list,
      apps_rui_list: message.apps_rui_list,
      apps_active_list: message.apps_active_list,
      apps_install_path: message.apps_install_path,
      apps_install_list: message.apps_install_list,
      backup_removed_apps: message.backup_removed_apps,

      apps_connected: true
    })    

    this.props.ros.appNames = message.apps_ordered_list

  }

  // Function for configuring and subscribing to Status
  updateMgrAppsStatusListener() {
    const statusNamespace = this.getAppsMgrNamespace() + '/status'
    if (this.state.appsListener) {
      this.state.appsListener.unsubscribe()
    }
    var appsListener = this.props.ros.setupStatusListener(
          statusNamespace,
          "nepi_interfaces/MgrAppsStatus",
          this.appsStatusListener
        )
    this.setState({ appsListener: appsListener,
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


  async checkConnection() {
    const { namespacePrefix, deviceId} = this.props.ros
    if (namespacePrefix != null && deviceId != null) {
      this.setState({needs_update: true})
    }
    else {
      setTimeout(async () => {
        await this.checkConnection()
      }, 1000)
    }
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
        this.updateMgrAppsStatusListener()
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
    if (this.state.appsListener) {
      this.state.appsListener.unsubscribe()
    }
  }

  toggleViewableApps() {
    const viewable = !this.state.viewableApps
    this.setState({viewableApps: viewable})
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

  


  toggleViewableApps() {
    const viewable = !this.state.viewableApps
    this.setState({viewableApps: viewable})
  }


  onToggleAppSelection(event){
    const app_name = event.target.value
    this.setState({selected_app: app_name})
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
    const connected = this.state.drvs_connected && this.state.apps_connected 
    const hide_app_list = !this.state.viewableApps && !connected

    return (
      <React.Fragment>

      <Columns>
        <Column>

        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Select Device App"}
         </label>
         

          <div onClick={this.onToggleAppSelection} style={{backgroundColor: Styles.vars.colors.grey0}}>
            <Select style={{width: "10px"}}/>
          </div>
          <div hidden={hide_app_list}>
          {app_options.map((app) =>
          <div onClick={this.onToggleAppSelection}
            style={{
              textAlign: "center",
              padding: `${Styles.vars.spacing.xs}`,
              color: Styles.vars.colors.black,
              backgroundColor: (app.props.value === this.state.selected_app) ? Styles.vars.colors.blue : Styles.vars.colors.grey0,
              cursor: "pointer",
              }}>
              <body app-topic ={app} style={{color: Styles.vars.colors.black}}>{app}</body>
          </div>
          )}
          </div>

      </Column>
      </Columns>

      </React.Fragment>
    )
  }


  renderApplication() {
    const sel_app = this.state.selected_app
    const {appNameList, appStatusList} = this.props.ros

    if (sel_app === "NONE"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {this.state.selected_app}
          </label>
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
            {this.state.selected_app}
          </label>
          {this.renderDriversMgr()}    
        </React.Fragment>
      )
    }


  }



  render() {
    return (


      <div style={{ display: 'flex' }}>
        <div style={{ width: '10%' }}>
          {this.renderSelection()}
        </div>

        <div style={{ width: '5%' }}>
          {}
        </div>

        <div style={{ width: '85%' }}>
          {this.renderApplication()}
        </div>
      </div>

    )
  }

}

export default DevicesSelector
