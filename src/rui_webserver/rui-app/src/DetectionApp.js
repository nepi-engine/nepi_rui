import React, { Component } from "react"
import Toggle from "react-toggle"
import { observer, inject } from "mobx-react"

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Select, { Option } from "./Select"
import Button, { ButtonMenu } from "./Button"
import {SliderAdjustment} from "./AdjustmentWidgets"
import {ColoredTextIndicator, indicator_colors} from "./ColoredIndicator"

import createShortUniqueValues from "./Utilities"

import CameraViewer from "./CameraViewer"

@inject("ros")
@observer
class DetectionApp extends Component {
  constructor(props) {
    super(props)
    var img = (this.props.ros.reportedClassifier !== null)? this.props.ros.reportedClassifier.selected_img_topic.split("/") : null
    const classifier_running = ((this.props.ros.reportedClassifier !== null) && (this.props.ros.reportedClassifier.classifier_state === "Running"))?
      true : false
    this.state = {
      imageTopic: null,
      imageText: (classifier_running === true)?
        img[img.length-1] + ':' + this.props.ros.reportedClassifier.selected_classifier : 
        img? img[img.length-1] : null,
      // Only set currentDisplayImgTopic when classifier is running -- this state transition is required for the CameraViewer to work properly
      currentDisplayImgTopic: (classifier_running === true)? 
        this.props.ros.classifierImgTopic : 
        (this.props.ros.reportedClassifier? this.props.ros.reportedClassifier.selected_img_topic : null),
      selectedClassifier: null,
      detectionThreshold: (classifier_running === true)? +this.props.ros.reportedClassifier.detection_threshold.toFixed(2) : 0.3,
      localizerOptionAvailable: false,
      localizerEnabled: false}
    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
    this.onClassifierSelected = this.onClassifierSelected.bind(this)
    this.waitForClassifierRunning = this.waitForClassifierRunning.bind(this)
    this.onApplyButtonPressed = this.onApplyButtonPressed.bind(this)
    this.onStopButtonPressed = this.onStopButtonPressed.bind(this)
    this.onToggleRunLocalizer = this.onToggleRunLocalizer.bind(this)
  }
  // Function for creating image topic options.
  createImageTopicsOptions() {
    var items = []
    items.push(<Option>{"None"}</Option>)
    const { imageTopicsDetection } = this.props.ros
    var uniqueNames = createShortUniqueValues(imageTopicsDetection)
    const classifier_not_stopped = 
      (this.props.ros.reportedClassifier !== null) && (this.props.ros.reportedClassifier.classifier_state !== "Stopped")
    for (var i = 0; i < imageTopicsDetection.length; i++) {
      if (classifier_not_stopped) {
        if (imageTopicsDetection[i] === this.props.ros.reportedClassifier.selected_img_topic) {
          items.push(<Option selected="selected" value={imageTopicsDetection[i]}>{uniqueNames[i]}</Option>)
        }
        else {
          items.push(<Option value={imageTopicsDetection[i]}>{uniqueNames[i]}</Option>)
        }
      }
      else if (imageTopicsDetection[i] === this.state.imageTopic) {
        items.push(<Option selected="selected" value={imageTopicsDetection[i]}>{uniqueNames[i]}</Option>)
      }
      else {
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
      if((this.props.ros.reportedClassifier !== null) && (classifiers[i] === this.props.ros.reportedClassifier.selected_classifier)) {
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

    // Check if the sensor associated with this image topic supports target localization (requires a published depth map)
    // TODO: This calculation is pretty limited -- only works for IDX sensors at this point that directly report their
    // capabilities (including "has_depth_map"). Anything more robust will probably require some backend support, though.
    const { idxSensors } = this.props.ros
    const sensorName = value.split('/idx/')[0]
    const hasDepthMap = (sensorName in idxSensors)? this.props.ros.idxSensors[sensorName].has_depth_map : false

    await this.setState({
      imageTopic: value,
      imageText: text === "None" ? null : text,
      localizerOptionAvailable: hasDepthMap,
      
      // Experimental -- try showing plain camera imagery until classifier is loaded
      currentDisplayImgTopic: ((this.props.ros.reportedClassifier !== null) && (this.props.ros.reportedClassifier.classifier_state !== "Running"))?
        value : null
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
      setTimeout(this.waitForClassifierRunning, 250)
    }
    else {
      await this.setState({
        currentDisplayImgTopic: (localizerEnabled===false)? classifierImgTopic : targLocalizerImgTopic,
        imageText: this.state.imageText + ': ' + reportedClassifier.selected_classifier})
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
      await this.setState({currentDisplayImgTopic: (e.target.checked===false)? classifierImgTopic : targLocalizerImgTopic })
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

    // Revert back to showing the raw image
    if (this.state.imageTopic && this.state.imageText) {
      this.setState({
        currentDisplayImgTopic: this.state.imageTopic,
        imageText: this.state.imageText.split(':')[0]
      })
    }

    stopClassifier()
  }

  render() {
    const {
      reportedClassifier
    } = this.props.ros

    const thresholdVal = reportedClassifier? reportedClassifier.detection_threshold : 0.3
    var status_text = reportedClassifier? reportedClassifier.classifier_state : "Unknown"
    var status_color = indicator_colors.grey
    if (status_text === "Stopped") {
      status_color = indicator_colors.red
    }
    else if (status_text === "Loading") {
      status_color = indicator_colors.orange
    }
    else if (status_text === "Running") {
      status_color = indicator_colors.green
    }   
    
    return (
      <Columns>
        <Column equalWidth={false}>
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
            {this.state.localizerOptionAvailable?
            <Label title={"Enable Smart Targeting \u2122"}>
              <Toggle id={"toggle_run_localizer"} onClick={this.onToggleRunLocalizer} />
            </Label>
            : null}
          </Section>
          <Section title={"Parameters"}>
            <SliderAdjustment
              title={"Detection Threshold"}
              msgType={"std_msgs/Float32"}
              adjustment={thresholdVal}
              topic={"nepi_darknet_ros/set_threshold"}
              scaled={0.01}
              min={0}
              max={100}
              disabled={this.state.disabled}
              tooltip={"Sets detection confidence threshold"}
              unit={"%"}
            />
          </Section>
          <Section title={"A/I Status"}>
            <Columns>
              <Column>
                <ColoredTextIndicator indicator_color={status_color} text={status_text} style={{width:"100%", fontWeight:"bold"}}/>
                {(status_text === "Loading")?
                  <progress value={reportedClassifier? reportedClassifier.loading_progress : 0.0} style={{width: '100%'}}/>
                  : null
                }
              </Column>
              <Column>
                <ButtonMenu style={{marginTop: "0px"}}>
                  <Button onClick={this.onApplyButtonPressed}>{"Start"}</Button>
                  <Button onClick={this.onStopButtonPressed}>{"Stop"}</Button>
                </ButtonMenu>
              </Column>
            </Columns>
          </Section>
        </Column>
      </Columns>
    )
  }
}

export default DetectionApp
