import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Select, { Option } from "./Select"

import CameraViewer from "./CameraViewer"
import NDControl from "./NDControl"
import createShortUniqueValues from "./Utilities"

@inject("ros")
@observer

// NDSensor Application page
class NDSensor extends Component {
  constructor(props) {
    super(props)

    this.state = {
      // ND Sensor topic to subscribe to and update
      ndTopic: null,
      ndTopicText: null,

      // image topics and names for the quad image display
      // these are not an array because state values are not
      // mutable, making dealing with an array in the state
      // object obnoxious
      imageTopic_0: null,
      imageText_0: null,
      imageTopic_1: null,
      imageText_1: null,
      imageTopic_2: null,
      imageText_2: null,
      imageTopic_3: null,
      imageText_3: null
    }

    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
    this.onNDTopicSelected = this.onNDTopicSelected.bind(this)
    this.createTopicOptions = this.createTopicOptions.bind(this)
  }

  // Function for creating topic options for Select input
  createTopicOptions(topics, filter) {
    var filteredTopics = topics
    if (filter) {
      filteredTopics = []
      for (var i = 0; i < topics.length; i++) {
        // includes does a substring search
        if (topics[i].includes(filter)) {
          filteredTopics.push(topics[i])
        }
      }
    }

    var items = []
    items.push(<Option>{"None"}</Option>)
    var unique_names = createShortUniqueValues(filteredTopics)
    for (var i = 0; i < filteredTopics.length; i++) {
      items.push(<Option value={filteredTopics[i]}>{unique_names[i]}</Option>)
    }
    return items
  }

  // Handler for ND Sensor topic selection
  onNDTopicSelected(event) {
    var idx = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[idx].text
    var value = event.target.value

    this.setState({
      ndTopic: value,
      ndTopicText: text === "None" ? null : text,
      imageTopic_0: "None",
      imageText_0: null,
      imageTopic_1: "None",
      imageText_1: null,
      imageTopic_2: "None",
      imageText_2: null,
      imageTopic_3: "None",
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
    const { ndSensorTopics, imageTopics } = this.props.ros
    const NoneOption = <Option>None</Option>

    return (
      <React.Fragment>
        <Columns>
          <Column>
            <Section title={"ND Sensor"}>
              <Label title={"ND Sensor Selection"}>
                <Select onChange={this.onNDTopicSelected}>
                  {this.createTopicOptions(ndSensorTopics)}
                </Select>
              </Label>
              <Label title={"Selected Image 1"}>
                <Select
                  id="topicSelect_0"
                  onChange={this.onImageTopicSelected}
                  value={this.state.imageTopic_0}
                >
                  {this.state.ndTopic
                    ? this.createTopicOptions(imageTopics, this.state.ndTopic)
                    : NoneOption}
                </Select>
              </Label>
              <Label title={"Selected Image 2"}>
                <Select
                  id="topicSelect_1"
                  onChange={this.onImageTopicSelected}
                  value={this.state.imageTopic_1}
                >
                  {this.state.ndTopic
                    ? this.createTopicOptions(imageTopics, this.state.ndTopic)
                    : NoneOption}
                </Select>
              </Label>
              <Label title={"Selected Image 3"}>
                <Select
                  id="topicSelect_2"
                  onChange={this.onImageTopicSelected}
                  value={this.state.imageTopic_2}
                >
                  {this.state.ndTopic
                    ? this.createTopicOptions(imageTopics, this.state.ndTopic)
                    : NoneOption}
                </Select>
              </Label>
              <Label title={"Selected Image 4"}>
                <Select
                  id="topicSelect_3"
                  onChange={this.onImageTopicSelected}
                  value={this.state.imageTopic_3}
                >
                  {this.state.ndTopic
                    ? this.createTopicOptions(imageTopics, this.state.ndTopic)
                    : NoneOption}
                </Select>
              </Label>
            </Section>
          </Column>
          <Column>
            <NDControl
              topic={this.state.ndTopic}
              title={this.state.ndTopicText}
            />
          </Column>
        </Columns>
        <Columns>
          <Column>
            <CameraViewer
              imageTopic={this.state.imageTopic_0}
              title={this.state.imageText_0}
            />
            <CameraViewer
              imageTopic={this.state.imageTopic_2}
              title={this.state.imageText_2}
            />
          </Column>
          <Column>
            <CameraViewer
              imageTopic={this.state.imageTopic_1}
              title={this.state.imageText_1}
            />
            <CameraViewer
              imageTopic={this.state.imageTopic_3}
              title={this.state.imageText_3}
            />
          </Column>
        </Columns>
      </React.Fragment>
    )
  }
}

export default NDSensor
