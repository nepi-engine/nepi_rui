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
import Toggle from "react-toggle"

import Section from "./Section"
import Select, { Option } from "./Select"
import { Columns, Column } from "./Columns"
import { SliderAdjustment } from "./AdjustmentWidgets"
import BooleanIndicator from "./BooleanIndicator"
import Label from "./Label"
import Input from "./Input"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"

import { round } from "./Utilities"

@inject("ros")
@observer

// Reusable component that renders the selector and data for a motorized device
// connected through the ConnectMotorsDeviceIF interface. It subscribes to the
// connect namespace ConnectIFStatus (selector/connection state and
// section-visibility flags) and to the selected device's MotorsStatus (the
// per-motor telemetry array), talking to ROS directly through this.props.ros
// the same way the neighboring Nepi_IF_Connect* components do.
//
// Each motor is rendered as a single row: its read-only status telemetry and,
// under show_controls, its command controls sit side by side in adjacent
// columns. Command controls publish the four standard motor command topics
// (set_speed, set_direction, go_direction, stop_motor), each carrying a
// nepi_interfaces/MotorCommand keyed by motor_name, on the selected device
// namespace. Motion is continuous-until-stop: GO starts the motor moving in its
// set direction at its set speed, STOP halts it.
class NepiIFConnectMotor extends Component {
  constructor(props) {
    super(props)

    this.state = {

      // Connect namespace (node_name/motor_connect)
      namespace: null,

      // Two status sources
      connect_status_msg: null,   // ConnectIFStatus
      device_status_msg: null,    // MotorsStatus

      // The device status topic the device listener is currently pointed at
      selected_topic: 'None',

      // Status listener handles
      connectStatusListener: null,
      deviceStatusListener: null,

      // Local intended-direction UI state keyed by motor_name (1 = clockwise,
      // -1 = counter-clockwise). MotorStatus.motor_dir reports the reverse flag,
      // a different concept from the commanded direction, so the direction
      // toggle tracks its own state here (default clockwise) and publishes
      // set_direction on change.
      motorDirections: {},

    }

    this.getConnectNamespace = this.getConnectNamespace.bind(this)

    this.publishMotorCommand = this.publishMotorCommand.bind(this)
    this.getMotorDirection = this.getMotorDirection.bind(this)

    this.updateConnectStatusListener = this.updateConnectStatusListener.bind(this)
    this.connectStatusListener = this.connectStatusListener.bind(this)
    this.updateDeviceStatusListener = this.updateDeviceStatusListener.bind(this)
    this.deviceStatusListener = this.deviceStatusListener.bind(this)

    this.onDeviceSelected = this.onDeviceSelected.bind(this)

    this.renderSelector = this.renderSelector.bind(this)
    this.renderMotorStatus = this.renderMotorStatus.bind(this)
    this.renderMotorControlFields = this.renderMotorControlFields.bind(this)
    this.renderMotorRow = this.renderMotorRow.bind(this)
    this.renderMotors = this.renderMotors.bind(this)
  }

  // Resolve the connect namespace from the namespace prop
  getConnectNamespace() {
    return (this.props.namespace !== undefined) ? this.props.namespace : null
  }

  componentDidMount() {
    this.updateConnectStatusListener()
  }

  // Lifecycle method called when the component updates.
  // Re-point the connect listener when the namespace prop changes.
  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace = this.getConnectNamespace()
    if (namespace !== this.state.namespace) {
      this.updateConnectStatusListener()
    }
  }

  // Lifecycle method called just before the component unmounts.
  // Used to tear down both status listeners.
  componentWillUnmount() {
    if (this.state.connectStatusListener) {
      this.state.connectStatusListener.unsubscribe()
    }
    if (this.state.deviceStatusListener) {
      this.state.deviceStatusListener.unsubscribe()
    }
    this.setState({ connectStatusListener: null, deviceStatusListener: null })
  }

  // Function for configuring and subscribing to the connect namespace status
  // topic (node_name/motor_connect/status), message type ConnectIFStatus.
  updateConnectStatusListener() {
    const namespace = this.getConnectNamespace()
    if (this.state.connectStatusListener != null) {
      this.state.connectStatusListener.unsubscribe()
      this.setState({ connectStatusListener: null, connect_status_msg: null })
    }
    if (namespace != null && namespace !== 'None') {
      const statusNamespace = namespace + '/status'
      var connectStatusListener = this.props.ros.setupStatusListener(
        statusNamespace,
        "nepi_interfaces/ConnectIFStatus",
        this.connectStatusListener
      )
      this.setState({ connectStatusListener: connectStatusListener })
    }
    this.setState({ namespace: namespace })
  }

  // Callback for ConnectIFStatus messages. Stores the message and re-points the
  // device status listener whenever selected_topic changes.
  connectStatusListener(message) {
    this.setState({ connect_status_msg: message })
    if (message.selected_topic !== this.state.selected_topic) {
      this.updateDeviceStatusListener(message.selected_topic)
    }
  }

  // Function for configuring and subscribing to the selected device's motor
  // status topic (selected_topic/motor_status), message type MotorsStatus.
  updateDeviceStatusListener(selected_topic) {
    if (this.state.deviceStatusListener != null) {
      this.state.deviceStatusListener.unsubscribe()
      this.setState({ deviceStatusListener: null, device_status_msg: null })
    }
    if (selected_topic != null && selected_topic !== 'None') {
      const statusNamespace = selected_topic + '/motor_status'
      var deviceStatusListener = this.props.ros.setupStatusListener(
        statusNamespace,
        "nepi_interfaces/MotorsStatus",
        this.deviceStatusListener
      )
      this.setState({ deviceStatusListener: deviceStatusListener })
    }
    this.setState({ selected_topic: selected_topic })
  }

  // Callback for MotorsStatus messages.
  deviceStatusListener(message) {
    this.setState({ device_status_msg: message })
  }

  // Handler for the device Select. Changes the connected topic by publishing a
  // std_msgs/String to the connect namespace select_topic topic.
  onDeviceSelected(event) {
    const namespace = this.getConnectNamespace()
    const value = event.target.value
    if (namespace != null && namespace !== 'None') {
      this.props.ros.sendStringMsg(namespace + '/select_topic', value)
    }
  }

  // Device selector, backed by ConnectIFStatus. Populated from
  // available_topics/available_names, shows the selected_name and a connected
  // BooleanIndicator, and changes the connection by publishing a
  // std_msgs/String to the connect namespace select_topic topic.
  renderSelector() {
    const connect_status_msg = this.state.connect_status_msg
    if (connect_status_msg == null) {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }

    const available_topics = connect_status_msg.available_topics
    const available_names = connect_status_msg.available_names
    const selected_topic = connect_status_msg.selected_topic
    const connected = connect_status_msg.connected

    var items = []
    items.push(<Option value={'None'}>{'None'}</Option>)
    for (var i = 0; i < available_topics.length; i++) {
      const device_name = (available_names[i] !== undefined) ? available_names[i] : available_topics[i]
      items.push(<Option value={available_topics[i]}>{device_name}</Option>)
    }

    return (
      <Columns>
        <Column>

          <Label title={"Device"}>
            <Select
              onChange={this.onDeviceSelected}
              value={selected_topic}
            >
              {items}
            </Select>
          </Label>

        </Column>
        <Column>

          <Label title={"Connected"}>
            <BooleanIndicator value={connected} />
          </Label>

        </Column>
      </Columns>
    )
  }

  // Read-only telemetry fields for a single motor, backed by one MotorStatus
  // element of the MotorsStatus array. No divider or motor-name header (the row
  // that hosts this supplies those); no command publishers here.
  renderMotorStatus(motor, index) {
    const motor_enable = motor.motor_enable
    const motor_dir = motor.motor_dir
    const motor_max_speed = round(motor.motor_max_speed + .001, 2)
    const motor_speed_ratio = round(motor.motor_speed_ratio + .001, 2)
    const motor_speed = round(motor.motor_speed + .001, 2)
    const motor_position = round(motor.motor_position + .001, 2)

    return (
      <React.Fragment>

        <Label title={"Enabled"}>
          <BooleanIndicator value={motor_enable} />
        </Label>

        <Label title={"Direction"}>
          <Input disabled value={motor_dir} />
        </Label>

        <Label title={"Max Speed (dps)"}>
          <Input disabled value={motor_max_speed} />
        </Label>

        <Label title={"Speed Ratio (0-1)"}>
          <Input disabled value={motor_speed_ratio} />
        </Label>

        <Label title={"Speed (dps)"}>
          <Input disabled value={motor_speed} />
        </Label>

        <Label title={"Position (deg)"}>
          <Input disabled value={motor_position} />
        </Label>

      </React.Fragment>
    )
  }

  // Command control fields for a single motor: a speed_ratio slider (enabled
  // only when the motor reports an adjustable speed, motor_max_speed > 0), a
  // clockwise/counter-clockwise direction toggle, and GO / STOP buttons for
  // continuous motion. No divider or motor-name header (the row supplies those).
  renderMotorControlFields(motor, index) {
    const motor_name = (motor.motor_name !== undefined && motor.motor_name !== '') ? motor.motor_name : ('motor_' + index)
    const has_speed = (motor.motor_max_speed > 0)
    const motor_speed_ratio = motor.motor_speed_ratio
    const direction = this.getMotorDirection(motor_name)
    const is_cw = (direction === 1)

    return (
      <React.Fragment>

        <div hidden={(has_speed === false)}>
          <SliderAdjustment
            disabled={!has_speed}
            title={"Speed"}
            msgType={"nepi_interfaces/MotorCommand"}
            adjustment={motor_speed_ratio}
            topic={this.state.selected_topic + "/set_speed"}
            scaled={0.01}
            min={0}
            max={100}
            tooltip={"Speed as a percentage (0%=off, 100%=max)"}
            unit={"%"}
            onSliderChangeOverride={(new_value) => this.publishMotorCommand('set_speed', motor_name, new_value * 0.01, 0)}
          />
        </div>

        <Label title={"Direction"}>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>
            <Toggle
              checked={is_cw}
              onClick={() => {
                const new_dir = is_cw ? -1 : 1
                this.setState({ motorDirections: { ...this.state.motorDirections, [motor_name]: new_dir } })
                this.publishMotorCommand('set_direction', motor_name, 0.0, new_dir)
              }}
            />
          </div>
          <div style={{ display: "inline-block", width: "50%", float: "right" }}>
            {is_cw ? "Clockwise" : "Counter-Clockwise"}
          </div>
        </Label>

        <ButtonMenu>
          <Button onClick={() => this.publishMotorCommand('go_direction', motor_name, 0.0, 0)}>{"GO"}</Button>
          <Button onClick={() => this.publishMotorCommand('stop_motor', motor_name, 0.0, 0)}>{"STOP"}</Button>
        </ButtonMenu>

      </React.Fragment>
    )
  }

  // One row per motor: a divider, the bold motor_name header, then the motor's
  // read-only status and (under show_controls) its command controls side by side
  // in adjacent columns.
  renderMotorRow(motor, index, show_data, show_controls) {
    const motor_name = (motor.motor_name !== undefined && motor.motor_name !== '') ? motor.motor_name : ('motor_' + index)

    return (
      <React.Fragment key={motor_name + '_row'}>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <Label title={motor_name} style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}/>

        <Columns>
          { (show_data === true) ? (
            <Column>
              {this.renderMotorStatus(motor, index)}
            </Column>
          ) : null }
          { (show_controls === true) ? (
            <Column>
              {this.renderMotorControlFields(motor, index)}
            </Column>
          ) : null }
        </Columns>

      </React.Fragment>
    )
  }

  // Device telemetry + controls, backed by MotorsStatus. Renders the device
  // header (device name / motor count, under show_data) and one row per motor,
  // each row placing that motor's status and controls next to each other.
  renderMotors(show_data, show_controls) {
    const status_msg = this.state.device_status_msg
    if (status_msg == null || status_msg.motors == null) {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }

    const device_name = status_msg.device_name
    const motors = status_msg.motors

    return (
      <React.Fragment>

        { (show_data === true) ? (
          <React.Fragment>
            <Label title={"Device Name"}>
              <Input disabled value={device_name} />
            </Label>

            <Label title={"Motor Count"}>
              <Input disabled value={motors.length} />
            </Label>
          </React.Fragment>
        ) : null }

        { motors.map((motor, index) => this.renderMotorRow(motor, index, show_data, show_controls)) }

      </React.Fragment>
    )
  }

  // Publish one of the four standard motor command topics on the selected
  // device namespace, carrying a nepi_interfaces/MotorCommand keyed by
  // motor_name. speed_ratio is only meaningful for set_speed and direction only
  // for set_direction; the other fields are sent as 0.
  publishMotorCommand(command_topic, motor_name, speed_ratio, direction) {
    const namespace = this.state.selected_topic
    if (namespace == null || namespace === 'None') {
      return
    }
    this.props.ros.publishMessage({
      name: namespace + '/' + command_topic,
      messageType: "nepi_interfaces/MotorCommand",
      data: {
        motor_name: motor_name,
        speed_ratio: (speed_ratio !== undefined && speed_ratio !== null) ? Number(speed_ratio) : 0.0,
        direction: (direction !== undefined && direction !== null) ? direction : 0
      },
      noPrefix: true
    })
  }

  // Resolve the current intended direction for a motor (1 = clockwise,
  // -1 = counter-clockwise), defaulting to clockwise.
  getMotorDirection(motor_name) {
    const dir = this.state.motorDirections[motor_name]
    return (dir === -1) ? -1 : 1
  }

  render() {
    const connect_status_msg = this.state.connect_status_msg
    const make_section = (this.props.make_section !== undefined) ? this.props.make_section : true
    const title = (this.props.title !== undefined) ? this.props.title : "Motor Connect"

    // No connect status yet: render nothing (empty Columns/Column), matching
    // the Nepi_IF_ConnectPTX "not ready" branch.
    if (connect_status_msg == null) {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }

    // Resolve the three section-visibility flags by combining the props with
    // the ConnectIFStatus flags the same defaulting way Nepi_IF_ConnectPTX
    // resolves its show_* props: a prop overrides, otherwise fall back to the
    // backend flag from ConnectIFStatus.
    const show_selector = (this.props.show_selector !== undefined) ? this.props.show_selector : connect_status_msg.show_selector
    const show_controls = (this.props.show_controls !== undefined) ? this.props.show_controls : connect_status_msg.show_controls
    const show_data = (this.props.show_data !== undefined) ? this.props.show_data : connect_status_msg.show_data

    const content = (
      <React.Fragment>

        { (show_selector === true) ? this.renderSelector() : null }
        { (show_data === true || show_controls === true) ? this.renderMotors(show_data, show_controls) : null }

      </React.Fragment>
    )

    if (make_section === false) {
      return (
        <React.Fragment>
          {content}
        </React.Fragment>
      )
    }
    else {
      return (
        <Section title={(this.props.title !== undefined) ? this.props.title : title}>
          {content}
        </Section>
      )
    }
  }

}

export default NepiIFConnectMotor
