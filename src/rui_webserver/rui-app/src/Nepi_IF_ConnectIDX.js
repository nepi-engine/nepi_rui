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

// Reusable component that renders the selector, data, and controls for an IDX
// imaging device connected through the ConnectIDXDeviceIF interface. It
// subscribes to the connect namespace ConnectIFStatus (selector/connection
// state and section-visibility flags) and to the selected device's
// DeviceIDXStatus (telemetry and capability fields), talking to ROS directly
// through this.props.ros the same way the neighboring Nepi_IF_ components do.
class NepiIFConnectIDX extends Component {
  constructor(props) {
    super(props)

    this.state = {

      // Connect namespace (node_name/idx_connect)
      namespace: null,

      // Two status sources
      connect_status_msg: null,   // ConnectIFStatus
      device_status_msg: null,    // DeviceIDXStatus

      // The device status topic the device listener is currently pointed at
      selected_topic: 'None',

      // Status listener handles
      connectStatusListener: null,
      deviceStatusListener: null,

      // Edit buffers for the editable command inputs. Kept separate from the
      // device status so typing is not clobbered by incoming status messages.
      widthDeg: '',
      heightDeg: '',
      maxFramerate: '',

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
  // topic (node_name/idx_connect/status), message type ConnectIFStatus.
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
  // topic (selected_topic/status), message type DeviceIDXStatus.
  updateDeviceStatusListener(selected_topic) {
    if (this.state.deviceStatusListener != null) {
      this.state.deviceStatusListener.unsubscribe()
      this.setState({ deviceStatusListener: null, device_status_msg: null })
    }
    if (selected_topic != null && selected_topic !== 'None') {
      var deviceStatusListener = this.props.ros.setupIDXStatusListener(
        selected_topic,
        this.deviceStatusListener
      )
      this.setState({ deviceStatusListener: deviceStatusListener })
    }
    this.setState({ selected_topic: selected_topic })
  }

  // Callback for DeviceIDXStatus messages.
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
    const { sendIntMsg, sendFloatMsg } = this.props.ros
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

    if (id === "ConnectIDXWidthDeg") {
      sendIntMsg(namespace + "/set_width_deg", Number(e.target.value))
      clearDirty(id)
    }
    else if (id === "ConnectIDXHeightDeg") {
      sendIntMsg(namespace + "/set_height_deg", Number(e.target.value))
      clearDirty(id)
    }
    else if (id === "ConnectIDXMaxFramerate") {
      sendFloatMsg(namespace + "/set_max_framerate", Number(e.target.value))
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

  // Read-only device telemetry, backed by DeviceIDXStatus. No command
  // publishers here. IDX exposes no explicit has_* capability flags, so
  // sections are gated on presence (e.g. ranging shown when max_range_m > 0).
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

    const has_ranging = (status_msg.max_range_m !== undefined && status_msg.max_range_m > 0)

    const deviceName = status_msg.device_name
    const disabled = status_msg.disabled
    const standby = status_msg.standby

    const widthDeg = status_msg.width_deg
    const heightDeg = status_msg.height_deg
    const resolutionCurrent = status_msg.resolution_current
    const maxFramerate = round(status_msg.max_framerate + .001, 2)

    const brightness = round(status_msg.brightness_ratio + .001, 2)
    const contrast = round(status_msg.contrast_ratio + .001, 2)
    const threshold = round(status_msg.threshold_ratio + .001, 2)
    const resolutionRatio = round(status_msg.resolution_ratio + .001, 2)

    const autoAdjustEnabled = status_msg.auto_adjust_enabled

    const minRange = round(status_msg.min_range_m + .001, 2)
    const maxRange = round(status_msg.max_range_m + .001, 2)

    const data_products = status_msg.data_products
    const has_data_products = (data_products !== undefined && data_products !== null && data_products.length > 0)

    return (
      <React.Fragment>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <Label title={"Device Name"}>
          <Input disabled value={deviceName} />
        </Label>

        <Label title={"Disabled"}>
          <BooleanIndicator value={disabled} />
        </Label>

        <Label title={"Standby"}>
          <BooleanIndicator value={standby} />
        </Label>

        <Label title={"Width (deg)"}>
          <Input disabled style={{ width: "45%", float: "left" }} value={widthDeg} />
          <Input disabled style={{ width: "45%" }} value={heightDeg} />
        </Label>

        <Label title={"Resolution"}>
          <Input disabled value={resolutionCurrent} />
        </Label>

        <Label title={"Resolution Ratio"}>
          <Input disabled value={resolutionRatio} />
        </Label>

        <Label title={"Max Framerate (Hz)"}>
          <Input disabled value={maxFramerate} />
        </Label>

        <Label title={"Auto Adjust Enabled"}>
          <BooleanIndicator value={autoAdjustEnabled} />
        </Label>

        <Label title={"Brightness"}>
          <Input disabled value={brightness} />
        </Label>

        <Label title={"Contrast"}>
          <Input disabled value={contrast} />
        </Label>

        <Label title={"Threshold"}>
          <Input disabled value={threshold} />
        </Label>

        <div hidden={(has_ranging === false)}>

          <Label title={"Range Min (m)"}>
            <Input disabled style={{ width: "45%", float: "left" }} value={minRange} />
            <Input disabled style={{ width: "45%" }} value={maxRange} />
          </Label>

        </div>

        <div hidden={(has_data_products === false)}>
          <Label title={"Data Products"}>
            <Input disabled value={has_data_products ? data_products.join(', ') : ''} />
          </Label>
        </div>

      </React.Fragment>
    )
  }

  // Command controls, backed by DeviceIDXStatus. Publishes through
  // this.props.ros to the device topic names the ConnectIDXDeviceIF publishers
  // use, showing off the full ConnectIDXDeviceIF command API: enable/disable,
  // auto-adjust, brightness/contrast/threshold/resolution ratios, width/height,
  // max framerate, range window, reset-controls, and save/reset config.
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

    const has_ranging = (status_msg.max_range_m !== undefined && status_msg.max_range_m > 0)

    const disabled = status_msg.disabled
    const autoAdjustEnabled = status_msg.auto_adjust_enabled

    const brightnessRatio = status_msg.brightness_ratio
    const contrastRatio = status_msg.contrast_ratio
    const thresholdRatio = status_msg.threshold_ratio
    const resolutionRatio = status_msg.resolution_ratio

    const rangeWindow = status_msg.range_window_ratios
    const startRange = (rangeWindow !== undefined && rangeWindow !== null) ? rangeWindow.start_range : 0
    const stopRange = (rangeWindow !== undefined && rangeWindow !== null) ? rangeWindow.stop_range : 1

    // Edit buffers for the editable command inputs.
    const widthDeg = this.state.widthDeg
    const heightDeg = this.state.heightDeg
    const maxFramerate = this.state.maxFramerate

    return (
      <React.Fragment>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <Label title={"Disable"}>
          <Toggle checked={disabled} onClick={() => sendBoolMsg.bind(this)(namespace + "/disable", !disabled)} />
        </Label>

        <Label title={"Auto Adjust"}>
          <Toggle checked={autoAdjustEnabled} onClick={() => sendBoolMsg.bind(this)(namespace + "/set_auto_adjust_enable", !autoAdjustEnabled)} />
        </Label>

        <div hidden={(autoAdjustEnabled === true)}>

          <SliderAdjustment
            title={"Brightness"}
            msgType={"std_msgs/Float32"}
            adjustment={brightnessRatio}
            topic={namespace + "/set_brightness_ratio"}
            scaled={0.01}
            min={0}
            max={100}
            tooltip={"Brightness as a percentage (0%=min, 100%=max)"}
            unit={"%"}
          />

          <SliderAdjustment
            title={"Contrast"}
            msgType={"std_msgs/Float32"}
            adjustment={contrastRatio}
            topic={namespace + "/set_contrast_ratio"}
            scaled={0.01}
            min={0}
            max={100}
            tooltip={"Contrast as a percentage (0%=min, 100%=max)"}
            unit={"%"}
          />

          <SliderAdjustment
            title={"Threshold"}
            msgType={"std_msgs/Float32"}
            adjustment={thresholdRatio}
            topic={namespace + "/set_threshold_ratio"}
            scaled={0.01}
            min={0}
            max={100}
            tooltip={"Threshold as a percentage (0%=min, 100%=max)"}
            unit={"%"}
          />

        </div>

        <SliderAdjustment
          title={"Resolution"}
          msgType={"std_msgs/Float32"}
          adjustment={resolutionRatio}
          topic={namespace + "/set_resolution_ratio"}
          scaled={0.01}
          min={0}
          max={100}
          tooltip={"Resolution as a percentage (0%=min, 100%=max)"}
          unit={"%"}
        />

        <Label title={""} style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Width"}</div>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Height"}</div>
        </Label>

        <Label title={"Size (deg)"}>
          <Input
            id={"ConnectIDXWidthDeg"}
            style={{ width: "45%", float: "left" }}
            value={widthDeg}
            onChange={(e) => this.onUpdateInput(e, "widthDeg")}
            onKeyDown={this.onKeyInput}
          />
          <Input
            id={"ConnectIDXHeightDeg"}
            style={{ width: "45%" }}
            value={heightDeg}
            onChange={(e) => this.onUpdateInput(e, "heightDeg")}
            onKeyDown={this.onKeyInput}
          />
        </Label>

        <Label title={"Max Framerate (Hz)"}>
          <Input
            id={"ConnectIDXMaxFramerate"}
            value={maxFramerate}
            onChange={(e) => this.onUpdateInput(e, "maxFramerate")}
            onKeyDown={this.onKeyInput}
          />
        </Label>

        <div hidden={(has_ranging === false)}>

          <SliderAdjustment
            title={"Range Start"}
            msgType={"std_msgs/Float32"}
            adjustment={startRange}
            topic={namespace + "/set_range_window_start"}
            scaled={0.01}
            min={0}
            max={100}
            tooltip={"Range window start as a percentage of max range"}
            unit={"%"}
          />

          <SliderAdjustment
            title={"Range Stop"}
            msgType={"std_msgs/Float32"}
            adjustment={stopRange}
            topic={namespace + "/set_range_window_stop"}
            scaled={0.01}
            min={0}
            max={100}
            tooltip={"Range window stop as a percentage of max range"}
            unit={"%"}
          />

        </div>

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
    const title = (this.props.title !== undefined) ? this.props.title : "IDX Connect"

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

export default NepiIFConnectIDX
