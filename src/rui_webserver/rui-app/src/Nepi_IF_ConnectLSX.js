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

import NepiIFLSXData from "./Nepi_IF_LSX-Data"
import NepiIFLSXControls from "./Nepi_IF_LSX-Controls"

@inject("ros")
@observer

// Reusable component that renders the device selector for an LSX light/laser device
// connected through the ConnectLSXDeviceIF interface, and composes the data and
// controls children for the selected device. It subscribes to the connect
// namespace ConnectIFStatus (selector/connection state and section-visibility
// flags) only -- the two children each own their own DeviceLSXStatus
// subscription -- talking to ROS directly through this.props.ros the same way
// the neighboring Nepi_IF_ components do.
class NepiIFConnectLSX extends Component {
  constructor(props) {
    super(props)

    this.state = {

      // Connect namespace (node_name/lsx_connect)
      namespace: null,

      // ConnectIFStatus from the connect namespace -- the only status this
      // component subscribes to.
      connect_status_msg: null,

      // Status listener handle
      connectStatusListener: null,

    }

    this.getConnectNamespace = this.getConnectNamespace.bind(this)

    this.updateConnectStatusListener = this.updateConnectStatusListener.bind(this)
    this.connectStatusListener = this.connectStatusListener.bind(this)

    this.onDeviceSelected = this.onDeviceSelected.bind(this)

    this.renderSelector = this.renderSelector.bind(this)
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
  // Used to tear down the connect status listener.
  componentWillUnmount() {
    if (this.state.connectStatusListener) {
      this.state.connectStatusListener.unsubscribe()
    }
    this.setState({ connectStatusListener: null })
  }

  // Function for configuring and subscribing to the connect namespace status
  // topic (node_name/lsx_connect/status), message type ConnectIFStatus.
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

  // Callback for ConnectIFStatus messages.
  connectStatusListener(message) {
    this.setState({ connect_status_msg: message })
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

  render() {
    const make_section = (this.props.make_section !== undefined) ? this.props.make_section : true
    const title = (this.props.title !== undefined) ? this.props.title : "LSX Connect"
    const connect_status_msg = this.state.connect_status_msg
    var show_selector = false
    var show_data = false
    var show_controls = false
    var selected_namespace = null

    // No connect status yet: render nothing (empty Columns/Column), matching
    // the Nepi_IF_ConnectIDX "not ready" branch.
    if (connect_status_msg == null) {
      return (
        <Columns>
        <Column>

        </Column>
        </Columns>
      )
    }

    // Resolve the three section-visibility flags by combining the props with
    // the ConnectIFStatus flags the same defaulting way Nepi_IF_ConnectIDX
    // resolves its show_* props: a prop overrides, otherwise fall back to the
    // backend flag from ConnectIFStatus. The child device namespace is the
    // ConnectIFStatus selected_topic, with a selected_namespace prop override
    // for callers that drive the children manually.
    show_selector = this.props.show_selector !== undefined ? this.props.show_selector : connect_status_msg.show_selector
    show_data = this.props.show_data !== undefined ? this.props.show_data : connect_status_msg.show_data
    show_controls = this.props.show_controls !== undefined ? this.props.show_controls : connect_status_msg.show_controls
    selected_namespace = this.props.selected_namespace !== undefined ? this.props.selected_namespace : connect_status_msg.selected_topic

    const has_device = (selected_namespace != null && selected_namespace !== 'None')

    const content = (
      <React.Fragment>

          { (show_selector === true) ?
            this.renderSelector()
          : null }

          { (show_data === true && has_device === true) ?
            <NepiIFLSXData
              namespace={selected_namespace}
              make_section={false}
            />
          : null }

          { (show_controls === true && has_device === true) ?
            <NepiIFLSXControls
              namespace={selected_namespace}
              make_section={false}
              show_controls_option={this.props.show_controls_option}
              show_settings={this.props.show_settings}
              show_admin={this.props.show_admin}
            />
          : null }

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
        <Section title={title}>
          {content}
        </Section>
      )
    }
  }

}

export default NepiIFConnectLSX
