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
import { SliderAdjustment } from "./AdjustmentWidgets"
import Label from "./Label"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"
import { Column, Columns } from "./Columns"

import NepiIFSettings from "./Nepi_IF_Settings"
import NepiIFAdmin from "./Nepi_IF_Admin"

@inject("ros")
@observer

// Command component for a motor device. Subscribes to the device's MotorsStatus
// on the namespace prop (namespace/motor_status) and renders command widgets
// only. The companion Nepi_IF_Motor-Data component owns the read-only telemetry
// rows for the same device.
//
// Command controls publish the four standard motor command topics (set_speed,
// set_direction, go_direction, stop_motor), each carrying a
// nepi_interfaces/MotorCommand keyed by motor_name, on the device namespace.
// Motion is continuous-until-stop: GO starts the motor moving in its set
// direction at its set speed, STOP halts it.
//
// One row per motor, each with a divider and the bold motor_name header. The
// pre-split Nepi_IF_ConnectMotor placed a motor's read-only cells and its
// command cells side by side in adjacent columns of a single row; with data and
// controls in separate components those become two stacked blocks, each with its
// own per-motor rows.
//
// The Device Settings (Nepi_IF_Settings) and Advanced Settings (Nepi_IF_Admin)
// panels for the connected device are rendered here as well, so any page that
// drops in this component gets them without wiring up the device namespace
// itself. Suppress either one with show_settings/show_admin={false}.
class NepiIFMotorControls extends Component {
  constructor(props) {
    super(props)

    // these states track the values through MotorsStatus messages
    this.state = {

      namespace: 'None',
      status_msg: null,

      statusListener: null,

      // Local intended-direction UI state keyed by motor_name (1 = clockwise,
      // -1 = counter-clockwise). MotorStatus.motor_dir reports the reverse flag,
      // a different concept from the commanded direction, so the direction
      // toggle tracks its own state here (default clockwise) and publishes
      // set_direction on change.
      motorDirections: {},

    }

    this.publishMotorCommand = this.publishMotorCommand.bind(this)
    this.getMotorDirection = this.getMotorDirection.bind(this)

    this.renderMotorControlFields = this.renderMotorControlFields.bind(this)
    this.renderMotorRow = this.renderMotorRow.bind(this)
    this.renderControls = this.renderControls.bind(this)
    this.renderSettingsAndAdmin = this.renderSettingsAndAdmin.bind(this)

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

  }

  // Callback for handling ROS MotorsStatus messages.
  statusListener(message) {
    this.setState({ status_msg: message })
  }

  // Function for configuring and subscribing to the device's motor status topic
  // (namespace/motor_status), message type MotorsStatus.
  updateStatusListener() {
    const { namespace } = this.props
    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
      this.setState({ status_msg: null, statusListener: null})
    }
    if (namespace != null && namespace !== 'None'){
      const statusNamespace = namespace + '/motor_status'
      var statusListener = this.props.ros.setupStatusListener(
        statusNamespace,
        "nepi_interfaces/MotorsStatus",
        this.statusListener
      )
      this.setState({ statusListener: statusListener})
    }
    this.setState({ namespace: namespace})

  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { namespace } = this.props
    if (namespace !== this.state.namespace){
      if (namespace !== null) {
        this.updateStatusListener()
      }
    }
  }

  componentDidMount() {
    this.updateStatusListener()
    }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to MotorsStatus message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
  }

  // Publish one of the four standard motor command topics on the device
  // namespace, carrying a nepi_interfaces/MotorCommand keyed by motor_name.
  // speed_ratio is only meaningful for set_speed and direction only for
  // set_direction; the other fields are sent as 0.
  publishMotorCommand(command_topic, motor_name, speed_ratio, direction) {
    const namespace = this.props.namespace
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
            topic={this.props.namespace + "/set_speed"}
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

  // One row per motor: a divider, the bold motor_name header, then that motor's
  // command controls.
  renderMotorRow(motor, index) {
    const motor_name = (motor.motor_name !== undefined && motor.motor_name !== '') ? motor.motor_name : ('motor_' + index)

    return (
      <React.Fragment key={motor_name + '_controls_row'}>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <Label title={motor_name} style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}/>

        <Columns>
          <Column>
            {this.renderMotorControlFields(motor, index)}
          </Column>
        </Columns>

      </React.Fragment>
    )
  }

  // Command controls, backed by MotorsStatus. One row per motor.
  renderControls() {
    const status_msg = this.state.status_msg
    if (status_msg == null || status_msg.motors == null) {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }

    // Device command namespace is the selected device topic, supplied by the
    // parent as the namespace prop.
    const namespace = this.props.namespace
    if (namespace == null || namespace === 'None') {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }

    const motors = status_msg.motors

    return (
      <React.Fragment>

        { motors.map((motor, index) => this.renderMotorRow(motor, index)) }

      </React.Fragment>
    )
  }


  // Device Settings and Advanced Settings panels for the connected device.
  // Both build their own Section, so these are rendered as siblings of this
  // component's Section rather than nested inside it.
  //
  // Motor devices have no capabilities dictionary in the ros store, so the node
  // name for the Advanced Settings panel cannot be resolved the way the typed
  // device controls components resolve it. Pass node_name explicitly, or pass
  // show_admin={false} to suppress that panel.
  renderSettingsAndAdmin() {
    const namespace = this.state.namespace
    const has_device = (namespace != null && namespace !== 'None')
    if (has_device === false){
      return null
    }

    const show_settings = (this.props.show_settings !== undefined) ? this.props.show_settings : true
    const show_admin = (this.props.show_admin !== undefined) ? this.props.show_admin : true
    if (show_settings === false && show_admin === false){
      return null
    }

    const node_name = (this.props.node_name !== undefined) ? this.props.node_name : 'None'

    return (
      <React.Fragment>

        {(show_settings === true) ?
          <NepiIFSettings
            settingsNamespace={namespace + '/settings'}
            title={"Device Settings"}
          />
        : null}

        {(show_admin === true) ?
          <NepiIFAdmin
            title={"Advanced Settings"}
            show_advanced_option={true}
            show_admin_device_names={true}
            node_name={node_name}
            make_section={true}
          />
        : null}

      </React.Fragment>
    )
  }


  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const status_msg = this.state.status_msg
    if (status_msg == null){
      return (
        <Columns>
        <Column>

        </Column>
        </Columns>
      )
    }
    else if (make_section === false){
      return (

          <React.Fragment>

                    {this.renderControls()}

                    { this.renderSettingsAndAdmin() }

          </React.Fragment>
      )
    }
    else {
      return (

        <React.Fragment>

          <Section title={(this.props.title !== undefined) ? this.props.title : null}>

              {this.renderControls()}

          </Section>

          { this.renderSettingsAndAdmin() }

        </React.Fragment>
     )
    }
  }

}
export default NepiIFMotorControls
