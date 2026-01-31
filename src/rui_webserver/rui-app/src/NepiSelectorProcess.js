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



      aiMgrName: 'ai_model_mgr',
      aiMgrNamespace: null,
      aiMgrListener: null,
      ai_connected: false,

      frameworks_list: [],
      active_framework: "None",
      models_list:  [],
      models_aifs: [],
      models_types: [],
      active_models_list:  [],
      active_models_types: [],


      needs_update: false
    }


    this.getAiMgrNamespace = this.getAiMgrNamespace.bind(this)
    this.updateAiMgrStatusListener = this.updateAiMgrStatusListener.bind(this)
    this.aiMgrStatusListener = this.aiMgrStatusListener.bind(this)

    this.checkConnection = this.checkConnection.bind(this)

    this.getAppsMgrNamespace = this.getAppsMgrNamespace.bind(this)

    this.updateAppsMgrStatusListener = this.updateAppsMgrStatusListener.bind(this)
    this.appsStatusListener = this.appsStatusListener.bind(this)

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



  async checkConnection() {
    const { connectedToNepi } = this.props.ros
    if (this.state.connectedToNepi !== connectedToNepi){
      this.setState({connectedToNepi: connectedToNepi,
                    appsMgrNamespace: null, apps_connected: false,
                    aiMgrNamespace: null, ai_connected: false,
                    selected_app: 'NONE', needs_update: true})
    }

    setTimeout(async () => {
      await this.checkConnection()
    }, 1000)
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
  aiMgrStatusListener(message) {
    this.setState({
      frameworks_list: message.ai_frameworks,
      models_list: message.ai_models,
      models_aifs: message.ai_models_frameworks,
      models_types: message.ai_models_types,
      active_framework: message.active_ai_framework,
      active_models_list: message.active_ai_models,
      active_models_types: message.active_ai_models_types,

      ai_connected: true
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
    if (this.state.appsMgrListener) {
      this.state.appsMgrListener.unsubscribe()
    }
    if (this.state.aiMgrListener) {
      this.state.aiMgrListener.unsubscribe()
    }
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



  onToggleAppSelection(event){
    const app_name = event.target.value
    if (app_name !== 'Connecting'){
      this.setState({selected_app: app_name})
    }
  }


  // Function for creating image topic options.
  getAppOptions() {
    const appsList = this.state.apps_list
    const ruiList = this.state.apps_rui_list 
    const groupList = this.state.apps_group_list
    const activeAppList = this.state.apps_active_list
    const activeModelTypes = this.state.active_models_types
    var items = []
    const connected = this.state.apps_connected && this.state.ai_connected
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

export default ProcessSelector
