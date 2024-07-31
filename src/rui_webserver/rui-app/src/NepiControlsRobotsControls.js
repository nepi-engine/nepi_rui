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
import RangeAdjustment from "./RangeAdjustment"
import {RadioButtonAdjustment, SliderAdjustment} from "./AdjustmentWidgets"
import Toggle from "react-toggle"
import Label from "./Label"
import { Column, Columns } from "./Columns"
import Input from "./Input"
import Select, { Option } from "./Select"
import Styles from "./Styles"
import BooleanIndicator from "./BooleanIndicator"


function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer

// Component that contains RBX Controls
class NepiRobotControls extends Component {
  constructor(props) {
    super(props)

    // these states track the values through  Status messages
    this.state = {
      
      current_lat: null,
      current_long: null,
      current_altitude: null,
      current_heading: null,
      current_roll: null,
      current_pitch: null,
      current_yaw: null, 
      process_current: null,
      process_last: null,
      ready: null,
      battery: null,
      errors_current: null,
      errors_prev: null,
      cmd_success: null,
      manual_ready: null,
      autonomous_ready: null,
      manual_ready:null,
      last_cmd_str: null,
      last_error_message: null,

      rbx_capabilities: null,
      has_battery_feedback: null,
      has_motor_controls: null,
      has_autonomous_controls: null,
      has_set_home: null,
      has_go_stop: null,
      has_goto_pose: null,
      has_goto_position: null,
      has_goto_location: null,
      has_fake_gps: null,

      state_options: null,
      mode_options: null,
      action_options: null,
      data_products: null,

      controls_list: null,
      controls_menu: null,
      selected_control: null,

      controlsStatusListener : null,

    }

    this.getStrListAsList = this.getStrListAsList.bind(this)
    this.convertStrListToMenuList = this.convertStrListToMenuList.bind(this)

    this.updateControlsStatusListener = this.updateControlsStatusListener.bind(this)
    this.controlsStatusListener = this.controlsStatusListener.bind(this)

    this.onControlSelected = this.onControlSelected.bind(this)


  }



  // Callback for handling ROS Status messages
  controlsStatusListener(message) {
    const {rbxRobots} = this.props.ros
    this.setState({
      current_long: message.current_long ,
      current_altitude: message.current_altitude ,
      current_heading: message.current_heading ,
      current_roll: message.current_roll ,
      current_pitch: message.current_pitch ,
      current_yaw: message.current_yaw , 
      process_current: message.process_current ,
      process_last: message.process_last ,
      ready: message.ready ,
      battery: message.battery ,
      errors_current: [message.errors_current.x_m ,message.errors_current.x_m, message.errors_current.x_m, message.errors_current.heading_deg, message.errors_current.roll_deg, message.errors_current.pitch_deg, message.errors_current.yaw_deg],
      errors_prev: [message.errors_prev.x_m ,message.errors_prev.x_m, message.errors_prev.x_m, message.errors_prev.heading_deg, message.errors_prev.roll_deg, message.errors_prev.pitch_deg, message.errors_prev.yaw_deg],
      cmd_success: message.cmd_success ,
      manual_ready: message.manual_motor_control_mode_ready ,
      autonomous_ready: message.autonomous_control_mode_ready ,
      manual_ready: message.manual_motor_control_mode_ready,

      last_cmd_str: message.last_cmd_string ,
      last_error_message: message.last_error_message 
    })
    const motorControlsStrList = message.current_motor_control_settings
    if (this.state.rbx_capabilities === null){
      const capabilities = rbxRobots[this.props.rbxNamespace]
      if (capabilities){
        const states=this.getStrListAsList(capabilities.state_options)
        const states_menu_options=this.convertStrListToMenuList(states)
        const modes=this.getStrListAsList(capabilities.mode_options)
        const modes_menu_options=this.convertStrListToMenuList(modes)
      
        this.setState({ 
          rbx_capabilities: capabilities,
          has_battery_feedback: capabilities.has_battery_feedback,
          has_motor_controls: capabilities.has_motor_controls,
          has_autonomous_controls: capabilities.has_autonomous_controls,
          has_set_home: capabilities.has_set_home,
          has_go_stop: capabilities.has_go_stop,
          has_goto_pose: capabilities.has_goto_pose,
          has_goto_position: capabilities.has_goto_position,
          has_goto_location: capabilities.has_goto_location,
          has_fake_gps: capabilities.has_fake_gps,
    
          state_options: capabilities.state_options,
          mode_options: capabilities.mode_options,
          action_options: capabilities.action_options,
          data_products: capabilities.data_products,
        })
        var controls_list = ["None"]
        if (this.state.has_motor_controls){
          controls_list.push("Manual")
        }
        if (this.state.has_autonomous_controls){
          controls_list.push("Autonomous")
        }
        const controls_menu = this.convertStrListToMenuList(controls_list)
        this.setState({
          controls_list: controls_list,
          controls_menu: controls_menu
        })
      }
    }
  }

  // Function for configuring and subscribing to Status
  updateControlsStatusListener() {
    const Namespace = this.props.rbxNamespace
    if (this.state.controlsStatusListener ) {
      this.state.controlsStatusListener .unsubscribe()
    }
    var listener = this.props.ros.setupStatusListener(
          Namespace + "/rbx/status",
          "nepi_ros_interfaces/RBXStatus",
          this.controlsStatusListener
        )
    this.setState({ controlsStatusListener : listener})
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { rbxNamespace } = this.props
    if (prevProps.rbxNamespace !== rbxNamespace && rbxNamespace !== null) {
      if (rbxNamespace.indexOf('null') === -1){
        this.updateControlsStatusListener()
        this.render()
      } 
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.controlsStatusListener ) {
      this.state.controlsStatusListener .unsubscribe()
    }
  }

  onControlSelected(event) {
    this.setState({
      selected_control: event.target.value
    }) 
  }

  convertStrListToMenuList(strList) {
    var menuList = []
    for (let ind = 0; ind < strList.length; ind++){
      menuList.push(<Option>{strList[ind]}</Option>)
    } 
    return menuList
  }

  getStrListAsList(transformsStr) {
    var StrList = []
    if (transformsStr != null){
      transformsStr = transformsStr.replaceAll("[","")
      transformsStr = transformsStr.replaceAll("]","")
      transformsStr = transformsStr.replaceAll(" '","")
      transformsStr = transformsStr.replaceAll("'","")
      StrList = transformsStr.split(",")
    }
    return StrList
  }


  render() {
    const {  sendTriggerMsg } = this.props.ros
    const NoneOption = <Option>None</Option>

    return (
      <Section title={"Process Controls"}>
        <label style={{fontWeight: 'bold'}}>
          {"Initial State"}
        </label>
        
        <Columns>
          <Column>
          
            <Label title={"Latitude"}>
              <Input
                disabled value={this.state.current_long}
                id="InitLatitude"
              />

            </Label>
            <Label title={"Longitude"}>
              <Input
                disabled value={this.state.current_altitude}
                id="InitLongitude"
              />

            </Label>
            <Label title={"Altitude (m)"}>
              <Input
                disabled value={this.state.current_heading}
                id="InitAltitude"
              />

            </Label>
          </Column>
          <Column>
            <Label title={"Roll (deg)"}>
              <Input
                disabled value={this.state.current_roll}
                id="InitRoll"
              />

            </Label>
            <Label title={"Pitch (deg)"}>
              <Input
                disabled value={this.state.current_pitch}
                id="InitPitch"
              />

            </Label>
            <Label title={"Yaw (deg)"}>
              <Input
                disabled value={this.state.current_yaw}
                id="InitYaw"
              />
              
            </Label>
            </Column>
            </Columns>

            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

            <Label title={"Current Battery"}>
              <Input 
               disabled value={this.state.battery}
                id="current_battery"
              />
            </Label>

            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

            <Columns>
            <Column>

            <Label title={"System Ready"}>
              <BooleanIndicator value={(this.state.ready !== null)? this.state.ready : false} />
            </Label>

            <Label title={"Select Control Type"}>
                    <Select
                      id="selected_control"
                      onChange={this.onControlSelected}
                      value={this.state.selected_control}
                    >
                      {this.state.controls_list ? this.state.controls_menu : NoneOption}
                    </Select>
                    </Label>


            </Column>
            <Column>

            <Label title={"Current Process"}>
              <Input
                disabled value={this.state.process_current}
                id="current_process"
              />
            </Label>

            </Column>
            </Columns>

            <Columns>
            <Column>
            
            <div hidden={(this.state.selected_control!=="Autonomous")}>
            <Label title={"Autonomous Ready"}>
              <BooleanIndicator value={(this.state.autonomous_ready !== null)? this.state.autonomous_ready : false} />
            </Label>

            </div>

            </Column>
            </Columns>

            <Columns>
            <Column>

            <div hidden={(this.state.selected_control!=="Manual")}>
            <Label title={"Manual Ready"}>
              <BooleanIndicator value={(this.state.manual_ready !== null)? this.state.manual_ready : false} />
            </Label>

            </div>

            <Label title={""}></Label>
            <Label title={" "}></Label>
            <Label title={""}></Label>

            </Column>
            </Columns>

            <Columns>
            <Column>

            <Label title={"CMD Success"}>
              <BooleanIndicator value={(this.state. cmd_success !== null)? this.state. cmd_success : false} />
            </Label>

            </Column>
            </Columns>

            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>


            <Columns>
            <Column>

            <label style={{fontWeight: 'bold'}}>
             {"Errors"}
            </label>



            </Column>
            </Columns>

            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

            <Columns>
            <Column>

            </Column>
            <Column>

            <Columns>
            <Column>
            </Column>
            <Column>
            </Column>
            <Column>
            <Label title={"Last Command"}>
              <Input
                disabled value={this.state.last_cmd_str}
                id="last_command"
              />
            </Label>
            </Column>
            </Columns>

            </Column>
            </Columns>

      </Section>
    )
  }

}
export default NepiRobotControls
