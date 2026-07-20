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

// Reusable component that renders the selector, data, and controls for a PTX
// pan/tilt device connected through the ConnectPTXDeviceIF interface. It
// subscribes to the connect namespace ConnectIFStatus (selector/connection
// state and section-visibility flags) and to the selected device's
// DevicePTXStatus (telemetry and capability flags), talking to ROS directly
// through this.props.ros the same way the neighboring Nepi_IF_ components do.
class NepiIFConnectPTX extends Component {
  constructor(props) {
    super(props)

    this.state = {

      // Connect namespace (node_name/ptx_connect)
      namespace: null,

      // Two status sources
      connect_status_msg: null,   // ConnectIFStatus
      device_status_msg: null,    // DevicePTXStatus

      // The device status topic the device listener is currently pointed at
      selected_topic: 'None',

      // Status listener handles
      connectStatusListener: null,
      deviceStatusListener: null,

      // Edit buffers for the editable command inputs. Kept separate from the
      // device status so typing is not clobbered by incoming status messages.
      panGoto: '',
      tiltGoto: '',
      panGotoRatio: '',
      tiltGotoRatio: '',
      panHomeSet: '',
      tiltHomeSet: '',

      // Jog speed ratio for timed-speed jogging (0.0 - 1.0)
      jog_speed_ratio: 0.5,

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
    this.renderJog = this.renderJog.bind(this)
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
  // Re-point the connect listener when the namespace prop changes, and
  // re-point the device listener when the selected_topic changes.
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
  // topic (node_name/ptx_connect/status), message type ConnectIFStatus.
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
  // topic (selected_topic/status), message type DevicePTXStatus.
  updateDeviceStatusListener(selected_topic) {
    if (this.state.deviceStatusListener != null) {
      this.state.deviceStatusListener.unsubscribe()
      this.setState({ deviceStatusListener: null, device_status_msg: null })
    }
    if (selected_topic != null && selected_topic !== 'None') {
      var deviceStatusListener = this.props.ros.setupPTXStatusListener(
        selected_topic,
        this.deviceStatusListener
      )
      this.setState({ deviceStatusListener: deviceStatusListener })
    }
    this.setState({ selected_topic: selected_topic })
  }

  // Callback for DevicePTXStatus messages.
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
    const { onSetPTXGotoPos, onSetPTXGotoPanPos, onSetPTXGotoTiltPos, onSetPTXHomePos, sendFloatMsg } = this.props.ros
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

    const has_sep = (status_msg.has_seperate_pan_tilt_control === true)
    const id = e.target.id

    if (id === "ConnectPTXPanGoto" || id === "ConnectPTXTiltGoto") {
      const panEl = document.getElementById("ConnectPTXPanGoto")
      const tiltEl = document.getElementById("ConnectPTXTiltGoto")
      if (has_sep === true) {
        if (id === "ConnectPTXPanGoto") { onSetPTXGotoPanPos(namespace, Number(panEl.value)) }
        else { onSetPTXGotoTiltPos(namespace, Number(tiltEl.value)) }
      } else {
        onSetPTXGotoPos(namespace, Number(panEl.value), Number(tiltEl.value))
      }
      clearDirty(id)
    }
    else if (id === "ConnectPTXPanGotoRatio") {
      sendFloatMsg(namespace + "/goto_pan_ratio", Number(e.target.value))
      clearDirty(id)
    }
    else if (id === "ConnectPTXTiltGotoRatio") {
      sendFloatMsg(namespace + "/goto_tilt_ratio", Number(e.target.value))
      clearDirty(id)
    }
    else if (id === "ConnectPTXPanHomeSet" || id === "ConnectPTXTiltHomeSet") {
      const panEl = document.getElementById("ConnectPTXPanHomeSet")
      const tiltEl = document.getElementById("ConnectPTXTiltHomeSet")
      onSetPTXHomePos(namespace, Number(panEl.value), Number(tiltEl.value))
      clearDirty("ConnectPTXPanHomeSet")
      clearDirty("ConnectPTXTiltHomeSet")
    }

    this.setState({ dirtyFields: dirtyFields })
  }

  // Timed jog controls, gated by has_timed_positioning / has_timed_speed_positioning.
  // Press-and-hold: jog while held, stop the axis on release. Uses the timed-speed
  // API (with the jog speed slider) when the device reports has_timed_speed_positioning.
  renderJog() {
    const { onPTXJogPan, onPTXJogTilt, onPTXJogSpeedPan, onPTXJogSpeedTilt, onPTXPanStop, onPTXTiltStop, onPTXStop } = this.props.ros

    const connect_status_msg = this.state.connect_status_msg
    const status_msg = this.state.device_status_msg
    if (connect_status_msg == null || status_msg == null) {
      return null
    }
    const namespace = connect_status_msg.selected_topic
    if (namespace == null || namespace === 'None') {
      return null
    }

    const has_timed_pos = (status_msg.has_timed_positioning === true)
    const has_timed_speed_pos = (status_msg.has_timed_speed_positioning === true)
    if (has_timed_pos === false && has_timed_speed_pos === false) {
      return null
    }

    const jog_speed_ratio = this.state.jog_speed_ratio

    return (
      <React.Fragment>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <div hidden={(has_timed_speed_pos === false)}>
          <Label title={"Jog Speed"}>
            <Input
              value={Math.round(jog_speed_ratio * 100)}
              onChange={(e) => this.setState({ jog_speed_ratio: (Number(e.target.value) / 100) })}
            />
          </Label>
        </div>

        <ButtonMenu>
          <Button
            buttonDownAction={() => has_timed_speed_pos ? onPTXJogSpeedPan(namespace, 1, jog_speed_ratio) : onPTXJogPan(namespace, 1)}
            buttonUpAction={() => onPTXPanStop(namespace)}>
            {'Pan ◀'}
          </Button>
          <Button
            buttonDownAction={() => has_timed_speed_pos ? onPTXJogSpeedPan(namespace, -1, jog_speed_ratio) : onPTXJogPan(namespace, -1)}
            buttonUpAction={() => onPTXPanStop(namespace)}>
            {'▶ Pan'}
          </Button>
          <Button
            buttonDownAction={() => has_timed_speed_pos ? onPTXJogSpeedTilt(namespace, 1, jog_speed_ratio) : onPTXJogTilt(namespace, 1)}
            buttonUpAction={() => onPTXTiltStop(namespace)}>
            {'Tilt ▲'}
          </Button>
          <Button
            buttonDownAction={() => has_timed_speed_pos ? onPTXJogSpeedTilt(namespace, -1, jog_speed_ratio) : onPTXJogTilt(namespace, -1)}
            buttonUpAction={() => onPTXTiltStop(namespace)}>
            {'▼ Tilt'}
          </Button>
          <Button onClick={() => onPTXStop(namespace)}>{"STOP"}</Button>
        </ButtonMenu>

      </React.Fragment>
    )
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

  // Read-only device telemetry, backed by DevicePTXStatus. No command
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

  // Command controls, gated by DevicePTXStatus capability flags. Publishes
  // through this.props.ros to the device topic names the ConnectPTXDeviceIF
  // publishers use, showing off the full ConnectPTXDeviceIF command API:
  // stop/home, jog (see renderJog), speed, GoTo absolute/ratio position, reverse,
  // set-home (here + explicit), and save/reset config.
  renderControls() {
    const { sendBoolMsg, onPTXStop, onPTXGoHome, onPTXSetHomeHere } = this.props.ros

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

    const has_homing = (status_msg.has_homing === true)
    const has_set_home = (status_msg.has_set_home === true)
    const has_speed_control = (status_msg.has_adjustable_speed === true)
    const has_sep_speed = (status_msg.has_seperate_pan_tilt_speed === true)
    const has_abs_pos = (status_msg.has_absolute_positioning === true)

    const reversePanEnabled = status_msg.reverse_pan_enabled
    const reverseTiltEnabled = status_msg.reverse_tilt_enabled

    const speedRatio = status_msg.speed_ratio
    const speedPanRatio = status_msg.speed_pan_ratio
    const speedTiltRatio = status_msg.speed_tilt_ratio

    // Edit buffers for the editable command inputs.
    const panGoto = this.state.panGoto
    const tiltGoto = this.state.tiltGoto
    const panGotoRatio = this.state.panGotoRatio
    const tiltGotoRatio = this.state.tiltGotoRatio
    const panHomeSet = this.state.panHomeSet
    const tiltHomeSet = this.state.tiltHomeSet

    return (
      <React.Fragment>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        { (has_homing === false) ?

          <ButtonMenu>
            <Button onClick={() => onPTXStop(namespace)}>{"STOP"}</Button>
          </ButtonMenu>

          :

          <ButtonMenu>
            <Button onClick={() => onPTXStop(namespace)}>{"STOP"}</Button>
            <Button disabled={!has_homing} onClick={() => onPTXGoHome(namespace)}>{"GO HOME"}</Button>
          </ButtonMenu>

        }

        { this.renderJog() }

        <div hidden={(has_speed_control === false)}>

          {(has_sep_speed === true) ? (
            <React.Fragment>
              <SliderAdjustment
                disabled={!has_speed_control}
                title={"Pan Speed"}
                msgType={"std_msgs/Float32"}
                adjustment={speedPanRatio}
                topic={namespace + "/set_pan_speed_ratio"}
                scaled={0.01}
                min={0}
                max={100}
                tooltip={"Speed as a percentage (0%=min, 100%=max)"}
                unit={"%"}
              />
              <SliderAdjustment
                disabled={!has_speed_control}
                title={"Tilt Speed"}
                msgType={"std_msgs/Float32"}
                adjustment={speedTiltRatio}
                topic={namespace + "/set_tilt_speed_ratio"}
                scaled={0.01}
                min={0}
                max={100}
                tooltip={"Speed as a percentage (0%=min, 100%=max)"}
                unit={"%"}
              />
            </React.Fragment>
          ) : (
            <SliderAdjustment
              disabled={!has_speed_control}
              title={"Speed"}
              msgType={"std_msgs/Float32"}
              adjustment={speedRatio}
              topic={namespace + "/set_speed_ratio"}
              scaled={0.01}
              min={0}
              max={100}
              tooltip={"Speed as a percentage (0%=min, 100%=max)"}
              unit={"%"}
            />
          )}

        </div>

        <div hidden={(has_abs_pos === false)}>

          <Label title={""} style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Pan"}</div>
            <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Tilt"}</div>
          </Label>

          <Label title={"GoTo Position (deg)"}>
            <Input
              id={"ConnectPTXPanGoto"}
              style={{ width: "45%", float: "left" }}
              value={panGoto}
              onChange={(e) => this.onUpdateInput(e, "panGoto")}
              onKeyDown={this.onKeyInput}
            />
            <Input
              id={"ConnectPTXTiltGoto"}
              style={{ width: "45%" }}
              value={tiltGoto}
              onChange={(e) => this.onUpdateInput(e, "tiltGoto")}
              onKeyDown={this.onKeyInput}
            />
          </Label>

          <Label title={"GoTo Ratio (0-1)"}>
            <Input
              id={"ConnectPTXPanGotoRatio"}
              style={{ width: "45%", float: "left" }}
              value={panGotoRatio}
              onChange={(e) => this.onUpdateInput(e, "panGotoRatio")}
              onKeyDown={this.onKeyInput}
            />
            <Input
              id={"ConnectPTXTiltGotoRatio"}
              style={{ width: "45%" }}
              value={tiltGotoRatio}
              onChange={(e) => this.onUpdateInput(e, "tiltGotoRatio")}
              onKeyDown={this.onKeyInput}
            />
          </Label>

        </div>

        <Label title={""}>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Pan"}</div>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Tilt"}</div>
        </Label>

        <Label title={"Reverse Control"}>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>
            <Toggle style={{justifyContent: "flex-left"}} checked={reversePanEnabled} onClick={() => sendBoolMsg.bind(this)(namespace + "/set_reverse_pan_enable",!reversePanEnabled)} />
          </div>
          <div style={{ display: "inline-block", width: "45%", float: "right" }}>
            <Toggle style={{justifyContent: "flex-right"}} checked={reverseTiltEnabled} onClick={() => sendBoolMsg.bind(this)(namespace + "/set_reverse_tilt_enable",!reverseTiltEnabled)} />
          </div>
        </Label>

        <div hidden={(has_set_home === false && has_homing === false)}>

          <div hidden={(has_set_home === false)}>

            <Label title={"Set Home Position (deg)"}>
              <Input
                id={"ConnectPTXPanHomeSet"}
                style={{ width: "45%", float: "left" }}
                value={panHomeSet}
                onChange={(e) => this.onUpdateInput(e, "panHomeSet")}
                onKeyDown={this.onKeyInput}
              />
              <Input
                id={"ConnectPTXTiltHomeSet"}
                style={{ width: "45%" }}
                value={tiltHomeSet}
                onChange={(e) => this.onUpdateInput(e, "tiltHomeSet")}
                onKeyDown={this.onKeyInput}
              />
            </Label>

          </div>

          <ButtonMenu>
            <Button disabled={!(has_set_home || has_homing)} onClick={() => onPTXSetHomeHere(namespace)}>{"Set Home Here"}</Button>
          </ButtonMenu>

        </div>

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
    const title = (this.props.title !== undefined) ? this.props.title : "Pan Tilt Connect"

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

export default NepiIFConnectPTX
