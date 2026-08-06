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
import AsyncToggle from "./AsyncToggle"

import Section from "./Section"
import { SliderAdjustment } from "./AdjustmentWidgets"
import Label from "./Label"
import Input from "./Input"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"
import { Column, Columns } from "./Columns"
import { setElementStyleModified, clearElementStyleModified } from "./Utilities"

import NepiIFConfig from "./Nepi_IF_Config"
import NepiIFSettings from "./Nepi_IF_Settings"
import NepiIFAdmin from "./Nepi_IF_Admin"

@inject("ros")
@observer

// Command component for a PTX pan/tilt device. Subscribes to the device's
// DevicePTXStatus on the namespace prop and renders command widgets only. The
// companion Nepi_IF_PTX-Data component owns the read-only telemetry rows for
// the same device.
//
// The Device Settings (Nepi_IF_Settings) and Advanced Settings (Nepi_IF_Admin)
// panels for the connected device are rendered here as well, so any page that
// drops in this component gets them without wiring up the device namespace and
// node name itself. Suppress either one with show_settings/show_admin={false}.
class NepiIFPTXControls extends Component {
  constructor(props) {
    super(props)

    // these states track the values through PTX Status messages
    this.state = {

      namespace: 'None',
      status_msg: null,

      statusListener: null,

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

    this.onUpdateInput = this.onUpdateInput.bind(this)
    this.onKeyInput = this.onKeyInput.bind(this)

    this.renderJog = this.renderJog.bind(this)
    this.renderControls = this.renderControls.bind(this)
    this.renderSettingsAndAdmin = this.renderSettingsAndAdmin.bind(this)

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

  }

  // Callback for handling ROS DevicePTXStatus messages. The editable command
  // inputs keep their own edit buffers, so the incoming status is tracked
  // directly here.
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

  // Editable-input commit handler: on Enter, publish the command to the device
  // topic and clear the modified style / dirty flag.
  onKeyInput(e) {
    if (e.key !== 'Enter') {
      return
    }
    const { onSetPTXGotoPos, onSetPTXGotoPanPos, onSetPTXGotoTiltPos, onSetPTXHomePos, sendFloatMsg } = this.props.ros
    const status_msg = this.state.status_msg
    if (status_msg == null) {
      return
    }
    const namespace = this.props.namespace
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

    const status_msg = this.state.status_msg
    if (status_msg == null) {
      return null
    }
    const namespace = this.props.namespace
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

  // Command controls, gated by DevicePTXStatus capability flags. Publishes
  // through this.props.ros to the device topic names the ConnectPTXDeviceIF
  // publishers use, showing off the full ConnectPTXDeviceIF command API:
  // stop/home, jog (see renderJog), speed, GoTo absolute/ratio position, reverse,
  // set-home (here + explicit), and save/reset config.
  renderControls() {
    const { sendBoolMsg, onPTXStop, onPTXGoHome, onPTXSetHomeHere } = this.props.ros

    const status_msg = this.state.status_msg
    if (status_msg == null) {
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
            <AsyncToggle style={{justifyContent: "flex-left"}} checked={reversePanEnabled} onClick={() => sendBoolMsg.bind(this)(namespace + "/set_reverse_pan_enable",!reversePanEnabled)} />
          </div>
          <div style={{ display: "inline-block", width: "45%", float: "right" }}>
            <AsyncToggle style={{justifyContent: "flex-right"}} checked={reverseTiltEnabled} onClick={() => sendBoolMsg.bind(this)(namespace + "/set_reverse_tilt_enable",!reverseTiltEnabled)} />
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


  // Device Settings and Advanced Settings panels for the connected device.
  // Both build their own Section, so these are rendered as siblings of this
  // component's Section rather than nested inside it.
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

    const capabilities = this.props.ros.ptxDevices[namespace]
    const node_name = capabilities ? capabilities.device_node_name : 'None'

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
export default NepiIFPTXControls
