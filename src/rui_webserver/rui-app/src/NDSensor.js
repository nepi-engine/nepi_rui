import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Select, { Option } from "./Select"

import CameraViewer from "./CameraViewer"
import NDControl from "./NDControl"

@inject("ros")
@observer
class NDSensor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      imageTopic_0: null,
      imageTopic_1: null,
      imageTopic_2: null,
      imageTopic_3: null
    }

    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
  }

  createImageTopicsOptions() {
    var items = []
    items.push(<Option value={null}>{null}</Option>)
    const { imageTopics } = this.props.ros
    for (var i = 0; i < imageTopics.length; i++) {
      items.push(<Option value={imageTopics[i]}>{imageTopics[i]}</Option>)
    }
    return items
  }

  onImageTopicSelected(event) {
    switch (event.currentTarget.id) {
      case "topicSelect_0":
        this.setState({
          imageTopic_0: event.target.value
        })
        break
      case "topicSelect_1":
        this.setState({
          imageTopic_1: event.target.value
        })
        break
      case "topicSelect_2":
        this.setState({
          imageTopic_2: event.target.value
        })
        break
      case "topicSelect_3":
        this.setState({
          imageTopic_3: event.target.value
        })
        break
      default:
        console.warn("Unexpected target ID: " + event.currentTarget.id)
    }
  }

  render() {
    return (
      <React.Fragment>
        <Columns>
          <Column>
            <Section title={"Image Topic Source"}>
              <Label title={"Topic 0"}>
                <Select id="topicSelect_0" onChange={this.onImageTopicSelected}>
                  {this.createImageTopicsOptions()}
                </Select>
              </Label>
              <Label title={"Topic 1"}>
                <Select id="topicSelect_1" onChange={this.onImageTopicSelected}>
                  {this.createImageTopicsOptions()}
                </Select>
              </Label>
              <Label title={"Topic 2"}>
                <Select id="topicSelect_2" onChange={this.onImageTopicSelected}>
                  {this.createImageTopicsOptions()}
                </Select>
              </Label>
              <Label title={"Topic 3"}>
                <Select id="topicSelect_3" onChange={this.onImageTopicSelected}>
                  {this.createImageTopicsOptions()}
                </Select>
              </Label>
            </Section>
          </Column>
          <Column>
            <NDControl />
          </Column>
        </Columns>
        <Columns>
          <Column>
            <CameraViewer imageTopic={this.state.imageTopic_0} />
            <CameraViewer imageTopic={this.state.imageTopic_2} />
          </Column>
          <Column>
            <CameraViewer imageTopic={this.state.imageTopic_1} />
            <CameraViewer imageTopic={this.state.imageTopic_3} />
          </Column>
        </Columns>
      </React.Fragment>
    )
  }
}

export default NDSensor
