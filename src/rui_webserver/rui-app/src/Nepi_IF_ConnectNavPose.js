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

import { round } from "./Utilities"

import NepiIFConfig from "./Nepi_IF_Config"

@inject("ros")
@observer

// Reusable component that renders the selector, data, and controls for a
// navpose source connected through the ConnectNavPoseIF interface. It
// subscribes to the connect namespace ConnectIFStatus (selector/connection
// state and section-visibility flags) and to the selected source's
// NavPoseStatus (frame identity, topic wiring, and publish stats), talking to
// ROS directly through this.props.ros the same way the neighboring
// Nepi_IF_Connect* components do.
//
// ConnectNavPoseIF publishes no command topics on the selected source beyond
// the standard save/reset config triggers, so the controls section is the
// shared Nepi_IF_Config panel pointed at the selected source namespace.
class NepiIFConnectNavPose extends Component {
  constructor(props) {
    super(props)

    this.state = {

      // Connect namespace (node_name/navpose_connect)
      namespace: null,

      // Two status sources
      connect_status_msg: null,   // ConnectIFStatus
      device_status_msg: null,    // NavPoseStatus

      // The source status topic the source listener is currently pointed at
      selected_topic: 'None',

      // Status listener handles
      connectStatusListener: null,
      deviceStatusListener: null,

    }

    this.getConnectNamespace = this.getConnectNamespace.bind(this)

    this.updateConnectStatusListener = this.updateConnectStatusListener.bind(this)
    this.connectStatusListener = this.connectStatusListener.bind(this)
    this.updateDeviceStatusListener = this.updateDeviceStatusListener.bind(this)
    this.deviceStatusListener = this.deviceStatusListener.bind(this)

    this.onSourceSelected = this.onSourceSelected.bind(this)

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
  // topic (node_name/navpose_connect/status), message type ConnectIFStatus.
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
  // source status listener whenever selected_topic changes.
  connectStatusListener(message) {
    this.setState({ connect_status_msg: message })
    if (message.selected_topic !== this.state.selected_topic) {
      this.updateDeviceStatusListener(message.selected_topic)
    }
  }

  // Function for configuring and subscribing to the selected source's navpose
  // status topic (selected_topic/status), message type NavPoseStatus.
  updateDeviceStatusListener(selected_topic) {
    if (this.state.deviceStatusListener != null) {
      this.state.deviceStatusListener.unsubscribe()
      this.setState({ deviceStatusListener: null, device_status_msg: null })
    }
    if (selected_topic != null && selected_topic !== 'None') {
      const statusNamespace = selected_topic + '/status'
      var deviceStatusListener = this.props.ros.setupStatusListener(
        statusNamespace,
        "nepi_interfaces/NavPoseStatus",
        this.deviceStatusListener
      )
      this.setState({ deviceStatusListener: deviceStatusListener })
    }
    this.setState({ selected_topic: selected_topic })
  }

  // Callback for NavPoseStatus messages.
  deviceStatusListener(message) {
    this.setState({ device_status_msg: message })
  }

  // Handler for the source Select. Changes the connected topic by publishing a
  // std_msgs/String to the connect namespace select_topic topic.
  onSourceSelected(event) {
    const namespace = this.getConnectNamespace()
    const value = event.target.value
    if (namespace != null && namespace !== 'None') {
      this.props.ros.sendStringMsg(namespace + '/select_topic', value)
    }
  }

  // Source selector, backed by ConnectIFStatus. Populated from
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
      const source_name = (available_names[i] !== undefined) ? available_names[i] : available_topics[i]
      items.push(<Option value={available_topics[i]}>{source_name}</Option>)
    }

    // Optional header row. Pages that draw one bordered panel around several
    // connect rows (make_section={false}) pass show_connect_header={true}: the
    // row's title and its connected BooleanIndicator then share a line ABOVE
    // the selector, and the Select spans the panel width. Default false keeps
    // the original one-line layout with the indicator beside the Select.
    const show_connect_header = (this.props.show_connect_header !== undefined) ? this.props.show_connect_header : false
    const header_title = (this.props.title !== undefined) ? this.props.title : "NavPose Connect"

    // Single-line row mode. Pages that pack several connect rows into one panel
    // pass shortened={true} and get exactly one line: the row's name (the title
    // prop) on the left, its Select on the right, no header line and no
    // Connected indicator. Default false leaves both layouts below untouched,
    // so every existing consumer renders as it always has.
    const shortened = (this.props.shortened !== undefined) ? this.props.shortened : false

    // In shortened mode the row's one label IS its name, so the second word
    // ("NavPose Source") would just repeat the title the caller already passed.
    const selector_label = (shortened === true) ? header_title : "NavPose Source"

    const selector = (
      <Label title={selector_label}>
        <Select
          onChange={this.onSourceSelected}
          value={selected_topic}
        >
          {items}
        </Select>
      </Label>
    )

    const connected_indicator = (
      <Label title={"Connected"}>
        <BooleanIndicator value={connected} />
      </Label>
    )

    if (shortened === true) {
      return (
        <Columns>
          <Column>

            {selector}

          </Column>
        </Columns>
      )
    }

    if (show_connect_header === true) {
      return (
        <React.Fragment>

          <Columns>
            <Column>

              <Label title={header_title} labelStyle={{fontWeight: 'bold'}}/>

            </Column>
            <Column>

              {connected_indicator}

            </Column>
          </Columns>

          <Columns>
            <Column>

              {selector}

            </Column>
          </Columns>

        </React.Fragment>
      )
    }

    return (
      <Columns>
        <Column>

          {selector}

        </Column>
        <Column>

          {connected_indicator}

        </Column>
      </Columns>
    )
  }

  // Read-only source telemetry, backed by NavPoseStatus. No command publishers
  // here.
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

    const frameName = status_msg.frame_name
    const nodeName = status_msg.node_name
    const navposeTopic = status_msg.navpose_topic
    const transformTopic = status_msg.transform_topic

    const sourceDescription = status_msg.data_source_description
    const refDescription = status_msg.data_ref_description

    const frameNav = status_msg.frame_nav
    const frameAltitude = status_msg.frame_altitude
    const frameDepth = status_msg.frame_depth

    const avgPubRate = round(status_msg.avg_pub_rate + .001, 2)
    const lastPubSec = round(status_msg.last_pub_sec + .001, 3)
    const statsMessage = status_msg.stats_message

    return (
      <React.Fragment>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <Label title={"Frame Name"}>
          <Input disabled value={frameName} />
        </Label>

        <Label title={"Node Name"}>
          <Input disabled value={nodeName} />
        </Label>

        <Label title={"NavPose Topic"}>
          <Input disabled value={navposeTopic} />
        </Label>

        <Label title={"Transform Topic"}>
          <Input disabled value={transformTopic} />
        </Label>

        <Label title={"Source"}>
          <Input disabled value={sourceDescription} />
        </Label>

        <Label title={"Reference"}>
          <Input disabled value={refDescription} />
        </Label>

        <Label title={"Nav Frame"}>
          <Input disabled value={frameNav} />
        </Label>

        <Label title={"Altitude Frame"}>
          <Input disabled value={frameAltitude} />
        </Label>

        <Label title={"Depth Frame"}>
          <Input disabled value={frameDepth} />
        </Label>

        <Label title={"Publish Rate (hz)"}>
          <Input disabled value={avgPubRate} />
        </Label>

        <Label title={"Last Publish (s)"}>
          <Input disabled value={lastPubSec} />
        </Label>

        <Label title={"Message"}>
          <Input disabled value={statsMessage} />
        </Label>

      </React.Fragment>
    )
  }

  // Controls, backed by ConnectIFStatus. ConnectNavPoseIF registers no command
  // publishers on the selected source beyond the standard save / reset /
  // factory-reset config triggers, so the controls section is the shared
  // Nepi_IF_Config panel pointed at the selected source namespace.
  renderControls() {
    const connect_status_msg = this.state.connect_status_msg
    if (connect_status_msg == null) {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }

    const namespace = connect_status_msg.selected_topic
    if (namespace == null || namespace === 'None') {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }

    return (
      <React.Fragment>

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
    const title = (this.props.title !== undefined) ? this.props.title : "NavPose Connect"

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

export default NepiIFConnectNavPose
