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
import Input from "./Input"


// import NepiAppPointcloudProcess from "./NepiAppPointcloudProcess"
import NepiAppPointcloudViewer from "./NepiAppPointcloudViewer"

import Nepi_IF_SaveData from "./Nepi_IF_SaveData"

//import createShortValues from "./Utilities"

@inject("ros")
@observer

// Pointcloud Application page
class NepiAppPointcloud extends Component {
  constructor(props) {
    super(props)

    this.state = {
      appName: "pointcloud_app",
      appNamespace: null,
      pointcloudTopicList: [],
      selectedPointclouds: [],
      viewableTopics: false,

      transforms_topic_list: [],
      transofrm_data_list: [],
      selectedTransformInd: 0,
      selectedTransformName: null,
      selectedTransformData: null,

      combineOption: null,
      combineOptionsList: [],
      selectedCombineOptionsInd: 0,

      rangeMaxMeters: null,
      rangeMinMeters: null,

      connected: false,
      disabled: true,
      listener: null

    }

    this.createShortValues = this.createShortValues.bind(this)

    this.getAppNamespace = this.getAppNamespace.bind(this)
    this.getPointcloudOptions = this.getPointcloudOptions.bind(this)
    this.getSelectedPointclouds = this.getSelectedPointclouds.bind(this)
    this.updateSelectedPointclouds = this.updateSelectedPointclouds.bind(this)
    this.onTogglePointcloudSelection = this.onTogglePointcloudSelection.bind(this)
    this.toggleViewableTopics = this.toggleViewableTopics.bind(this)

    this.getTransformTopicOptions = this.getTransformTopicOptions.bind(this)
    this.updateTranformsLists = this.updateTranformsLists.bind(this)

    this.getStrListAsList = this.getStrListAsList.bind(this)
    this.convertStrListToMenuList = this.convertStrListToMenuList.bind(this)

    this.updateListener = this.updateListener.bind(this)
    this.StatusListener = this.StatusListener.bind(this)

  }

  getAppNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var appNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      appNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.appName
      this.setState({connected: true})
    }
    return appNamespace
  }

  // Callback for handling ROS Status messages
  StatusListener(message) {
    const pointcloudsMsg = message.pointcloud_topics
    this.updateSelectedPointclouds(pointcloudsMsg)
    const combineOptionsMsg = message.combine_options
    const combineOptions = this.getStrListAsList(combineOptionsMsg)
    const transformsTopicMsg = message.transforms_topic_list
    const transformsMsg = message.transforms_list
    this.updateTransformLists( transformsTopicMsg,transformsMsg)
    this.setState({
    combineOptionsList: combineOptions,
    combineOption: message.combine_option,
    rangeMinMeters: message.range_min_max_m.start_range,
    rangeMaxMeters: message.range_min_max_m.stop_range,
    })
  }

  // Function for configuring and subscribing to Status
  updateListener() {
    const {title} = this.props
    const { setupPointcloudSelectionStatusListener } = this.props.ros
    const appNamespace = this.getAppNamespace()
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
    if (appNamespace) {
      const statusNamespace = appNamespace + "/status"
      var listener = setupPointcloudSelectionStatusListener(
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

  getStrListAsList(transformsStr) {
    var StrList = []
    if (transformsStr != null){
      transformsStr = transformsStr.replaceAll("[","")
      transformsStr = transformsStr.replaceAll("]","")
      transformsStr = transformsStr.replaceAll(" '","")
      transformsStr = transformsStr.replaceAll("'","")
      StrList = transformsStr.split(",")
    }
    return StrList
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


  // Function for creating image topic options.
  getTransformTopicOptions() {
    const topicList = this.state.transforms_topic_list
    var items = [<Option value={"NONE"}>{"NONE"}</Option>]
    var topicListShortnames = this.createShortValues(topicList)
    for (var i = 0; i < topicList.length; i++) {
      items.push(<Option value={topicList[i]}>{topicListShortnames[i]}</Option>)
    }
    return items
  }


  updateTranformsLists(transformsTopicMsg,transformsMsg) {
    var topicsList = this.getStrListAsList(transformsTopicMsg)
    var transformsStr = transformsMsg
    var transformsStrList = []
    if (transformsStr != null){
      transformsStr = transformsStr.replaceAll("[","")
      transformsStr = transformsStr.replaceAll("]","")
      transformsStr = transformsStr.replaceAll(" '","")
      transformsStr = transformsStr.replaceAll("'","")
      transformsStrList = transformsStr.split(",")
    }
    this.setState({transforms_topic_list: topicsList,
                   transforms_data_list: transformsStrList
    })
  }


  updateSelectedTransformData(topicIndex){
    const name = this.state.transforms_topic_list[topicIndex]
    const data = this.state.transforms_list[topicIndex]
    this.setState({selectedTransformInd: topicIndex,
      selectedTransformName: name,
      selectedTransformData: data,})
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


  getSelectedPointclouds(){
    const selectedPointclouds = this.state.selectedPointclouds
    const appNamespace = this.state.appNamespace
    return selectedPointclouds
  }

  convertStrListToMenuList(strList) {
    var menuList = []
    for (let ind = 0; ind < strList.length; ind++){
      menuList.push(<Option>{strList[ind]}</Option>)
    } 
    return menuList
  }

  renderPointcloudSelection() {
    const { saveConfigTriggered, sendTriggerMsg  } = this.props.ros
    const {viewableTopics} = this.state
    const appNamespace = this.getAppNamespace()
    const pointcloudSources = this.getPointcloudOptions()
    const selectedPointclouds = this.getSelectedPointclouds()
    const NoneOption = <Option>None</Option>


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
                    <ButtonMenu>
                      <Button onClick={() => sendTriggerMsg(appNamespace + "/reset_app")}>{"Reset App"}</Button>
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
    const appNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.appName
    const connected = this.state.connected
    return (
      <Columns>
        <Column>

          {this.renderImageViewer()}


        <div hidden={!connected}>
          <Nepi_IF_SaveData
                saveNamespace={appNamespace}
                title={"Nepi_IF_SaveData"}
            />
        </div>

        </Column>
        <Column>

          {this.renderPointcloudSelection()}

{/*
        <div hidden={!connected}>
          <NepiAppPointcloudProcess
                appNamespace={appNamespace + "/process"}
                title={"NepiAppPointcloudProcess"}
            />
        </div>
*/}

{/*
        <div hidden={!connected}>
          <NepiAppPointcloudViewer
                appNamespace={appNamespace + "/viewer"}
                title={"NepiAppPointcloudViewer"}
            />
        </div>

*/}
         </Column>
      </Columns>
    )
  }
}

export default NepiAppPointcloud
