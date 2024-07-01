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

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Select, { Option } from "./Select"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"
import CameraViewer from "./CameraViewer"
// import NepiPointcloudViewerSaveData from "./NepiPointcloudViewerSaveData"
// import NepiPointcloudViewerControls from "./NepiPointcloudViewerControls"

//import createShortValues from "./Utilities"

@inject("ros")
@observer

// SensorIDX Application page
class NepiAppPointcloudViewer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      appName: "pointcloud_viewer",
      appNamespace: null,
      pointcloudTopicList: [],
      selectedPointclouds: [],
      viewableTopics: false,

      disabled: true,
      listener: null

    }

    this.createShortValues = this.createShortValues.bind(this)

    this.getAppNamespace = this.getAppNamespace.bind(this)
    this.getPointcloudOptions = this.getPointcloudOptions.bind(this)
    this.getSelectedPointclouds = this.getSelectedPointclouds.bind(this)
    this.updateSelectedPointclouds = this.updateSelectedPointclouds.bind(this)
    this.updateSelectedPointclouds = this.updateSelectedPointclouds.bind(this)
    this.onTogglePointcloudSelection = this.onTogglePointcloudSelection.bind(this)
    this.toggleViewableTopics = this.toggleViewableTopics.bind(this)

    this.updateListener = this.updateListener.bind(this)
    this.StatusListener = this.StatusListener.bind(this)

  }

  getAppNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var appNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      appNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.appName
    }
    return appNamespace
  }

  // Callback for handling ROS Status messages
  StatusListener(message) {
    const pointcloudsMsg = message.pointcloud_topics
    this.updateSelectedPointclouds(pointcloudsMsg)
  }

  // Function for configuring and subscribing to Status
  updateListener() {
    const {title} = this.props
    const { setupPointcloudRenderStatusListener } = this.props.ros
    const appNamespace = this.getAppNamespace()
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
    if (appNamespace) {
      const statusNamespace = appNamespace + "/status"
      var listener = setupPointcloudRenderStatusListener(
        statusNamespace,
        this.StatusListener
      )
      this.setState({ listener: listener, disabled: false })
    } else {
      this.setState({ disabled: true })
    }
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const appNamespace = this.getAppNamespace()
    if (prevState.appNamespace !== appNamespace && appNamespace !== null) {
      this.setState({appNamespace: appNamespace})
      this.updateListener()
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
  }

  // Function for creating image topic options.
  getPointcloudOptions() {
    const { pointcloudTopics } = this.props.ros
    const appNamespace = this.getAppNamespace()
    const thisPointcloudTopic = appNamespace + "/pointcloud"
    var items = []
    var pointcloudTopicShortnames = this.createShortValues(pointcloudTopics)
    for (var i = 0; i < pointcloudTopics.length; i++) {
      if (pointcloudTopics[i] !== thisPointcloudTopic){
        items.push(<Option value={pointcloudTopics[i]}>{pointcloudTopicShortnames[i]}</Option>)
      }
    }
    items.push(<Option>{"ALL"}</Option>) 
    items.push(<Option>{"NONE"}</Option>) 
    return items
  }

  getSelectedPointclouds(){
    const selectedPointclouds = this.state.selectedPointclouds
    const appNamespace = this.state.appNamespace
    return selectedPointclouds
  }

  updateSelectedPointclouds(pointcloudsMsg) {
    var pointcloudsStrList = []
    if (pointcloudsMsg != null){
      pointcloudsMsg = pointcloudsMsg.replaceAll("[","")
      pointcloudsMsg = pointcloudsMsg.replaceAll("]","")
      pointcloudsMsg = pointcloudsMsg.replaceAll(" '","")
      pointcloudsMsg = pointcloudsMsg.replaceAll("'","")
      pointcloudsStrList = pointcloudsMsg.split(",")
    }
    this.setState({selectedPointclouds:pointcloudsStrList})
  }

  doNothing(){
    var ret = false
    return ret
  }
 
  onTogglePointcloudSelection(event){
    const {pointcloudTopics, sendStringMsg} = this.props.ros
    const pointcloud = event.target.value
    const appNamespace = this.getAppNamespace()
    const addNamespace = appNamespace + "/add_pointcloud"
    const removeNamespace = appNamespace + "/remove_pointcloud"
    const selectedList = this.state.selectedPointclouds
    if (appNamespace){
      if (pointcloud === "NONE"){
        for (let ind = 0; ind < selectedList.length; ind++) {
          sendStringMsg(removeNamespace,selectedList[ind])
        }
      }
      else if (pointcloud === "ALL"){
        var pointcloud2
        for (let ind = 0; ind < pointcloudTopics.length; ind++) {
          pointcloud2 = pointcloudTopics[ind]
          if (( pointcloud2 !== "NONE" || pointcloud2 !== "ALL") && selectedList.indexOf(pointcloud2) !== -1) {}
          sendStringMsg(addNamespace,pointcloud2)
        }
      }
      else if (selectedList.indexOf(pointcloud) !== -1){
        sendStringMsg(removeNamespace,pointcloud)
      }
      else {
        sendStringMsg(addNamespace,pointcloud)
      }
    }
  }

  createShortValues(list) {
    var tokenizedList = []
    var shortList = []
    var shortName = ''
    for (var i = 0; i < list.length; ++i) {
      tokenizedList.push(list[i].split("/"))
      shortName = tokenizedList[i][3] + "/" + tokenizedList[i][tokenizedList[i].length-1]
      shortList.push(shortName)
    }
    return shortList
  }

  toggleViewableTopics() {
    const set = !this.state.viewableTopics
    this.setState({viewableTopics: set})
  }

  renderSensorSelection() {
    const { saveConfigTriggered  } = this.props.ros
    const {viewableTopics} = this.state
    const appNamespace = this.getAppNamespace()
    const pointcloudSources = this.getPointcloudOptions()
    const selectedPointclouds = this.getSelectedPointclouds()

    const NoneOption = <Option>None</Option>
    const SensorSelected = (this.state.currentIDXNamespace != null)

    return (
      <React.Fragment>
        <Columns>
          <Column>
            <Section title={"Selection"}>

         
                  <Label title="Add/Remove Pointclouds">
                    <div onClick={this.toggleViewableTopics} style={{backgroundColor: Styles.vars.colors.grey0}}>
                      <Select style={{width: "10px"}}/>
                    </div>
                    <div hidden={!viewableTopics}>
                    {pointcloudSources.map((pointcloud) =>
                    <div onClick={this.onTogglePointcloudSelection}
                      style={{
                        textAlign: "center",
                        padding: `${Styles.vars.spacing.xs}`,
                        color: Styles.vars.colors.black,
                        backgroundColor: (selectedPointclouds.includes(pointcloud.props.value))? Styles.vars.colors.blue : Styles.vars.colors.grey0,
                        cursor: "pointer",
                        }}>
                        <body pointcloud-topic ={pointcloud} style={{color: Styles.vars.colors.black}}>{pointcloud}</body>
                    </div>
                    )}
                    </div>
                  </Label>

                <div align={"left"} textAlign={"left"} hidden={appNamespace === null}>
                    <ButtonMenu>
                      <Button onClick={() => saveConfigTriggered(appNamespace)}>{"Save Config"}</Button>
                    </ButtonMenu>
                </div>
            </Section>
          </Column>
        </Columns>
      </React.Fragment>
    )
  }

  renderImageViewer() {
    const appNamespace = this.getAppNamespace()
    const img_topic = appNamespace + "/pointcloud_image"
    return (
      <React.Fragment>
        <Columns>
          <Column equalWidth={false}>
            <CameraViewer
              imageTopic={img_topic}
              title={"pointcloud_image"}
              hideQualitySelector={false}
            />
          </Column>
        </Columns>
      </React.Fragment>
    )
  }


  render() {
    const { namespacePrefix, deviceId } = this.props.ros
    const namespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.appName
    
    return (
      <Columns>
        <Column>

          {this.renderImageViewer()}

{/*        
        <div hidden={false}>
          <NepiPointcloudViewerSaveData
                appNamespace={namespace}
                title={"NepiPointcloudViewerSaveData}
            />
        </div>
*/}


        </Column>
        <Column>

          {this.renderSensorSelection()}



{/*        
        <div hidden={false}>
          <NepiPointcloudViewerControls
                appNamespace={namespace}
                title={"NepiPointcloudViewerControls}
            />
        </div>
*/}
         </Column>
      </Columns>
    )
  }
}

export default NepiAppPointcloudViewer
