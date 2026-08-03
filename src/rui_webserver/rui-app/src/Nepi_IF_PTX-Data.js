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

// Read-only PTX device data component. Subscribes to the device's
// DevicePTXStatus on the namespace prop and renders telemetry only. No command
// publishers, no editable inputs. The companion Nepi_IF_PTX-Controls component
// owns every command widget for the same device.
class NepiIFPTXData extends Component {
  constructor(props) {
    super(props)

    // these states track the values through PTX Status messages
    this.state = {

      namespace: 'None',
      status_msg: null,

      statusListener: null,

    }

    this.renderData = this.renderData.bind(this)

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

  }

  // Callback for handling ROS DevicePTXStatus messages. Nothing in this
  // component is editable, so the incoming status is tracked directly.
  statusListener(message) {
    this.setState({ status_msg: message })
  }

  // Function for configuring and subscribing to DevicePTXStatus
  updateStatusListener() {
    const { namespace } = this.props
    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
      this.setState({ status_msg: null, statusListener: null})
    }
    if (namespace !== 'None'){
      var statusListener = this.props.ros.setupPTXStatusListener(
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
  // Used to unsubscribe to DevicePTXStatus message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
  }


  // Read-only device telemetry, backed by DevicePTXStatus. No command
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

    const has_abs_pos = (status_msg.has_absolute_positioning === true)
    const has_speed_control = (status_msg.has_adjustable_speed === true)
    const has_homing = (status_msg.has_homing === true)
    const has_limits = (status_msg.has_limit_controls === true)

    const panPosition = round(status_msg.pan_now_deg + .001, 2)
    const tiltPosition = round(status_msg.tilt_now_deg + .001, 2)

    const panGoal = round(status_msg.pan_goal_deg + .001, 2)
    const tiltGoal = round(status_msg.tilt_goal_deg + .001, 2)

    const panCurSpeed = round(status_msg.speed_pan_dps + .001, 2)
    const tiltCurSpeed = round(status_msg.speed_tilt_dps + .001, 2)

    const speedMax = round(status_msg.speed_max_dps, 2)
    const panSetSpeed = round(status_msg.speed_pan_ratio * status_msg.speed_max_dps + .001, 2)
    const tiltSetSpeed = round(status_msg.speed_tilt_ratio * status_msg.speed_max_dps + .001, 2)

    const isMoving = status_msg.is_moving

    const panSoftMin = round(status_msg.pan_min_softstop_deg, 1)
    const panSoftMax = round(status_msg.pan_max_softstop_deg, 1)
    const tiltSoftMin = round(status_msg.tilt_min_softstop_deg, 1)
    const tiltSoftMax = round(status_msg.tilt_max_softstop_deg, 1)

    const panHardMin = round(status_msg.pan_min_hardstop_deg, 1)
    const panHardMax = round(status_msg.pan_max_hardstop_deg, 1)
    const tiltHardMin = round(status_msg.tilt_min_hardstop_deg, 1)
    const tiltHardMax = round(status_msg.tilt_max_hardstop_deg, 1)

    const panHomePos = round(status_msg.pan_home_pos_deg, 1)
    const tiltHomePos = round(status_msg.tilt_home_pos_deg, 1)

    const reversePanEnabled = status_msg.reverse_pan_enabled
    const reverseTiltEnabled = status_msg.reverse_tilt_enabled

    const error_msgs = status_msg.error_msgs
    const has_errors = (error_msgs !== undefined && error_msgs !== null && error_msgs.length > 0)

    return (
      <React.Fragment>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <Label title={""} style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Pan"}</div>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Tilt"}</div>
        </Label>

        <div hidden={(has_abs_pos === false)}>

          <Label title={"Current Position"}>
            <Input disabled style={{ width: "45%", float: "left" }} value={panPosition} />
            <Input disabled style={{ width: "45%" }} value={tiltPosition} />
          </Label>

          <Label title={"Goal Position"}>
            <Input disabled style={{ width: "45%", float: "left" }} value={panGoal} />
            <Input disabled style={{ width: "45%" }} value={tiltGoal} />
          </Label>

        </div>

        <div hidden={(has_speed_control === false)}>

          <Label title={"Speed (dps)"}>
            <Input disabled style={{ width: "45%", float: "left" }} value={panCurSpeed} />
            <Input disabled style={{ width: "45%" }} value={tiltCurSpeed} />
          </Label>

          <Label title={"Set Speed (dps)"}>
            <Input disabled style={{ width: "45%", float: "left" }} value={panSetSpeed} />
            <Input disabled style={{ width: "45%" }} value={tiltSetSpeed} />
          </Label>

          <Label title={"Max Speed (dps)"}>
            <Input disabled style={{ width: "45%", float: "left" }} value={speedMax} />
          </Label>

        </div>

        <Label title={"Moving"}>
          <BooleanIndicator value={isMoving} />
        </Label>

        <div hidden={(has_limits === false)}>

          <Label title={"Soft Limit Min"}>
            <Input disabled style={{ width: "45%", float: "left" }} value={panSoftMin} />
            <Input disabled style={{ width: "45%" }} value={tiltSoftMin} />
          </Label>

          <Label title={"Soft Limit Max"}>
            <Input disabled style={{ width: "45%", float: "left" }} value={panSoftMax} />
            <Input disabled style={{ width: "45%" }} value={tiltSoftMax} />
          </Label>

          <Label title={"Hard Limit Min"}>
            <Input disabled style={{ width: "45%", float: "left" }} value={panHardMin} />
            <Input disabled style={{ width: "45%" }} value={tiltHardMin} />
          </Label>

          <Label title={"Hard Limit Max"}>
            <Input disabled style={{ width: "45%", float: "left" }} value={panHardMax} />
            <Input disabled style={{ width: "45%" }} value={tiltHardMax} />
          </Label>

        </div>

        <div hidden={(has_homing === false)}>

          <Label title={"Home Position"}>
            <Input disabled style={{ width: "45%", float: "left" }} value={panHomePos} />
            <Input disabled style={{ width: "45%" }} value={tiltHomePos} />
          </Label>

        </div>

        <Label title={"Reverse Enabled"}>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>
            <BooleanIndicator value={reversePanEnabled} />
          </div>
          <div style={{ display: "inline-block", width: "45%", float: "right" }}>
            <BooleanIndicator value={reverseTiltEnabled} />
          </div>
        </Label>

        <div hidden={(has_errors === false)}>
          <Label title={"Error Messages"}>
            <Input disabled value={has_errors ? error_msgs.join(', ') : ''} />
          </Label>
        </div>

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
export default NepiIFPTXData
