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
import Button, { ButtonMenu } from "./Button"
import { Column, Columns } from "./Columns"
import { setElementStyleModified, clearElementStyleModified } from "./Utilities"

import NepiIFConfig from "./Nepi_IF_Config"
import NepiIFSettings from "./Nepi_IF_Settings"
import NepiIFAdmin from "./Nepi_IF_Admin"

@inject("ros")
@observer

// Command component for an RBX robot device. Subscribes to the device's
// DeviceRBXStatus on the namespace prop and renders command widgets only. The
// companion Nepi_IF_RBX-Data component owns the read-only telemetry rows for
// the same device.
//
// State, mode, and action are enumerated indices on the wire (std_msgs/Int32) --
// ConnectRBXDeviceIF exposes no capabilities query for their display names, so
// they are entered as indices here.
//
// The Device Settings (Nepi_IF_Settings) and Advanced Settings (Nepi_IF_Admin)
// panels for the connected device are rendered here as well, so any page that
// drops in this component gets them without wiring up the device namespace and
// node name itself. Suppress either one with show_settings/show_admin={false}.
class NepiIFRBXControls extends Component {
  constructor(props) {
    super(props)

    // these states track the values through RBX Status messages
    this.state = {

      namespace: 'None',
      status_msg: null,

      statusListener: null,

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

    this.onUpdateInput = this.onUpdateInput.bind(this)
    this.onKeyInput = this.onKeyInput.bind(this)

    this.renderControls = this.renderControls.bind(this)
    this.renderSettingsAndAdmin = this.renderSettingsAndAdmin.bind(this)

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

  }

  // Callback for handling ROS DeviceRBXStatus messages. The editable command
  // inputs keep their own edit buffers, so the incoming status is tracked
  // directly here.
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
    const { sendIntMsg } = this.props.ros
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

  // Command controls for the connected device. Publishes through this.props.ros
  // to the device topic names the ConnectRBXDeviceIF publishers use: set_state,
  // set_mode, setup_action, go_action, set_goto_timeout, go_home, go_stop,
  // publish_status, and save/reset config.
  renderControls() {
    const { sendTriggerMsg } = this.props.ros

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

    const capabilities = this.props.ros.rbxDevices[namespace]
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
export default NepiIFRBXControls
