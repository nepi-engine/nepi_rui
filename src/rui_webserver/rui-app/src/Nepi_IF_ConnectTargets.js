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
// targets source connected through the ConnectTargetsIF interface. It
// subscribes to the connect namespace ConnectIFStatus (selector/connection
// state and section-visibility flags) and to the selected source's
// TargetingStatus (the targeting process's ProcessStatus telemetry plus its
// class filtering state), talking to ROS directly through this.props.ros the
// same way the neighboring Nepi_IF_Connect* components do.
//
// ConnectTargetsIF publishes no command topics on the selected source beyond
// the standard save/reset config triggers, so the controls section is the
// shared Nepi_IF_Config panel pointed at the selected source namespace.
class NepiIFConnectTargets extends Component {
  constructor(props) {
    super(props)

    this.state = {

      // Connect namespace (node_name/targets_connect)
      namespace: null,

      // Two status sources
      connect_status_msg: null,   // ConnectIFStatus
      device_status_msg: null,    // TargetingStatus

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
  // topic (node_name/targets_connect/status), message type ConnectIFStatus.
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

  // Function for configuring and subscribing to the selected source's targeting
  // status topic (selected_topic/status), message type TargetingStatus.
  updateDeviceStatusListener(selected_topic) {
    if (this.state.deviceStatusListener != null) {
      this.state.deviceStatusListener.unsubscribe()
      this.setState({ deviceStatusListener: null, device_status_msg: null })
    }
    if (selected_topic != null && selected_topic !== 'None') {
      const statusNamespace = selected_topic + '/status'
      var deviceStatusListener = this.props.ros.setupStatusListener(
        statusNamespace,
        "nepi_interfaces/TargetingStatus",
        this.deviceStatusListener
      )
      this.setState({ deviceStatusListener: deviceStatusListener })
    }
    this.setState({ selected_topic: selected_topic })
  }

  // Callback for TargetingStatus messages.
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

    return (
      <Columns>
        <Column>

          <Label title={"Targeter"}>
            <Select
              onChange={this.onSourceSelected}
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

  // Read-only source telemetry, backed by TargetingStatus. No command
  // publishers here. The targeting process's run state and rate stats live on
  // the nested ProcessStatus; the class filtering state lives on
  // TargetingStatus itself.
  renderData() {
    const status_msg = this.state.device_status_msg
    if (status_msg == null || status_msg.process_status == null) {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }

    const process_status = status_msg.process_status

    const name = process_status.name
    const nodeName = process_status.node_name
    const enabled = process_status.enabled
    const running = process_status.running
    const msgStr = process_status.msg_str

    const sourceSelected = process_status.source_selected
    const sourceConnected = process_status.source_connected

    const avgProcessRate = round(process_status.avg_process_rate + .001, 2)
    const avgProcessLatency = round(process_status.avg_process_latency + .001, 3)

    const selectedClasses = (status_msg.selected_classes !== undefined) ? status_msg.selected_classes : []
    const availableClasses = (status_msg.available_classes !== undefined) ? status_msg.available_classes : []
    const thresholdFilter = round(status_msg.threshold_filter + .001, 2)

    return (
      <React.Fragment>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <Label title={"Targeter Name"}>
          <Input disabled value={name} />
        </Label>

        <Label title={"Node Name"}>
          <Input disabled value={nodeName} />
        </Label>

        <Label title={"Enabled"}>
          <BooleanIndicator value={enabled} />
        </Label>

        <Label title={"Running"}>
          <BooleanIndicator value={running} />
        </Label>

        <Label title={"Source Selected"}>
          <BooleanIndicator value={sourceSelected} />
        </Label>

        <Label title={"Source Connected"}>
          <BooleanIndicator value={sourceConnected} />
        </Label>

        <Label title={"Process Rate (hz)"}>
          <Input disabled value={avgProcessRate} />
        </Label>

        <Label title={"Process Latency (s)"}>
          <Input disabled value={avgProcessLatency} />
        </Label>

        <Label title={"Threshold"}>
          <Input disabled value={thresholdFilter} />
        </Label>

        <Label title={"Available Classes"}>
          <Input disabled value={availableClasses.length} />
        </Label>

        <Label title={"Selected Classes"}>
          <Input disabled value={selectedClasses.join(', ')} />
        </Label>

        <Label title={"Message"}>
          <Input disabled value={msgStr} />
        </Label>

      </React.Fragment>
    )
  }

  // Controls, backed by ConnectIFStatus. ConnectTargetsIF registers no command
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
    const title = (this.props.title !== undefined) ? this.props.title : "Targets Connect"

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

export default NepiIFConnectTargets
