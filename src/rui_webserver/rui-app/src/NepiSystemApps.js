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

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Toggle from "react-toggle"
import Select, { Option } from "./Select"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"
import Input from "./Input"
import BooleanIndicator from "./BooleanIndicator"


import { onChangeSwitchStateValue, onDropdownSelectedSetState
  } from "./Utilities"

@inject("ros")
@observer

// Pointcloud Application page
class AppsMgr extends Component {
  constructor(props) {
    super(props)

    this.state = {
      show_delete_app: false,
      mgrName: "apps_mgr",
      mgrNamespace: null,

      viewableApps: false,
      viewableGroups: false,





      group_list: ['DEVICE','DATA','NAVPOSE','AI','AUTOMATION','DRIVER'],
      group_names: ['Device','Data','NavPose','AI','Automation','Driver'],
      selected_group: "All",

      selected_app: 'None',

      app_status_msg: null,
      app_name: 'None',
      display_name: 'None',
      pkg_name: 'None',
      group: 'None',
      node_name: 'None',
      app_description: null,
      license_type: null,
      license_link: null,
      app_options_menu: null,
      enabled: null,
      running: null,

      backup_removed_apps: true,
      restart_enabled: false,
      selected_app_install_pkg: null,

      connected: false,

      needs_update: false
    }
    this.checkConnection = this.checkConnection.bind(this)

    this.getMgrNamespace = this.getMgrNamespace.bind(this)

    this.sendAppUpdateOrder = this.sendAppUpdateOrder.bind(this)
    this.toggleViewableApps = this.toggleViewableApps.bind(this)
    this.toggleViewableGroups = this.toggleViewableGroups.bind(this)
    this.getAppOptions = this.getAppOptions.bind(this)
    this.getGroupOptions = this.getGroupOptions.bind(this)
    this.onChangeGroupSelection = this.onChangeGroupSelection.bind(this)
    this.onToggleAppSelection = this.onToggleAppSelection.bind(this)


    this.getDisabledStr = this.getDisabledStr.bind(this)
    this.getActiveStr = this.getActiveStr.bind(this)


    this.getShortName = this.getShortName.bind(this)
  
  }

  getMgrNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var mgrNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      mgrNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.props.ros.appsMgrName
    }
    return mgrNamespace
  }



  async checkConnection() {
    const { connectedToNepi , connectedToAppsMgr, connectedToDriversMgr, connectedToAiModelsMgr} = this.props.ros
    if (this.state.connectedToNepi !== connectedToNepi){
      this.setState({connectedToNepi: connectedToNepi,
                    app_status_msg: null,
                    selected_app: 'None', needs_update: true})
    }
    if (this.state.connectedToAppsMgr !== connectedToAppsMgr )
    {
      this.setState({connected: true, needs_update: true})
    }

    setTimeout(async () => {
      await this.checkConnection()
    }, 1000)
  }





  componentDidMount(){
    this.checkConnection()
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const needs_update = this.state.needs_update
    if (needs_update === true) {
       
        const selected_app = this.state.selected_app
        const apps_list = this.props.ros.apps_list
        var app_status_msg = null
        if (apps_list.indexOf(selected_app) !== -1 && selected_app !== 'None'){
            app_status_msg = this.props.ros.callAppStatusQueryService(selected_app)
        }

        if ( app_status_msg != null) {
          this.setState({
            app_status_msg: app_status_msg,
            app_name: app_status_msg.name,
            display_name: app_status_msg.display_name,
            app_description: app_status_msg.description,
            pkg_name: app_status_msg.pkg_name,
            group: app_status_msg.group_name,
            node_name: app_status_msg.node_name,

            license_type: app_status_msg.license_type,
            license_link: app_status_msg.license_link,
            enabled: app_status_msg.enabled,
            running: app_status_msg.running,
            order: app_status_msg.order,
            msg_str: app_status_msg.msg_str
          })

        }
        else {
          this.setState({app_status_msg: null})
        }
        this.setState({needs_update: false})
      }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    this.setState({connected: false})
  }

  toggleViewableApps() {
    const set = !this.state.viewableApps
    this.setState({viewableApps: set})
  }

  toggleViewableGroups() {
    const set = !this.state.viewableGroups
    this.setState({viewableGroups: set})
  }

  getShortName(long_name) { 
    var short_name = long_name.replace("nepi_app_","")
    short_name = short_name.replaceAll("_"," ")
    return short_name
  }

  // Function for creating image topic options.
  getAppOptions() {


    const appsList = this.props.ros.apps_list 
    const groupsList = this.props.ros.apps_group_list
    const nameList = this.props.ros.apps_name_list
    const sel_group = this.state.selected_group
    var items = []
    var app_name = ""
    var display_name = ""
    if (appsList.length > 0){
      for (var i = 0; i < appsList.length; i++) {
          if (sel_group === "All" || groupsList[i] === sel_group){
            app_name = appsList[i]
            display_name = nameList[i]
            items.push(<Option value={app_name}>{display_name}</Option>)
          }
     }
    }
    else{
      items.push(<Option value={'None'}>{'None'}</Option>)
      //items.push(<Option value={'TEST1'}>{'TEST1'}</Option>)
      //items.push(<Option value={'TEST2'}>{'TEST2'}</Option>)
    }
    return items
  }

  // Function for creating group topic options.
  getGroupOptions() { 
    const groups = this.props.ros.apps_group_list
    const groupIds = this.state.group_list
    const groupNames = this.state.group_names
    var items = []
    items.push(<Option value={'None'}>{'None'}</Option>)
    items.push(<Option value={'All'}>{'All'}</Option>)
    if (groups.length > 0){
      for (var i = 0; i < groupIds.length; i++) {
        if (groups.indexOf(groupIds[i]) !== -1){
          items.push(<Option value={groupIds[i]}>{groupNames[i]}</Option>)
        }
      }
    }
    return items
  }
  


  onToggleAppSelection(event){
    const {sendStringMsg} = this.props.ros
    const app_name = event.target.value
    this.setState({selected_app: app_name})
    this.setState({needs_update: true})
  }


  sendAppUpdateOrder(){
    const {sendUpdateOrderMsg} = this.props.ros
    const namespace = this.getMgrNamespace()
    var app_name = this.state.app_name
    var move_cmd = this.state.move_cmd
    sendUpdateOrderMsg(namespace,app_name,move_cmd)
    this.setState({needs_update: true})
  }




  renderAppConfigure() {
    const { sendUpdateOrderMsg, sendUpdateBoolMsg} = this.props.ros

    const mgrNamespace = this.getMgrNamespace()
    const selected_app = this.state.selected_app
    const selected_app_index = this.props.ros.apps_list.indexOf(selected_app) 

    const display_name = (selected_app_index !== -1) ? this.props.ros.apps_name_list[selected_app_index] : ''
    const msg = (selected_app_index !== -1) ? this.props.ros.apps_msg_list[selected_app_index] : ''

    const enabled = this.props.ros.apps_active_list.indexOf(selected_app) !== -1
    const running = this.props.ros.apps_running_list.indexOf(selected_app) !== -1
    const disable_enable = (enabled === false && running === true)
    return (
      <React.Fragment>

        <Section title={"Configure App"}>

        <Label title={"Turn off unused apps for faster startup times"}> </Label>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>


          <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {display_name}
          </label>
  
          <Columns equalWidth={true}>
      <Column>


        <Label title="Enable/Disable App"> 
          <Toggle
            checked={enabled===true}
            onClick={() => sendUpdateBoolMsg(mgrNamespace + "/update_state", selected_app, !enabled)}
            disabled={disable_enable}>
          </Toggle>
      </Label>


      </Column>
      <Column>


      <Label title={"App Running"}>
          <BooleanIndicator value={running} />
        </Label>

      </Column>
      <Column>


      </Column>
      </Columns>

          <pre style={{ height: "50px", overflowY: "auto" }}>
          {"Description: " + this.state.app_description}
          </pre>

          <pre style={{ height: "50px", overflowY: "auto" }}>
          {"Status: " + msg}
          </pre>

          <pre style={{ height: "50px", overflowY: "auto" }}>
          {"License Type: " + this.state.license_type}
          </pre>

          <pre style={{ height: "50px", overflowY: "auto" }}>
          {"License Link: " + this.state.license_link}
          </pre>



      <Columns equalWidth={true}>
      <Column>

      <pre style={{ height: "50px", overflowY: "auto" }}>
          {"Group: " + this.state.group}
          </pre>

      </Column>
      <Column>

      <pre style={{ height: "50px", overflowY: "auto" }}>
          {"Node: " + this.state.node_name}
          </pre>



      </Column>
      <Column>
      <pre style={{ height: "50px", overflowY: "auto" }}>
          {"Package: " + this.state.pkg_name}
          </pre>
      </Column>
      </Columns>

        <Columns equalWidth={true}>
          <Column>


      <Label title={"Application Name"}>
        <Input disabled value={selected_app} />
      </Label>
 


   

      </Column>
      <Column>


        <Label title={"Start Order"}>
          <Input disabled value={this.state.order} />
        </Label>


        <ButtonMenu>
        <Button onClick={() => sendUpdateOrderMsg(mgrNamespace + "/update_order", selected_app, "top")}>{"Move to Top"}</Button>
        </ButtonMenu>

        <ButtonMenu>
        <Button onClick={() => sendUpdateOrderMsg(mgrNamespace + "/update_order", selected_app, "up")}>{"Move Up"}</Button>
        </ButtonMenu>

        <ButtonMenu>
          <Button onClick={() => sendUpdateOrderMsg(mgrNamespace + "/update_order", selected_app, "down")}>{"Move Down"}</Button>
        </ButtonMenu>

        <ButtonMenu>
          <Button onClick={() => sendUpdateOrderMsg(mgrNamespace + "/update_order", selected_app, "bottom")}>{"Move to Bottom"}</Button>
        </ButtonMenu>
        </Column>
        </Columns>

        </Section>

        
      </React.Fragment>
    )
  }


  getActiveStr(){
    const active =  this.props.ros.apps_active_list
    const app_list = this.props.ros.apps_list
    const app_name_list = this.props.ros.apps_name_list

    var config_str_list = []
    for (var i = 0; i < app_list.length; i++) {
      if (active.indexOf(app_list[i]) !== -1){
        config_str_list.push(app_name_list[i])
        config_str_list.push("\n")
      }
    }
    const config_str =config_str_list.join("")
    return config_str
  }

  
  getDisabledStr(){
    const active =  this.props.ros.apps_active_list
    const app_list = this.props.ros.apps_list
    const app_name_list = this.props.ros.apps_name_list
    var config_str_list = []
    for (var i = 0; i < app_list.length; i++) {
      if (active.indexOf(app_list[i]) === -1){
        config_str_list.push(app_name_list[i])
        config_str_list.push("\n")
      }
    }
    const config_str =config_str_list.join("")
    return config_str
  }


  onChangeGroupSelection(event){
    var selected_group = event.target.value
    this.setState({selected_group: selected_group})
  }

  render() {
    const mgrNamespace = this.getMgrNamespace()
    // if (this.state.needs_update === true){
    //   this.setState({needs_update: false})
    // }
    const selected_app = this.state.selected_app
    const app_options = this.getAppOptions()
    const active_app_list = this.props.ros.apps_active_list
    const hide_app_list = !this.state.viewableApps && !this.state.connected
    const app_group_options = this.getGroupOptions()
    const app_status_msg = this.state.app_status_msg

    return (

       
    <Columns>
      <Column>


      <Columns equalWidth={true}>
        <Column>
        <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <label style={{fontWeight: 'bold'}}>
            {"Filter App List"}
          </label>

          <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>


            <Select onChange={this.onChangeGroupSelection}
            id="AppGroupSelector"
            value={this.state.selected_group}>
            {app_group_options}
            </Select>

            <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Select App"}
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
            backgroundColor: (app.props.value === selected_app) ?
              Styles.vars.colors.green :
              (active_app_list.includes(app.props.value)) ? Styles.vars.colors.blue : Styles.vars.colors.grey0,
            cursor: "pointer",
            }}>
            <body app-topic ={app} style={{color: Styles.vars.colors.black}}>{app}</body>
        </div>
        )}
        </div>

      </Column>
      <Column>

      <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
      <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Active Apps List "}
          </label>

      <pre style={{ height: "200px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
        {this.getActiveStr()}
        </pre>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Disabled Apps List "}
          </label>

        <pre style={{ height: "200px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
        {this.getDisabledStr()}
        </pre>


      </Column>
      <Column>

      <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(mgrNamespace + "/enable_all_apps")}>{"Enable All"}</Button>
      </ButtonMenu>

      <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(mgrNamespace + "/disable_all_apps")}>{"Disable All"}</Button>
      </ButtonMenu>


      <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(mgrNamespace + "/refresh_apps")}>{"Refresh"}</Button>
      </ButtonMenu>

        {/* <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(mgrNamespace + "/factory_reset")}>{"Factory Reset"}</Button>
      </ButtonMenu> */}


      <Label title="Allow Restart on Crash">
          <Toggle
            checked={this.state.restart_enabled}
            onClick={() => this.props.ros.sendBoolMsg(mgrNamespace + "/enable_restart", !this.state.restart_enabled)}>
          </Toggle>
          </Label>

        </Column>
      </Columns>




      </Column>
      <Column>

      { (app_status_msg != null && selected_app !== 'None') ?
        this.renderAppConfigure()
      : null }


       </Column>
     </Columns>
         
       
          

    )
  }

}

export default AppsMgr
