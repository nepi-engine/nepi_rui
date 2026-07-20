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

import { round, setElementStyleModified, clearElementStyleModified } from "./Utilities"

import NepiIFConfig from "./Nepi_IF_Config"

@inject("ros")
@observer

// Reusable component that renders the selector, data, and controls for an LSX
// light/laser device connected through the ConnectLSXDeviceIF interface. It
// subscribes to the connect namespace ConnectIFStatus (selector/connection
// state and section-visibility flags) and to the selected device's
// DeviceLSXStatus (telemetry and state fields), talking to ROS directly
// through this.props.ros the same way the neighboring Nepi_IF_ components do.
class NepiIFConnectLSX extends Component {
  constructor(props) {
    super(props)

    this.state = {

      // Connect namespace (node_name/lsx_connect)
      namespace: null,

      // Two status sources
      connect_status_msg: null,   // ConnectIFStatus
      device_status_msg: null,    // DeviceLSXStatus

      // The device status topic the device listener is currently pointed at
      selected_topic: 'None',

      // Status listener handles
      connectStatusListener: null,
      deviceStatusListener: null,

      // Edit buffers for the editable command inputs. Kept separate from the
      // device status so typing is not clobbered by incoming status messages.
      color: '',
      kelvin: '',
      blinkInterval: '',

      // Ids of inputs edited but not yet committed (per the RUI dirty-input
      // convention), styled via setElementStyleModified/clearElementStyleModified.
      dirtyFields: new Set(),

    }

    this.getConnectNamespace = this.getConnectNamespace.bind(this)

    this.updateConnectStatusListener = this.updateConnectStatusListener.bind(this)
    this.connectStatusListener = this.connectStatusListener.bind(this)
    this.updateDeviceStatusListener = this.updateDeviceStatusListener.bind(this)
    this.deviceStatusListener = this.deviceStatusListener.bind(this)

    this.onDeviceSelected = this.onDeviceSelected.bind(this)
    this.onUpdateInput = this.onUpdateInput.bind(this)
    this.onKeyInput = this.onKeyInput.bind(this)

    this.renderSelector = this.renderSelector.bind(this)
    this.renderData = this.renderData.bind(this)
    this.renderControls = this.renderControls.bind(this)
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
  // topic (node_name/lsx_connect/status), message type ConnectIFStatus.
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

  // Function for configuring and subscribing to the selected device's status
  // topic (selected_topic/status), message type DeviceLSXStatus.
  updateDeviceStatusListener(selected_topic) {
    if (this.state.deviceStatusListener != null) {
      this.state.deviceStatusListener.unsubscribe()
      this.setState({ deviceStatusListener: null, device_status_msg: null })
    }
    if (selected_topic != null && selected_topic !== 'None') {
      var deviceStatusListener = this.props.ros.setupLSXStatusListener(
        selected_topic,
        this.deviceStatusListener
      )
      this.setState({ deviceStatusListener: deviceStatusListener })
    }
    this.setState({ selected_topic: selected_topic })
  }

  // Callback for DeviceLSXStatus messages.
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

  // Editable-input change handler: mark the box modified (red + bold) and record
  // it as dirty. stateKey is the edit-buffer field to store the typed value in.
  onUpdateInput(e, stateKey) {
    const id = e.target.id
    const el = document.getElementById(id)
    if (el) {
      setElementStyleModified(el)
    }
    const dirtyFields = new Set(this.state.dirtyFields)
    dirtyFields.add(id)
    this.setState({ [stateKey]: e.target.value, dirtyFields: dirtyFields })
  }

  // Editable-input commit handler: on Enter, publish the command to the selected
  // device topic and clear the modified style / dirty flag.
  onKeyInput(e) {
    if (e.key !== 'Enter') {
      return
    }
    const { sendStringMsg, sendIntMsg, sendFloatMsg } = this.props.ros
    const status_msg = this.state.device_status_msg
    const connect_status_msg = this.state.connect_status_msg
    if (status_msg == null || connect_status_msg == null) {
      return
    }
    const namespace = connect_status_msg.selected_topic
    if (namespace == null || namespace === 'None') {
      return
    }

    const dirtyFields = new Set(this.state.dirtyFields)
    const clearDirty = (fid) => {
      const fel = document.getElementById(fid)
      if (fel) {
        clearElementStyleModified(fel)
      }
      dirtyFields.delete(fid)
    }

    const id = e.target.id

    if (id === "ConnectLSXColor") {
      sendStringMsg(namespace + "/set_color", e.target.value)
      clearDirty(id)
    }
    else if (id === "ConnectLSXKelvin") {
      sendIntMsg(namespace + "/set_kelvin", Number(e.target.value))
      clearDirty(id)
    }
    else if (id === "ConnectLSXBlinkInterval") {
      sendFloatMsg(namespace + "/set_blink_interval", Number(e.target.value))
      clearDirty(id)
    }

    this.setState({ dirtyFields: dirtyFields })
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

  // Read-only device telemetry, backed by DeviceLSXStatus. No command
  // publishers here. LSX exposes no explicit has_* capability flags, so all
  // telemetry fields are shown when a device status is present.
  renderData() {
    const status_msg = this.state.device_status_msg
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

  // Command controls, backed by DeviceLSXStatus. Publishes through
  // this.props.ros to the device topic names the ConnectLSXDeviceIF publishers
  // use, showing off the full ConnectLSXDeviceIF command API: on/off, standby,
  // intensity, strobe, color, kelvin, blink interval, reset-controls, and
  // save/reset config.
  renderControls() {
    const { sendBoolMsg } = this.props.ros

    const connect_status_msg = this.state.connect_status_msg
    const status_msg = this.state.device_status_msg
    if (connect_status_msg == null || status_msg == null) {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }

    // Device command namespace is the selected device topic.
    const namespace = connect_status_msg.selected_topic
    if (namespace == null || namespace === 'None') {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }

    const onOffState = status_msg.on_off_state
    const standbyState = status_msg.standby_state
    const strobeState = status_msg.strobe_state
    const intensityRatio = status_msg.intensity_ratio

    // Edit buffers for the editable command inputs.
    const color = this.state.color
    const kelvin = this.state.kelvin
    const blinkInterval = this.state.blinkInterval

    return (
      <React.Fragment>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <Label title={"On"}>
          {/* device_if_lsx subscribes standby on the 'set_empty' topic, mirrored here */}
          <Toggle checked={onOffState} onClick={() => sendBoolMsg.bind(this)(namespace + "/turn_on_off", !onOffState)} />
        </Label>

        <Label title={"Standby"}>
          <Toggle checked={standbyState} onClick={() => sendBoolMsg.bind(this)(namespace + "/set_empty", !standbyState)} />
        </Label>

        <Label title={"Strobe"}>
          <Toggle checked={strobeState} onClick={() => sendBoolMsg.bind(this)(namespace + "/set_strobe_enable", !strobeState)} />
        </Label>

        <SliderAdjustment
          title={"Intensity"}
          msgType={"std_msgs/Float32"}
          adjustment={intensityRatio}
          topic={namespace + "/set_intensity_ratio"}
          scaled={0.01}
          min={0}
          max={100}
          tooltip={"Intensity as a percentage (0%=off, 100%=max)"}
          unit={"%"}
        />

        <Label title={"Color"}>
          <Input
            id={"ConnectLSXColor"}
            value={color}
            onChange={(e) => this.onUpdateInput(e, "color")}
            onKeyDown={this.onKeyInput}
          />
        </Label>

        <Label title={"Kelvin"}>
          <Input
            id={"ConnectLSXKelvin"}
            value={kelvin}
            onChange={(e) => this.onUpdateInput(e, "kelvin")}
            onKeyDown={this.onKeyInput}
          />
        </Label>

        <Label title={"Blink Interval (s)"}>
          <Input
            id={"ConnectLSXBlinkInterval"}
            value={blinkInterval}
            onChange={(e) => this.onUpdateInput(e, "blinkInterval")}
            onKeyDown={this.onKeyInput}
          />
        </Label>

        <ButtonMenu>
          <Button onClick={() => this.props.ros.sendTriggerMsg(namespace + "/reset_controls")}>{"Reset Controls"}</Button>
        </ButtonMenu>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <NepiIFConfig
          namespace={namespace}
          show_save_all={true}
          title={"Nepi_IF_Config"}
        />

      </React.Fragment>
    )
  }

  render() {
    const connect_status_msg = this.state.connect_status_msg
    const make_section = (this.props.make_section !== undefined) ? this.props.make_section : true
    const title = (this.props.title !== undefined) ? this.props.title : "LSX Connect"

    // No connect status yet: render nothing (empty Columns/Column), matching
    // the Nepi_IF_Admin "not ready" branch.
    if (connect_status_msg == null) {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }

    // Resolve the three section-visibility flags by combining the props with
    // the ConnectIFStatus flags the same defaulting way Nepi_IF_Admin resolves
    // its show_* props: a prop overrides, otherwise fall back to the backend
    // flag from ConnectIFStatus.
    const show_selector = (this.props.show_selector !== undefined) ? this.props.show_selector : connect_status_msg.show_selector
    const show_controls = (this.props.show_controls !== undefined) ? this.props.show_controls : connect_status_msg.show_controls
    const show_data = (this.props.show_data !== undefined) ? this.props.show_data : connect_status_msg.show_data

    const content = (
      <React.Fragment>

        { (show_selector === true) ? this.renderSelector() : null }
        { (show_data === true) ? this.renderData() : null }
        { (show_controls === true) ? this.renderControls() : null }

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

export default NepiIFConnectLSX
