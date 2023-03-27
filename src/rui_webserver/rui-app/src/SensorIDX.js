import React, { Component } from "react"
import { observer, inject } from "mobx-react"
import Toggle from "react-toggle"

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Select, { Option } from "./Select"

import CameraViewer from "./CameraViewer"
import Control3DX from "./Control3DX"
import createShortUniqueValues from "./Utilities"

@inject("ros")
@observer

// SensorIDX Application page
class SensorIDX extends Component {
  constructor(props) {
    super(props)

    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
    this.onTopicIDXSelected = this.onTopicIDXSelected.bind(this)
    this.createTopicOptions = this.createTopicOptions.bind(this)

    this.state = {
      // IDX Sensor topic to subscribe to and update
      topicIDX: (props.ros.sensor3DXTopics.length === 1)? props.ros.sensor3DXTopics[0] : null,
      topicIDXText: (props.ros.sensor3DXTopics.length === 1)? createShortUniqueValues(props.ros.sensor3DXTopics)[0] : null,

      // image topics and names for the quad image display
      // these are not an array because state values are not
      // mutable, making dealing with an array in the state
      // object obnoxious
      imageTopic_0: (props.ros.sensor3DXTopics.length === 1)? props.ros.sensor3DXTopics[0].concat("/img_0/image_raw") : null,
      imageText_0: (props.ros.sensor3DXTopics.length === 1)? "img_0/image_raw" : null,
      imageTopic_1: null,
      imageText_1: null,
      imageTopic_2: null,
      imageText_2: null,
      imageTopic_3: null,
      imageText_3: null
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
    return items
  }

  // Handler for IDX Sensor topic selection
  onTopicIDXSelected(event) {
    var idx = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[idx].text
    var value = event.target.value

    this.setState({
      topicIDX: value,
      topicIDXText: idx === 0 ? null : text,
      imageTopic_0: idx === 0 ? null : this.props.ros.sensor3DXTopics[idx - 1].concat("/img_0/image_raw"),
      imageText_0: idx === 0 ? null : "img_0/image_raw",
      imageTopic_1: idx === 0 ? null : this.props.ros.sensor3DXTopics[idx - 1].concat("/alt/image_raw"),
      imageText_1: idx === 0 ? null : "alt/image_raw",
      imageTopic_2: idx === 0 ? null : this.props.ros.sensor3DXTopics[idx - 1].concat("/img_1/image_raw"),
      imageText_2: idx === 0 ? null : "img_1/image_raw",
      imageTopic_3: null,
      imageText_3: null
    })
  }

  // Handler for Image topic selection
  onImageTopicSelected(event) {
    var idx = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[idx].text
    var value = event.target.value

    switch (event.currentTarget.id) {
      case "topicSelect_0":
        this.setState({
          imageTopic_0: value,
          imageText_0: text === "None" ? null : text
        })
        break
      case "topicSelect_1":
        this.setState({
          imageTopic_1: value,
          imageText_1: text === "None" ? null : text
        })
        break
      case "topicSelect_2":
        this.setState({
          imageTopic_2: value,
          imageText_2: text === "None" ? null : text
        })
        break
      case "topicSelect_3":
        this.setState({
          imageTopic_3: value,
          imageText_3: text === "None" ? null : text
        })
        break
      default:
        console.warn("Unexpected target ID: " + event.currentTarget.id)
    }
  }

  render() {
    const { sensor3DXTopics, imageTopics3DX, deviceInWater, onToggleDeviceInWater } = this.props.ros
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
            { /* TODO: Restore when we are ready for dynamically sized and positioned multi-view
            <CameraViewer
              imageTopic={this.state.imageTopic_2}
              title={this.state.imageText_2}
              hideQualitySelector={true}
            />
          </Column>
          <Column>
            <CameraViewer
              imageTopic={this.state.imageTopic_1}
              title={this.state.imageText_1}
              hideQualitySelector={true}
            />
            <CameraViewer
              imageTopic={this.state.imageTopic_3}
              title={this.state.imageText_3}
              hideQualitySelector={true}
            />
            */ }
          </Column>
          <Column>
            <Section title={"IDX Sensor"}>
              <Label title={"IDX Sensor Selection"}>
                <Select
                  onChange={this.onTopicIDXSelected}
                  value={this.state.topicIDX}
                >
                  {this.createTopicOptions(sensor3DXTopics)}
                </Select>
              </Label>
              <Label title={"Selected Image"}>
                <Select
                  id="topicSelect_0"
                  onChange={this.onImageTopicSelected}
                  value={this.state.imageTopic_0}
                >
                  {this.state.topicIDX
                    ? this.createTopicOptions(imageTopics3DX, this.state.topicIDX)
                    : NoneOption}
                </Select>
              </Label>
              { /* TODO: Restore when we are ready for dynamically sized and positioned multi-view
              <Label title={"Selected Image 2"}>
                <Select
                  id="topicSelect_1"
                  onChange={this.onImageTopicSelected}
                  value={this.state.imageTopic_1}
                >
                  {this.state.topicIDX
                    ? this.createTopicOptions(imageTopicsIDX, this.state.topicIDX)
                    : NoneOption}
                </Select>
              </Label>
              <Label title={"Selected Image 3"}>
                <Select
                  id="topicSelect_2"
                  onChange={this.onImageTopicSelected}
                  value={this.state.imageTopic_2}
                >
                  {this.state.topicIDX
                    ? this.createTopicOptions(imageTopicsIDX, this.state.topicIDX)
                    : NoneOption}
                </Select>
              </Label>
              <Label title={"Selected Image 4"}>
                <Select
                  id="topicSelect_3"
                  onChange={this.onImageTopicSelected}
                  value={this.state.imageTopic_3}
                >
                  {this.state.topicIDX
                    ? this.createTopicOptions(imageTopicsIDX, this.state.topicIDX)
                    : NoneOption}
                </Select>
              </Label>
              */ }
              <Label title={"In Water"}>
                <Toggle checked={deviceInWater} onClick={onToggleDeviceInWater} />
              </Label>
            </Section>
            <Control3DX
              topic={this.state.topicIDX}
              title={this.state.topicIDXText}
            />
          </Column>
        </Columns>
      </React.Fragment>
    )
  }
}

export default SensorIDX
