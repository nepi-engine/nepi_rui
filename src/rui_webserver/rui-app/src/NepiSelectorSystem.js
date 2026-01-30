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
import Label from "./Label"
import Toggle from "react-toggle"

import {onChangeSwitchStateValue} from "./Utilities"



import DeviceMgr from "./NepiSystemDevice"
import NavPoseMgr from "./NepiMgrNavPose"
import SoftwareMgr from "./NepiSystemSoftware"
import AifsMgr from "./NepiSystemAIFs"
import AppsMgr from "./NepiSystemApps"
import DriversMgr from "./NepiSystemDrivers"

import AppRender from "./Nepi_IF_Apps"


@inject("ros")
@observer

class SystemSelector extends Component {
  constructor(props) {
    super(props)

    this.state = {
      show_delete_app: false,
      mgrName: "apps_mgr",
      mgrNamespace: null,

      apps_list: ['NONE'],
      last_apps_list: [],
      apps_active_list: [],
      apps_install_path: null,
      apps_install_list: [],
      selected_app: 'NONE',

      apps_rui_list: [],
      apps_group_list: [],

      app_name: 'NONE',
      app_description: null,
      apps_path: null,
      app_options_menu: null,
      active_state: null,

      backup_removed_apps: true,

      connected: false,

      appsListener: null,
      appListener: null,

      needs_update: true
    }


    this.getMgrNamespace = this.getMgrNamespace.bind(this)

    this.updateMgrAppsStatusListener = this.updateMgrAppsStatusListener.bind(this)
    this.appsStatusListener = this.appsStatusListener.bind(this)

    this.toggleViewableApps = this.toggleViewableApps.bind(this)  
    this.onToggleAppSelection = this.onToggleAppSelection.bind(this)  

    
  }

  getMgrNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var mgrNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      mgrNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.mgrName
    }
    return mgrNamespace
  }

  // Callback for handling ROS Status messages
  appsStatusListener(message) {
    this.setState({
      apps_path: message.apps_path,
      apps_list: message.apps_ordered_list,
      apps_group_list: message.apps_group_list,
      apps_active_list: message.apps_active_list,
      apps_install_path: message.apps_install_path,
      apps_install_list: message.apps_install_list,
      backup_removed_apps: message.backup_removed_apps,
      apps_rui_list: message.apps_rui_list,
      connected: true
    })    

    this.props.ros.appNames = message.apps_ordered_list

  }

  // Function for configuring and subscribing to Status
  updateMgrAppsStatusListener() {
    const statusNamespace = this.getMgrNamespace() + '/status'
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




  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace = this.getMgrNamespace()

    const {topicNames} = this.props.ros
    //Unused const script_file = this.state.automationSelectedScript
    const check_topic = namespace + "/status"
    const topic_publishing = topicNames ? topicNames.indexOf(check_topic) !== -1 : false

    const namespace_updated = (prevState.mgrNamespace !== namespace && namespace !== null)
    const needs_update = (this.state.needs_update && namespace !== null && topic_publishing)
    if (namespace_updated || needs_update) {
      if (namespace.indexOf('null') === -1){
        this.setState({
          mgrNamespace: namespace,
        })
        this.updateMgrAppsStatusListener()
      } 
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.appsListener) {
      this.state.appsListener.unsubscribe()
    }
  }





  renderApplication() {
    const sel_app = this.state.selected_app

    const {appNameList} = this.props.ros
  

    if (sel_app === "Device Manager"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <DeviceMgr
              title={"Device Manager"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }

    if (sel_app === "Software Manager"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <SoftwareMgr
              title={"Software Manager"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }

    if (sel_app === "NavPose Manager"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <NavPoseMgr
              title={"NavPose Manager"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }

    if (sel_app === "Driver Manager"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <DriversMgr
              title={"Driver Manager"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }

    if (sel_app === "AI Model Manager"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <AifsMgr
              title={"AI Model Manager"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }

    if (sel_app === "Apps Manager"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <AppsMgr
              title={"Apps Manager"}
              />

          </Column>
          </Columns>  
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

    return (
      <React.Fragment>

      <Columns>
        <Column>

        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Select Device App"}
         </label>

        <div>
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

export default SystemSelector
