import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Select, { Option } from "./Select"
import createShortUniqueValues from "./Utilities"

import CameraViewer from "./CameraViewer"

@inject("ros")
@observer
class CameraApp extends Component {
  constructor(props) {
    super(props)
    this.state = { imageTopic: null, imageText: null }

    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
  }

  // Function for creating image topic options.
  createImageTopicsOptions() {
    var items = []
    items.push(<Option>{"None"}</Option>)
    const { imageTopics } = this.props.ros
    var uniqueNames = createShortUniqueValues(imageTopics)
    for (var i = 0; i < imageTopics.length; i++) {
      items.push(<Option value={imageTopics[i]}>{uniqueNames[i]}</Option>)
    }
    return items
  }

  // Handler for when the image topic selection changes
  onImageTopicSelected(event) {
    var idx = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[idx].text
    var value = event.target.value === "None" ? null : event.target.value

    this.setState({
      imageTopic: value,
      imageText: text === "None" ? null : text
    })
  }

  render() {
    return (
      <Columns>
        <Column>
          <CameraViewer
            imageTopic={this.state.imageTopic}
            title={this.state.imageText}
          />
        </Column>
        <Column>
          <Section title={"Device"}>
            <Label title={"Image Topic"}>
              <Select onChange={this.onImageTopicSelected}>
                {this.createImageTopicsOptions()}
              </Select>
            </Label>
            <Label title={"Image Classifier"}>
              <Select>
                <Option value="number">Number</Option>
                <Option value="face">Face</Option>
                <Option value="cat">Cat</Option>
                <Option value="hamster">Hamster</Option>
              </Select>
            </Label>
          </Section>
        </Column>
      </Columns>
    )
  }
}

export default CameraApp
