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

// Read-only LSX device data component. Subscribes to the device's
// DeviceLSXStatus on the namespace prop and renders telemetry only. No command
// publishers, no editable inputs. The companion Nepi_IF_LSX-Controls component
// owns every command widget for the same device.
class NepiIFLSXData extends Component {
  constructor(props) {
    super(props)

    // these states track the values through LSX Status messages
    this.state = {

      namespace: 'None',
      status_msg: null,

      statusListener: null,

    }

    this.renderData = this.renderData.bind(this)

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

  }

  // Callback for handling ROS DeviceLSXStatus messages. Nothing in this
  // component is editable, so the incoming status is tracked directly.
  statusListener(message) {
    this.setState({ status_msg: message })
  }

  // Function for configuring and subscribing to DeviceLSXStatus
  updateStatusListener() {
    const { namespace } = this.props
    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
      this.setState({ status_msg: null, statusListener: null})
    }
    if (namespace !== 'None'){
      var statusListener = this.props.ros.setupLSXStatusListener(
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
  // Used to unsubscribe to DeviceLSXStatus message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
  }


  // Read-only device telemetry, backed by DeviceLSXStatus. No command
  // publishers here. LSX exposes no explicit has_* capability flags, so all
  // telemetry fields are shown when a device status is present.
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
    const onOffState = status_msg.on_off_state
    const standbyState = status_msg.standby_state
    const blinkState = status_msg.blink_state
    const strobeState = status_msg.strobe_state

    const intensity = round(status_msg.intensity_ratio + .001, 2)
    const blinkInterval = round(status_msg.blink_interval + .001, 2)
    const colorSetting = status_msg.color_setting
    const kelvinSetting = status_msg.kelvin_setting

    const tempC = status_msg.temp_c
    const powerW = round(status_msg.power_w + .001, 2)

    return (
      <React.Fragment>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <Label title={"Device Name"}>
          <Input disabled value={deviceName} />
        </Label>

        <Label title={"On"}>
          <BooleanIndicator value={onOffState} />
        </Label>

        <Label title={"Standby"}>
          <BooleanIndicator value={standbyState} />
        </Label>

        <Label title={"Blinking"}>
          <BooleanIndicator value={blinkState} />
        </Label>

        <Label title={"Strobe"}>
          <BooleanIndicator value={strobeState} />
        </Label>

        <Label title={"Intensity"}>
          <Input disabled value={intensity} />
        </Label>

        <Label title={"Blink Interval (s)"}>
          <Input disabled value={blinkInterval} />
        </Label>

        <Label title={"Color"}>
          <Input disabled value={colorSetting} />
        </Label>

        <Label title={"Kelvin"}>
          <Input disabled value={kelvinSetting} />
        </Label>

        <Label title={"Temp (C)"}>
          <Input disabled value={tempC} />
        </Label>

        <Label title={"Power (W)"}>
          <Input disabled value={powerW} />
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
export default NepiIFLSXData
