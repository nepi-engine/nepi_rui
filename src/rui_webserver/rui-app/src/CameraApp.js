import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Select, { Option } from "./Select"
import Button, { ButtonMenu } from "./Button"
import Slider from "rc-slider"
import Input from "./Input"

import createShortUniqueValues from "./Utilities"

import CameraViewer from "./CameraViewer"

@inject("ros")
@observer
class CameraApp extends Component {
  constructor(props) {
    super(props)
    this.state = { imageTopic: null, imageText: null, currentClassifierImgTopic: this.props.ros.classifierImgTopic, selectedClassifier: null, detectionThreshold: 0.3 }
    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
    this.onClassifierSelected = this.onClassifierSelected.bind(this)
    this.waitForClassifierRunning = this.waitForClassifierRunning.bind(this)
    this.onApplyButtonPressed = this.onApplyButtonPressed.bind(this)
    this.onStopButtonPressed = this.onStopButtonPressed.bind(this)
    this.onThresholdSliderValueChange = this.onThresholdSliderValueChange.bind(this)
  }
  // Function for creating image topic options.
  createImageTopicsOptions() {
    var items = []
    items.push(<Option>{"None"}</Option>)
    const { imageTopicsDetection } = this.props.ros
    var uniqueNames = createShortUniqueValues(imageTopicsDetection)
    for (var i = 0; i < imageTopicsDetection.length; i++) {
      items.push(<Option value={imageTopicsDetection[i]}>{uniqueNames[i]}</Option>)
    }
    return items
  }

  // Function for creating image classifier options.
  createImageClassifierOptions() {
    var items = []
    items.push(<Option>{"None"}</Option>)
    const { classifiers } = this.props.ros
    for (var i = 0; i < classifiers.length; i++) {
      items.push(<Option value={classifiers[i]}>{classifiers[i]}</Option>)
    }
    return items
  }

  // Handler for when the image topic selection changes
  async onImageTopicSelected(event) {
    var idx = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[idx].text
    var value = event.target.value === "None" ? null : event.target.value

    await this.setState({
      imageTopic: value,
      imageText: text === "None" ? null : text
    })
  }

  async onClassifierSelected(event) {
    var value = event.target.value === "None" ? null : event.target.value

    await this.setState({
      selectedClassifier: value
    })
  }

  async waitForClassifierRunning() {
    const {
      reportedClassifierState,
      classifierImgTopic
    } = this.props.ros

    // Delay the state transition until the classifier is actually running
    // in order to avoid invoking CameraViewer's updateImageSource method (via
    // componentDidUpdate()) until we can receive a real image with a valid size
    if (reportedClassifierState !== "Running") {
      await setTimeout(this.waitForClassifierRunning, 1000)
    }
    else {
      await this.setState({currentClassifierImgTopic: classifierImgTopic})
    }
  }

  async onApplyButtonPressed() {
    const { startClassifier } = this.props.ros
    const {
      imageTopic,
      selectedClassifier,
      detectionThreshold
    } = this.state

    startClassifier(imageTopic, selectedClassifier, detectionThreshold)

    this.waitForClassifierRunning()

  }

  onStopButtonPressed() {
    const {
      stopClassifier
    } = this.props.ros

    stopClassifier()
    //this.setState({currentClassifierImgTopic: null})
  }

  async onThresholdSliderValueChange(value) {
    const {
      updateDetectionThreshold
    } = this.props.ros

    await this.setState({detectionThreshold: value})
    updateDetectionThreshold(value)
  }

  render() {
    const {
      reportedClassifierState
    } = this.props.ros
    return (
      <Columns>
        <Column>
          <CameraViewer
            imageTopic={this.state.currentClassifierImgTopic}
            title={this.state.imageText}
          />
        </Column>
        <Column>
          <Section title={"Settings"}>
            <Label title={"Image Topic"}>
              <Select onChange={this.onImageTopicSelected}>
                {this.createImageTopicsOptions()}
              </Select>
            </Label>
            <Label title={"Image Classifier"}>
              <Select onChange={this.onClassifierSelected}>
                {this.createImageClassifierOptions()}
              </Select>
            </Label>
            <ButtonMenu>
              <Button onClick={this.onApplyButtonPressed}>{"Apply"}</Button>
              <Button onClick={this.onStopButtonPressed}>{"Stop"}</Button>
            </ButtonMenu>
          </Section>
          <Section title={"Parameters"}>  
            <Label title={"Detection Threshold"}>
              <Input
                disabled={true}
                value={this.state.detectionThreshold}
              />
              <Slider
                defaultValue={this.state.detectionThreshold}
                disabled={false}
                onChange={this.onThresholdSliderValueChange}
                onAfterChange={this.onThresholdSliderValueChange}
                min={0.01}
                max={1.0}
                step={0.01}
              />
            </Label>
          </Section>
          <Section title={"Status"}>
            <Label title={reportedClassifierState} />
          </Section>
        </Column>
      </Columns>
    )
  }
}

export default CameraApp
