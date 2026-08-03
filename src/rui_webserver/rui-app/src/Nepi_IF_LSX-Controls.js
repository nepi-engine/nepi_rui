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

// Command component for an LSX light/laser device. Subscribes to the device's
// DeviceLSXStatus on the namespace prop and renders command widgets only. The
// companion Nepi_IF_LSX-Data component owns the read-only telemetry rows for
// the same device.
//
// The Device Settings (Nepi_IF_Settings) and Advanced Settings (Nepi_IF_Admin)
// panels for the connected device are rendered here as well, so any page that
// drops in this component gets them without wiring up the device namespace and
// node name itself. Suppress either one with show_settings/show_admin={false}.
class NepiIFLSXControls extends Component {
  constructor(props) {
    super(props)

    // these states track the values through LSX Status messages
    this.state = {

      namespace: 'None',
      status_msg: null,

      statusListener: null,

      // Edit buffers for the editable command inputs. Kept separate from the
      // device status so typing is not clobbered by incoming status messages.
      color: '',
      kelvin: '',
      blinkInterval: '',

      // Ids of inputs edited but not yet committed (per the RUI dirty-input
      // convention), styled via setElementStyleModified/clearElementStyleModified.
      dirtyFields: new Set(),

    }

    this.onUpdateInput = this.onUpdateInput.bind(this)
    this.onKeyInput = this.onKeyInput.bind(this)

    this.renderControls = this.renderControls.bind(this)
    this.renderSettingsAndAdmin = this.renderSettingsAndAdmin.bind(this)

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

  }

  // Callback for handling ROS DeviceLSXStatus messages. The editable command
  // inputs keep their own edit buffers, so the incoming status is tracked
  // directly here.
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
    const { sendStringMsg, sendIntMsg, sendFloatMsg } = this.props.ros
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

  // Command controls, backed by DeviceLSXStatus. Publishes through
  // this.props.ros to the device topic names the ConnectLSXDeviceIF publishers
  // use, showing off the full ConnectLSXDeviceIF command API: on/off, standby,
  // intensity, strobe, color, kelvin, blink interval, reset-controls, and
  // save/reset config.
  renderControls() {
    const { sendBoolMsg } = this.props.ros

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

    const capabilities = this.props.ros.lsxDevices[namespace]
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
export default NepiIFLSXControls
