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
import Toggle from "react-toggle"

import createShortValuesFromNamespace from "./Utilities"

import NepiPointcloudProcessControls from "./NepiPointcloudProcessControls"
import NepiPointcloudRenderControls from "./NepiPointcloudRenderControls"

import Nepi_IF_SaveData from "./Nepi_IF_SaveData"

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer

// Pointcloud Application page
class NepiAppPointcloud extends Component {
  constructor(props) {
    super(props)

    this.state = {
      appName: "app_pointcloud",
      appNamespace: null,
      pointcloudTopicList: [],
      selectedPointclouds: [],
      viewableTopics: false,
     
      showTransforms: false,
      transforms_topic_list: [],
      transforms_list: [],
      selectedTransformPointcloud: "",
      selectedTransformInd: 0,
      selectedTransformPointcloud: null,
      selectedTransformData: null,
      selectedTransformTX: 0,
      selectedTransformTY: 0,
      selectedTransformTZ: 0,
      selectedTransformRX: 0,
      selectedTransformRY: 0,
      selectedTransformRZ: 0,
      selectedTransformHO: 0,
      age_filter_s: null,
      primary_pointcloud_topic: null,

      combineOption: null,
      combineOptionsList: [],

      rangeMaxMeters: null,
      rangeMinMeters: null,

      connected: false,

      listener: null



    }

    this.getAppNamespace = this.getAppNamespace.bind(this)
    this.getPointcloudOptions = this.getPointcloudOptions.bind(this)
    this.getSelectedPointclouds = this.getSelectedPointclouds.bind(this)
    this.updateSelectedPointclouds = this.updateSelectedPointclouds.bind(this)
    this.onTogglePointcloudSelection = this.onTogglePointcloudSelection.bind(this)
    this.toggleViewableTopics = this.toggleViewableTopics.bind(this)

    this.getTransformTopicOptions = this.getTransformTopicOptions.bind(this)
    this.updateTranformsList = this.updateTranformsList.bind(this)

    this.getStrListAsList = this.getStrListAsList.bind(this)
    this.convertStrListToMenuList = this.convertStrListToMenuList.bind(this)

    this.onAppDropdownSlectedSetState = this.onAppDropdownSlectedSetState.bind(this)
    this.onAppDropdownSlectedSendStr = this.onAppDropdownSlectedSendStr.bind(this)
    this.createDropdownBoxOptions = this.createDropdownBoxOptions.bind(this)
    
    this.onUpdateAppInputBoxValue = this.onUpdateAppInputBoxValue.bind(this)
    this.onEnterSendInputBoxFloatValue = this.onEnterSendInputBoxFloatValue.bind(this)


    this.onClickToggleShowTransforms = this.onClickToggleShowTransforms.bind(this)
    this.onEnterSetInputBoxFloatValue = this.onEnterSetInputBoxFloatValue.bind(this)
    this.sendTransformUpdateMessage = this.sendTransformUpdateMessage.bind(this)
    this.setSelectedTransform = this.setSelectedTransform.bind(this)

    this.updateSelectionListener = this.updateSelectionListener.bind(this)
    this.selectionStatusListener = this.selectionStatusListener.bind(this)

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
  selectionStatusListener(message) {
    const pointcloudsMsg = message.selected_pointcloud_topics
    this.updateSelectedPointclouds(pointcloudsMsg)
    const combineOptionsMsg = message.combine_options
    const combineOptions = this.getStrListAsList(combineOptionsMsg)
    const transformsTopicMsg = message.transforms_topic_list
    const transformsMsg = message.transforms_list
    this.updateTranformsList( transformsTopicMsg,transformsMsg)
    this.setState({
    age_filter_s: message.age_filter_s,
    combineOptionsList: combineOptions,
    combineOption: message.combine_option,
    rangeMinMeters: message.range_min_max_m.start_range,
    rangeMaxMeters: message.range_min_max_m.stop_range,
    primary_pointcloud_topic: message.primary_pointcloud_topic
    })
    this.setState({connected: true})
  }

  // Function for configuring and subscribing to Status
  updateSelectionListener() {
    const statusNamespace = this.getAppNamespace() + '/status'
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
    var listener = this.props.ros.setupPointcloudSelectionStatusListener(
          statusNamespace,
          this.selectionStatusListener
        )
    this.setState({ listener: listener})
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace = this.getAppNamespace()
    if (prevState.appNamespace !== namespace && namespace !== null) {
      if (namespace.indexOf('null') === -1) {
        this.setState({appNamespace: namespace})
        this.updateSelectionListener()
      } 
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
    const thisPointcloudTopic = this.state.appNamespace + "/pointcloud"
    var items = []
    var pointcloudTopicShortnames = createShortValuesFromNamespace(pointcloudTopics)
    for (var i = 0; i < pointcloudTopics.length; i++) {
      if (pointcloudTopics[i] !== thisPointcloudTopic){
        items.push(<Option value={pointcloudTopics[i]}>{pointcloudTopicShortnames[i]}</Option>)
      }
    }
    //items.push(<Option>{"ALL"}</Option>) 
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
    const addNamespace = this.state.appNamespace + "/add_pointcloud"
    const removeNamespace = this.state.appNamespace + "/remove_pointcloud"
    const selectedList = this.state.selectedPointclouds
    if (this.state.appNamespace){
      if (pointcloud === "NONE"){
        for (let ind = 0; ind < selectedList.length; ind++) {
          sendStringMsg(removeNamespace,selectedList[ind])
        }
      }
      else if (pointcloud === "ALL"){
        var pointcloud2
        for (let ind = 0; ind < pointcloudTopics.length; ind++) {
          pointcloud2 = pointcloudTopics[ind]
          if ( pointcloud2 !== "NONE" || pointcloud2 !== "ALL"){
            if (pointcloud2.indexOf('pointcloud_app') === -1 && selectedList.includes(pointcloud2) === false) {
              sendStringMsg(addNamespace,pointcloud2)
            }
          }
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

  updateCombineOptions(combineOptionsMsg) {
    var combineStrList = []
    if (combineOptionsMsg != null){
      combineOptionsMsg = combineOptionsMsg.replaceAll("[","")
      combineOptionsMsg = combineOptionsMsg.replaceAll("]","")
      combineOptionsMsg = combineOptionsMsg.replaceAll(" '","")
      combineOptionsMsg = combineOptionsMsg.replaceAll("'","")
      combineStrList = combineOptionsMsg.split(",")
    }
    this.setState({combineOptionsList:combineStrList})
  }

  doNothing(){
    var ret = false
    return ret
  }
 

  // Function for creating image topic options.
  getTransformTopicOptions() {
    const topicList = this.state.transforms_topic_list
    var items = [<Option value={"NONE"}>{"NONE"}</Option>]
    var topicListShortnames = createShortValuesFromNamespace(topicList)
    for (var i = 0; i < topicList.length; i++) {
      items.push(<Option value={topicList[i]}>{topicListShortnames[i]}</Option>)
    }
    return items
  }


  updateTranformsList(transformsTopicMsg,transformsMsg) {
    var topicsList = this.getStrListAsList(transformsTopicMsg)
    const transformsFlat = this.getStrListAsList(transformsMsg)
    var transform = []
    var transformsList = []
    var tf_index = 0
    for (var i = 0; i < transformsFlat.length; i++) {
      transform.push(transformsFlat[i])
      tf_index += 1
      if (tf_index === 7){
        transformsList.push(transform)
        transform = []
        tf_index = 0
      }
    }
    this.setState({transforms_topic_list: topicsList,
                  transforms_list: transformsList
    })
  }


  updateSelectedTransformData(topicIndex){
    const name = this.state.transforms_topic_list[topicIndex]
    const data = this.state.transforms_list[topicIndex]
    this.setState({selectedTransformInd: topicIndex,
      selectedTransformPointcloud: name,
      selectedTransformData: data,})
  }


  toggleViewableTopics() {
    const set = !this.state.viewableTopics
    this.setState({viewableTopics: set})
  }


  getSelectedPointclouds(){
    const selectedPointclouds = this.state.selectedPointclouds
    return selectedPointclouds
  }

  convertStrListToMenuList(strList) {
    var menuList = []
    for (let ind = 0; ind < strList.length; ind++){
      menuList.push(<Option>{strList[ind]}</Option>)
    } 
    return menuList
  }


   onAppDropdownSlectedSetState(event, stateVarStr) {
    var key = stateVarStr
    var value = event.target.value
    var obj  = {}
    obj[key] = value
    this.setState(obj)
  }

  onAppDropdownSlectedSendStr(event, topicName) {
    const {sendStringMsg} = this.props.ros
    const value = event.target.value
    const namespace = this.state.appNamespace + topicName
    sendStringMsg(namespace,value)
  }


   createDropdownBoxOptions(optionsStrList, useShortNames, filterOut, prefixOptionsStrList, appendOptionsStrList) {
    var filteredTopics = []
    var i
    var filteredTopics = []
    if (filterOut) {
      for (i = 0; i < optionsStrList.length; i++) {
          if (filterOut.includes(optionsStrList[i]) === false){
            filteredTopics.push(optionsStrList[i])
          }
      }
    }

    var unique_names = null
    if (useShortNames === true){
      unique_names = this.createShortValuesFromNamespace(filteredTopics)
    } 
    else{
      unique_names = filteredTopics
    }
    var items = []
    for (i = 0; i < prefixOptionsStrList.length; i++) {
        items.push(<Option>{prefixOptionsStrList[i]}</Option>)
    }

    for (i = 0; i < filteredTopics.length; i++) {
      items.push(<Option value={filteredTopics[i]}>{unique_names[i]}</Option>)
    }

    for (i = 0; i < appendOptionsStrList.length; i++) {
        items.push(<Option>{appendOptionsStrList[i]}</Option>)
    }

     return items
  }
  
  onUpdateAppInputBoxValue(event,stateVarStr) {
    var key = stateVarStr
    var value = event.target.value
    var obj  = {}
    obj[key] = value
    this.setState(obj)
    document.getElementById(event.target.id).style.color = Styles.vars.colors.red
    this.render()
  }


  onEnterSendInputBoxFloatValue(event, topicName) {
    const {sendFloatMsg} = this.props.ros
    const namespace = this.state.appNamespace + topicName
    if(event.key === 'Enter'){
      const value = parseFloat(event.target.value)
      if (!isNaN(value)){
        sendFloatMsg(namespace,value)
      }
      document.getElementById(event.target.id).style.color = Styles.vars.colors.black
    }
  }

  onEnterSetInputBoxFloatValue(event, stateVarStr) {
    if(event.key === 'Enter'){
      const value = parseFloat(event.target.value)
      if (!isNaN(value)){
        var key = stateVarStr
        var obj  = {}
        obj[key] = value
        this.setState(obj)
      }
      document.getElementById(event.target.id).style.color = Styles.vars.colors.black
    }
  }

  sendTransformUpdateMessage(){
    const {sendFrame3DTransformUpdateMsg} = this.props.ros
    const namespace = this.state.appNamespace + "/update_transform"
    const transformNamespace = this.state.selectedTransformPointcloud
    const TX = this.state.selectedTransformTX
    const TY = this.state.selectedTransformTY
    const TZ = this.state.selectedTransformTZ
    const RX = this.state.selectedTransformRX
    const RY = this.state.selectedTransformRY
    const RZ = this.state.selectedTransformRZ
    const HO = this.state.selectedTransformHO
    const transformList = [TX,TY,TZ,RX,RY,RZ,HO]

    sendFrame3DTransformUpdateMsg(namespace,transformNamespace,transformList)
  }

  onClickToggleShowTransforms(){
    const currentVal = this.state.showTransforms 
    this.setState({showTransforms: !currentVal})
    this.render()
  }

  setSelectedTransform(event){
    const pointcloud = event.target.value
    const pointclouds = this.state.transforms_topic_list
    const transforms = this.state.transforms_list
    const tf_index = pointclouds.indexOf(pointcloud)
    if (tf_index !== -1){
      this.setState({
        selectedTransformPointcloud: pointcloud,
        selectedTransformInd: tf_index
      })
      const transform = transforms[tf_index]
      this.setState({
        selectedTransformTX: transform[0],
        selectedTransformTY: transform[1],
        selectedTransformTZ: transform[2],
        selectedTransformRX: transform[3],
        selectedTransformRX: transform[4],
        selectedTransformRY: transform[5],
        selectedTransformRZ: transform[6],
        selectedTransformHO: transform[7]
      })
      
    }
  }

  renderPointcloudSelection() {
    const { saveConfigTriggered, sendTriggerMsg  } = this.props.ros
    const {viewableTopics} = this.state
    const pointcloudSources = this.getPointcloudOptions()
    const selectedPointclouds = this.getSelectedPointclouds()
    const NoneOption = <Option>None</Option>
    const connected = this.state.connected
    return (
      <React.Fragment>

            <Section title={"Selection"}>



            <Columns>
              <Column>

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

             </Column>
             <Column>

             <div align={"left"} textAlign={"left"} hidden={connected === false}>
                  <Label title={"Primary Pointcloud"}>
                    <Select
                      id="primary_pointcloud"
                      onChange={(event) => this.onAppDropdownSlectedSendStr(event,"/set_primary_pointcloud")}
                      value={this.state.primary_pointcloud_topic}
                    >
                      {this.state.selectedPointclouds
                        ? this.createDropdownBoxOptions(this.state.selectedPointclouds, true, [],[],[])
                        : NoneOption}
                    </Select>
                  </Label>
              </div>

              </Column>
            </Columns>

            <div align={"left"} textAlign={"left"} hidden={connected === false}>

            <Label title={""}></Label>

            <Columns>
              <Column>
                  <Label title={"Age Filter (s)"}>
                    <Input id="age_filter" 
                      value={this.state.age_filter_s} 
                      onChange={(event) => this.onUpdateAppInputBoxValue(event,"age_filter_s")} 
                      onKeyDown= {(event) => this.onEnterSendInputBoxFloatValue(event,"/set_age_filter")} />
                  </Label>

                  <Label title={""}></Label>
                  <Label title={""}></Label>
                  
                  <Label title="Show 3D Transforms">
                    <Toggle
                      checked={this.state.showTransforms===true}
                      onClick={this.onClickToggleShowTransforms}>
                    </Toggle>
                  </Label>

              </Column>
              <Column>

                  <Label title={"Combine Options"}>
                    <Select
                      id="combine_options"
                      onChange={(event) => this.onAppDropdownSlectedSendStr(event,"/set_combine_option")}
                      value={this.state.combineOption}
                    >
                      {this.state.combineOptionsList
                        ? this.createDropdownBoxOptions(this.state.combineOptionsList, false, [],[],[])
                        : NoneOption}
                    </Select>
                  </Label>
                  
                  <Label title={""}></Label>
                  <Label title={""}></Label>

                  <div align={"left"} textAlign={"left"} hidden={this.state.showTransforms === false}>

                  <Label title={"Select Transforms"}>
                    <Select
                      id="select_transforms"
                      onChange={this.setSelectedTransform}
                      value={this.state.selectedTransformPointcloud}
                    >
                      {this.state.transforms_topic_list
                        ? this.createDropdownBoxOptions(this.state.transforms_topic_list, true, [],[],[])
                        : NoneOption}
                    </Select>
                  </Label>

                  </div>
              </Column>
            </Columns>
            <div align={"left"} textAlign={"left"} hidden={this.state.showTransforms === false}>

          <Columns>
            <Column>


              <Label title={"X (m)"}>
                <Input
                  value={round(this.state.selectedTransformTX, 2)}
                  id="XTranslation"
                  onChange= {(event) => this.onUpdateAppInputBoxValue(event,"selectedTransformTX")}
                  onKeyDown= {(event) => this.onEnterSetInputBoxFloatValue(event,"selectedTransformTX")}
                  style={{ width: "80%" }}
                />
              </Label>

              <Label title={"Y (m)"}>
                <Input
                  value={round(this.state.selectedTransformTY, 2)}
                  id="YTranslation"
                  onChange= {(event) => this.onUpdateAppInputBoxValue(event,"selectedTransformTY")}
                  onKeyDown= {(event) => this.onEnterSetInputBoxFloatValue(event,"selectedTransformTY")}
                  style={{ width: "80%" }}
                />
              </Label>

              <Label title={"Z (m)"}>
                <Input
                  value={round(this.state.selectedTransformTZ, 2)}
                  id="ZTranslation"
                  onChange= {(event) => this.onUpdateAppInputBoxValue(event,"selectedTransformTZ")}
                  onKeyDown= {(event) => this.onEnterSetInputBoxFloatValue(event,"selectedTransformTZ")}
                  style={{ width: "80%" }}
                />
              </Label>

              <Label title={"Heading Offset (deg)"}>
                <Input
                  value={round(this.state.selectedTransformHO, 2)}
                  id="HeadingOffset"
                  onChange= {(event) => this.onUpdateAppInputBoxValue(event,"selectedTransformHO")}
                  onKeyDown= {(event) => this.onEnterSetInputBoxFloatValue(event,"selectedTransformHO")}
                  style={{ width: "80%" }}
                />
              </Label>

            </Column>
            <Column>

              <Label title={"Roll (deg)"}>
                <Input
                  value={round(this.state.selectedTransformRX, 2)}
                  id="XRotation"
                  onChange= {(event) => this.onUpdateAppInputBoxValue(event,"selectedTransformRX")}
                  onKeyDown= {(event) => this.onEnterSetInputBoxFloatValue(event,"selectedTransformRX")}
                  style={{ width: "80%" }}
                />
              </Label>

              <Label title={"Pitch (deg)"}>
                <Input
                  value={round(this.state.selectedTransformRY, 2)}
                  id="YRotation"
                  onChange= {(event) => this.onUpdateAppInputBoxValue(event,"selectedTransformRY")}
                  onKeyDown= {(event) => this.onEnterSetInputBoxFloatValue(event,"selectedTransformRY")}
                  style={{ width: "80%" }}
                />
              </Label>

              <Label title={"Yaw (deg)"}>
                <Input
                  value={round(this.state.selectedTransformRZ, 2)}
                  id="ZRotation"
                  onChange= {(event) => this.onUpdateAppInputBoxValue(event,"selectedTransformRZ")}
                  onKeyDown= {(event) => this.onEnterSetInputBoxFloatValue(event,"selectedTransformRZ")}
                  style={{ width: "80%" }}
                />
              </Label>

              <ButtonMenu>
                <Button onClick={() => this.sendTransformUpdateMessage()}>{"Update Transform"}</Button>
              </ButtonMenu>

            </Column>
          </Columns>
          </div>

    
          <Columns>
            <Column>
            
              <Label title={""}></Label>

              <ButtonMenu>
                <Button onClick={() => saveConfigTriggered(this.state.appNamespace)}>{"Save Config"}</Button>
              </ButtonMenu>

            </Column>
            <Column>
            
              <Label title={""}></Label>

              <ButtonMenu>
                <Button onClick={() => sendTriggerMsg(this.state.appNamespace + "/reset_app")}>{"Reset App"}</Button>
              </ButtonMenu>

            </Column>
          </Columns>


          </div>
          
        </Section>

        
      </React.Fragment>
    )
  }

  renderImageViewer() {
    const img_topic = this.state.appNamespace + "/pointcloud_image"
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
    const connected = this.state.connected
    return (
      <Columns>
        <Column>

          {this.renderImageViewer()}


          <div hidden={!connected}>
          <NepiPointcloudProcessControls
                processNamespace={this.state.appNamespace + "/process"}
                title={"NepiPointcloudProcessControls"}
            />
          </div>

          <div hidden={!connected}>
            <Nepi_IF_SaveData
                  saveNamespace={this.state.appNamespace}
                  title={"Nepi_IF_SaveData"}
              />
          </div>


        </Column>
        <Column>

          {this.renderPointcloudSelection()}




        <div hidden={!connected}>
          <NepiPointcloudRenderControls
                renderNamespace={this.state.appNamespace + "/render"}
                title={"NepiPointcloudRenderControls"}
            />
        </div>


         </Column>
      </Columns>
    )
  }
}

export default NepiAppPointcloud
