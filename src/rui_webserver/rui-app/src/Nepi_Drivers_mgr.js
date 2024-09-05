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
      mgrName: "driver_mgr",
      MgrNamespace: null,
      driver_mgr: null,
      mgr_reset_sub: null,

      drivers_path: null,
      drivers_ordered_list: null,
      drivers_active_path: null,
      drivers_active_list: null,
      drivers_install_path: null,
      drivers_install_list: null,

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
      driverListener: null,

      listener: null
    }

    this.statusListener = this.statusListener.bind(this)
    this.updateStatusListener = this.updateStatusListener.bind(this)

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
      drivers_install_list: message.drivers_install_list
    })
  }

      /*

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
      order: message.order,


 

    const driver_options_menu = createMenuListFromStrList(this.state.driver_options,false,[],[],[])
    this.setState({
      driver_options_menu: driver_options_menu
    })
  */



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

  


  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace = this.getNamespace()
    if (prevState.MgrNamespace !== namespace && namespace !== null) {
      if (namespace.indexOf('null') === -1) {
        this.setState({MgrNamespace: namespace})
        this.updateStatusListener()
      } 
    }
  }

  componentWillUnmount() {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
  }


















  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.driverListener) {
      this.state.driverListener.unsubscribe()
    }
  }



/*



  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const {DriversStatusQuery} = this.props.ros
    const {DriversListQuery} = this.props.ros
    
    for (let i = 0; i < DriversStatusQuery.length; ++i) {
      if (DriversStatusQuery[i]['sequence_id'] === selectedSequenceObj['sequence_id']) {
        // Check all entries item-by-item to see if there is a change... this avoids the dreaded "Maximum depth exceeded" runtime error
        if ((DriversStatusQuery[i]['driver_name'] !== selectedSequenceObj['driver_name']) ||
            (DriversStatusQuery[i]['group'] !== selectedSequenceObj['group']) ||
            (DriversStatusQuery[i]['group_id'] !== selectedSequenceObj['group_id']) ||
            (DriversStatusQuery[i]['node_file_name'] !== selectedSequenceObj['node_file_name']) ||
            (DriversStatusQuery[i]['node_file_path'] !== selectedSequenceObj['node_file_path']) ||
            (DriversStatusQuery[i]['node_module_name'] !== selectedSequenceObj['node_module_name']) ||
            (DriversStatusQuery[i]['node_class_name'] !== selectedSequenceObj['node_class_name']) ||
            (DriversStatusQuery[i]['driver_name'] !== selectedSequenceObj['driver_name']) ||
            (DriversStatusQuery[i]['driver_interfaces'] !== selectedSequenceObj['driver_interfaces']) ||
            (DriversStatusQuery[i]['driver_option'] !== selectedSequenceObj['driver_option']) ||
            (DriversStatusQuery[i]['discovery_name'] !== selectedSequenceObj['discovery_name']) ||
            (DriversStatusQuery[i]['discovery_method'] !== selectedSequenceObj['discovery_method']) ||
            (DriversStatusQuery[i]['active_state'] !== selectedSequenceObj['active_state']) ||
            (DriversStatusQuery[i]['order'] !== selectedSequenceObj['order']) ||
            (DriversStatusQuery[i]['inputs'].length !== selectedSequenceObj['inputs'].length)) {
          this.setState({ selectedSequenceObj: DriversStatusQuery[i] })
          break
        }
        for (let j = 0; j < DriversStatusQuery[i]['inputs'].length; ++j) {
          if ((DriversStatusQuery[i]['inputs'][j]['driver_options'] !== selectedSequenceObj['inputs'][j]['driver_options']) ||
              (DriversStatusQuery[i]['inputs'][j]['other_users_list'] !== selectedSequenceObj['inputs'][j]['other_users_list'])) {
            this.setState({ selectedSequenceObj: DriversStatusQuery[i] })
            // We're in a nested loop, so set the exit condition of the outer loop
            i = DriversStatusQuery.length
            break // And break from the inner loop
          }
        }
      }
    }

    for (let i = 0; i < DriversListQuery.length; ++i) {
      if (DriversStatusQuery[i]['sequence_id'] === selectedSequenceObj['sequence_id']) {
        // Check all entries item-by-item to see if there is a change... this avoids the dreaded "Maximum depth exceeded" runtime error
        if ((DriversListQuery[i]['drivers_path'] !== selectedSequenceObj['drivers_path']) ||
            (DriversListQuery[i]['drivers_install_path'] !== selectedSequenceObj['drivers_install_path']) ||
            (DriversListQuery[i]['inputs'].length !== selectedSequenceObj['inputs'].length)) {
          this.setState({ selectedSequenceObj: DriversListQuery[i] })
          break
        }
        for (let j = 0; j < DriversListQuery[i]['inputs'].length; ++j) {
          if ((DriversListQuery[i]['inputs'][j]['drivers_ordered_list'] !== selectedSequenceObj['inputs'][j]['drivers_ordered_list']) ||
              (DriversListQuery[i]['inputs'][j]['drivers_active_list'] !== selectedSequenceObj['inputs'][j]['drivers_active_list']) ||
              (DriversListQuery[i]['inputs'][j]['drivers_install_path'] !== selectedSequenceObj['inputs'][j]['drivers_install_path']) ||
              (DriversListQuery[i]['inputs'][j]['drivers_install_list'] !== selectedSequenceObj['inputs'][j]['drivers_install_list'])) {
            this.setState({ selectedSequenceObj: DriversListQuery[i] })
            // We're in a nested loop, so set the exit condition of the outer loop
            i = DriversListQuery.length
            break // And break from the inner loop
          }
        }
      }
    }



    if (prevProps.settingsNamespace !== settingsNamespace && settingsNamespace != null) {
      this.updateSettingsListener()
    }
  }
*/

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


              
      <Label title={"Drivers Path"}>
        <Input disabled value={this.state.drivers_path} />
      </Label>

      <Label title={"Drivers Active Path"}>
        <Input disabled value={this.state.drivers_active_path} />
      </Label>

*/}

<Label title={"Select Driver"}>
        <Select
          id="select_driver"
          onChange={(event) => onDropdownSelectedSetState.bind(this)(event,"driver_option")}
          value={this.state.driver_option}
        >
          {this.state.driver_options ? this.state.driver_options_menu : NoneOption}
        </Select>
      </Label>

      </Section>
    )
  }

}
export default NepiDriversMgr
