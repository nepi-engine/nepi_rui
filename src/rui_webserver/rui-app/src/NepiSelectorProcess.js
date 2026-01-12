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

import TargetsMgr from "./NepiMgrTargets"
import AiDetectorMgr from "./NepiMgrAiDetector"
//import AiSegmentorMgr from "./NepiMgrAiSegmentor"
//import AiPoserMgr from "./NepiMgrAiPoser"
//import AiOrientatorMgr from "./NepiMgrAiOrientator"
import AifsMgr from "./NepiSystemAIFs"

import AppRender from "./Nepi_IF_Apps"



@inject("ros")
@observer

// Pointcloud Application page
class ProcessSelector extends Component {
  constructor(props) {
    super(props)

    this.state = {
      show_delete_app: false,
      appsMgrName: "apps_mgr",
      appsMgrNamespace: null,

      viewableApps: false,

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

      aiMgrName: "ai_model_mgr",
      aiMgrNamespace: null,


      frameworks_list: [],
      active_framework: "None",
      models_list:  [],
      models_aifs: [],
      models_types: [],
      active_models_list:  [],
      active_models_types: [],


      selected_app_install_pkg: null,
      needs_update: false
    }

    this.checkConnection = this.checkConnection.bind(this)

    this.getAppsMgrNamespace = this.getAppsMgrNamespace.bind(this)
    this.getAiMgrNamespace = this.getAiMgrNamespace.bind(this)

    this.updateMgrAppsStatusListener = this.updateMgrAppsStatusListener.bind(this)
    this.appsStatusListener = this.appsStatusListener.bind(this)

    this.updateAiMgrStatusListener = this.updateAiMgrStatusListener.bind(this)
    this.aiMgrStatusListener = this.aiMgrStatusListener.bind(this)
    


    this.toggleViewableApps = this.toggleViewableApps.bind(this)  
    this.onToggleAppSelection = this.onToggleAppSelection.bind(this)  

    
  }

  getAppsMgrNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var appsMgrNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      appsMgrNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.appsMgrName
    }
    return appsMgrNamespace
  }

  getAiMgrNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var aiMgrNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      aiMgrNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.aiMgrName
    }
    return aiMgrNamespace
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

      connected: true
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
  aiMgrStatusListener(message) {
    this.setState({
      frameworks_list: message.ai_frameworks,
      models_list: message.ai_models,
      models_aifs: message.ai_models_frameworks,
      models_types: message.ai_models_types,
      active_framework: message.active_ai_framework,
      active_models_list: message.active_ai_models,
      active_models_types: message.active_ai_models_types
    })    

  }

  // Function for configuring and subscribing to Status
  updateAiMgrStatusListener() {
    const statusNamespace = this.getAiMgrNamespace() + '/status'
    if (this.state.aiMgrListener) {
      this.state.aiMgrListener.unsubscribe()
    }
    var aiMgrListener = this.props.ros.setupStatusListener(
          statusNamespace,
          "nepi_interfaces/MgrAiModelsStatus",
          this.aiMgrStatusListener
        )
    this.setState({ aiMgrListener: aiMgrListener})
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

    const aiNamespace = this.getAiMgrNamespace()
    const aiNamespace_updated = (prevState.aiNamespace !== aiNamespace && aiNamespace !== null)
    if (namespace_updated ) {
      if (aiNamespace.indexOf('null') === -1){
        this.setState({
          aiMgrNamespace: aiNamespace,
        })
        this.updateAiMgrStatusListener()
      } 
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.appsListener) {
      this.state.appsListener.unsubscribe()
    }
    if (this.state.aiMgrListener) {
      this.state.aiMgrListener.unsubscribe()
    }
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
    const appsList = this.state.apps_list
    const ruiList = this.state.apps_rui_list 
    const groupList = this.state.apps_group_list
    const activeAppList = this.state.apps_active_list
    const activeModelTypes = this.state.active_models_types
    var items = []
    const connected = this.state.connected
    if (connected !== true){
      items.push(<Option value={'Connecting'}>{'Connecting'}</Option>)
    }
    else {
      if (appsList.length > 0){
        for (var i = 0; i < ruiList.length; i++) {
          if (groupList[i] === "PROCESS" && ruiList[i] !== "None" && activeAppList.indexOf(appsList[i]) !== -1 ){
            items.push(<Option value={appsList[i]}>{ruiList[i]}</Option>)
          }
        }
      }

      if (activeModelTypes.indexOf('detection') !== -1){
        items.push(<Option value={'AI Detector'}>{'AI Detector'}</Option>)
      }
      if (activeModelTypes.indexOf('segmentation') !== -1){
        items.push(<Option value={'AI Segmetation'}>{'AI Segmetation'}</Option>)
      }
      if (activeModelTypes.indexOf('pose') !== -1){
        items.push(<Option value={'AI Pose'}>{'AI Pose'}</Option>)
      }
      if (activeModelTypes.indexOf('orientation') !== -1){
        items.push(<Option value={'AI Orienation'}>{'AI Orienation'}</Option>)
      }

      //items.push(<Option value={'Targeting'}>{'Targeting'}</Option>)
      
      items.push(<Option value={'Model Manager'}>{'Model Manager'}</Option>)
      //items.push(<Option value={"AI PanTilt Tracker"}>{"AI PanTilt Tracker"}</Option>)
    }
    return items
  }


  renderSelection() {
    const app_options = this.getAppOptions()
    const hide_app_list = !this.state.viewableApps && !this.state.connected

    return (
      <React.Fragment>

      <Columns>
        <Column>

        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Select Process App"}
         </label>
         

          <div onClick={this.toggleViewableApps} style={{backgroundColor: Styles.vars.colors.grey0}}>
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
  
    if (sel_app === "Targeting"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <TargetsMgr
              title={"Targeting"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }
    if (sel_app === "AI Detector"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <AiDetectorMgr
              title={"AI Detector"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }

    {/*
    if (sel_app === "AI Segmentor"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <AiSegmentorMgr
              title={"AI Segmentor"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }
    if (sel_app === "AI Poser"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <AiPoserMgr
              title={"AI Poser"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }
    if (sel_app === "AI Orientator"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <AiOrientatorMgr
              title={"AI Orientator"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }
  */}
    if (sel_app === "Model Manager"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <AifsMgr
              title={"Model Manager"}
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

export default ProcessSelector
