import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Select, { Option } from "./Select"

import CameraViewer from "./CameraViewer"

@inject("ros")
@observer
class Applications extends Component {
  constructor(props) {
    super(props)
    this.state = { imageTopic: null }

    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
  }

  createImageTopicsOptions() {
    var items = []
    items.push(<Option value={null}>None</Option>)
    const { imageTopics } = this.props.ros
    for (var i = 0; i < imageTopics.length; i++) {
      items.push(<Option value={imageTopics[i]}>{imageTopics[i]}</Option>)
    }
    return items
  }

  onImageTopicSelected(e) {
    this.setState({
      imageTopic: e.target.value
    })
  }

  render() {
    return (
      <Columns>
        <Column>
          <CameraViewer imageTopic={this.state.imageTopic} />
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

export default Applications
