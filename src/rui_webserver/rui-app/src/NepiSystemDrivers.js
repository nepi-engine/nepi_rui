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

import NepiIFSettings from "./Nepi_IF_Settings"

import { onChangeSwitchStateValue, onDropdownSelectedSetState } from "./Utilities"

  @inject("ros")
  @observer
  

  class DriversMgr extends Component {
    constructor(props) {
      super(props)
  
      this.state = {
        show_delete_driver: false,
        mgrName: "drivers_mgr",
        mgrNamespace: null,

      viewableDrivers: false,
      viewabletypes: false,

      selected_driver: 'None',

      drivers_pkg_list: [],
      last_drivers_pkg_list: [],
      drivers_name_list: [],
      drivers_type_list: [],
      drivers_active_pkg_list: [],
      drivers_active_name_list: [],
      drivers_active_namespace_list: [],
      drivers_install_path: null,
      drivers_install_list: [],
      backup_removed_drivers: true,

      settings_namespace: 'None',
      driver_pkg: 'None',
      driver_display_name: 'None',
      driver_description: null,
      driver_type: null,
      driver_type_name: "None",
      driver_group_id: null,
      driver_interfaces: null, 
      driver_active_state: null,
      driver_running_state: null,
      driver_order: 0,
      driver_msg_str: "",
      
      retry_enabled: false,

      connected: false,

      statusListener: null,
      driverListener: null,
      selected_driver_install_pkg: null,
      type_list: ['IDX','LSX','PTX','RBX','NPX'],
      type_names: ['Imaging','Lights','PanTilts','Robots','NavPose'],
      selected_type: 'All',
      
      needs_update: false
    }

    this.getMgrNamespace = this.getMgrNamespace.bind(this)

    this.sendDriverUpdateOrder = this.sendDriverUpdateOrder.bind(this)
    this.toggleViewableDrivers = this.toggleViewableDrivers.bind(this)
    this.toggleViewabletypes = this.toggleViewabletypes.bind(this)
    this.getDriverOptions = this.getDriverOptions.bind(this)
    this.getInstallOptions = this.getInstallOptions.bind(this)
    this.getTypeOptions = this.getTypeOptions.bind(this)
    this.onChangetypeSelection = this.onChangetypeSelection.bind(this)
    this.onToggleDriverSelection = this.onToggleDriverSelection.bind(this)

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

    this.convertDriverStrInstallToStrList = this.convertDriverStrInstallToStrList.bind(this)

    this.getDisabledStr = this.getDisabledStr.bind(this)
    this.getActiveStr = this.getActiveStr.bind(this)
    this.getInstallStr = this.getInstallStr.bind(this)

    this.getSettingsNamespace = this.getSettingsNamespace.bind(this)

    
  
    this.onDropdownSelectedSendDriverOption = this.onDropdownSelectedSendDriverOption.bind(this)
  
  
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
  statusListener(message) {
    this.setState({
      drivers_pkg_list: message.pkg_list,
      drivers_name_list: message.name_list,
      drivers_type_list: message.type_list,
      drivers_active_pkg_list: message.active_pkg_list,
      drivers_active_name_list: message.active_name_list,
      drivers_active_namespace_list: message.active_namespace_list,
      drivers_install_path: message.install_path,
      drivers_install_list: message.install_list,
      backup_removed_drivers: message.backup_removed_drivers,
      retry_enabled: message.retry_enabled,
      connected: true
    })    

    const status_list = message.status_list
    const status_index = message.pkg_list.indexOf(this.state.selected_driver)
    if (status_index !== -1){
      const status_msg = message.status_list[status_index]
      this.setState({
        driver_pkg: status_msg.pkg_name,
        driver_display_name: status_msg.display_name,
        driver_description: status_msg.description,
        driver_type: status_msg.type,
        driver_group_id: status_msg.group_id,
        driver_active_state: status_msg.active_state,
        driver_running_state: status_msg.running_state,
        driver_order: status_msg.order,
        driver_msg_str: status_msg.msg_str
      })
    }

  }

  // Function for configuring and subscribing to Status
  updateStatusListener() {
    const namespace = this.getMgrNamespace()
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
    if (namespace != null){
      var statusListener = this.props.ros.setupStatusListener(
            namespace  + '/status',
            "nepi_interfaces/MgrDriversStatus",
            this.statusListener
          )
      this.setState({ statusListener: statusListener})
    }
    this.setState({needs_update: false})

    }
  
    componentDidMount(){
      this.setState({needs_update: true})
    }

    
  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace = this.getMgrNamespace()
    const namespace_updated = (this.state.mgrNamespace !== namespace && namespace !== null)
    if (namespace_updated) {
        this.setState({
          mgrNamespace: namespace
        })
        this.updateStatusListener()
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
  }

  toggleViewableDrivers() {
    const set = !this.state.viewableDrivers
    this.setState({viewableDrivers: set})
  }

  toggleViewabletypes() {
    const set = !this.state.viewabletypes
    this.setState({viewabletypes: set})
  }

  // Function for creating image topic options.
  getDriverOptions() {
    const driversList = this.state.drivers_pkg_list  
    const namesList = this.state.drivers_name_list
    const typesList = this.state.drivers_type_list
    const sel_type = this.state.selected_type
    var items = []
    if (driversList.length > 0){
      for (var i = 0; i < driversList.length; i++) {
          if (sel_type === "All" || typesList[i] === sel_type){
            items.push(<Option value={driversList[i]}>{namesList[i]}</Option>)
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

  // Function for creating type topic options.
  getTypeOptions() { 
    const types = this.state.drivers_type_list
    const typeIds = this.state.type_list
    const typeNames = this.state.type_names
    var items = []
    if (types.length === 0){
          items.push(<Option value={'None'}>{'None'}</Option>)
    }
    else {
      items.push(<Option value={'All'}>{'All'}</Option>)
    }
    if (types.length > 0){
      for (var i = 0; i < typeIds.length; i++) {
        if (types.indexOf(typeIds[i]) !== -1){
          items.push(<Option value={typeIds[i]}>{typeNames[i]}</Option>)
        }
      }
    }

    return items
  }
  


  onToggleDriverSelection(event){
    const {sendStringMsg} = this.props.ros
    const selected_driver = event.target.value
    const selectNamespace = this.state.mgrNamespace + "/select_driver"
    this.setState({selected_driver: selected_driver})
  }


  sendDriverUpdateOrder(){
    const {sendUpdateOrderMsg} = this.props.ros
    var namespace = this.state.mgrNamespace
    var selected_driver = this.state.selected_driver
    var move_cmd = this.state.move_cmd
    sendUpdateOrderMsg(namespace,selected_driver,move_cmd)
  }
  convertDriverStrInstallToStrList(inputStr) {
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
    const driversList = this.state.drivers_install_list
    var items = []
    const connected = this.state.connected
    if (connected !== true){
      items.push(<Option value={'Connecting'}>{'Connecting'}</Option>)
    }
    else{
      if (driversList.length > 0){
        for (var i = 0; i < driversList.length; i++) {
            items.push(<Option value={driversList[i]}>{driversList[i]}</Option>)
        }
      }
      else{
        items.push(<Option value={'None'}>{'None'}</Option>)
        //items.push(<Option value={'TEST1'}>{'TEST1'}</Option>)
        //items.push(<Option value={'TEST2'}>{'TEST2'}</Option>)
      }
    }
    return items
  }


  onDropdownSelectedSendDriverOption(event) {
    const {sendUpdateStringMsg} = this.props.ros
    const topic = event.target.id
    const namespace = this.state.mgrNamespace + "/" + topic
    const selected_driver = this.state.selected_driver
    const option_str = event.target.value
    sendUpdateStringMsg(namespace, selected_driver, option_str)
  }


  getSettingsNamespace(){
    const active_drivers = this.state.drivers_active_pkg_list
    const active_topics = this.state.drivers_active_namespace_list
    const sel_drv = this.state.selected_driver
    const set_namespace = this.state.settings_namespace
    const ind = active_drivers.indexOf(sel_drv)
    var cur_namespace = 'None'
    if (ind !== -1){
      cur_namespace = active_topics[ind]
      if (set_namespace !== cur_namespace){  
        this.props.ros.callSettingsCapabilitiesQueryService(cur_namespace)
        this.setState({ settings_namespace: cur_namespace})
      }
    }
    return cur_namespace
  }

  renderDriverConfigure() {
    const { sendStringMsg, sendUpdateOrderMsg, sendUpdateBoolMsg, } = this.props.ros
    //Unused const NoneOption = <Option>None</Option>
    const namespace = this.getSettingsNamespace()
    const check_topic = namespace + "/settings/status"
    const {topicNames} = this.props.ros
    const topic_publishing = topicNames ? topicNames.indexOf(check_topic) !== -1 : false
    const settings_namespace = topic_publishing ? namespace + '/settings': "None"

    if (this.state.selected_driver === 'None') {
      return (
        <React.Fragment>

          <Section title={'None'}>


          </Section>

        </React.Fragment>
      )
    }
    else {

      return (
        <React.Fragment>

          <Section title={this.state.driver_display_name}>

          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

            <label style={{}} align={"left"} textAlign={"left"}>
              {this.state.driver_display_name}
            </label>
      

            <pre style={{ height: "50px", overflowY: "auto" }}>
            {this.state.driver_description}
            </pre>


        <Columns equalWidth={true}>
        <Column>

          <Label title="Enable/Disable Driver">
            <Toggle
              checked={this.state.driver_active_state===true}
              onClick={() => sendUpdateBoolMsg(this.state.mgrNamespace + "/update_driver_state", this.state.selected_driver, !this.state.driver_active_state)}>
            </Toggle>
            </Label>


        </Column>
        <Column>

        <Label title={"Driver Running"}>
            <BooleanIndicator value={(this.state.driver_running_state !== null)? this.state.driver_running_state : false} />
          </Label>
          
        </Column>
        <Column>

        <pre style={{ height: "50px", overflowY: "auto" }}>
            {"Subtype: " + this.state.driver_group_id}
            </pre>

        </Column>
        </Columns>


          <Columns equalWidth={true}>
            <Column>


        <Label title={"Type"}>
          <Input disabled value={this.state.driver_type} />
        </Label>
        <Label title={"Group ID"}>
          <Input disabled value={this.state.driver_group_id} />
        </Label>

        </Column>
        <Column>

        <Label title={"Package"}>
          <Input disabled value={this.state.selected_driver} />
        </Label>



        </Column>
        <Column>


          <Label title={"Driver Start Order"}>
            <Input disabled value={this.state.driver_order} />
          </Label>


          <ButtonMenu>
          <Button onClick={() => sendUpdateOrderMsg(this.state.mgrNamespace + "/update_driver_order", this.state.selected_driver, "top")}>{"Move to Top"}</Button>
          </ButtonMenu>

          <ButtonMenu>
          <Button onClick={() => sendUpdateOrderMsg(this.state.mgrNamespace + "/update_driver_order", this.state.selected_driver, "up")}>{"Move    Up"}</Button>
          </ButtonMenu>

          <ButtonMenu>
            <Button onClick={() => sendUpdateOrderMsg(this.state.mgrNamespace + "/update_driver_order", this.state.selected_driver, "down")}>{"Move Down"}</Button>
          </ButtonMenu>

          <ButtonMenu>
            <Button onClick={() => sendUpdateOrderMsg(this.state.mgrNamespace + "/update_driver_order", this.state.selected_driver, "bottom")}>{"Move to Bottom"}</Button>
          </ButtonMenu>
          </Column>
          </Columns>

          <div hidden={settings_namespace === 'None'}>
          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

          <label style={{fontWeight: 'bold'}}>
              {"Discovery Options Settings"}
            </label>


            <NepiIFSettings
              settingsNamespace={settings_namespace}
              make_section={false}
              allways_show_settings={true}
              title={"Driver Discovery Options"}
            />

            </div>
            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

          <Columns equalWidth={true}>
            <Column>


            <Label title="Show Remove Driver">
                  <Toggle
                  checked={this.state.show_delete_driver===true}
                  onClick={() => onChangeSwitchStateValue.bind(this)("show_delete_driver",this.state.show_delete_driver)}>
                  </Toggle>
            </Label>


        </Column>
        <Column>


        </Column>
        <Column>

        </Column>
        <Column>

          </Column>
          </Columns>


        <div hidden={!this.state.show_delete_driver}>

          <Columns equalWidth={true}>
            <Column>


          <Label title="Backup on Remove">
                  <Toggle
                  checked={this.state.backup_removed_drivers===true}
                  onClick={() => this.props.ros.sendBoolMsg(this.state.mgrNamespace + "/backup_on_remeove", this.state.backup_removed_drivers===false)}>
                  </Toggle>
          </Label>


        </Column>
        <Column>

        <ButtonMenu>
          <Button onClick={() => sendStringMsg(this.state.mgrNamespace + "/remove_driver", this.state.selected_driver)}>{"Remove Driver"}</Button>
        </ButtonMenu>

        </Column>
        <Column>

          </Column>
          </Columns>

          </div>



          </Section>
        
        </React.Fragment>
      )
    }
  }

  
 
  renderDriverInstall() {
    const selected_install_pkg = this.state.selected_driver_install_pkg ? this.state.selected_driver_install_pkg : "None"
    const install_options = this.getInstallOptions()
    const {sendStringMsg} = this.props.ros
    return (
      <React.Fragment>

        <Section title={"Install/Update Drivers"}>

        <Label title="Install"> 
        <Select
          id="select_target"
          onChange={(event) => onDropdownSelectedSetState.bind(this)(event, "selected_driver_install_pkg")}
          value={this.state.selected_driver_install_pkg}
          >
          {install_options}
        </Select>
        </Label>

        <Label title="Show Install Driver">
                <Toggle
                checked={this.state.show_install_driver===true}
                onClick={() => onChangeSwitchStateValue.bind(this)("show_install_driver",this.state.show_install_driver)}>
                </Toggle>
          </Label>

          <div hidden={!this.state.show_install_driver}>
      <ButtonMenu>
        <Button onClick={() => sendStringMsg(this.state.mgrNamespace + "/install_driver_pkg", selected_install_pkg)}>{"Install Driver"}</Button>
      </ButtonMenu>
      </div>

          <Label title={"Install Folder"} >
          </Label>

          <pre style={{ height: "20Spx", overflowY: "auto" }}>
            {this.state.drivers_install_path}
          </pre>



        </Section>
        
      </React.Fragment>
    )
  }



  getActiveStr(){
    const active_names =  this.state.drivers_active_name_list
    var config_str_list = []
    for (var i = 0; i < active_names.length; i++) {
      config_str_list.push(active_names[i])
      config_str_list.push("\n")
    }
    const config_str =config_str_list.join("")
    return config_str
  }

  
  getDisabledStr(){
    const installed = this.state.drivers_pkg_list
    const active_names =  this.state.drivers_active_name_list
    var config_str_list = []
    for (var i = 0; i < installed.length; i++) {
      if (active_names.indexOf(installed[i]) === -1){
        config_str_list.push(installed[i])
        config_str_list.push("\n")
      }
    }
    const config_str =config_str_list.join("")
    return config_str
  }


  getInstallStr(){
    const install_list = this.state.drivers_install_list
    var config_str_list = []
    for (var i = 0; i < install_list.length; i++) {
      config_str_list.push(install_list[i])
      config_str_list.push("\n")
    }
    const config_str =config_str_list.join("")
    return config_str
  }

  onChangetypeSelection(event){
    var selected_type = event.target.value
    this.setState({selected_type: selected_type})
  }

  render() {
    if (this.state.needs_update === true){
      this.setState({needs_update: false})
    }
    const selected_driver = this.state.selected_driver
    const driver_options = this.getDriverOptions()
    const active_driver_list = this.state.drivers_active_pkg_list
    const hide_driver_list = !this.state.viewableDrivers && !this.state.connected
    const drv_type_options = this.getTypeOptions()
    return (


      <Columns equalWidth={true}>
        <Column>




                <Columns equalWidth={true}>
                  <Column>


                        

                        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                          {"Select Driver"}
                        </label>

                        <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                          <div onClick={this.toggleViewableDrivers} style={{backgroundColor: Styles.vars.colors.grey0}}>
                            <Select style={{width: "10px"}}/>
                          </div>
                          <div hidden={hide_driver_list}>
                          {driver_options.map((driver) =>
                          <div onClick={this.onToggleDriverSelection}
                            style={{
                              textAlign: "center",
                              padding: `${Styles.vars.spacing.xs}`,
                              color: Styles.vars.colors.black,
                              backgroundColor: (driver.props.value === selected_driver) ?
                                Styles.vars.colors.green :
                                (active_driver_list.includes(driver.props.value)) ? Styles.vars.colors.blue : Styles.vars.colors.grey0,
                              cursor: "pointer",
                              }}>
                              <body driver-topic ={driver} style={{color: Styles.vars.colors.black}}>{driver}</body>
                          </div>
                          )}
                          </div>

                </Column>
                <Column>

                        <ButtonMenu>
                      <Button onClick={() => this.props.ros.sendTriggerMsg(this.state.mgrNamespace + "/enable_all_drivers")}>{"Enable All"}</Button>
                    </ButtonMenu>

                    <ButtonMenu>
                      <Button onClick={() => this.props.ros.sendTriggerMsg(this.state.mgrNamespace + "/disable_all_drivers")}>{"Disable All"}</Button>
                    </ButtonMenu>

                    <ButtonMenu>
                      <Button onClick={() => this.props.ros.sendTriggerMsg(this.state.mgrNamespace + "/refresh_drivers")}>{"Refresh"}</Button>
                    </ButtonMenu>

                      <ButtonMenu>
                      <Button onClick={() => this.props.ros.sendTriggerMsg(this.state.mgrNamespace + "/factory_reset")}>{"Factory Reset"}</Button>
                    </ButtonMenu>

                    <Label title="Allow Discovery Retry">
                        <Toggle
                          checked={this.state.retry_enabled}
                          onClick={() => this.props.ros.sendBoolMsg(this.state.mgrNamespace + "/enable_retry", !this.state.retry_enabled)}>
                        </Toggle>
                        </Label>

                        <Label title="Filter Driver List">
                            <Select onChange={this.onChangetypeSelection}
                            id="DrvtypeSelector"
                            value={this.state.selected_type}>
                            {drv_type_options}
                            </Select>
                        </Label>

                </Column>
                <Column>



                  
                      <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
                      <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                          {"Active Drivers List "}
                          </label>

                      <pre style={{ height: "200px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
                        {this.getActiveStr()}
                        </pre>

                        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
                      <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                          {"Disabled Drivers List "}
                          </label>

                        <pre style={{ height: "200px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
                        {this.getDisabledStr()}
                        </pre>

                        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
                      <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                          {"Install Drivers List "}
                          </label>

                        <pre style={{ height: "200px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
                        {this.getInstallStr()}
                        </pre>

                        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>



                </Column>
              </Columns>


      </Column>
      <Column>
      


              {this.renderDriverConfigure()}


            {/* {this.renderDriverInstall()} */}

       </Column>
     </Columns>
         

   

    )
  }

}

export default DriversMgr
