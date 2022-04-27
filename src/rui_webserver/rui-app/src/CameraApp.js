import React, { Component } from "react"
import Toggle from "react-toggle"
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
    var img = this.props.ros.reportedClassifier.selected_img_topic.split("/")
    this.state = {
      imageTopic: null,
      imageText: (this.props.ros.reportedClassifier.classifier_state === "Running")? img[img.length-2] + "/" + img[img.length-1] : null,
      // Only set currentDisplayImgTopic when classifier is running -- this state transition is required for the CameraViewer to work properly
      currentDisplayImgTopic: (this.props.ros.reportedClassifier.classifier_state === "Running")? this.props.ros.classifierImgTopic : null,
      selectedClassifier: null,
      detectionThreshold: (this.props.ros.reportedClassifier.classifier_state === "Running")? +this.props.ros.reportedClassifier.detection_threshold.toFixed(2) : 0.3,
      localizerEnabled: false}
    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
    this.onClassifierSelected = this.onClassifierSelected.bind(this)
    this.waitForClassifierRunning = this.waitForClassifierRunning.bind(this)
    this.onApplyButtonPressed = this.onApplyButtonPressed.bind(this)
    this.onStopButtonPressed = this.onStopButtonPressed.bind(this)
    this.onThresholdSliderValueChange = this.onThresholdSliderValueChange.bind(this)
    this.onToggleRunLocalizer = this.onToggleRunLocalizer.bind(this)
  }
  // Function for creating image topic options.
  createImageTopicsOptions() {
    var items = []
    items.push(<Option>{"None"}</Option>)
    const { imageTopicsDetection } = this.props.ros
    var uniqueNames = createShortUniqueValues(imageTopicsDetection)
    for (var i = 0; i < imageTopicsDetection.length; i++) {
      if(imageTopicsDetection[i] === this.props.ros.reportedClassifier.selected_img_topic){
        items.push(<Option selected="selected" value={imageTopicsDetection[i]}>{uniqueNames[i]}</Option>)
      } else{
        items.push(<Option value={imageTopicsDetection[i]}>{uniqueNames[i]}</Option>)
      }

    }
    return items
  }

  // Function for creating image classifier options.
  createImageClassifierOptions() {
    var items = []
    items.push(<Option>{"None"}</Option>)
    const { classifiers } = this.props.ros
    for (var i = 0; i < classifiers.length; i++) {
      if(classifiers[i] === this.props.ros.reportedClassifier.selected_classifier) {
        items.push(<Option selected="selected" value={classifiers[i]}>{classifiers[i]}</Option>)
      }else {
        items.push(<Option value={classifiers[i]}>{classifiers[i]}</Option>)
      }
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
      reportedClassifier,
      classifierImgTopic,
      targLocalizerImgTopic
    } = this.props.ros

    const { localizerEnabled } = this.state

    // Delay the state transition until the classifier is actually running
    // in order to avoid invoking CameraViewer's updateImageSource method (via
    // componentDidUpdate()) until we can receive a real image with a valid size
    if (reportedClassifier.classifier_state !== "Running") {
      await setTimeout(this.waitForClassifierRunning, 250)
    }
    else {
      await this.setState({currentDisplayImgTopic: (localizerEnabled===false)? classifierImgTopic : targLocalizerImgTopic})
    }
  }

  async onToggleRunLocalizer(e) {
    const {
      reportedClassifier,
      classifierImgTopic,
      targLocalizerImgTopic
    } = this.props.ros

    // Always update the local state
    this.setState({localizerEnabled: e.target.checked})

    // If classifier is already running, update the image topic directly
    if (reportedClassifier.classifier_state === "Running")
    {
      await this.setState({currentDisplayImgTopic: (e.target.checked===false)? classifierImgTopic : targLocalizerImgTopic})
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
    //this.setState({currentDisplayImgTopic: null})
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
      reportedClassifier
    } = this.props.ros
    return (
      <Columns>
        <Column>
          <CameraViewer
            imageTopic={this.state.currentDisplayImgTopic}
            title={this.state.imageText}
            hideQualitySelector={false}
          />
        </Column>
        <Column>
          <Section title={"Settings"}>
            <Label title={"Image Topic"}>
              <Select id="ImgSelect" onChange={this.onImageTopicSelected}>
                {this.createImageTopicsOptions()}
              </Select>
            </Label>
            <Label title={"Image Classifier"}>
              <Select id="ClassifierSelect" onChange={this.onClassifierSelected}>
                {this.createImageClassifierOptions()}
              </Select>
            </Label>
            <ButtonMenu>
              <Button onClick={this.onApplyButtonPressed}>{"Apply"}</Button>
              <Button onClick={this.onStopButtonPressed}>{"Stop"}</Button>
            </ButtonMenu>
            <Label title={"Enable Smart Targeting \u2122"}>
              <Toggle id={"toggle_run_localizer"} onClick={this.onToggleRunLocalizer} />
            </Label>
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
            <Label title={reportedClassifier.classifier_state} />
          </Section>
        </Column>
      </Columns>
    )
  }
}

export default CameraApp
