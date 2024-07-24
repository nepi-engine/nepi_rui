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

      rbxStatusListener: null,

    }

    this.updateRbxStatusListener = this.updateRbxStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)
  }



  // Callback for handling ROS Status messages
  statusListener(message) {
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
  updateRbxStatusListener() {
    const statusNamespace = this.props.rbxNamespace + '/status'
    if (this.state.rbxStatusListener) {
      this.state.rbxStatusListener.unsubscribe()
    }
    var listener = this.props.ros.setupStatusListener(
          statusNamespace + "/rbx/status",
          "nepi_ros_interfaces/RBXStatus",
          this.statusListener
        )
    this.setState({ rbxStatusListener: listener})
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { rbxNamespace } = this.props
    if (prevProps.rbxNamespace !== rbxNamespace && rbxNamespace !== null) {
      if (rbxNamespace.indexOf('null') === -1){
        this.updateRbxStatusListener()
        this.render()
      } 
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.rbxStatusListener) {
      this.state.rbxStatusListener.unsubscribe()
    }
  }


  render() {
    const {  sendTriggerMsg } = this.props.ros
    return (
      <Section title={"Process Controls"}>


      </Section>
    )
  }

}
export default NepiRobotControls
