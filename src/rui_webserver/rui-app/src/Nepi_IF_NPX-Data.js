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

// Read-only NPX device data component. Subscribes to the device's
// DeviceNPXStatus on the namespace prop and renders telemetry only. No command
// publishers, no editable inputs. The companion Nepi_IF_NPX-Controls component
// owns every command widget for the same device.
class NepiIFNPXData extends Component {
  constructor(props) {
    super(props)

    // these states track the values through NPX Status messages
    this.state = {

      namespace: 'None',
      status_msg: null,

      statusListener: null,

    }

    this.renderData = this.renderData.bind(this)

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

  }

  // Callback for handling ROS DeviceNPXStatus messages. Nothing in this
  // component is editable, so the incoming status is tracked directly.
  statusListener(message) {
    this.setState({ status_msg: message })
  }

  // Function for configuring and subscribing to DeviceNPXStatus
  updateStatusListener() {
    const { namespace } = this.props
    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
      this.setState({ status_msg: null, statusListener: null})
    }
    if (namespace !== 'None'){
      var statusListener = this.props.ros.setupNPXStatusListener(
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
  // Used to unsubscribe to DeviceNPXStatus message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
  }


  // Read-only device telemetry, backed by DeviceNPXStatus. No command
  // publishers here. The navpose capability rows are gated by the device's
  // has_* flags, mirroring the PTX capability-gated data pattern.
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
    const navposeFrame = status_msg.navpose_frame
    const updateRate = round(status_msg.update_rate + .001, 2)

    const hasLocation = (status_msg.has_location === true)
    const hasHeading = (status_msg.has_heading === true)
    const hasOrientation = (status_msg.has_orientation === true)
    const hasPosition = (status_msg.has_position === true)
    const hasAltitude = (status_msg.has_altitude === true)
    const hasDepth = (status_msg.has_depth === true)
    const hasPanTilt = (status_msg.has_pan_tilt === true)

    return (
      <React.Fragment>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <Label title={"Device Name"}>
          <Input disabled value={deviceName} />
        </Label>

        <Label title={"NavPose Frame"}>
          <Input disabled value={navposeFrame} />
        </Label>

        <Label title={"Update Rate (Hz)"}>
          <Input disabled value={updateRate} />
        </Label>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <Label title={""} style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Capabilities"}
        </Label>

        <Label title={"Location"}>
          <BooleanIndicator value={hasLocation} />
        </Label>

        <Label title={"Heading"}>
          <BooleanIndicator value={hasHeading} />
        </Label>

        <Label title={"Orientation"}>
          <BooleanIndicator value={hasOrientation} />
        </Label>

        <Label title={"Position"}>
          <BooleanIndicator value={hasPosition} />
        </Label>

        <Label title={"Altitude"}>
          <BooleanIndicator value={hasAltitude} />
        </Label>

        <Label title={"Depth"}>
          <BooleanIndicator value={hasDepth} />
        </Label>

        <Label title={"Pan/Tilt"}>
          <BooleanIndicator value={hasPanTilt} />
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
export default NepiIFNPXData
