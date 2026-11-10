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
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Select, { Option } from "./Select"
import Button, { ButtonMenu } from "./Button"
import AsyncToggle from "./AsyncToggle"
import Input from "./Input"
import Styles from "./Styles"

import NepiDeviceControls from "./NepiDeviceRBX-Controls"
import NepiDeviceMessages from "./NepiDeviceRBX-Info"

import NepiDeviceInfo from "./Nepi_IF_DeviceInfo"

import ImageViewer from "./Nepi_IF_ImageViewer"
import NepiIFSaveData from "./Nepi_IF_SaveData"
import NepiIFConnectNavPose from "./Nepi_IF_ConnectNavPose"
import NepiIFSettings from "./Nepi_IF_Settings"
import NepiIFMessages from "./Nepi_IF_Messages"

import NepiIFConfig from "./Nepi_IF_Config"

import { createShortValuesFromNamespaces, createMenuListFromStrList,
  onDropdownSelectedSendIndex, onUpdateSetStateValue } from "./Utilities"


@inject("ros")
@observer

// RBX Device page
class NepiDeviceRBX extends Component {
  constructor(props) {
    super(props)

    this.state = {

      show_controls: true,
      show_settings: true,
      show_save_data: true,

      capabilities: null,

      status_msg: null,
      device_name: null,
      serial_num: null,
      hw_version: null,
      sw_version: null,
      standby: null,
      state_index: null,
      mode_index: null,
      error_bound_m: 0,
      error_bound_deg: 0,
      error_stabilize_s: 0,
      cmd_timeout: null,
      image_source: null,
      image_status_overlay: null,
      home_lat: null,
      home_long: null,
      home_alt: null,
      fake_gps_enabled: null,
      states_list: null,
      states_menu: null,
      modes_list: null,
      modes_menu: null,
      image_topic: null,

      actions_list: null,
      actions_menu: null,
      selected_setup_action: null,
      selected_setup_action_index: 0,

      currentRBXNamespace: null,
      currentRBXNamespaceText: "No device selected",

      rbxInfoListener: null,

      // This device's own settings/status, kept here for two consumers: the
      // setting NAMES and VALUES are passed to NepiDeviceControls (driver
      // Settings such as teleop_movement_enabled/autonomous_movement_enabled
      // gate its control types), and enabled_image_sources curates
      // createImageOptions(). enabled_image_sources is a comma-separated topic
      // allowlist, or empty for "unrestricted" (no curation saved).
      rbxSettingsListener: null,
      settingsNamesList: [],
      settingsValuesDict: {},
      enabled_image_sources: "",

      // Robot Link (nepi_app_sim_connector) status, shown as "Linked with
      // <device>" next to the selector. robot_link/status is a JSON-encoded
      // std_msgs/String. There is one sim connector instance, at
      // <root namespace>/app_sim_connector, so the root is derived from
      // currentRBXNamespace rather than hardcoded. Without the app the topic
      // has no publisher and the indicator simply never renders.
      robotLinkListener: null,
      robot_link_status: null
    }

    this.updateInfoListener = this.updateInfoListener.bind(this)
    this.infoListener = this.infoListener.bind(this)
    this.updateRbxSettingsListener = this.updateRbxSettingsListener.bind(this)
    this.rbxSettingsListenerCb = this.rbxSettingsListenerCb.bind(this)
    this.updateRobotLinkListener = this.updateRobotLinkListener.bind(this)
    this.robotLinkListenerCb = this.robotLinkListenerCb.bind(this)
    this.renderLinkIndicator = this.renderLinkIndicator.bind(this)

    this.setDeviceSelection = this.setDeviceSelection.bind(this)
    this.clearDeviceSelection = this.clearDeviceSelection.bind(this)
    this.reconcileDeviceSelection = this.reconcileDeviceSelection.bind(this)
    this.selectDeviceNamespace = this.selectDeviceNamespace.bind(this)

    this.createTopicOptions = this.createTopicOptions.bind(this)
    this.createImageOptions = this.createImageOptions.bind(this)
    this.onEnterSetInputErrorBoundValue = this.onEnterSetInputErrorBoundValue.bind(this)
    this.sendErrorBounds = this.sendErrorBounds.bind(this)
    this.onDropdownSelectedAction = this.onDropdownSelectedAction.bind(this)
    this.sendSetupActionIndex = this.sendSetupActionIndex.bind(this)
    this.renderImageViewer = this.renderImageViewer.bind(this)
  }


  // Callback for handling ROS DeviceRBXStatus messages. In 3.4 the RBX IF
  // publishes no <ns>/info DeviceRBXData topic; every field this page used
  // from it, plus the state/mode/setup-action option lists, rides in the
  // status message. Pose values come from the NavPose topic, as before.
  infoListener(message) {
    this.setState({
      device_name: message.device_name,
      serial_num: message.serial_num,
      hw_version: message.hw_version,
      sw_version: message.sw_version,
      standby: message.standby,
      // DeviceRBXStatus has no int state index: the IF writes it into the
      // base bool `state` field, so DISARM/ARM arrive as false/true.
      state_index: (message.state === true) ? 1 : ((message.state === false) ? 0 : message.state),
      mode_index: message.mode,
      error_bound_m: message.error_bounds.max_distance_error_m,
      error_bound_deg: message.error_bounds.max_rotation_error_deg,
      error_stabilize_s: message.error_bounds.min_stabilize_time_s,
      cmd_timeout: message.cmd_timeout,
      image_source: (message.connect_image_topic !== undefined) ? message.connect_image_topic : message.image_source,
      image_status_overlay: message.image_status_overlay,
      home_lat: message.home_lat,
      home_long: message.home_long,
      home_alt: message.home_alt
    })
    // Rebuild the Mode/State/Setup Action menus on the first status message
    // and whenever a list changes. The old guard (`this.state === null`) was
    // never true in a mounted component, so these menus only showed None.
    const states = (message.state_options !== undefined) ? message.state_options : []
    const modes = (message.mode_options !== undefined) ? message.mode_options : []
    const actions = (message.setup_action_options !== undefined) ? message.setup_action_options : []
    const lists_changed = (JSON.stringify(states) !== JSON.stringify(this.state.states_list)) ||
                          (JSON.stringify(modes) !== JSON.stringify(this.state.modes_list)) ||
                          (JSON.stringify(actions) !== JSON.stringify(this.state.actions_list))
    if (this.state.status_msg === null || lists_changed) {
      this.setState({
        status_msg: message,
        capabilities: message,
        states_list: states,
        states_menu: createMenuListFromStrList(states, false, [], [], []),
        modes_list: modes,
        modes_menu: createMenuListFromStrList(modes, false, [], [], []),
        actions_list: actions,
        actions_menu: createMenuListFromStrList(actions, false, [], [], []),
      })
    }
  }


  // Function for configuring and subscribing to the device /info topic
  updateInfoListener() {
    const deviceNamespace = this.state.currentRBXNamespace

    if (this.state.rbxInfoListener) {
      this.state.rbxInfoListener.unsubscribe()
      this.setState({
        status_msg: null,
        capabilities: null,
        states_list: null,
        modes_list: null,
        actions_list: null
      })
    }
    if (deviceNamespace !== null && deviceNamespace.indexOf('null') === -1) {
      // 3.4: subscribe to <ns>/status (DeviceRBXStatus); there is no <ns>/info.
      var listener = this.props.ros.setupRBXStatusListener(
        deviceNamespace,
        this.infoListener
      )
      this.setState({ rbxInfoListener: listener })
    }
  }


  // Callback for this device's settings ControlsStatus: parallel name and
  // Control lists, each Control's current value in value[0] (a string[]).
  rbxSettingsListenerCb(message) {
    const names = (message.controls_name_list !== undefined) ? message.controls_name_list : []
    const msgs = (message.controls_msg_list !== undefined) ? message.controls_msg_list : []
    var valuesDict = {}
    for (var i = 0; i < names.length; i++) {
      const ctrl = msgs[i]
      valuesDict[names[i]] = (ctrl != null && ctrl.value !== undefined && ctrl.value.length > 0) ? ctrl.value[0] : ""
    }
    const enabled = (valuesDict["enabled_image_sources"] !== undefined) ? valuesDict["enabled_image_sources"] : ""
    this.setState({ settingsNamesList: names, settingsValuesDict: valuesDict, enabled_image_sources: enabled })
  }

  updateRbxSettingsListener(rbxNamespace) {
    if (this.state.rbxSettingsListener) {
      this.state.rbxSettingsListener.unsubscribe()
      this.setState({ rbxSettingsListener: null, settingsNamesList: [], settingsValuesDict: {}, enabled_image_sources: "" })
    }
    if (rbxNamespace !== null && rbxNamespace !== '' && rbxNamespace !== 'None') {
      var listener = this.props.ros.setupSettingsStatusListener(
        rbxNamespace + "/settings/status",
        this.rbxSettingsListenerCb
      )
      this.setState({ rbxSettingsListener: listener })
    }
  }

  updateRobotLinkListener(rbxNamespace) {
    if (this.state.robotLinkListener) {
      this.state.robotLinkListener.unsubscribe()
      this.setState({ robotLinkListener: null, robot_link_status: null })
    }
    if (rbxNamespace === null || rbxNamespace === '' || rbxNamespace === 'None') {
      return
    }
    const deviceBaseNamespace = rbxNamespace.split('/rbx')[0]
    const rootNamespace = deviceBaseNamespace.substring(0, deviceBaseNamespace.lastIndexOf('/'))
    const listener = this.props.ros.setupStatusListener(
      rootNamespace + "/app_sim_connector/sim/robot_link/status",
      "std_msgs/String",
      this.robotLinkListenerCb
    )
    this.setState({ robotLinkListener: listener })
  }

  robotLinkListenerCb(message) {
    try {
      this.setState({ robot_link_status: JSON.parse(message.data) })
    } catch (e) {
      // Malformed/empty payload -- keep the last good status.
    }
  }

  // Renders "Linked with <other device>" next to the device selector when
  // Robot Link is actively enabled and this device is one end of it.
  renderLinkIndicator() {
    const status = this.state.robot_link_status
    const namespace = this.state.currentRBXNamespace
    if (status == null || namespace == null || status.enabled !== true) {
      return null
    }
    var otherNamespace = null
    if (status.sim_namespace === namespace) {
      otherNamespace = status.physical_namespace
    } else if (status.physical_namespace === namespace) {
      otherNamespace = status.sim_namespace
    }
    if (!otherNamespace) {
      return null
    }
    const otherName = otherNamespace.split('/rbx')[0].split('/').pop()
    return (
      <Label title={""}>
        <p style={{ color: Styles.vars.colors.green }}>{"Linked with " + otherName}</p>
      </Label>
    )
  }


  // Lifecycle method called when component updates.
  // Used to track changes in the selected device.
  componentDidUpdate(prevProps, prevState) {
    // Reconcile first: this is the safe phase for the setState calls that used
    // to run during render out of createTopicOptions.
    this.reconcileDeviceSelection(Object.keys(this.props.ros.rbxDevices))

    const currentRBXNamespace = this.state.currentRBXNamespace
    if (prevState.currentRBXNamespace !== currentRBXNamespace && currentRBXNamespace !== null) {
      if (currentRBXNamespace.indexOf('null') === -1) {
        this.setState({ image_topic: currentRBXNamespace.split('/rbx')[0] + "/image" })
        this.updateInfoListener()
        this.updateRbxSettingsListener(currentRBXNamespace)
        this.updateRobotLinkListener(currentRBXNamespace)
      }
    }
  }


  // Lifecycle method called just before the component unmounts.
  // Used to unsubscribe from the /info, settings and robot link topics.
  componentWillUnmount() {
    if (this.state.rbxInfoListener) {
      this.state.rbxInfoListener.unsubscribe()
    }
    if (this.state.rbxSettingsListener) {
      this.state.rbxSettingsListener.unsubscribe()
    }
    if (this.state.robotLinkListener) {
      this.state.robotLinkListener.unsubscribe()
    }
  }


  // Function for creating topic options for Select input
  createTopicOptions(topics) {
    // const namespace = this.state.currentRBXNamespace
    var items = []
    items.push(<Option>{"None"}</Option>)
    var device_name = ""
    for (var i = 0; i < topics.length; i++) {
      device_name = topics[i].split('/rbx')[0].split('/').pop()
      items.push(<Option value={topics[i]}>{device_name}</Option>)
    }
    // Selection reconciliation deliberately does NOT happen here. This runs
    // during render, and both branches call setState -- see
    // reconcileDeviceSelection(), called from componentDidUpdate instead.
    return items
  }

  // Keep the current selection consistent with what is actually on the system:
  // drop a selection whose device has disappeared, and adopt the first device
  // when nothing is selected yet.
  //
  // Runs from componentDidUpdate, not from render. It also selects by NAMESPACE
  // rather than by calling setDeviceSelection: that method is a DOM event
  // handler and reads event.nativeEvent.target, so handing it a namespace
  // string threw "Cannot read properties of undefined (reading 'target')" and
  // took the whole page down as soon as any RBX device existed.
  reconcileDeviceSelection(topics) {
    const namespace = this.state.currentRBXNamespace
    const selected = (namespace != null && namespace !== 'None')

    if (selected && topics.includes(namespace) === false) {
      this.clearDeviceSelection()
      return
    }
    if (selected === false && topics.length > 0) {
      this.selectDeviceNamespace(topics[0])
    }
  }

  // The selection itself, independent of how it was chosen. Both the Select
  // handler and the auto-adopt path above go through here.
  selectDeviceNamespace(namespace) {
    if (namespace == null || namespace === 'None') {
      this.clearDeviceSelection()
      return
    }
    this.setState({
      currentRBXNamespace: namespace,
      currentRBXNamespaceText: namespace.split('/rbx')[0].split('/').pop(),
    })
  }

  createImageOptions(RBXDeviceNamespace) {
    var items = []
    items.push(<Option>{"None"}</Option>)

    // enabled_image_sources (see rbxSettingsListenerCb) is an opt-in
    // curation Setting: when a driver exposes it and the operator has saved a
    // non-empty allowlist (the Sim Connector's Robot Capabilities panel writes
    // it), only those topics are offered, and the list is exhaustive. Empty
    // or absent means nothing is curated, and the full candidate list below
    // is offered exactly as before.
    const enabledRaw = this.state.enabled_image_sources || ""
    const enabledList = enabledRaw.split(',').map((s) => s.trim()).filter((s) => s !== "")

    const image_topics = this.props.ros.imageTopics
    var img_topics = []

    for (var i = 0; i < image_topics.length; i++) {
      const topic = image_topics[i]
      if (topic.includes('zed_node') === true) {
        continue
      }
      if (enabledList.length > 0) {
        if (enabledList.includes(topic)) {
          img_topics.push(topic)
        }
        continue
      }
      if (topic.startsWith(RBXDeviceNamespace) === true) {
        continue
      }
      img_topics.push(topic)
    }

    const img_topics_short = createShortValuesFromNamespaces(img_topics)
    for (i = 0; i < img_topics.length; i++) {
      items.push(<Option value={img_topics[i]}>{img_topics_short[i]}</Option>)
    }
    return items
  }

  clearDeviceSelection() {
    if (this.state.rbxInfoListener) {
      this.state.rbxInfoListener.unsubscribe()
    }
    if (this.state.rbxSettingsListener) {
      this.state.rbxSettingsListener.unsubscribe()
    }
    if (this.state.robotLinkListener) {
      this.state.robotLinkListener.unsubscribe()
    }
    this.setState({
      currentRBXNamespace: null,
      currentRBXNamespaceText: "No device selected",
      image_topic: null,
      status_msg: null,
      capabilities: null,
      states_list: null,
      modes_list: null,
      actions_list: null,
      rbxInfoListener: null,
      rbxSettingsListener: null,
      settingsNamesList: [],
      settingsValuesDict: {},
      enabled_image_sources: "",
      robotLinkListener: null,
      robot_link_status: null
    })
  }

  // Handler for RBX device topic selection. Event-shaped, so it only ever
  // receives a real DOM event from the Select below; everything else selects
  // through selectDeviceNamespace().
  setDeviceSelection(event) {
    var rbx = event.nativeEvent.target.selectedIndex

    // Handle the "None" option -- always index 0
    if (rbx === 0) {
      this.clearDeviceSelection()
      return
    }

    this.setState({
      currentRBXNamespace: event.target.value,
      currentRBXNamespaceText: event.nativeEvent.target[rbx].text,
    })
  }


  onEnterSetInputErrorBoundValue(event, stateVarStr) {
    if (event.key === 'Enter') {
      const value = parseFloat(event.target.value)
      if (!isNaN(value)) {
        var obj = {}
        obj[stateVarStr] = value
        this.setState(obj)
      }
      this.sendErrorBounds()
      document.getElementById(event.target.id).style.color = Styles.vars.colors.black
    }
  }

  sendErrorBounds() {
    const { sendErrorBoundsMsg } = this.props.ros
    const max_m = parseFloat(this.state.error_bound_m)
    const max_d = parseFloat(this.state.error_bound_deg)
    const min_stab = parseFloat(this.state.error_stabilize_s)
    if (isNaN(max_m) || isNaN(max_d) || isNaN(min_stab)) {
      return
    }
    const namespace = this.state.currentRBXNamespace + "/set_goto_error_bounds"
    sendErrorBoundsMsg(namespace, max_m, max_d, min_stab)
  }

  sendSetupActionIndex() {
    const { sendIntMsg } = this.props.ros
    const namespace = this.state.currentRBXNamespace + "/setup_action"
    if (this.state.selected_setup_action_index !== null) {
      sendIntMsg(namespace, this.state.selected_setup_action_index)
    }
  }

  onDropdownSelectedAction(event) {
    // Looked up by VALUE in the driver's own actions_list, not by
    // event.target.selectedIndex (a DOM position): the dropdown's position of
    // an action need not match the driver's own action index, so
    // position-based dispatch could fire a different action.
    const actions = this.state.actions_list || []
    this.setState({
      selected_setup_action: event.target.value,
      selected_setup_action_index: actions.indexOf(event.target.value)
    })
  }


  renderDeviceSelection() {
    const { rbxDevices, sendStringMsg, sendBoolMsg, sendGeoPointMsg } = this.props.ros
    const NoneOption = <Option>None</Option>
    const device_selected = (this.state.currentRBXNamespace != null)
    const has_fake_gps = (this.state !== null) ? (this.state.has_fake_gps === true) : false
    const namespace = this.state.currentRBXNamespace
    return (
      <React.Fragment>
        <Section title={"Robot Selection and Configuration"}>
          <Columns>
            <Column>

              <Label title={"Device"}>
                <Select
                  onChange={this.setDeviceSelection}
                  value={namespace}
                >
                  {this.createTopicOptions(Object.keys(rbxDevices))}
                </Select>
              </Label>

              {this.renderLinkIndicator()}

            </Column>
            <Column>
            </Column>
          </Columns>


          <div align={"left"} textAlign={"left"} hidden={!device_selected}>


            <Columns>
              <Column>
                <div hidden={(has_fake_gps === false)}>
                  <Label title="Enable Fake GPS">
                    <AsyncToggle
                      checked={this.state.fake_gps_enabled === true}
                      onClick={() => sendBoolMsg(namespace + "/enable_fake_gps", this.state.fake_gps_enabled === false)}>
                    </AsyncToggle>
                  </Label>
                </div>

                <Label title={"Image_Source"}>
                  <Select
                    id="image_source"
                    onChange={(event) => sendStringMsg(namespace + "/set_image_topic", event.target.value)}
                    value={this.state.image_source}
                  >
                    {namespace
                      ? this.createImageOptions(namespace)
                      : NoneOption}
                  </Select>
                </Label>

              </Column>
              <Column>

                <Label title="Image Status Overlay">
                  <AsyncToggle
                    checked={this.state.image_status_overlay === true}
                    onClick={() => sendBoolMsg(namespace + "/enable_image_overlay", this.state.image_status_overlay === false)}>
                  </AsyncToggle>
                </Label>

                <Label title="">
                </Label>

              </Column>
            </Columns>

            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }} />

            <label style={{ fontWeight: 'bold' }}>
              {"GoTo Error Bounds"}
            </label>

            <Columns>
              <Column>

                <Label title={"Max (m)"}>
                  <Input
                    value={this.state.error_bound_m}
                    id="error_m"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event, "error_bound_m")}
                    onKeyDown={(event) => this.onEnterSetInputErrorBoundValue(event, "error_bound_m")}
                    style={{ width: "80%" }}
                  />
                </Label>

              </Column>
              <Column>

                <Label title={"Max deg"}>
                  <Input
                    value={this.state.error_bound_deg}
                    id="error_deg"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event, "error_bound_deg")}
                    onKeyDown={(event) => this.onEnterSetInputErrorBoundValue(event, "error_bound_deg")}
                    style={{ width: "80%" }}
                  />
                </Label>

              </Column>
              <Column>

                <Label title={"Stablize Time (s)"}>
                  <Input
                    value={this.state.error_stabilize_s}
                    id="error_stablize"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event, "error_stabilize_s")}
                    onKeyDown={(event) => this.onEnterSetInputErrorBoundValue(event, "error_stabilize_s")}
                    style={{ width: "80%" }}
                  />
                </Label>

              </Column>
            </Columns>

            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }} />
            <label style={{ fontWeight: 'bold' }}>
              {"Home Location"}
            </label>

            <Columns>
              <Column>

                <Label title={"latitude"}>
                  <Input
                    value={this.state.home_lat}
                    id="home_lat"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event, "home_lat")}
                    style={{ width: "80%" }}
                  />
                </Label>

              </Column>
              <Column>

                <Label title={"longitude"}>
                  <Input
                    value={this.state.home_long}
                    id="home_long"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event, "home_long")}
                    style={{ width: "80%" }}
                  />
                </Label>

              </Column>
              <Column>

                <Label title={"altitude"}>
                  <Input
                    value={this.state.home_alt}
                    id="home_alt"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event, "home_alt")}
                    style={{ width: "80%" }}
                  />
                </Label>

                <ButtonMenu>
                  <Button onClick={() => sendGeoPointMsg(namespace + "/set_home", this.state.home_lat, this.state.home_long, this.state.home_alt)}>{"Set Home"}</Button>
                </ButtonMenu>

              </Column>
            </Columns>

          </div>
        </Section>

      </React.Fragment>
    )
  }

  renderSetupControls() {
    const NoneOption = <Option>None</Option>
    const current_state = (this.state.status_msg !== null && this.state.states_list !== null) ? this.state.states_list[this.state.state_index] : "None"
    const current_mode = (this.state.status_msg !== null && this.state.modes_list !== null) ? this.state.modes_list[this.state.mode_index] : "None"
    const namespace = this.state.currentRBXNamespace
    return (
      <React.Fragment>
        <Section title={"Setup Controls"}>

          <Columns>
            <Column>

              <Label title={"Set Mode"}>
                <Select
                  id="device_mode"
                  onChange={(event) => onDropdownSelectedSendIndex.bind(this)(event, namespace + "/set_mode")}
                  value={current_mode}
                >
                  {this.state.modes_list ? this.state.modes_menu : NoneOption}
                </Select>
              </Label>


              <Label title={"Set State"}>
                <Select
                  id="device_state"
                  onChange={(event) => onDropdownSelectedSendIndex.bind(this)(event, namespace + "/set_state")}
                  value={current_state}
                >
                  {this.state.states_list ? this.state.states_menu : NoneOption}
                </Select>
              </Label>

            </Column>
            <Column>

              <Label title={"Setup Actions"}>
                <Select
                  id="action_select"
                  onChange={(event) => this.onDropdownSelectedAction(event)}
                  value={this.state.selected_setup_action}
                >
                  {this.state.actions_list ? this.state.actions_menu : NoneOption}
                </Select>
              </Label>

              <ButtonMenu>
                <Button onClick={() => this.sendSetupActionIndex()}>{"Send Action"}</Button>
              </ButtonMenu>

            </Column>
          </Columns>

        </Section>

      </React.Fragment>
    )
  }

  renderImageViewer() {
    return (
      <React.Fragment>
        <Columns>
          <Column equalWidth={false}>
            <ImageViewer
              image_topic={this.state.image_topic}
              title={""}
              hideQualitySelector={false}
              show_save_config={false}
              show_save_data={false}
              show_topic_selector={false}
            />
          </Column>
        </Columns>
      </React.Fragment>
    )
  }


  render() {
    const device_selected = (this.state.currentRBXNamespace != null)
    const namespace = this.state.currentRBXNamespace
    const status_msg = this.props.ros.rbxDevices[namespace]

    const save_data_topic = (status_msg && status_msg.save_data_topic) ? status_msg.save_data_topic : null
    const settings_topic = (status_msg && status_msg.settings_topic) ? status_msg.settings_topic : null
    // The NavPose source selector is the node's ConnectNavPoseIF at
    // <node_namespace>/navpose_connect, the namespace Nepi_IF_ConnectNavPose
    // expects. DeviceRBXStatus has no field for it: navpose_connect_topic does
    // not exist, and connect_navpose_topic carries the SELECTED source.
    const navpose_connect_topic = (status_msg && status_msg.node_namespace) ? status_msg.node_namespace + "/navpose_connect" : null
    const navpose_topic = (status_msg && status_msg.navpose_topic) ? status_msg.navpose_topic : null    

    return (
      <Columns>
        <Column>

          {(device_selected === true) ?
            <NepiDeviceInfo
              deviceNamespace={namespace}
              status_topic={"/status"}
              status_msg_type={"nepi_interfaces/DeviceRBXStatus"}
              name_update_topic={"/update_device_name"}
              name_reset_topic={"/reset_device_name"}
              title={"Device Info"}
            />
            : null}

          {this.renderImageViewer()}

 

          {(device_selected === true) ?
            <NepiDeviceMessages
              rbxNamespace={namespace}
              has_set_home={(this.state !== null) ? (this.state.has_set_home === true) : false}
              title={"System Information"}
            />
            : null}


                  {(device_selected === true) ?
                      <NepiIFSaveData
                      saveNamespace={save_data_topic}
                      make_section={true}
                      show_all_save_options={false}
                      show_topic_selector={false}
                    />
                : null}

                  {(device_selected === true) ?
                    <NepiIFConnectNavPose
                    namespace={navpose_connect_topic}
                    navpose_topic={navpose_topic}
                    select_title={"NavPose Frame"}
                    show_selector={true}
                    show_transform={true}
                    show_controls={true}
                    show_data={false}
                    make_section={true}
                    />
                  : null}


                  {(device_selected === true) ?
                    <NepiIFMessages
                    messagesNamespace={namespace + '/messages'}
                    hide_control={true}
                    title={"Messages"}
                    />
                  : null}



        </Column>
        <Column>
          {this.renderDeviceSelection()}

          {(device_selected === true) ?
            this.renderSetupControls()
            : null}

          {(device_selected === true) ?
            <NepiIFConfig
              namespace={namespace}
              title={"Save Config"}
              show_save_all={true}
            />
            : null}

          {/* Driver Settings such as teleop_movement_enabled and
              autonomous_movement_enabled decide which control types are
              offered; capabilities alone only say whether a robot type
              supports something, not whether this deployment wants it. */}
          {(device_selected === true) ?
            <NepiDeviceControls
              rbxNamespace={namespace}
              title={"Process Controls"}
              settingsNamesList={this.state.settingsNamesList}
              settingsValuesDict={this.state.settingsValuesDict}
            />
            : null}

          {(device_selected === true) ?
                          <NepiIFSettings
                            settingsNamespace={settings_topic}
                            allways_show_controls={true}
                            title={"Device Settings"}
                        />
            : null}

        </Column>
      </Columns>
    )
  }
}

export default NepiDeviceRBX
