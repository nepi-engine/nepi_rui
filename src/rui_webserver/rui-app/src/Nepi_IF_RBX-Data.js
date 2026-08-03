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
import Label from "./Label"
import Input from "./Input"
import Styles from "./Styles"
import BooleanIndicator from "./BooleanIndicator"
import { Column, Columns } from "./Columns"
import { round } from "./Utilities"

@inject("ros")
@observer

// Read-only RBX device data component. Subscribes to the device's
// DeviceRBXStatus on the namespace prop and renders telemetry only. No command
// publishers, no editable inputs. The companion Nepi_IF_RBX-Controls component
// owns every command widget for the same device.
//
// This covers the DeviceRBXStatus telemetry the ConnectRBXDeviceIF interface
// exposes. It deliberately does not pull in the device page's
// NepiDeviceRBX-Info "System Information" panel: that panel re-reads the same
// status fields and adds its own /messages and NavPose subscriptions plus a
// message-queue UI, none of which are part of the connect interface surface.
class NepiIFRBXData extends Component {
  constructor(props) {
    super(props)

    // these states track the values through RBX Status messages
    this.state = {

      namespace: 'None',
      status_msg: null,

      statusListener: null,

    }

    this.renderData = this.renderData.bind(this)

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

  }

  // Callback for handling ROS DeviceRBXStatus messages. Nothing in this
  // component is editable, so the incoming status is tracked directly.
  statusListener(message) {
    this.setState({ status_msg: message })
  }

  // Function for configuring and subscribing to DeviceRBXStatus
  updateStatusListener() {
    const { namespace } = this.props
    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
      this.setState({ status_msg: null, statusListener: null})
    }
    if (namespace !== 'None'){
      var statusListener = this.props.ros.setupRBXStatusListener(
        namespace,
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
  // Used to unsubscribe to DeviceRBXStatus message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
  }


  // Read-only device telemetry, backed by DeviceRBXStatus. No command
  // publishers here.
  renderData() {
    const status_msg = this.state.status_msg
    if (status_msg == null) {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }

    const deviceName = status_msg.device_name
    const deviceNodeName = status_msg.device_node_name
    const swVersion = status_msg.sw_version

    const ready = status_msg.ready
    const battery = round(status_msg.battery + .001, 2)

    const manualReady = status_msg.manual_control_mode_ready
    const autonomousReady = status_msg.autonomous_control_mode_ready

    const processCurrent = status_msg.process_current
    const processLast = status_msg.process_last
    const cmdSuccess = status_msg.cmd_success

    const lastCmdString = status_msg.last_cmd_string
    const lastErrorMessage = status_msg.last_error_message

    const errors = status_msg.errors_current

    return (
      <React.Fragment>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <Label title={"Device Name"}>
          <Input disabled value={deviceName} />
        </Label>

        <Label title={"Node Name"}>
          <Input disabled value={deviceNodeName} />
        </Label>

        <Label title={"SW Version"}>
          <Input disabled value={swVersion} />
        </Label>

        <Label title={"Ready"}>
          <BooleanIndicator value={ready} />
        </Label>

        <Label title={"Battery (0-1)"}>
          <Input disabled value={battery} />
        </Label>

        <Label title={"Manual Control Ready"}>
          <BooleanIndicator value={manualReady} />
        </Label>

        <Label title={"Autonomous Control Ready"}>
          <BooleanIndicator value={autonomousReady} />
        </Label>

        <Label title={"Current Process"}>
          <Input disabled value={processCurrent} />
        </Label>

        <Label title={"Last Process"}>
          <Input disabled value={processLast} />
        </Label>

        <Label title={"Last Cmd Success"}>
          <BooleanIndicator value={cmdSuccess} />
        </Label>

        { (errors != null) ? (
          <React.Fragment>

            <Label title={"Error Heading (deg)"}>
              <Input disabled value={round(errors.heading_deg + .001, 2)} />
            </Label>

            <Label title={"Error X (m)"}>
              <Input disabled value={round(errors.x_m + .001, 2)} />
            </Label>

            <Label title={"Error Y (m)"}>
              <Input disabled value={round(errors.y_m + .001, 2)} />
            </Label>

            <Label title={"Error Z (m)"}>
              <Input disabled value={round(errors.z_m + .001, 2)} />
            </Label>

          </React.Fragment>
        ) : null }

        <Label title={"Last Command"}>
          <Input disabled value={lastCmdString} />
        </Label>

        <Label title={"Last Error"}>
          <Input disabled value={lastErrorMessage} />
        </Label>

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

                    {this.renderData()}

          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={(this.props.title !== undefined) ? this.props.title : null}>

              {this.renderData()}

        </Section>
     )
    }
  }

}
export default NepiIFRBXData
