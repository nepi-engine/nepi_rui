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

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Toggle from "react-toggle"
import Select, { Option } from "./Select"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"
import Input from "./Input"
import BooleanIndicator from "./BooleanIndicator"

import PointcloudApp from "./NepiAppPointcloud"
import AiTargetingApp from "./NepiAppAiTargeting"
import ImageViewerApp from "./NepiAppImageViewer"
import ImageSequencer from "./NepiAppImageSequencer"
import OnvifApp from "./NepiAppOnvif"




import { round, convertStrToStrList, createShortValuesFromNamespaces, onChangeSwitchStateValue,createMenuListFromStrList,
  onDropdownSelectedSendStr, onUpdateSetStateValue, onEnterSendFloatValue, onEnterSetStateFloatValue, onDropdownSelectedSetState, onDropdownSelectedSendAppOption
  } from "./Utilities"

@inject("ros")
@observer

// Pointcloud Application page
class AppsSelector extends Component {
  constructor(props) {
    super(props)

    this.state = {
      show_delete_app: false,
      mgrName: "apps_mgr",
      mgrNamespace: null,

      viewableApps: false,

      apps_list: [],
      last_apps_list: [],
      apps_active_list: [],
      apps_install_path: null,
      apps_install_list: [],
      selected_app: null,

      app_name: 'NONE',
      app_description: null,
      apps_path: null,
      app_options_menu: null,
      active_state: null,

      backup_removed_apps: true,

      connected: false,

      appsListener: null,
      appListener: null,

      app_selected: null,



      selected_app_install_pkg: null
    }


    this.getMgrNamespace = this.getMgrNamespace.bind(this)

    this.sendAppUpdateOrder = this.sendAppUpdateOrder.bind(this)
    this.toggleViewableApps = this.toggleViewableApps.bind(this)
    this.getAppOptions = this.getAppOptions.bind(this)
    this.getInstallOptions = this.getInstallOptions.bind(this)
    this.onToggleAppSelection = this.onToggleAppSelection.bind(this)

    this.updateAppsStatusListener = this.updateAppsStatusListener.bind(this)
    this.appsStatusListener = this.appsStatusListener.bind(this)

    this.updateAppStatusListener = this.updateAppStatusListener.bind(this)
    this.statusAppListener = this.statusAppListener.bind(this)
    this.statusAppListener = this.statusAppListener.bind(this)
    this.convertAppStrInstallToStrList = this.convertAppStrInstallToStrList.bind(this)

    this.getDisabledStr = this.getDisabledStr.bind(this)
    this.getActiveStr = this.getActiveStr.bind(this)
    this.getReadyStr = this.getReadyStr.bind(this)

  
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
    const apps_str_list = convertStrToStrList(message.apps_ordered_list)
    this.setState({
      apps_path: message.apps_path,
      apps_list: apps_str_list,
      apps_active_list: convertStrToStrList(message.apps_active_list),
      apps_install_path: message.apps_install_path,
      apps_install_list: this.convertAppStrInstallToStrList(message.apps_install_list),
      backup_removed_apps: message.backup_removed_apps,
      selected_app: message.selected_app
    })    

    const last_apps_list = this.state.apps_list
    this.setState({
      last_apps_list: apps_str_list
    })
    if (last_apps_list !== apps_str_list){
      this.render()
    }
  }

  // Function for configuring and subscribing to Status
  updateAppsStatusListener() {
    const statusNamespace = this.getMgrNamespace() + '/status'
    if (this.state.appsListener) {
      this.state.appsListener.unsubscribe()
    }
    var appsListener = this.props.ros.setupStatusListener(
          statusNamespace,
          "nepi_ros_interfaces/AppsStatus",
          this.appsStatusListener
        )
    this.setState({ appsListener: appsListener})
  }


  statusAppListener(message) {
    this.setState({
  
      app_name: message.name,
      app_description: message.description,
      active_state: message.active_state,
      order: message.order,
      msg_str: message.msg_str

    })
  }

    // Function for configuring and subscribing to Status
    updateAppStatusListener() {
      const namespace = this.getMgrNamespace()
      const statusNamespace = namespace + '/status_app'
      if (this.state.appListener) {
        this.state.appListener.unsubscribe()
      }
      var appListener = this.props.ros.setupStatusListener(
            statusNamespace,
            "nepi_ros_interfaces/AppStatus",
            this.statusAppListener
          )
      this.setState({ appListener: appListener})
    }


  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace = this.getMgrNamespace()
    if (prevState.mgrNamespace !== namespace && namespace !== null) {
      if (namespace.indexOf('null') === -1) {
        this.setState({
          mgrNamespace: namespace,
          connected: true
        })
        this.updateAppsStatusListener()
        this.updateAppStatusListener()
      } 
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.appsListener) {
      this.state.appsListener.unsubscribe()
      this.state.appListener.unsubscribe()
    }
  }

  toggleViewableApps() {
    const set = !this.state.viewableApps
    this.setState({viewableApps: set})
  }

  // Function for creating image topic options.
  getAppOptions() {
    const appsList = this.state.apps_active_list  
    var items = []
    items.push(<Option>{"NONE"}</Option>) 
    if (appsList.length > 0){
      for (var i = 0; i < appsList.length; i++) {
          items.push(<Option value={appsList[i]}>{appsList[i]}</Option>)
     }
    }
    return items
  }


  onToggleAppSelection(event){
    const {sendStringMsg} = this.props.ros
    const app_name = event.target.value
    const selectNamespace = this.state.mgrNamespace + "/select_app"
    sendStringMsg(selectNamespace,app_name)
    this.toggleViewableApps()
  }


  sendAppUpdateOrder(){
    const {sendUpdateOrderMsg} = this.props.ros
    var namespace = this.state.mgrNamespace
    var app_name = this.state.app_name
    var move_cmd = this.state.move_cmd
    sendUpdateOrderMsg(namespace,app_name,move_cmd)
  }
  convertAppStrInstallToStrList(inputStr) {
    var strList = []
    if (inputStr != null){
      inputStr = inputStr.replaceAll("[","")
      inputStr = inputStr.replaceAll("]","")
      inputStr = inputStr.replaceAll(" '","")
      inputStr = inputStr.replaceAll("'","")
      strList = inputStr.split(",")
      
    }
    return strList
  }

  // Function for creating image topic options.
  getInstallOptions() {
    const appsList = this.state.apps_install_list
    var items = []
    items.push(<Option>{"NONE"}</Option>) 
    if (appsList.length > 0){
      for (var i = 0; i < appsList.length; i++) {
          items.push(<Option value={appsList[i]}>{appsList[i]}</Option>)
      }
    }
    return items
  }option

/*}
  onDropdownSelectedSendAppOption(event) {
    const {appUpdateOptionMsg} = this.props.ros
    const {sendStringMsg} = this.props.ros
    const namespace = this.state.mgrNamespace
    const app_name = this.state.app_name
    const option_str = event.target.value

    appUpdateOptionMsg(namespace, app_name, option_str)
  }
*/
  
 


  getActiveStr(){
    const active =  this.state.apps_active_list
    var config_str_list = []
    for (var i = 0; i < active.length; i++) {
      config_str_list.push(active[i])
      config_str_list.push("\n")
    }
    const config_str =config_str_list.join("")
    return config_str
  }

  
  getDisabledStr(){
    const installed = this.state.apps_list
    const active =  this.state.apps_active_list
    var config_str_list = []
    for (var i = 0; i < installed.length; i++) {
      if (active.indexOf(installed[i]) === -1){
        config_str_list.push(installed[i])
        config_str_list.push("\n")
      }
    }
    const config_str =config_str_list.join("")
    return config_str
  }


  getReadyStr(){
    const ready = this.state.apps_install_list
    var config_str_list = []
    for (var i = 0; i < ready.length; i++) {
      config_str_list.push(ready[i])
      config_str_list.push("\n")
    }
    const config_str =config_str_list.join("")
    return config_str
  }

  renderAiTargetingApp() {
    return (
      <Columns>
        <Column>

        <AiTargetingApp
         title={"AiTargetingApp"}
         />

      </Column>
      </Columns>
    )
  }

  renderImageSequencerApp() {
    return (
      <Columns>
        <Column>

        <ImageSequencer
         title={"ImageSequencer"}
         />

      </Column>
      </Columns>
    )
  }

  renderImageViewerApp() {
    return (
      <Columns>
        <Column>

        <ImageViewerApp
         title={"ImageViewerApp"}
         />

      </Column>
      </Columns>
    )
  }

  renderOnvifApp() {
    return (
      <Columns>
        <Column>

        <OnvifApp
         title={"OnvifApp"}
         />

      </Column>
      </Columns>
    )
  }

  renderPointcloudApp() {
    return (
      <Columns>
        <Column>

        <PointcloudApp
         title={"PointcloudApp"}
         />

      </Column>
      </Columns>
    )
  }



  render() {
    const { sendStringMsg, sendTriggerMsg,sendBoolMsg, sendUpdateOrderMsg, sendUpdateActiveStateMsg} = this.props.ros
    const {apps_ordered_list, apps_active_list} = this.state
    const connected = this.state.connected
    const selected_app = this.state.selected_app
    const viewableApps = this.state.viewableApps
    const app_options = this.getAppOptions()
    const active_app_list = this.state.apps_active_list
    const NoneOption = <Option>None</Option>

    return (
      <Columns>
        <Column>

        <Label title={"Combine Options"}>
                    <Select
                      id="combine_options"
                      onChange={(event) => onUpdateSetStateValue.bind(this)(event,"app_selected")}
                      value={this.state.app_selected}
                    >
                      {this.state.apps_active_list
                        ? createMenuListFromStrList(this.state.apps_active_list, false, [],[],[])
                        : NoneOption}
                    </Select>
                  </Label>

                  {/*}
        <Label title="Select App">
                    <div onClick={this.toggleViewableApps} style={{backgroundColor: Styles.vars.colors.grey0}}>
                      <Select style={{width: "10px"}}/>
                    </div>
                    <div hidden={!viewableApps}>
                    {app_options.map((app) =>
                    <div onClick={this.onToggleAppSelection}
                      style={{
                        textAlign: "center",
                        padding: `${Styles.vars.spacing.xs}`,
                        color: Styles.vars.colors.black,
                        backgroundColor: (app.props.value === selected_app) ?
                          Styles.vars.colors.green :
                          (active_app_list.includes(app.props.value)) ? Styles.vars.colors.blue : Styles.vars.colors.grey0,
                        cursor: "pointer",
                        }}>
                        <body app-topic ={app} style={{color: Styles.vars.colors.black}}>{app}</body>
                    </div>
                    )}
                    </div>
                  </Label>
*/}

                  <div hidden={this.state.app_selected !== "AI_Targeting"}>
                  {this.renderAiTargetingApp()}    
                  </div>

                  <div hidden={this.state.app_selected !== "Image_Sequencer"}>
                  {this.renderImageSequencerApp()}    
                  </div>

                  <div hidden={this.state.app_selected !== "Image_Viewer"}>
                  {this.renderImageViewerApp()}    
                  </div>


                  <div hidden={this.state.app_selected !== "ONVIF"}>
                  {this.renderOnvifApp()}    
                  </div>

                  <div hidden={this.state.app_selected !== "Pointcloud"}>
                  {this.renderPointcloudApp()}    
                  </div>

      </Column>
      </Columns>


    )
  }

}

export default AppsSelector
