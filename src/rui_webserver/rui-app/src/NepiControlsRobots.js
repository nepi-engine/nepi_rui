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

//import NepiSensorsImagingInfo from "./NepiSensorsImagingInfo"
//import NepiSensorsImagingControls from "./NepiSensorsImagingControls"

import Nepi_IF_Settings from "./Nepi_IF_Settings"
import Nepi_IF_SaveData from "./Nepi_IF_SaveData"

import createShortUniqueValues from "./Utilities"

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
      
      // RBX Sensor topic to subscribe to and update
      currentRBXNamespace: null,
      currentRBXNamespaceText: "No robot selected",

      connected: false,

      listener: null
    }

    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
    this.onTopicRBXSelected = this.onTopicRBXSelected.bind(this)
    this.clearTopicRBXSelection = this.clearTopicRBXSelection.bind(this)
    this.createTopicOptions = this.createTopicOptions.bind(this)
    this.createImageOptions = this.createImageOptions.bind(this)

    this.updateInfoListener = this.updateInfoListener.bind(this)
    this.infoStatusListener = this.infoStatusListener.bind(this)
    //const RBXSensorNamespaces = Object.keys(props.ros.RBXSensors)

  }


  // Callback for handling ROS Status messages
  infoStatusListener(message) {
    this.setState({
    
    })
    this.setState({connected: true})
  }

  // Function for configuring and subscribing to Status
  updateInfoListener() {
    const infoNamespace = this.state.currentRBXNamespace + '/rbx/info'
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
    var listener = this.props.ros.setupRBXInfoListener(
          infoNamespace,
          this.infoStatusListener
        )
    this.setState({ listener: listener})
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
    var unique_names = createShortUniqueValues(filteredTopics)
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

  createImageOptions(RBXSensorNamespace) {
    var items = []
    items.push(<Option>{"None"}</Option>)

    const image_topics = this.props.ros.imageTopics
    var sensor_img_topics = []

    for (var i = 0; i < image_topics.length; i++) {
      const topic = image_topics[i]
      if (topic.startsWith(RBXSensorNamespace) === false || image_topics[i].includes("rbx") === false ) {
        continue
      }
      sensor_img_topics.push(topic)
    }

    const sensor_img_topics_short = createShortUniqueValues(sensor_img_topics)
    for (i = 0; i < sensor_img_topics.length; i++) {
      items.push(<Option value={sensor_img_topics[i]}>{sensor_img_topics_short[i]}</Option>)
    }
    return items    
  }

  clearTopicRBXSelection() {
    this.setState({
      currentRBXNamespace: null,
      currentRBXNamespaceText: "No sensor selected",
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
    autoSelectedImgTopicText = createShortUniqueValues([autoSelectedImgTopic])[0]
  
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
    const SensorSelected = (this.state.currentRBXNamespace != null)

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
               
                <div align={"left"} textAlign={"left"} hidden={!SensorSelected}>
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
                <div align={"left"} textAlign={"left"} hidden={!SensorSelected}>
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
    const SensorSelected = (this.state.currentRBXNamespace != null)
    const ImageName = this.state.imageText_0
    
    return (
      <Columns>
        <Column>
{/*
          <div hidden={(!SensorSelected)}>
            <NepiControlsRobotsInfo
                  rbxRobotNamespace={this.state.currentRBXNamespace}
                  title={"NepiSensorsImagingInfo"}
              />
          </div>

*/}

          {this.renderImageViewer()}

      
          <div hidden={!SensorSelected}>
            <Nepi_IF_SaveData
                saveNamespace={this.state.currentRBXNamespace}
                title={"Nepi_IF_SaveData"}
            />
          </div>


        </Column>
        <Column>
          {this.renderSensorSelection()}

{/*

          <div hidden={(!SensorSelected && this.state.show_controls)}>
            <NepiControslsRobotsControls
                rbxRobotNamespace={this.state.currentRBXNamespace}
                rbxImageName = {ImageName}
                title={"NepiSensorsImagingControls"}
            />
          </div>

*/}

          <div hidden={(!SensorSelected && this.state.show_settings)}>
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
