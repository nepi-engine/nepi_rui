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

import NepiIFImageViewer from "./Nepi_IF_ImageViewer"

@inject("ros")
@observer

// Reusable component that renders the selector and image data for a data
// (image) source connected through the ConnectDataIF interface. It subscribes
// to the connect namespace ConnectIFStatus (selector/connection state and
// section-visibility flags), talking to ROS directly through this.props.ros the
// same way the neighboring Nepi_IF_Connect components do. The connected data
// (image) topic identity comes from ConnectIFStatus.selected_topic; the
// reusable Nepi_IF_ImageViewer streams that topic over web_video_server and
// reads its own ImageStatus. This component never subscribes to a data-source
// topic directly, matching the IF-only rule for the connect examples.
class NepiIFConnectData extends Component {
  constructor(props) {
    super(props)

    this.state = {

      // Connect namespace (node_name/data_connect)
      namespace: null,

      // ConnectIFStatus from the connect namespace -- the only status this
      // component subscribes to.
      connect_status_msg: null,

      connectStatusListener: null,
    }

    this.getConnectNamespace = this.getConnectNamespace.bind(this)

    this.updateConnectStatusListener = this.updateConnectStatusListener.bind(this)
    this.connectStatusListener = this.connectStatusListener.bind(this)

    this.onSourceSelected = this.onSourceSelected.bind(this)

    this.renderSelector = this.renderSelector.bind(this)
    this.renderData = this.renderData.bind(this)
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
  // topic (node_name/data_connect/status), message type ConnectIFStatus.
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

          <Label title={"Data Source"}>
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

  // Image data section, backed by ConnectIFStatus. The image topic comes from
  // ConnectIFStatus.selected_topic (what ConnectDataIF exposes);
  // Nepi_IF_ImageViewer builds the web_video_server stream from it and reads
  // <topic>/status (ImageStatus) for its own stats. This component holds no
  // data-source subscription of its own.
  renderData() {
    const connect_status_msg = this.state.connect_status_msg
    if (connect_status_msg == null) {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }

    const image_topic = connect_status_msg.selected_topic
    const selected_name = connect_status_msg.selected_name
    if (image_topic == null || image_topic === 'None') {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }

    const image_text = (selected_name !== undefined && selected_name !== '' && selected_name !== 'None') ? selected_name : image_topic

    return (
      <React.Fragment>
        <Columns>
          <Column equalWidth={false}>

            <NepiIFImageViewer
              image_topic={image_topic}
              title={image_text}
              hideQualitySelector={false}
              show_topic_selector={false}
              show_all_config_options={false}
            />

          </Column>
        </Columns>
      </React.Fragment>
    )
  }

  render() {
    const connect_status_msg = this.state.connect_status_msg
    const make_section = (this.props.make_section !== undefined) ? this.props.make_section : true
    const title = (this.props.title !== undefined) ? this.props.title : "Data Connect"

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

    // Resolve the section-visibility flags by combining the props with the
    // ConnectIFStatus flags the same defaulting way Nepi_IF_ConnectIDX does: a
    // prop overrides, otherwise fall back to the backend flag from
    // ConnectIFStatus.
    const show_selector = (this.props.show_selector !== undefined) ? this.props.show_selector : connect_status_msg.show_selector
    const show_data = (this.props.show_data !== undefined) ? this.props.show_data : connect_status_msg.show_data

    const content = (
      <React.Fragment>

        { (show_selector === true) ? this.renderSelector() : null }
        { (show_data === true) ? this.renderData() : null }

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

export default NepiIFConnectData
