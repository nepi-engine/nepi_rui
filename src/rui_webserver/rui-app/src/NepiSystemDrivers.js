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

import { round, convertStrToStrList, createShortValuesFromNamespaces, onChangeSwitchStateValue,createMenuListFromStrList,
  onDropdownSelectedSendStr, onUpdateSetStateValue, onEnterSendFloatValue, onEnterSetStateFloatValue, onDropdownSelectedSetState
  } from "./Utilities"

@inject("ros")
@observer

// Pointcloud Application page
class DriversMgr extends Component {
  constructor(props) {
    super(props)

    this.state = {
      show_delete_driver: false,
      mgrName: "drivers_mgr",
      mgrNamespace: null,

      viewableDrivers: false,

      drivers_list: [],
      drivers_active_list: [],
      drivers_install_path: null,
      drivers_install_list: [],
      selected_driver: null,

      driver_name: null,
      driver_description: null,
      drivers_path: null,
      group: null,
      group_id: null,
      drivers_interfaces: null, 
      driver_options_1: [],
      set_option_1: null,
      driver_option_2: [],
      set_option_2: null,
      discovery: null,
      other_users_list: null,
      driver_options_menu: null,
      active_state: null,

      connected: false,

      driversListener: null,
      driverListener: null,

      driver_install_ready: null
    }


    this.getMgrNamespace = this.getMgrNamespace.bind(this)

    this.sendDriverUpdateOrder = this.sendDriverUpdateOrder.bind(this)
    this.toggleViewableDrivers = this.toggleViewableDrivers.bind(this)
    this.getDriverOptions = this.getDriverOptions.bind(this)
    this.onToggleDriverSelection = this.onToggleDriverSelection.bind(this)

    this.updateDriversStatusListener = this.updateDriversStatusListener.bind(this)
    this.driversStatusListener = this.driversStatusListener.bind(this)

    this.updateDriverStatusListener = this.updateDriverStatusListener.bind(this)
    this.statusDriverListener = this.statusDriverListener.bind(this)
  
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
  driversStatusListener(message) {
    this.setState({
      drivers_path: message.drivers_path,
      drivers_list: convertStrToStrList(message.drivers_ordered_list),
      drivers_active_list: convertStrToStrList(message.drivers_active_list),
      drivers_install_path: message.drivers_install_path,
      drivers_install_list: convertStrToStrList(message.drivers_install_list),
      selected_driver: message.selected_driver
    })    
  }

  // Function for configuring and subscribing to Status
  updateDriversStatusListener() {
    const statusNamespace = this.getMgrNamespace() + '/status'
    if (this.state.driversListener) {
      this.state.driversListener.unsubscribe()
    }
    var driversListener = this.props.ros.setupStatusListener(
          statusNamespace,
          "nepi_ros_interfaces/DriversStatus",
          this.driversStatusListener
        )
    this.setState({ driversListener: driversListener})
  }


  statusDriverListener(message) {
    this.setState({
  
      driver_name: message.name,
      driver_description: message.description,
      drivers_path: message.path,
      group: message.group,
      group_id: message.group_id,
      drivers_interfaces: message.interfaces,
      driver_options_1: message.driver_options_1,
      set_option_1: message.set_option_1,
      driver_options_2: message.driver_options_2,
      set_option_2: message.set_option_1,
      discovery: message.discovery,
      other_users_list: message.other_users_list,
      active_state: message.active_state,
      order: message.order,
      msg_str: message.msg_str

    })
  }

    // Function for configuring and subscribing to Status
    updateDriverStatusListener() {
      const namespace = this.getMgrNamespace()
      const statusNamespace = namespace + '/status_driver'
      if (this.state.driverListener) {
        this.state.driverListener.unsubscribe()
      }
      var driverListener = this.props.ros.setupStatusListener(
            statusNamespace,
            "nepi_ros_interfaces/DriverStatus",
            this.statusDriverListener
          )
      this.setState({ driverListener: driverListener})
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
        this.updateDriversStatusListener()
        this.updateDriverStatusListener()
      } 
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.driversListener) {
      this.state.driversListener.unsubscribe()
      this.state.driverListener.unsubscribe()
    }
  }

  toggleViewableDrivers() {
    const set = !this.state.viewableDrivers
    this.setState({viewableDrivers: set})
  }

  // Function for creating image topic options.
  getDriverOptions() {
    const driversList = this.state.drivers_list
    var items = []
    items.push(<Option>{"NONE"}</Option>) 
    if (driversList.length > 0){
      for (var i = 0; i < driversList.length; i++) {
          items.push(<Option value={driversList[i]}>{driversList[i]}</Option>)
     }
    }
    return items
  }

  onToggleDriverSelection(event){
    const {sendStringMsg} = this.props.ros
    const driver_name = event.target.value
    const selectNamespace = this.state.mgrNamespace + "/select_driver"
    sendStringMsg(selectNamespace,driver_name)
  }


  sendDriverUpdateOrder(){
    const {driverUpdateOrderMsg} = this.props.ros
    var namespace = this.state.mgrNamespace
    var driver_name = this.state.driver_name
    var move_cmd = this.state.move_cmd
    driverUpdateOrderMsg(namespace,driver_name,move_cmd)
  }

  onDropdownSelectedSendOption(event) {
    const {driverUpdateOptionMsg} = this.props.ros
    const {sendStringMsg} = this.props.ros
    const namespace = this.state.mgrNamespace
    const driver_name = this.state.driver_name
    const option_str = event.target.value

    driverUpdateOptionMsg(namespace, driver_name, option_str)
  }

  renderDriverConfigure() {
    const {  sendTriggerMsg,sendBoolMsg, driverUpdateOrderMsg, sendActiveStateBoolMsg, driverUpdateOptionMsg} = this.props.ros
    const {drivers_ordered_list, drivers_active_list} = this.state
    const connected = this.state.connected
    const selected_driver = this.state.selected_driver
    const viewableDrivers = this.state.viewableDrivers
    const driver_options = this.getDriverOptions()
    const active_driver_list = this.state.drivers_active_list
    const hide_settings = selected_driver === "None"
    const NoneOption = <Option>None</Option>




    return (
      <React.Fragment>

        <Section title={"Configure Drivers"}>

        <Columns>
        <Column>

        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Selected Driver: "}
        </label>
        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {this.state.driver_name}
        </label>

        </Column>
        </Columns>


            <Columns>
              <Column>
  
                  <Label title="Select Driver">
                    <div onClick={this.toggleViewableDrivers} style={{backgroundColor: Styles.vars.colors.grey0}}>
                      <Select style={{width: "10px"}}/>
                    </div>
                    <div hidden={!viewableDrivers}>
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
                  </Label>


                  <Label title="Active State"></Label>
                    <Toggle
                    checked={this.state.active_state===true}
                    onClick={() => sendActiveStateBoolMsg(this.state.mgrNamespace + "/update_state", this.state.driver_name, !this.state.active_state)}>
                    </Toggle>

             </Column>
             <Column>

             <Label title="Option 1"> 
        <Select
          id="select_target"
          onChange={(event) => onDropdownSelectedSendStr.bind(this)(event, this.state.mgrNamespace + "/update_option_1")}
          value={this.state.set_option_1}
        >
          {this.state.driver_options_1
            ? createMenuListFromStrList(this.state.driver_options_1, false, [],[],[])
            : NoneOption}
        </Select>
        </Label>

        <Label title={""}></Label>

      <div hidden={!hide_settings}>
             </div>

      </Column>
      <Column>
      <label style={{fontWeight: 'bold'}}>
                {""}
              </label>

      <Label title="Option 2"> 
        <Select
          id="select_target"
          onChange={(event) => onDropdownSelectedSendStr.bind(this)(event, this.state.mgrNamespace + "/update_option_2")}
          value={this.state.set_option_2}
        >
          {this.state.driver_options_2
            ? createMenuListFromStrList(this.state.driver_options_2, false, [],[],[])
            : NoneOption}
        </Select>
        </Label>
{/*
        <Label title={""}></Label>

        <ButtonMenu>
        <Button onClick={() => driverUpdateOrderMsg(this.state.mgrNamespace + "/update_order", this.state.driver_name, "top")}>{"Move to Top"}</Button>
        </ButtonMenu>

        <ButtonMenu>
        <Button onClick={() => driverUpdateOrderMsg(this.state.mgrNamespace + "/update_order", this.state.driver_name, "up")}>{"Move Up"}</Button>
        </ButtonMenu>

        <ButtonMenu>
          <Button onClick={() => driverUpdateOrderMsg(this.state.mgrNamespace + "/update_order", this.state.driver_name, "down")}>{"Move Down"}</Button>
        </ButtonMenu>

        <ButtonMenu>
          <Button onClick={() => driverUpdateOrderMsg(this.state.mgrNamespace + "/update_order", this.state.driver_name, "bottom")}>{"Move to Bottom"}</Button>
        </ButtonMenu>
*/}
              </Column>
            </Columns>

        </Section>
        
      </React.Fragment>
    )
  }

  renderDriverInfo() {
    const {sendStringMsg} = this.props.ros

    return (
    <React.Fragment>
      <Section title={"Driver Info"}>
      <Columns>
      <Column>

      <Label title={"Driver Name"}>
        <Input disabled value={this.state.driver_name} />
      </Label>
      <Label title={" Description"}>
        <Input disabled value={this.state.driver_description} />
      </Label>
      <Label title={"group"}>
        <Input disabled value={this.state.group} />
      </Label>
      <Label title={"group_id"}>
        <Input disabled value={this.state.group_id} />
      </Label>

      </Column>
      <Column>
      <Label title={"Interfaces"}>
        <Input disabled value={this.state.interfaces} />
      </Label>
      <Label title={"discovery"}>
        <Input disabled value={this.state.discovery} />
      </Label>
      <Label title={"other_users_list"}>
        <Input disabled value={this.state.other_users_list} />
      </Label>

      <Label title="Show Remove Driver">
                <Toggle
                checked={this.state.show_delete_driver===true}
                onClick={() => onChangeSwitchStateValue.bind(this)("show_delete_driver",this.state.show_delete_driver)}>
                </Toggle>
          </Label>

          <div hidden={!this.state.show_delete_driver}>
      <ButtonMenu>
        <Button onClick={() => sendStringMsg(this.state.mgrNamespace + "/remove_driver", this.state.selected_driver)}>{"Remove Driver"}</Button>
      </ButtonMenu>
      </div>

      </Column>
      </Columns>
     </Section>      
    </React.Fragment>
  )
}

  renderDriverInstall() {
    const connected = this.state.connected 
    const NoneOption = <Option>None</Option>
    const {sendStringMsg} = this.props.ros
    return (
      <React.Fragment>

        <Section title={"Install/Update Drivers"}>

        <Label title="Install"> 
        <Select
          id="select_target"
          onChange={(event) => onDropdownSelectedSetState.bind(this)(event, this.state.driver_install_ready)}
          value={this.state.driver_install_ready}
          >
          {this.state.drivers_install_list
            ? createMenuListFromStrList(this.state.drivers_install_list, false, [],[],[])
            : NoneOption}
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
        <Button onClick={() => sendStringMsg(this.state.mgrNamespace + "install_driver_pkg", this.state.driver_install_ready)}>{"Install Driver"}</Button>
      </ButtonMenu>
      </div>

          <Label title={"Install Path"} >
          </Label>
          <pre style={{ height: "20Spx", overflowY: "auto" }}>
            {this.state.drivers_install_path}
          </pre>



        </Section>
        
      </React.Fragment>
    )
  }

  renderDriverOrder() {
    const connected = this.state.connected 
    const NoneOption = <Option>None</Option>
    const {driverUpdateOrderMsg} = this.props.ros
    return (
      <React.Fragment>

        <Section title={"Driver Order"}>
{/*}
        <Columns>
        <Column>
        </Column>
        <Column>

        <Label title={"order"}>
          <Input disabled value={this.state.order} />
        </Label>

        </Column>
        <Column>  
        </Column>
        </Columns>
*/}
        <Columns>
        <Column>

        <ButtonMenu>
        <Button onClick={() => driverUpdateOrderMsg(this.state.mgrNamespace + "/update_order", this.state.driver_name, "top")}>{"Move to Top"}</Button>
        </ButtonMenu>

        </Column>
        <Column>

        <ButtonMenu>
        <Button onClick={() => driverUpdateOrderMsg(this.state.mgrNamespace + "/update_order", this.state.driver_name, "up")}>{"Move    Up"}</Button>
        </ButtonMenu>

        </Column>
        <Column>

        <Label title={"order"}>
          <Input disabled value={this.state.order} />
        </Label>

        </Column>
        <Column>

        <ButtonMenu>
          <Button onClick={() => driverUpdateOrderMsg(this.state.mgrNamespace + "/update_order", this.state.driver_name, "down")}>{"Move Down"}</Button>
        </ButtonMenu>

        </Column>
        <Column>

        <ButtonMenu>
          <Button onClick={() => driverUpdateOrderMsg(this.state.mgrNamespace + "/update_order", this.state.driver_name, "bottom")}>{"Move to Bottom"}</Button>
        </ButtonMenu>

        </Column>
        </Columns>
        </Section>
        
      </React.Fragment>
    )
  }

  render() {
    const connected = this.state.connected

    return (

       
    <Columns>
      <Column>

      {this.renderDriverConfigure()}

      {this.renderDriverOrder()}

      </Column>
      <Column>

      {this.renderDriverInfo()}

      {this.renderDriverInstall()}


       </Column>
     </Columns>
         
       
          

    )
  }

}

export default DriversMgr
