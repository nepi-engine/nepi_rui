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
import Toggle from "react-toggle"
import Input from "./Input"
import Styles from "./Styles"

import NepiDeviceControls from "./NepiDeviceRBX-Controls"
import NepiDeviceMessages from "./NepiDeviceRBX-Info"

import NepiDeviceInfo from "./Nepi_IF_DeviceInfo"
import ImageViewer from "./Nepi_IF_ImageViewer"
import NepiIFSettings from "./Nepi_IF_Settings"
import NepiIFSaveData from "./Nepi_IF_SaveData"
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

      rbx_capabilities: null,

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

      rbxInfoListener: null
    }

    this.updateInfoListener = this.updateInfoListener.bind(this)
    this.infoListener = this.infoListener.bind(this)

    this.setDeviceSelection = this.setDeviceSelection.bind(this)
    this.clearDeviceSelection = this.clearDeviceSelection.bind(this)

    this.createTopicOptions = this.createTopicOptions.bind(this)
    this.createImageOptions = this.createImageOptions.bind(this)
    this.onEnterSetInputErrorBoundValue = this.onEnterSetInputErrorBoundValue.bind(this)
    this.sendErrorBounds = this.sendErrorBounds.bind(this)
    this.onDropdownSelectedAction = this.onDropdownSelectedAction.bind(this)
    this.sendSetupActionIndex = this.sendSetupActionIndex.bind(this)
    this.renderImageViewer = this.renderImageViewer.bind(this)
  }


  // Callback for handling ROS DeviceRBXInfo messages.
  // Pose values are not part of DeviceRBXInfo; the System Information panel
  // sources them from the NavPose topic.
  infoListener(message) {
    const { rbxDevices } = this.props.ros
    this.setState({
      device_name: message.device_name,
      serial_num: message.serial_num,
      hw_version: message.hw_version,
      sw_version: message.sw_version,
      standby: message.standby,
      state_index: message.state,
      mode_index: message.mode,
      error_bound_m: message.error_bounds.max_distance_error_m,
      error_bound_deg: message.error_bounds.max_rotation_error_deg,
      error_stabilize_s: message.error_bounds.min_stabilize_time_s,
      cmd_timeout: message.cmd_timeout,
      image_source: message.image_source,
      image_status_overlay: message.image_status_overlay,
      home_lat: message.home_lat,
      home_long: message.home_long,
      home_alt: message.home_alt
    })
    if (this.state.rbx_capabilities === null) {
      const capabilities = rbxDevices[this.state.currentRBXNamespace]
      if (capabilities) {
        const states = capabilities.state_options
        const states_menu_options = createMenuListFromStrList(states, false, [], [], [])
        const modes = capabilities.mode_options
        const modes_menu_options = createMenuListFromStrList(modes, false, [], [], [])
        const actions = capabilities.setup_action_options
        const actions_menu_options = createMenuListFromStrList(actions, false, [], [], [])

        this.setState({
          rbx_capabilities: capabilities,
          states_list: states,
          states_menu: states_menu_options,
          modes_list: modes,
          modes_menu: modes_menu_options,
          actions_list: actions,
          actions_menu: actions_menu_options,
        })
      }
    }
  }


  // Function for configuring and subscribing to the device /info topic
  updateInfoListener() {
    const deviceNamespace = this.state.currentRBXNamespace

    if (this.state.rbxInfoListener) {
      this.state.rbxInfoListener.unsubscribe()
      this.setState({
        rbx_capabilities: null,
        states_list: null,
        modes_list: null,
        actions_list: null
      })
    }
    if (deviceNamespace !== null && deviceNamespace.indexOf('null') === -1) {
      var listener = this.props.ros.setupStatusListener(
        deviceNamespace + "/info",
        "nepi_interfaces/DeviceRBXInfo",
        this.infoListener
      )
      this.setState({ rbxInfoListener: listener })
    }
  }


  // Lifecycle method called when component updates.
  // Used to track changes in the selected device.
  componentDidUpdate(prevProps, prevState) {
    const currentRBXNamespace = this.state.currentRBXNamespace
    if (prevState.currentRBXNamespace !== currentRBXNamespace && currentRBXNamespace !== null) {
      if (currentRBXNamespace.indexOf('null') === -1) {
        this.setState({ image_topic: currentRBXNamespace.split('/rbx')[0] + "/image" })
        this.updateInfoListener()
      }
    }
  }


  // Lifecycle method called just before the component unmounts.
  // Used to unsubscribe from the /info topic.
  componentWillUnmount() {
    if (this.state.rbxInfoListener) {
      this.state.rbxInfoListener.unsubscribe()
    }
  }


  // Function for creating topic options for Select input
  createTopicOptions(topics) {
    const namespace = this.state.currentRBXNamespace
    var items = []
    items.push(<Option>{"None"}</Option>)
    var device_name = ""
    for (var i = 0; i < topics.length; i++) {
      device_name = topics[i].split('/rbx')[0].split('/').pop()
      items.push(<Option value={topics[i]}>{device_name}</Option>)
    }
    // Check that our current selection hasn't disappeared as an available option
    
    // Check that our current selection hasn't disappeard as an available option
    if ((namespace != null && namespace !== 'None')  && (topics.includes(namespace) === false)) {    
        this.clearDeviceSelection()
    }
    if ((namespace == null || namespace === 'None') && topics.length > 0) {    
        this.setDeviceSelection(topics[0])
    }
    return items
  }

  createImageOptions(RBXDeviceNamespace) {
    var items = []
    items.push(<Option>{"None"}</Option>)

    const image_topics = this.props.ros.imageTopics
    var img_topics = []

    for (var i = 0; i < image_topics.length; i++) {
      const topic = image_topics[i]
      if (topic.startsWith(RBXDeviceNamespace) === true || topic.includes('zed_node') === true) {
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
    this.setState({
      currentRBXNamespace: null,
      currentRBXNamespaceText: "No device selected",
      image_topic: null,
      rbx_capabilities: null,
      states_list: null,
      modes_list: null,
      actions_list: null,
      rbxInfoListener: null
    })
  }

  // Handler for RBX device topic selection
  setDeviceSelection(event) {
    var rbx = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[rbx].text
    var value = event.target.value

    // Handle the "None" option -- always index 0
    if (rbx === 0) {
      this.clearDeviceSelection()
      return
    }

    this.setState({
      currentRBXNamespace: value,
      currentRBXNamespaceText: text,
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
    const max_m = this.state.error_bound_m
    const max_d = this.state.error_bound_deg
    const min_stab = this.state.error_stabilize_s
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
    this.setState({
      selected_setup_action: event.target.value,
      selected_setup_action_index: event.target.selectedIndex
    })
  }


  renderDeviceSelection() {
    const { rbxDevices, sendStringMsg, sendBoolMsg, sendGeoPointMsg } = this.props.ros
    const NoneOption = <Option>None</Option>
    const deviceSelected = (this.state.currentRBXNamespace != null)
    const has_fake_gps = (this.state.rbx_capabilities !== null) ? (this.state.rbx_capabilities.has_fake_gps === true) : false
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

            </Column>
            <Column>
            </Column>
          </Columns>


          <div align={"left"} textAlign={"left"} hidden={!deviceSelected}>


            <Columns>
              <Column>
                <div hidden={(has_fake_gps === false)}>
                  <Label title="Enable Fake GPS">
                    <Toggle
                      checked={this.state.fake_gps_enabled === true}
                      onClick={() => sendBoolMsg(namespace + "/enable_fake_gps", this.state.fake_gps_enabled === false)}>
                    </Toggle>
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
                  <Toggle
                    checked={this.state.image_status_overlay === true}
                    onClick={() => sendBoolMsg(namespace + "/enable_image_overlay", this.state.image_status_overlay === false)}>
                  </Toggle>
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
    const current_state = (this.state.rbx_capabilities !== null && this.state.states_list !== null) ? this.state.states_list[this.state.state_index] : "None"
    const current_mode = (this.state.rbx_capabilities !== null && this.state.modes_list !== null) ? this.state.modes_list[this.state.mode_index] : "None"
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
              show_topic_selector={false}
            />
          </Column>
        </Columns>
      </React.Fragment>
    )
  }


  render() {
    const deviceSelected = (this.state.currentRBXNamespace != null)
    const namespace = this.state.currentRBXNamespace
    return (
      <Columns>
        <Column>

          {(deviceSelected === true) ?
            <NepiDeviceInfo
              deviceNamespace={namespace}
              status_topic={"/info"}
              status_msg_type={"nepi_interfaces/DeviceRBXInfo"}
              name_update_topic={"/update_device_name"}
              name_reset_topic={"/reset_device_name"}
              title={"Device Info"}
            />
            : null}

          {this.renderImageViewer()}

          {(deviceSelected === true) ?
            <NepiIFSaveData
              saveNamespace={namespace}
              make_section={true}
              title={"Save Data"}
            />
            : null}

          {(deviceSelected === true) ?
            <NepiDeviceMessages
              rbxNamespace={namespace}
              title={"System Information"}
            />
            : null}

        </Column>
        <Column>
          {this.renderDeviceSelection()}

          {(deviceSelected === true) ?
            this.renderSetupControls()
            : null}

          {(deviceSelected === true) ?
            <NepiIFConfig
              namespace={namespace}
              title={"Save Config"}
              show_save_all={true}
            />
            : null}

          {(deviceSelected === true) ?
            <NepiDeviceControls
              rbxNamespace={namespace}
              title={"Process Controls"}
            />
            : null}

          {(deviceSelected === true) ?
            <NepiIFSettings
              settingsNamespace={namespace + '/settings'}
              allways_show_settings={true}
              title={"Device Settings"}
            />
            : null}

        </Column>
      </Columns>
    )
  }
}

export default NepiDeviceRBX
