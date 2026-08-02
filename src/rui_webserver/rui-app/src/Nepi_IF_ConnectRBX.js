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
import Select, { Option } from "./Select"
import { Columns, Column } from "./Columns"
import BooleanIndicator from "./BooleanIndicator"
import Label from "./Label"
import Input from "./Input"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"

import { round, setElementStyleModified, clearElementStyleModified } from "./Utilities"

import NepiIFConfig from "./Nepi_IF_Config"

@inject("ros")
@observer

// Reusable component that renders the selector, data, and controls for an RBX
// robot device connected through the ConnectRBXDeviceIF interface. It
// subscribes to the connect namespace ConnectIFStatus (selector/connection
// state and section-visibility flags) and to the selected device's
// DeviceRBXStatus (telemetry and state fields), talking to ROS directly
// through this.props.ros the same way the neighboring Nepi_IF_Connect*
// components do.
//
// The command controls publish the ConnectRBXDeviceIF command topics on the
// selected device namespace. State, mode, and action are enumerated indices on
// the wire (std_msgs/Int32) -- ConnectRBXDeviceIF exposes no capabilities query
// for their display names, so they are entered as indices here.
class NepiIFConnectRBX extends Component {
  constructor(props) {
    super(props)

    this.state = {

      // Connect namespace (node_name/rbx_connect)
      namespace: null,

      // Two status sources
      connect_status_msg: null,   // ConnectIFStatus
      device_status_msg: null,    // DeviceRBXStatus

      // The device status topic the device listener is currently pointed at
      selected_topic: 'None',

      // Status listener handles
      connectStatusListener: null,
      deviceStatusListener: null,

      // Edit buffers for the editable command inputs. Kept separate from the
      // device status so typing is not clobbered by incoming status messages.
      stateIndex: '',
      modeIndex: '',
      setupAction: '',
      goAction: '',
      gotoTimeout: '',

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
  // topic (node_name/rbx_connect/status), message type ConnectIFStatus.
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
  // topic (selected_topic/status), message type DeviceRBXStatus.
  updateDeviceStatusListener(selected_topic) {
    if (this.state.deviceStatusListener != null) {
      this.state.deviceStatusListener.unsubscribe()
      this.setState({ deviceStatusListener: null, device_status_msg: null })
    }
    if (selected_topic != null && selected_topic !== 'None') {
      var deviceStatusListener = this.props.ros.setupRBXStatusListener(
        selected_topic,
        this.deviceStatusListener
      )
      this.setState({ deviceStatusListener: deviceStatusListener })
    }
    this.setState({ selected_topic: selected_topic })
  }

  // Callback for DeviceRBXStatus messages.
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
    const { sendIntMsg } = this.props.ros
    const connect_status_msg = this.state.connect_status_msg
    if (connect_status_msg == null) {
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

    if (id === "ConnectRBXState") {
      sendIntMsg(namespace + "/set_state", e.target.value)
      clearDirty(id)
    }
    else if (id === "ConnectRBXMode") {
      sendIntMsg(namespace + "/set_mode", e.target.value)
      clearDirty(id)
    }
    else if (id === "ConnectRBXSetupAction") {
      sendIntMsg(namespace + "/setup_action", e.target.value)
      clearDirty(id)
    }
    else if (id === "ConnectRBXGoAction") {
      sendIntMsg(namespace + "/go_action", e.target.value)
      clearDirty(id)
    }
    else if (id === "ConnectRBXGotoTimeout") {
      // set_goto_timeout is a std_msgs/UInt32 topic, so it is published
      // directly rather than through the Int32-typed sendIntMsg helper.
      const timeout = parseInt(e.target.value, 10)
      if (!isNaN(timeout) && timeout >= 0) {
        this.props.ros.publishMessage({
          name: namespace + "/set_goto_timeout",
          messageType: "std_msgs/UInt32",
          data: { data: timeout },
          noPrefix: true
        })
        clearDirty(id)
      }
    }

    this.setState({ dirtyFields: dirtyFields })
  }

  // Device selector, backed by ConnectIFStatus. Populated from
  // available_topics/available_names, shows a connected BooleanIndicator, and
  // changes the connection by publishing a std_msgs/String to the connect
  // namespace select_topic topic.
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

  // Read-only device telemetry, backed by DeviceRBXStatus. No command
  // publishers here.
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

  // Command controls, backed by ConnectIFStatus. Publishes through
  // this.props.ros to the device topic names the ConnectRBXDeviceIF publishers
  // use: set_state, set_mode, setup_action, go_action, set_goto_timeout,
  // go_home, go_stop, publish_status, and save/reset config.
  renderControls() {
    const { sendTriggerMsg } = this.props.ros

    const connect_status_msg = this.state.connect_status_msg
    if (connect_status_msg == null) {
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

    // Edit buffers for the editable command inputs.
    const stateIndex = this.state.stateIndex
    const modeIndex = this.state.modeIndex
    const setupAction = this.state.setupAction
    const goAction = this.state.goAction
    const gotoTimeout = this.state.gotoTimeout

    return (
      <React.Fragment>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <Label title={"State Index"}>
          <Input
            id={"ConnectRBXState"}
            value={stateIndex}
            onChange={(e) => this.onUpdateInput(e, "stateIndex")}
            onKeyDown={this.onKeyInput}
          />
        </Label>

        <Label title={"Mode Index"}>
          <Input
            id={"ConnectRBXMode"}
            value={modeIndex}
            onChange={(e) => this.onUpdateInput(e, "modeIndex")}
            onKeyDown={this.onKeyInput}
          />
        </Label>

        <Label title={"Setup Action Index"}>
          <Input
            id={"ConnectRBXSetupAction"}
            value={setupAction}
            onChange={(e) => this.onUpdateInput(e, "setupAction")}
            onKeyDown={this.onKeyInput}
          />
        </Label>

        <Label title={"Go Action Index"}>
          <Input
            id={"ConnectRBXGoAction"}
            value={goAction}
            onChange={(e) => this.onUpdateInput(e, "goAction")}
            onKeyDown={this.onKeyInput}
          />
        </Label>

        <Label title={"Goto Timeout (s)"}>
          <Input
            id={"ConnectRBXGotoTimeout"}
            value={gotoTimeout}
            onChange={(e) => this.onUpdateInput(e, "gotoTimeout")}
            onKeyDown={this.onKeyInput}
          />
        </Label>

        <ButtonMenu>
          <Button onClick={() => sendTriggerMsg(namespace + "/go_home")}>{"Go Home"}</Button>
          <Button onClick={() => sendTriggerMsg(namespace + "/go_stop")}>{"Stop"}</Button>
          <Button onClick={() => sendTriggerMsg(namespace + "/publish_status")}>{"Publish Status"}</Button>
        </ButtonMenu>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <NepiIFConfig
          namespace={namespace}
          title={"Nepi_IF_Config"}
        />

      </React.Fragment>
    )
  }

  render() {
    const connect_status_msg = this.state.connect_status_msg
    const make_section = (this.props.make_section !== undefined) ? this.props.make_section : true
    const title = (this.props.title !== undefined) ? this.props.title : "RBX Connect"

    // No connect status yet: render nothing (empty Columns/Column), matching
    // the Nepi_IF_ConnectMotor "not ready" branch.
    if (connect_status_msg == null) {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }

    // Resolve the three section-visibility flags by combining the props with
    // the ConnectIFStatus flags the same defaulting way Nepi_IF_ConnectMotor
    // resolves its show_* props: a prop overrides, otherwise fall back to the
    // backend flag from ConnectIFStatus.
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

export default NepiIFConnectRBX
