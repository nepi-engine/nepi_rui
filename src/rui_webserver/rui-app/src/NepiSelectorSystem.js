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

      needs_update: true
    }

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



  componentDidMount(){
    this.checkConnection()
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace = this.getAppsMgrNamespace()

    const {topicNames} = this.props.ros
    //Unused const script_file = this.state.automationSelectedScript
    const check_topic = namespace + "/status"
    const topic_publishing = topicNames ? topicNames.indexOf(check_topic) !== -1 : false

    const namespace_updated = (prevState.appsMgrNamespace !== namespace && namespace !== null)
    const needs_update = (this.state.needs_update && namespace !== null && topic_publishing)
    if (namespace_updated || needs_update) {
      if (namespace.indexOf('null') === -1){
        this.setState({
          appsMgrNamespace: namespace,
        })
        this.updateAppsMgrStatusListener()
      } 
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.appsMgrListener) {
      this.state.appsMgrListener.unsubscribe()
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
    const appsList = this.state.apps_list
    const ruiList = this.state.apps_rui_list 
    const groupList = this.state.apps_group_list
    const activeList = this.state.apps_active_list
    var items = []
    const apps_connected = this.state.apps_connected
    if (apps_connected !== true){
      items.push(<Option value={'Connecting'}>{'Connecting'}</Option>)
    }
    else {



      items.push(<Option value={'Device Manager'}>{'Device Manager'}</Option>)
      items.push(<Option value={'Software Manager'}>{'Software Manager'}</Option>)
      items.push(<Option value={'NavPose Manager'}>{'NavPose Manager'}</Option>)
      items.push(<Option value={'Driver Manager'}>{'Driver Manager'}</Option>)
      items.push(<Option value={'AI Model Manager'}>{'AI Model Manager'}</Option>)
      items.push(<Option value={'Apps Manager'}>{'Apps Manager'}</Option>)
      if (appsList.length > 0){
        for (var i = 0; i < ruiList.length; i++) {
          if (groupList[i] === "System" && ruiList[i] !== "None" && activeList.indexOf(appsList[i]) !== -1){
            items.push(<Option value={appsList[i]}>{ruiList[i]}</Option>)
          }
        }
      }
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

export default SystemSelector
