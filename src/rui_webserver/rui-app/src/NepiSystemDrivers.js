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

        mgrName: "drivers_mgr",
        mgrNamespace: null,

        connectedToDriversMgr: false,

        selected_driver: 'None',
        settings_namespace: 'None',

        driver_status_msg: null,
        driver_pkg: 'None',
        driver_settings_topic: 'None',

        driver_display_name: 'None',
        driver_description: null,
        driver_type: null,
        driver_group_id: null,

        driver_enabled: null,
        driver_running: null,
        driver_order: 0,
        driver_msg_str: "",
        

        type_list: ['IDX','LSX','PTX','RBX','NPX'],
        type_names: ['Imaging','Lights','PanTilts','Robots','NavPose'],
        selected_type: 'All',
        
        viewableDrivers: false,
        viewabletypes: false,

        connected: false,
        needs_update: false
    }

    this.getMgrNamespace = this.getMgrNamespace.bind(this)

    this.sendDriverUpdateOrder = this.sendDriverUpdateOrder.bind(this)
    this.toggleViewableDrivers = this.toggleViewableDrivers.bind(this)
    this.toggleViewabletypes = this.toggleViewabletypes.bind(this)
    this.getDriverOptions = this.getDriverOptions.bind(this)

    this.getTypeOptions = this.getTypeOptions.bind(this)
    this.onChangetypeSelection = this.onChangetypeSelection.bind(this)
    this.onToggleDriverSelection = this.onToggleDriverSelection.bind(this)


    this.getDisabledStr = this.getDisabledStr.bind(this)
    this.getActiveStr = this.getActiveStr.bind(this)

  
  }

  getMgrNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var mgrNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      mgrNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.props.ros.driversMgrName
    }
    return mgrNamespace
  }

  async checkConnection() {
    const { connectedToNepi , connectedToDriversMgr} = this.props.ros
    if (this.state.connectedToNepi !== connectedToNepi){
      this.setState({connectedToNepi: connectedToNepi,
                    driver_status_msg: null,
                    selected_driver: 'None', needs_update: true})
    }
    if (this.state.connectedToDriversMgr !== connectedToDriversMgr )
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

        const selected_driver = this.state.selected_driver
        const drivers_list = this.props.ros.drivers_list
        var driver_status_msg = null
        if (drivers_list.indexOf(selected_driver) !== -1 && selected_driver !== 'None'){
            driver_status_msg = this.props.ros.callDriverStatusQueryService(selected_driver)
        }

        if ( driver_status_msg != null) {
          this.setState({
            driver_status_msg: driver_status_msg,

            driver_pkg: driver_status_msg.pkg_name,
            driver_display_name: driver_status_msg.display_name,
            driver_description: driver_status_msg.description,
            
            driver_type: driver_status_msg.type,
            driver_group_id: driver_status_msg.group_id,

            driver_enabled: driver_status_msg.enabled,
            driver_running: driver_status_msg.running,
            driver_order: driver_status_msg.order,
            driver_msg_str: driver_status_msg.msg_str
          })

        }
        else {
          this.setState({driver_status_msg: null, driver_settings_topic: 'None'})
        }
        this.setState({needs_update: false})
    }

  }


  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    this.setState({connected: false})
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
    const driversList = this.props.ros.drivers_list  
    const namesList = this.props.ros.drivers_name_list
    const typesList = this.props.ros.drivers_type_list
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
    const types = this.props.ros.drivers_type_list
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
    const selected_driver = event.target.value
    this.setState({selected_driver: selected_driver})
    this.setState({needs_update: true})
  }


  sendDriverUpdateOrder(){
    const {sendUpdateOrderMsg} = this.props.ros
    var namespace = this.getMgrNamespace()
    var selected_driver = this.state.selected_driver
    var move_cmd = this.state.move_cmd
    sendUpdateOrderMsg(namespace + '/update_driver_order',selected_driver,move_cmd)
    this.setState({needs_update: true})
  }



  renderDriverConfigure() {
    const { sendUpdateOrderMsg, sendUpdateBoolMsg, } = this.props.ros
    const mgrNamespace = this.getMgrNamespace()

    const settings_namespace = this.state.driver_settings_topic

    const selected_driver = this.state.selected_driver
    const selected_driver_index = this.props.ros.drivers_list.indexOf(selected_driver) 

    const display_name = (selected_driver_index !== -1) ? this.props.ros.drivers_name_list[selected_driver_index] : ''
    const msg = (selected_driver_index !== -1) ? this.props.ros.drivers_msg_list[selected_driver_index] : ''

    const enabled = this.props.ros.drivers_active_list.indexOf(selected_driver) !== -1
    const running = this.props.ros.drivers_running_list.indexOf(selected_driver) !== -1
    const disable_enable = (enabled === false && running === true)
    

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
              checked={enabled}
              onClick={() => sendUpdateBoolMsg(mgrNamespace + "/update_driver_state", this.state.selected_driver, !enabled)}
              disabled={disable_enable}>
            </Toggle>
            </Label>


        </Column>
        <Column>

        <Label title={"Driver Running"}>
            <BooleanIndicator value={running} />
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
          <Button onClick={() => sendUpdateOrderMsg(mgrNamespace + "/update_driver_order", this.state.selected_driver, "top")}>{"Move to Top"}</Button>
          </ButtonMenu>

          <ButtonMenu>
          <Button onClick={() => sendUpdateOrderMsg(mgrNamespace + "/update_driver_order", this.state.selected_driver, "up")}>{"Move    Up"}</Button>
          </ButtonMenu>

          <ButtonMenu>
            <Button onClick={() => sendUpdateOrderMsg(mgrNamespace + "/update_driver_order", this.state.selected_driver, "down")}>{"Move Down"}</Button>
          </ButtonMenu>

          <ButtonMenu>
            <Button onClick={() => sendUpdateOrderMsg(mgrNamespace + "/update_driver_order", this.state.selected_driver, "bottom")}>{"Move to Bottom"}</Button>
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

          </Section>
        
        </React.Fragment>
      )
    }
  }

  
 




  getActiveStr(){
    const active_names =  this.props.ros.drivers_active_name_list
    var config_str_list = []
    for (var i = 0; i < active_names.length; i++) {
      config_str_list.push(active_names[i])
      config_str_list.push("\n")
    }
    const config_str =config_str_list.join("")
    return config_str
  }

  
  getDisabledStr(){
    const installed = this.props.ros.drivers_list
    const active_names =  this.props.ros.drivers_active_name_list
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



  onChangetypeSelection(event){
    var selected_type = event.target.value
    this.setState({selected_type: selected_type})
  }

  render() {
    // if (this.state.needs_update === true){
    //   this.setState({needs_update: false})
    // }
    const mgrNamespace = this.getMgrNamespace()
    const selected_driver = this.state.selected_driver
    const driver_options = this.getDriverOptions()
    const active_driver_list = this.props.ros.drivers_active_list
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
                      <Button onClick={() => this.props.ros.sendTriggerMsg(mgrNamespace + "/enable_all_drivers")}>{"Enable All"}</Button>
                    </ButtonMenu>

                    <ButtonMenu>
                      <Button onClick={() => this.props.ros.sendTriggerMsg(mgrNamespace + "/disable_all_drivers")}>{"Disable All"}</Button>
                    </ButtonMenu>

                    <ButtonMenu>
                      <Button onClick={() => this.props.ros.sendTriggerMsg(mgrNamespace + "/refresh_drivers")}>{"Refresh"}</Button>
                    </ButtonMenu>

                      <ButtonMenu>
                      <Button onClick={() => this.props.ros.sendTriggerMsg(mgrNamespace + "/factory_reset")}>{"Factory Reset"}</Button>
                    </ButtonMenu>

                    <Label title="Allow Discovery Retry">
                        <Toggle
                          checked={this.props.ros.drivers_retry_enabled}
                          onClick={() => this.props.ros.sendBoolMsg(mgrNamespace + "/enable_retry", !this.props.ros.drivers_retry_enabled)}>
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


                </Column>
              </Columns>


      </Column>
      <Column>
      


              {(this.state.driver_status_msg != null) ?
                this.renderDriverConfigure()
              : null}




       </Column>
     </Columns>
         

   

    )
  }

}

export default DriversMgr
