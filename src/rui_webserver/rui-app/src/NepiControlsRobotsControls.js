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
      last_cmd_str: null,
      last_error_message: null,

      controlsStatusListener : null,

    }

    this.updateControlsStatusListener = this.updateControlsStatusListener.bind(this)
    this.controlsStatusListener = this.controlsStatusListener.bind(this)
  }



  // Callback for handling ROS Status messages
  controlsStatusListener(message) {
    this.setState({
      current_long: message.current_long ,
      current_altitude: message.current_altitude ,
      current_heading: message.current_heading ,
      current_roll: message.current_roll ,
      current_pitch: message.current_pitch ,
      current_yaw: message.current_yaw , 
      process_current: message.rocess_current ,
      process_last: message.process_last ,
      ready: message.ready ,
      battery: message.battery ,
      errors_current: [message.errors_current.x_m ,message.errors_current.x_m, message.errors_current.x_m, message.errors_current.heading_deg, message.errors_current.roll_deg, message.errors_current.pitch_deg, message.errors_current.yaw_deg],
      errors_prev: [message.errors_prev.x_m ,message.errors_prev.x_m, message.errors_prev.x_m, message.errors_prev.heading_deg, message.errors_prev.roll_deg, message.errors_prev.pitch_deg, message.errors_prev.yaw_deg],
      cmd_success: message.cmd_success ,
      manual_ready: message.manual_motor_control_mode_ready ,
      autonomous_ready: message.autonomous_control_mode_ready ,
      last_cmd_str: message.last_cmd_str ,
      last_error_message: message.last_error_message 
    })
    const motorControlsStrList = message.current_motor_control_settings
  }

  // Function for configuring and subscribing to Status
  updateControlsStatusListener() {
    const statusNamespace = this.props.rbxNamespace + '/rbx/status'
    if (this.state.controlsStatusListener ) {
      this.state.controlsStatusListener .unsubscribe()
    }
    var listener = this.props.ros.setupStatusListener(
          statusNamespace + "/rbx/status",
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


  render() {
    const {  sendTriggerMsg } = this.props.ros
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

            <Columns>
            <Column>

            <Label title={"Current Process"}>
              <Input
                disabled value={this.state.process_current}
                id="current_process"
              />
            </Label>

            <Label title={"Ready"}>
              <BooleanIndicator value={(this.state.ready !== null)? this.state.ready : false} />
            </Label>

            <Label title={"Autonomous Control Mode Ready"}>
              <BooleanIndicator value={(this.state.autonomous_ready !== null)? this.state.autonomous_ready : false} />
            </Label>


            </Column>
            <Column>

            <Label title={"Current Battery"}>
              <Input 
               disabled value={this.state.battery}
                id="current_battery"
              />
            </Label>

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

            <Label title={"Last Command"}>
              <Input
                disabled value={this.state.last_cmd_str}
                id="last_command"
              />
            </Label>

            </Column>
            <Column>
            </Column>
            </Columns>

      </Section>
    )
  }

}
export default NepiRobotControls
