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
//import Toggle from "react-toggle"

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Select, { Option } from "./Select"

import CameraViewer from "./CameraViewer"
//import Control3DX from "./Control3DX"
import ControlIDX from "./ControlIDX"
import createShortUniqueValues from "./Utilities"

@inject("ros")
@observer

// SensorIDX Application page
class SensorIDX extends Component {
  constructor(props) {
    super(props)

    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
    this.onTopicIDXSelected = this.onTopicIDXSelected.bind(this)
    this.clearTopicIDXSelection = this.clearTopicIDXSelection.bind(this)
    this.createTopicOptions = this.createTopicOptions.bind(this)
    this.createImageOptions = this.createImageOptions.bind(this)

    const idxSensorNamespaces = Object.keys(props.ros.idxSensors)
    const idxSensorCount = idxSensorNamespaces.length
    var defaultImageTopic = null
    var defaultImageText = null

    if (idxSensorCount === 1) {
      const sensorNamespace = idxSensorNamespaces[0]
      const capabilities = props.ros.idxSensors[sensorNamespace]
      if (capabilities !== null) {
        if (capabilities.has_color_2d_image) {
          defaultImageTopic = sensorNamespace.concat("/idx/color_2d_image")
          defaultImageText = 'Color 2D'
        }
        else if (capabilities.has_bw_2d_image) {
          defaultImageTopic = sensorNamespace.concat("/idx/bw_2d_image")
          defaultImageText = 'B&W 2D'
        }
        // TODO: Other image types as a default?
      }
    }

    
    this.state = {
      // IDX Sensor topic to subscribe to and update
      currentIDXNamespace: (idxSensorCount === 1)? idxSensorNamespaces[0] : null,
      currentIDXNamespaceText: (idxSensorCount === 1)? createShortUniqueValues([idxSensorNamespaces[0]]) : "No sensor selected",
      
      imageTopic_0: defaultImageTopic,
      imageText_0: defaultImageText
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
    const { currentIDXNamespace } = this.state
    if ((currentIDXNamespace != null) && (! filteredTopics.includes(currentIDXNamespace))) {
      this.clearTopicIDXSelection()
    }

    return items
  }

  createImageOptions(idxSensorNamespace) {
    var items = []
    items.push(<Option>{"None"}</Option>)

    const image_topics = this.props.ros.imageTopics
    var sensor_img_topics = []

    for (var i = 0; i < image_topics.length; i++) {
      const topic = image_topics[i]
      if (topic.startsWith(idxSensorNamespace) === false) {
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

  clearTopicIDXSelection() {
    this.setState({
      currentIDXNamespace: null,
      currentIDXNamespaceText: "No sensor selected",
      imageTopic_0: null,
      imageText_0: null        
    })
  }

  // Handler for IDX Sensor topic selection
  onTopicIDXSelected(event) {
    var idx = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[idx].text
    var value = event.target.value

    // Handle the "None" option -- always index 0
    if (idx === 0) {
      this.clearTopicIDXSelection()
      return
    }

    var autoSelectedImgTopic = null
    var autoSelectedImgTopicText = null
    const capabilities = this.props.ros.idxSensors[value]
    if (capabilities.has_color_2d_image) {
      autoSelectedImgTopic = value.concat("/idx/color_2d_image")
      autoSelectedImgTopicText = 'Color 2D'
    }
    else if (capabilities.has_bw_2d_image) {
      autoSelectedImgTopic = value.concat("/idx/bw_2d_image")
      autoSelectedImgTopicText = 'B&W 2D'      
    }

    this.setState({
      currentIDXNamespace: value,
      currentIDXNamespaceText: text,
      imageTopic_0: autoSelectedImgTopic,
      imageText_0: autoSelectedImgTopicText
    })
  }

  // Handler for Image topic selection
  onImageTopicSelected(event) {
    var idx = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[idx].text
    var value = event.target.value

    this.setState({
      imageTopic_0: value,
      imageText_0: text === "None" ? null : text
    })
  }

  render() {
    const { idxSensors, /*sensor3DXTopics*, imageTopics3DX, deviceInWater, onToggleDeviceInWater */ } = this.props.ros
    const NoneOption = <Option>None</Option>

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
          <Column>
            <Section title={"IDX Sensor"}>
              <Label title={"IDX Sensor Selection"}>
                <Select
                  onChange={this.onTopicIDXSelected}
                  value={this.state.currentIDXNamespace}
                >
                  {this.createTopicOptions(Object.keys(idxSensors))}
                </Select>
              </Label>
              <Label title={"Selected Image"}>
                <Select
                  id="topicSelect_0"
                  onChange={this.onImageTopicSelected}
                  value={this.state.imageTopic_0}
                >
                  {this.state.currentIDXNamespace
                    ? this.createImageOptions(this.state.currentIDXNamespace)
                    : NoneOption}
                </Select>
              </Label>
              {/*
              <Label title={"In Water"}>
                <Toggle checked={deviceInWater} onClick={onToggleDeviceInWater} />
              </Label>
                  */}
            </Section>
            <ControlIDX
              idxSensorNamespace={this.state.currentIDXNamespace}
              title={this.state.currentIDXNamespaceText}
            />
          </Column>
        </Columns>
      </React.Fragment>
    )
  }
}

export default SensorIDX
