/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */
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
import NepIAppAiTargeting from "./NepIAppAiTargeting"


import { filterStrList, createShortValuesFromNamespaces } from "./Utilities"

import CameraViewer from "./CameraViewer"

@inject("ros")
@observer
class NepiAppAIDetector extends Component {
  constructor(props) {
    super(props)
    var img = (this.props.ros.reportedClassifier !== null)? this.props.ros.reportedClassifier.selected_img_topic.split("/") : null
    const classifier_running = ((this.props.ros.reportedClassifier !== null) && (this.props.ros.reportedClassifier.classifier_state === "Running"))?
      true : false
    const TARGETING_IMG_TOPIC = "/" + this.props.ros.namespacePrefix + "/" + this.props.ros.deviceId + '/app_ai_targeting/targeting_image'
    const DETCLASSIFIER_IMG_TOPIC = "/" + this.props.ros.namespacePrefix + "/" + this.props.ros.deviceId  + '/ai_detector_mgr/detection_image'

    this.state = {
      selectedImgTopic: null,
      last_reportedClassifier: null,
      imageTopic: (this.props.ros.reportedClassifier) ? this.props.ros.reportedClassifier.selected_img_topic : "None",
      imageText: (classifier_running === true)?
        img[img.length-1] + ':' + this.props.ros.reportedClassifier.selected_classifier : 
        img? img[img.length-1] : null,
      // Only set currentDisplayImgTopic when classifier is running -- this state transition is required for the CameraViewer to work properly
      currentDisplayImgTopic: (classifier_running === true)? 
      DETCLASSIFIER_IMG_TOPIC: 
        (this.props.ros.reportedClassifier? this.props.ros.reportedClassifier.selected_img_topic : null),
      selectedClassifier: (this.props.ros.reportedClassifier) ? this.props.ros.reportedClassifier.selected_classifier : "None",
      detectionThreshold: (this.props.ros.reportedClassifier)? this.props.ros.reportedClassifier.detection_threshold : 0.3,
      localizerOptionAvailable: false,
      appName: "ai_detector_mgr",
      localizerEnabled: false}
    this.getAppNamespace = this.getAppNamespace.bind(this)
    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
    this.onClassifierSelected = this.onClassifierSelected.bind(this)
    this.checkForClassifierRunning = this.checkForClassifierRunning.bind(this)
    this.onApplyButtonPressed = this.onApplyButtonPressed.bind(this)
    this.onStopButtonPressed = this.onStopButtonPressed.bind(this)
    this.onToggleRunLocalizer = this.onToggleRunLocalizer.bind(this)
    this.onImageSelect = this.onImageSelect.bind(this)

    

    this.checkForClassifierRunning()
  }

  getAppNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var appNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      appNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.appName
    }

    return appNamespace
  }

  // Function for creating image topic options.
  createImageTopicsOptions() {
    const {imageFilterDetection} = this.props.ros
    var items = []
    items.push(<Option>{"None"}</Option>)
    const { imageTopics } = this.props.ros
    const imageTopicsFiltered = filterStrList(imageTopics,['zed_node','detection_image','targeting_image'])
    var uniqueNames = createShortValuesFromNamespaces(imageTopicsFiltered)
    const classifier_not_stopped = 
      (this.props.ros.reportedClassifier !== null) && (this.props.ros.reportedClassifier.classifier_state !== "Stopped")
    for (var i = 0; i < imageTopicsFiltered .length; i++) {
      // Run the filter
      if (imageFilterDetection && !(imageFilterDetection.test(imageTopicsFiltered [i]))) {
        continue
      }
      if (classifier_not_stopped) {
        if (imageTopicsFiltered[i] === this.props.ros.reportedClassifier.selected_img_topic) {
          items.push(<Option selected="selected" value={imageTopicsFiltered [i]}>{uniqueNames[i]}</Option>)
        }
        else {
          items.push(<Option value={imageTopicsFiltered [i]}>{uniqueNames[i]}</Option>)
        }
      }
      else if (imageTopicsFiltered[i] === this.state.imageTopic) {
        items.push(<Option selected="selected" value={imageTopicsFiltered[i]}>{uniqueNames[i]}</Option>)
      }
      else {
        items.push(<Option value={imageTopicsFiltered[i]}>{uniqueNames[i]}</Option>)
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
    const sensorName = (value !== null)? value.split('/idx/')[0] : "None"
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

  async checkForClassifierRunning() {
    const {
      reportedClassifier,
      classifierImgTopic,
      targLocalizerImgTopic
    } = this.props.ros

    const { localizerEnabled } = this.state

    // Delay the state transition until the classifier is actually running
    // in order to avoid invoking CameraViewer's updateImageSource method (via
    // componentDidUpdate()) until we can receive a real image with a valid size
    if ((reportedClassifier === null) || (reportedClassifier.classifier_state !== "Running")) {
      if (this.state.currentDisplayImgTopic !== this.state.imageTopic) {
        await this.setState({
          currentDisplayImgTopic: this.state.imageTopic,
          imageText: (this.state.imageTopic !== null)? this.state.imageTopic.split('/').at(-1) : null
        })
      }
    }
    else {
      if (this.state.selectedImgTopic === null){
        const { namespacePrefix, deviceId} = this.props.ros
        const TARGETING_IMG_TOPIC = "/" + namespacePrefix + "/" + deviceId + '/app_ai_targeting/targeting_image'
        const DETCLASSIFIER_IMG_TOPIC = "/" + namespacePrefix + "/" + deviceId +  '/ai_detector_mgr/detection_image'

        this.setState({selectedImgTopic: TARGETING_IMG_TOPIC,
                        imageText: "Targeting Image"
        })
        currentDisplayImgTopic: DETCLASSIFIER_IMG_TOPIC
      }
      else{
        this.setState({
        currentDisplayImgTopic: this.state.selectedImgTopic
        })
      }
    }

    // Run this method periodically forever
    setTimeout(this.checkForClassifierRunning, 250)
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
    const { startClassifier, reportedClassifier } = this.props.ros
    var threshold = reportedClassifier.detection_threshold
    if (reportedClassifier){
      threshold = reportedClassifier.detection_threshold
    }
    const {
      imageTopic,
      selectedClassifier,
    } = this.state

    startClassifier(imageTopic, selectedClassifier, threshold)
  }

  onStopButtonPressed() {
    const {
      stopClassifier
    } = this.props.ros

    stopClassifier()
  }

  // Function for creating image topic options.
  getImageOptions() {
    var items = []
    items.push(<Option>{"Detection"}</Option>)
    items.push(<Option>{"Targeting"}</Option>)
    return items
    }

  onImageSelect(event){
    const {namespacePrefix, deviceId} = this.props.ros
    const value = event.target.value
    const DETCLASSIFIER_IMG_TOPIC = "/" + namespacePrefix + "/" + deviceId + '/ai_detector_mgr/detection_image'
    const TARGETING_IMG_TOPIC = "/" + namespacePrefix + "/" + deviceId + '/app_ai_targeting/targeting_image'
    var image_topic = ""
    var image_name = ""
    if (value === "Detection"){
      image_topic = DETCLASSIFIER_IMG_TOPIC
      image_name = "Detection Image"
    }
    else{
      image_topic = TARGETING_IMG_TOPIC
      image_name = "Targeting Image"
    }
    this.setState({selectedImgTopic: image_topic,
      imageText: image_name})
  }


  renderAIManager() {
    const { saveConfigTriggered, sendTriggerMsg  } = this.props.ros
    const {
      reportedClassifier
    } = this.props.ros

    const thresholdVal = reportedClassifier? reportedClassifier.detection_threshold : 0.3
    var status_text = reportedClassifier? reportedClassifier.classifier_state : "Unknown"
    
    if (reportedClassifier !== null && reportedClassifier !== this.state.last_reportedClassifier && reportedClassifier.selected_classifier !== "None"){
      this.setState({
        selectedClassifier: reportedClassifier.selected_classifier,
        detectionThreshold: reportedClassifier.detection_threshold,
        last_reportedClassifier: reportedClassifier
      })
    }
    
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

    const namespace = this.getAppNamespace()
    return (

          <Section title={"AI Detector Settings"}>

            <Label title={"Image Topic"}>
              <Select id="ImgSelect" onChange={this.onImageTopicSelected} disabled={status_text !== "Stopped"}>
                {this.createImageTopicsOptions()}
              </Select>
            </Label>

            <Label title={"Image Classifier"}>
              <Select id="ClassifierSelect" onChange={this.onClassifierSelected} disabled={status_text !== "Stopped"}>
                {this.createImageClassifierOptions()}
              </Select>
            </Label>


          <label style={{fontWeight: 'bold'}}>
          {"Parameters"}
        </label>

            <SliderAdjustment
              title={"Detection Threshold"}
              msgType={"std_msgs/Float32"}
              adjustment={thresholdVal}
              topic={"ai_detector_mgr/set_threshold"}
              scaled={0.01}
              min={0}
              max={100}
              disabled={this.state.disabled}
              tooltip={"Sets detection confidence threshold"}
              unit={"%"}
            />

          <label style={{fontWeight: 'bold'}}>
          {"A/I Status"}
        </label>

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

                <Columns>
                <Column>
                
              <ButtonMenu>
                <Button onClick={() => sendTriggerMsg(namespace + "/save_config")}>{"Save Config"}</Button>
              </ButtonMenu>

            </Column>
            <Column>
            
              <ButtonMenu>
                <Button onClick={() => sendTriggerMsg(namespace + "/reset_config")}>{"Reset Config"}</Button>
              </ButtonMenu>

            </Column>
          </Columns>


      </Section>

        )
      }

      render() {
        const namespace = this.getAppNamespace()
        return (
          <Columns>
          <Column equalWidth={false}>
  
          <Label title={"Image Select"}>
              <Select id="onImageSelect" onChange={this.onImageSelect}>
                {this.getImageOptions()}
              </Select>
            </Label>
          <CameraViewer
            imageTopic={this.state.currentDisplayImgTopic}
            title={this.state.imageText}
            hideQualitySelector={false}
          />


          </Column>
          <Column>


          {this.renderAIManager()}    


          <div hidden={namespace === null}>

          <NepIAppAiTargeting
          targetingNamespace={ namespace ? namespace.replace("ai_detector_mgr", "app_ai_targeting" ): namespace}
          title={"NepIAppAiTargeting"}
          />
        
        </div>   


          </Column>
          </Columns>



          )
        }
      
}

export default NepiAppAIDetector
