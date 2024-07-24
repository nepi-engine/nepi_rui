/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */
import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Select, { Option } from "./Select"
import Button, { ButtonMenu } from "./Button"
import Toggle from "react-toggle"
import CameraViewer from "./CameraViewer"

import NepiRobotControls from "./NepiControlsRobotsControls"

import NepiDeviceInfo from "./NepiDeviceInfo"
import Nepi_IF_Settings from "./Nepi_IF_Settings"
import Nepi_IF_SaveData from "./Nepi_IF_SaveData"

import createShortValuesFromNamespace from "./Utilities"

@inject("ros")
@observer

// ControlsRBX Application page
class NepiControlsRobots extends Component {
  constructor(props) {
    super(props)


    this.state = {

      show_controls: true,
      show_settings: true,
      show_save_data: true,


      device_name: null,
      serial_num: null,
      hw_version: null,
      sw_version: null,
      standy: null,
      state: null,
      mode: null,
      error_bound_m: null,
      error_bound_deg: null,
      error_stabilize_s: null,
      cmd_timeout: null,
      image_source: null,
      image_status_overlay: null,
      home_lat: null,
      home_long: null,
      home_alt: null,
      fake_gps_enabled: null,
        
      // RBX Sensor topic to subscribe to and update
      currentRBXNamespace: null,
      currentRBXNamespaceText: "No robot selected",

      rbxInfoListener: null
    }

    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
    this.onTopicRBXSelected = this.onTopicRBXSelected.bind(this)
    this.clearTopicRBXSelection = this.clearTopicRBXSelection.bind(this)
    this.createTopicOptions = this.createTopicOptions.bind(this)
    this.createImageOptions = this.createImageOptions.bind(this)

    this.updateInfoListener = this.updateInfoListener.bind(this)
    this.infoListener = this.infoListener.bind(this)
    //const RBXRobotNamespaces = Object.keys(props.ros.RBXRobots)

  }


  // Callback for handling ROS Status messages
  infoListener(message) {
    this.setState({
      device_name: message.device_name,
      serial_num: message.serial_num,
      hw_version: message.hw_version,
      sw_version: message.sw_version,
      standy: message.standy,
      state: message.state,
      mode: message.mode,
      error_bound_m: message.error_bounds.max_distance_error_m,
      error_bound_deg: message.error_bounds.max_rotation_error_deg,
      error_stabilize_s: message.error_bounds.max_stabilize_time_s,
      cmd_timeout: message.cmd_timeout,
      image_source: message.image_source,
      image_status_overlay: message.image_status_overlay,
      home_lat: message.home_lat,
      home_long: message.home_long,
      home_alt: message.home_alt,
      fake_gps_enabled: message.fake_gps_enabled
    })
  }

  // Function for configuring and subscribing to Status
  updateInfoListener() {
    const robotNamespace = this.state.currentRBXNamespace
    if (this.state.rbxInfoListener) {
      this.state.rbxInfoListener.unsubscribe()
    }
    var listener = this.props.ros.setupStatusListener(
          robotNamespace + "/rbx/info" ,
          "nepi_ros_interfaces/RBXInfo",
          this.infoListener
        )
    this.setState({ rbxInfoListener: listener})
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState) {
    const currentRBXNamespace = this.state.currentRBXNamespace
    if (prevState.currentRBXNamespace !== currentRBXNamespace && currentRBXNamespace !== null) {
      if (currentRBXNamespace.indexOf('null') === -1)
        this.setState({currentRBXNamespace: currentRBXNamespace})
        this.updateInfoListener()
      } 
    }


  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
  }

  // Function for creating topic options for Select input
  createTopicOptions(topics, filter) {
    var filteredTopics = topics
    var i
    if (filter) {
      filteredTopics = []
      for (i = 0; i < topics.length; i++) {
        // includes does a substring search
        if (topics[i].includes(filter)) {
          filteredTopics.push(topics[i])
        }
      }
    }

    var items = []
    items.push(<Option>{"None"}</Option>)
    var unique_names = createShortValuesFromNamespace(filteredTopics)
    for (i = 0; i < filteredTopics.length; i++) {
      items.push(<Option value={filteredTopics[i]}>{unique_names[i]}</Option>)
    }
    // Check that our current selection hasn't disappeard as an available option
    const { currentRBXNamespace } = this.state
    if ((currentRBXNamespace != null) && (! filteredTopics.includes(currentRBXNamespace))) {
      this.clearTopicRBXSelection()
    }

    return items
  }

  createImageOptions(RBXRobotNamespace) {
    var items = []
    const rbx_img_namespace = RBXRobotNamespace + "/image"
    items.push(<Option>{"None"}</Option>)

    const image_topics = this.props.ros.imageTopics
    var img_topics = []

    for (var i = 0; i < image_topics.length; i++) {
      const topic = image_topics[i]
      if (topic.startsWith(RBXRobotNamespace) === false) {
        continue
      }
      img_topics.push(topic)
    }

    const img_topics_short = createShortValuesFromNamespace(img_topics)
    for (i = 0; i < img_topics.length; i++) {
      items.push(<Option value={img_topics[i]}>{img_topics_short[i]}</Option>)
    }
    return items    
  }

  clearTopicRBXSelection() {
    this.setState({
      currentRBXNamespace: null,
      currentRBXNamespaceText: "No robot selected",
      imageTopic_0: null,
      imageText_0: null        
    })
  }

  // Handler for RBX Sensor topic selection
  onTopicRBXSelected(event) {
    var rbx = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[rbx].text
    var value = event.target.value

    // Handle the "None" option -- always index 0
    if (rbx === 0) {
      this.clearTopicRBXSelection()
      return
    }

    var autoSelectedImgTopic = null
    var autoSelectedImgTopicText = null
    autoSelectedImgTopic = value.concat("/rbx/image")
    autoSelectedImgTopicText = createShortValuesFromNamespace([autoSelectedImgTopic])[0]
  
    this.setState({
      currentRBXNamespace: value,
      currentRBXNamespaceText: text,
      imageTopic_0: autoSelectedImgTopic,
      imageText_0: autoSelectedImgTopicText
    })
  }

  // Handler for Image topic selection
  onImageTopicSelected(event) {
    var rbx = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[rbx].text
    var value = event.target.value

    this.setState({
      imageTopic_0: value,
      imageText_0: text === "None" ? null : text
    })
  }

  renderSensorSelection() {
    const { rbxRobots, sendTriggerMsg, saveConfigTriggered  } = this.props.ros
    const NoneOption = <Option>None</Option>
    const robotSelected = (this.state.currentRBXNamespace != null)
    const capabilities = rbxRobots[this.state.currentRBXNamespace]

    return (
      <React.Fragment>
        <Columns>
          <Column>
            <Section title={"Selection"}>

              <Columns>
              <Column>
                <Label title={"Robot"}>
                  <Select
                    onChange={this.onTopicRBXSelected}
                    value={this.state.currentRBXNamespace}
                  >
                    {this.createTopicOptions(Object.keys(rbxRobots))}
                  </Select>
                </Label>
               
                <div align={"left"} textAlign={"left"} hidden={!robotSelected}>
                  <Label title={"Image"}>
                    <Select
                      id="topicSelect_0"
                      onChange={this.onImageTopicSelected}
                      value={this.state.imageTopic_0}
                    >
                      {this.state.currentRBXNamespace
                        ? this.createImageOptions(this.state.currentRBXNamespace)
                        : NoneOption}
                    </Select>
                  </Label>
                </div>

              </Column>
              <Column>
                <div align={"left"} textAlign={"left"} hidden={!robotSelected}>
                    <ButtonMenu>
                      <Button onClick={() => saveConfigTriggered(this.state.currentRBXNamespace)}>{"Save Config"}</Button>
                    </ButtonMenu>
                    <ButtonMenu>
                      <Button onClick={() => sendTriggerMsg(this.state.currentRBXNamespace + "/reset_factory")}>{"Factory Reset"}</Button>
                    </ButtonMenu>
                </div>
              </Column>
            </Columns>


            </Section>
          </Column>
        </Columns>
      </React.Fragment>
    )
  }

  renderImageViewer() {
    return (
      <React.Fragment>
        <Columns>
          <Column equalWidth={false}>
            <CameraViewer
              imageTopic={this.state.imageTopic_0}
              title={this.state.imageText_0}
              hideQualitySelector={false}
            />
          </Column>
        </Columns>
      </React.Fragment>
    )
  }


  render() {
    const robotSelected = (this.state.currentRBXNamespace != null)
    const ImageName = this.state.imageText_0
    
    return (
      <Columns>
        <Column>

        <div hidden={(!robotSelected)}>
            <NepiDeviceInfo
                  deviceNamespace={this.state.currentRBXNamespace}
                  status_topic={"/rbx/info"}
                  status_msg_type={"nepi_ros_interfaces/RBXInfo"}
                  name_update_topic={"/rbx/update_device_name"}
                  name_reset_topic={"/rbx/reset_device_name"}
                  title={"NepiRobotInfo"}
              />
          </div>

          {this.renderImageViewer()}

      
          <div hidden={!robotSelected}>
            <Nepi_IF_SaveData
                saveNamespace={this.state.currentRBXNamespace}
                title={"Nepi_IF_SaveData"}
            />
          </div>


        </Column>
        <Column>
          {this.renderSensorSelection()}



          <div hidden={(!robotSelected && this.state.show_controls)}>
            <NepiRobotControls
                rbxNamespace={this.state.currentRBXNamespace}
                title={"NepiRobotControls"}
            />
          </div>



          <div hidden={(!robotSelected && this.state.show_settings)}>
            <Nepi_IF_Settings
              settingsNamespace={this.state.currentRBXNamespace}
              title={"Nepi_IF_Settings"}
            />
          </div>


         </Column>
      </Columns>
    )
  }
}

export default NepiControlsRobots
