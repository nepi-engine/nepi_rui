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
//import EnableAdjustment from "./EnableAdjustment"
import Button, { ButtonMenu } from "./Button"
import Toggle from "react-toggle"
import Label from "./Label"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
import Input from "./Input"
import Select, { Option } from "./Select"


import { convertStrToStrList, createMenuListFromStrList, onChangeSwitchStateValue, onDropdownSelectedSetState } from "./Utilities"

@inject("ros")
@observer

// Component that contains the Settings controls
class NepiDriversMgr extends Component {
  constructor(props) {
    super(props)

    this.state = {
      mgrName: "drivers_mgr",
      
      MgrNamespace: null,
      MgrNamespace: null,
      listenerDriver: null,
      listener: null,

      mgr_reset_sub: null,

      drivers_path: null,
      drivers_ordered_list: null,
      drivers_active_path: null,
      drivers_active_list: null,
      drivers_install_path: null,
      drivers_install_list: null,
      selected_driver: null,

      driver_name: null,
      active_state: null,
      group: null,
      group_id: null,
      node_file_name: null,
      node_file_path: null,
      node_module_name: null,
      node_class_name: null,
      driver_interfaces: null,
      driver_options: [],
      driver_option: null,
      discovery_name: null,
      discovery_method: null,
      other_users_list: [],
      order: null,

      driver_options_menu: null,

    }

    this.statusListener = this.statusListener.bind(this)
    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusDriverListener = this.statusDriverListener.bind(this)
    this.updateStatusDriverListener = this.updateStatusDriverListener.bind(this)

    this.getNamespace = this.getNamespace.bind(this)

  }

  getNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var namespace = null
    if (namespacePrefix !== null && deviceId !== null){
      namespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.mgrName
    }
    return namespace
  }

  // Callback for handling ROS Status3DX messages
  statusListener(message) {
    this.setState({
      drivers_path: message.drivers_path,
      drivers_ordered_list: message.drivers_ordered_list,
      drivers_active_path: message.drivers_active_path,
      drivers_active_list: message.drivers_active_list,
      drivers_install_path: message.drivers_install_path,
      drivers_install_list: message.drivers_install_list,
      selected_driver: message.selected_driver
    })
  }

  statusDriverListener(message) {
    this.setState({
  
      driver_name: message.driver_name,
      active_state: message.active_state,
      group: message.group,
      group_id: message.group_id,
      node_file_name: message.node_file_name,
      node_file_path: message.node_file_path,
      node_module_name: message.node_module_name,
      node_class_name: message.node_class_name,
      driver_interfaces: message.driver_interfaces,
      driver_options: message.driver_options,
      driver_option: message.driver_option,
      discovery_name: message.discovery_name,
      discovery_method: message.discovery_method,
      other_users_list: message.other_users_list,
      order: message.order


 
/*
    const driver_options_menu = createMenuListFromStrList(this.state.driver_options,false,[],[],[])
    this.setState({
      driver_options_menu: driver_options_menu
      })
      */
    })
  }



  // Function for configuring and subscribing to Status
  updateStatusListener() {
    const statusNamespace = this.MgrNamespace + '/status'
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
    var listener = this.props.ros.setupStatusListener(
          statusNamespace,
          this.statusListener
        )
    this.setState({ listener: listener})
  }

    // Function for configuring and subscribing to Status
    updateStatusDriverListener() {
      const statusNamespace = this.MgrNamespace + '/status_driver'
      if (this.state.listenerDriver) {
        this.state.listenerDriver.unsubscribe()
      }
      var listenerDriver = this.props.ros.setupDriverStatusListener(
            statusNamespace,
            this.statusDriverListener
          )
      this.setState({ listenerDriver: listenerDriver})
    }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace = this.getNamespace()
    if (prevState.MgrNamespace !== namespace && namespace !== null) {
      if (namespace.indexOf('null') === -1) {
        this.setState({MgrNamespace: namespace})
        this.updateStatusListener()
        this.updateStatusDriverListener()
      } 
    }
  }

  componentWillUnmount() {
    if (this.state.listener) {
      this.state.listener.unsubscribe() 
    }
    if (this.state.listenerDriver) {
      this.state.listenerDriver.unsubscribe()
    }
  }


  render() {
    const NoneOption = <Option>None</Option>
    const { sendTriggeredMsg} = this.props.ros


    return (
      <Section title={"Driver Settings"}>
{/*
      <Toggle
        checked={this.state.active_state===true}
        onClick={() => this.props.ros.sendBoolMsg(this.state.driverNamespace + "/active_state",!this.state.active_state)}>
      </Toggle>

      <Label title={"Driver Name"}>
        <Input disabled value={this.state.driver_name} />
      </Label>

      <Label title={"group"}>
        <Input disabled value={this.state.group} />
      </Label>

      <Label title={"group_id"}>
        <Input disabled value={this.state.group_id} />
      </Label>

      <Label title={"Node File Name"}>
        <Input disabled value={this.state.node_file_name} />
      </Label>

      <Label title={"Node File Path"}>
        <Input disabled value={this.state.node_file_path} />
      </Label>

      <Label title={"Node Module Name"}>
        <Input disabled value={this.state.node_module_name} />
      </Label>

      <Label title={"node_class_name"}>
        <Input disabled value={this.state.node_class_name} />
      </Label>

      <Label title={"node_module_name"}>
        <Input disabled value={this.state.node_module_name} />
      </Label>

      <Label title={"driver_interfaces"}>
        <Input disabled value={this.state.driver_interfaces} />
      </Label>
      
      <Label title={"driver_option"}>
        <Input disabled value={this.state.driver_option} />
      </Label>

      <Label title={"discovery_name"}>
        <Input disabled value={this.state.discovery_name} />
      </Label>

      <Label title={"discovery_method"}>
        <Input disabled value={this.state.discovery_method} />
      </Label>

      <Label title={"active_state"}>
        <Input disabled value={this.state.active_state} />
      </Label>

      <Label title={"Select Driver"}>
        <Select
          id="select_driver"
          onChange={(event) => onDropdownSelectedSetState.bind(this)(event,"driver_option")}
          value={this.state.driver_option}
        >
          {this.state.driver_options ? this.state.driver_options_menu : NoneOption}
        </Select>
      </Label>
              
      <Label title={"Drivers Path"}>
        <Input disabled value={this.state.drivers_path} />
      </Label>

      <Label title={"Drivers Active Path"}>
        <Input disabled value={this.state.drivers_active_path} />
      </Label>

*/}


      </Section>
    )
  }

}
export default NepiDriversMgr
