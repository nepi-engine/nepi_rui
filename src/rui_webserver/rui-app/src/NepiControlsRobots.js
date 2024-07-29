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
import Button, { ButtonMenu } from "./Button"
import Toggle from "react-toggle"
import CameraViewer from "./CameraViewer"
import NepiRobotControls from "./NepiControlsRobotsControls"
import NepiRobotMessages from "./NepiControlsRobotsMessages"
import NepiDeviceInfo from "./NepiDeviceInfo"
import Nepi_IF_Settings from "./Nepi_IF_Settings"
import Nepi_IF_SaveData from "./Nepi_IF_SaveData"
import createShortValuesFromNamespace from "./Utilities"
import Input from "./Input"
import Styles from "./Styles"

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer

// ControlsRBX Application page
class NepiControlsRobots extends Component {
  constructor(props) {
    super(props)


    this.state = {

      show_controls: true,
      show_settings: true,
      show_save_data: true,

      rbx_capabilities: null,

      device_name: null,
      serial_num: null,
      hw_version: null,
      sw_version: null,
      standby: null,
      state_index: null,
      mode_index: null,
      error_bound_m: 0,
      error_bound_deg: 0,
      error_stabilize_s: 0,
      cmd_timeout: null,
      image_source: null,
      image_status_overlay: null,
      home_lat: null,
      home_long: null,
      home_alt: null,
      fake_gps_enabled: null,
      states_list: null,
      states_menu: null,
      modes_list: null,
      modes_menu: null,

      image_topic: null,


      currentRBXNamespace: null,
      currentRBXNamespaceText: "No robot selected",

      rbxInfoListener: null
    }

    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
    this.onTopicRBXSelected = this.onTopicRBXSelected.bind(this)
    this.clearTopicRBXSelection = this.clearTopicRBXSelection.bind(this)
    this.createTopicOptions = this.createTopicOptions.bind(this)
    this.createImageOptions = this.createImageOptions.bind(this)

    this.onDropdownSlectedSendIndex = this.onDropdownSlectedSendIndex.bind(this)
    this.getStrListAsList = this.getStrListAsList.bind(this)
    this.convertStrListToMenuList = this.convertStrListToMenuList.bind(this)

    this.updateInfoListener = this.updateInfoListener.bind(this)
    this.infoListener = this.infoListener.bind(this)

    this.onChangeBoolStandby = this.onChangeBoolStandby.bind(this)
    this.onChangeBoolFakeGPS = this.onChangeBoolFakeGPS.bind(this)
    this.onChangeBoolImgStatusOverlay = this.onChangeBoolImgStatusOverlay.bind(this)

    this.onUpdateAppInputBoxValue = this.onUpdateAppInputBoxValue.bind(this)
    this.onEnterSetInputErrorBoundValue = this.onEnterSetInputErrorBoundValue.bind(this)

    //const RBXRobotNamespaces = Object.keys(props.ros.RBXRobots)

  }


  // Callback for handling ROS Status messages
  infoListener(message) {
    const {rbxRobots} = this.props.ros
    this.setState({
      device_name: message.device_name,
      serial_num: message.serial_num,
      hw_version: message.hw_version,
      sw_version: message.sw_version,
      standby: message.standby,
      state_index: message.state,
      mode_index: message.mode,
      error_bound_m: message.error_bounds.max_distance_error_m,
      error_bound_deg: message.error_bounds.max_rotation_error_deg,
      error_stabilize_s: message.error_bounds.max_stabilize_time_s,
      cmd_timeout: message.cmd_timeout,
      image_source: message.image_source,
      image_status_overlay: message.image_status_overlay,
      home_lat: message.home_lat,
      home_long: message.home_long,
      home_alt: message.home_alt,
      fake_gps_enabled: message.fake_gps_enabled
    })
    if (this.state.rbx_capabilities === null){
      const capabilities = rbxRobots[this.state.currentRBXNamespace]
      if (capabilities){
        const states=this.getStrListAsList(capabilities.state_options)
        const states_menu_options=this.convertStrListToMenuList(states)
        const modes=this.getStrListAsList(capabilities.mode_options)
        const modes_menu_options=this.convertStrListToMenuList(modes)
      
        this.setState({ rbx_capabilities: capabilities,
          states_list: states,
          states_menu: states_menu_options,
          modes_list: modes,
          modes_menu: modes_menu_options,
        })
      }
    }
  }

  // Function for configuring and subscribing to Status
  updateInfoListener() {
    const robotNamespace = this.state.currentRBXNamespace

    if (this.state.rbxInfoListener) {
      this.state.rbxInfoListener.unsubscribe()
      this.setState({
        rbx_capabilities: null,
        states_list: null,
        modes_list: null,
        image_topic: null
      })
    }
    var listener = this.props.ros.setupStatusListener(
          robotNamespace + "/rbx/info" ,
          "nepi_ros_interfaces/RBXInfo",
          this.infoListener
        )

    this.setState({ rbxInfoListener: listener })
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState) {
    const currentRBXNamespace = this.state.currentRBXNamespace
    if (prevState.currentRBXNamespace !== currentRBXNamespace && currentRBXNamespace !== null) {
      if (currentRBXNamespace.indexOf('null') === -1)
        this.setState({currentRBXNamespace: currentRBXNamespace,
        image_topic: currentRBXNamespace + "/rbx/image"
        })
        this.updateInfoListener()
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

  convertStrListToMenuList(strList) {
    var menuList = []
    for (let ind = 0; ind < strList.length; ind++){
      menuList.push(<Option>{strList[ind]}</Option>)
    } 
    return menuList
  }

  // Function for creating topic options for Select input
  createTopicOptions(topics, filter) {
    var filteredTopics = topics
    var i
    if (filter) {
      filteredTopics = []
      for (i = 0; i < topics.length; i++) {
        // includes does a substring search
        if (topics[i].includes(filter)) {
          filteredTopics.push(topics[i])
        }
      }
    }

    var items = []
    items.push(<Option>{"None"}</Option>)
    var unique_names = createShortValuesFromNamespace(filteredTopics)
    for (i = 0; i < filteredTopics.length; i++) {
      items.push(<Option value={filteredTopics[i]}>{unique_names[i]}</Option>)
    }
    // Check that our current selection hasn't disappeard as an available option
    const { currentRBXNamespace } = this.state
    if ((currentRBXNamespace != null) && (! filteredTopics.includes(currentRBXNamespace))) {
      this.clearTopicRBXSelection()
    }

    return items
  }

  createImageOptions(RBXRobotNamespace) {
    var items = []
    items.push(<Option>{"None"}</Option>)

    const image_topics = this.props.ros.imageTopics
    var img_topics = []

    for (var i = 0; i < image_topics.length; i++) {
      const topic = image_topics[i]
      if (topic.startsWith(RBXRobotNamespace) === true) {
        continue
      }
      img_topics.push(topic)
    }

    const img_topics_short = createShortValuesFromNamespace(img_topics)
    for (i = 0; i < img_topics.length; i++) {
      items.push(<Option value={img_topics[i]}>{img_topics_short[i]}</Option>)
    }
    return items    
  }

  clearTopicRBXSelection() {
    this.setState({
      currentRBXNamespace: null,
      currentRBXNamespaceText: "No robot selected",
      imageTopic_0: null,
      imageText_0: null        
    })
  }

  // Handler for RBX Sensor topic selection
  onTopicRBXSelected(event) {
    var rbx = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[rbx].text
    var value = event.target.value

    // Handle the "None" option -- always index 0
    if (rbx === 0) {
      this.clearTopicRBXSelection()
      return
    }

    var autoSelectedImgTopic = null
    var autoSelectedImgTopicText = null
    autoSelectedImgTopic = value.concat("/rbx/image")
    autoSelectedImgTopicText = createShortValuesFromNamespace([autoSelectedImgTopic])[0]
  
    this.setState({
      currentRBXNamespace: value,
      currentRBXNamespaceText: text,
    })
  }

  // Handler for Image topic selection
  onImageTopicSelected(event) {
    const {sendStringMsg} = this.props.ros
    const namespace = this.state.currentRBXNamespace + "/rbx/set_image_topic"
    var value = event.target.value
    sendStringMsg(namespace,value)
  }

  onDropdownSlectedSendIndex(event, topicName) {
    const {sendIntMsg} = this.props.ros
    const value = event.target.value
    if (value !== "None") {
      const index = event.target.selectedIndex
      const namespace = this.state.currentRBXNamespace + topicName
      sendIntMsg(namespace,index)
    }
  }

 onChangeBoolStandby(){
    const updateVal = this.state.standby == false
    this.props.ros.sendBoolMsg(this.state.currentRBXNamespace + "/",updateVal)
    this.render()
  }


  onChangeBoolImgStatusOverlay(){
    const updateVal = this.state.image_status_overlay == false
    this.props.ros.sendBoolMsg(this.state.currentRBXNamespace + "/rbx/enable_image_overlay",updateVal)
    this.render()
  }

  onChangeBoolFakeGPS(){
    const updateVal = this.state.fake_gps_enabled == false
    this.props.ros.sendBoolMsg(this.state.currentRBXNamespace + "/rbx/enable_fake_gps",updateVal)
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

  onEnterSetInputErrorBoundValue(event, stateVarStr) {
    if(event.key === 'Enter'){
      const value = parseFloat(event.target.value)
      if (!isNaN(value)){
        var key = stateVarStr
        var obj  = {}
        obj[key] = value
        this.setState(obj)
      }
      this.sendErrorBounds()
      document.getElementById(event.target.id).style.color = Styles.vars.colors.black
    }
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


  sendErrorBounds(){
    const {sendErrorBoundsMsg} = this.props.ros
    const max_m = this.state.error_bound_m
    const max_d = this.state.error_bound_deg
    const min_stab = this.state.error_stabilize_s
    const namespace = this.state.currentRBXNamespace + "/rbx/set_goto_error_bounds"
    sendErrorBoundsMsg(namespace,max_m,max_d,min_stab)
  }

  renderSensorSelection() {
    const { rbxRobots, sendTriggerMsg, saveConfigTriggered  } = this.props.ros
    const NoneOption = <Option>None</Option>
    const robotSelected = (this.state.currentRBXNamespace != null)
    const current_state = (this.state.rbx_capabilities !== null && this.state.states_list !== null)? this.state.states_list[this.state.state_index] : "None"
    const current_mode = (this.state.rbx_capabilities !== null && this.state.modes_list !== null)? this.state.modes_list[this.state.mode_index] : "None"

    return (
      <React.Fragment>
                    <Section title={"Selection"}>
        <Columns>
          <Column>


              <Columns>
              <Column>
                <Label title={"Robot"}>
                  <Select
                    onChange={this.onTopicRBXSelected}
                    value={this.state.currentRBXNamespace}
                  >
                    {this.createTopicOptions(Object.keys(rbxRobots))}
                  </Select>
                </Label>

     <div align={"left"} textAlign={"left"} hidden={!robotSelected}>

                  <Label title={"Image_Source"}>
                    <Select
                      id="image_source"
                      onChange={this.onImageTopicSelected}
                      value={this.state.image_source}
                      >
                      {this.state.currentRBXNamespace
                      ? this.createImageOptions(this.state.currentRBXNamespace)
                      : NoneOption}
                    </Select>
                    </Label>

                    <Label title={"Set State"}>
                    <Select
                      id="robot_state"
                      onChange={(event) => this.onDropdownSlectedSendIndex(event,"/rbx/set_state")}
                      value={current_state}
                    >
                      {this.state.states_list ? this.state.states_menu : NoneOption}
                    </Select>
                    </Label>


                    <Label title={"Set Mode"}>
                    <Select
                      id="robot_mode"
                      onChange={(event) => this.onDropdownSlectedSendIndex(event,"/rbx/set_mode")}
                      value={current_mode}
                    >
                      {this.state.modes_list ? this.state.modes_menu : NoneOption}
                    </Select>
                    </Label>


                   
                </div>

              </Column>
              <Column>
                <div align={"left"} textAlign={"left"} hidden={!robotSelected}>
                    <ButtonMenu>
                      <Button onClick={() => saveConfigTriggered(this.state.currentRBXNamespace)}>{"Save Config"}</Button>
                    </ButtonMenu>
                    <ButtonMenu>
                      <Button onClick={() => sendTriggerMsg(this.state.currentRBXNamespace + "/reset_factory")}>{"Factory Reset"}</Button>
                    </ButtonMenu>
{/*
                    <Label title="Standby">
                      <Toggle
                      checked={this.state.standby===true}
                      onClick={this.onChangeBoolStandby}>
                      </Toggle>
                    </Label>
*/}
                    <Label title="Image Status Overlay">
                      <Toggle
                      checked={this.state.image_status_overlay===true}
                      onClick={this.onChangeBoolImgStatusOverlay}>
                      </Toggle>
                    </Label>

                </div>
              </Column>
            </Columns>



          </Column>
        </Columns>

        <div align={"left"} textAlign={"left"} hidden={!robotSelected}>
        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <label style={{fontWeight: 'bold'}}>
          {"Error Bounds"}
        </label>

          <Columns>
          <Column>

              <Label title={"Max (m)"}>
                <Input
                  value={this.state.error_bound_m}
                  id="error_m"
                  onChange= {(event) => this.onUpdateAppInputBoxValue(event,"error_bound_m")}
                  onKeyDown= {(event) => this.onEnterSetInputErrorBoundValue(event,"error_bound_m")}
                  style={{ width: "80%" }}
                />
              </Label>

            </Column>
            <Column>

              <Label title={"Max deg"}>
                <Input
                  value={this.state.error_bound_deg}
                  id="error"
                  onChange= {(event) => this.onUpdateAppInputBoxValue(event,"error_bound_deg")}
                  onKeyDown= {(event) => this.onEnterSetInputErrorBoundValue(event,"error_bound_deg")}
                  style={{ width: "80%" }}
                />
              </Label>

            </Column>
            <Column>

              <Label title={"Stablize Time (s)"}>
                <Input
                  value={this.state.error_stabilize_s}
                  id="error_stablize"
                  onChange= {(event) => this.onUpdateAppInputBoxValue(event,"error_stabilize_s")}
                  onKeyDown= {(event) => this.onEnterSetInputErrorBoundValue(event,"error_stabilize_s")}
                  style={{ width: "80%" }}
                />
              </Label>

              </Column>
              </Columns>

              <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

{/*
              <Columns>
              <Column>

              <Label title={"latitude"}>
                <Input disabled value="Test" />
              </Label>

              </Column>
              <Column>

                    <Label title={"longitude"}>
                <Input disabled value="Test"/>
              </Label>

              </Column>
              <Column>

              <Label title={"altitude"}>
                <Input disabled value={this.state.latitude} />
              </Label>

              </Column>
              </Columns>
*/}



              <Columns>
            <Column>
              <Label title="Enable Fake GPS">
                <Toggle
                checked={this.state.fake_gps_enabled===true}
                onClick={this.onChangeBoolFakeGPS}>
                </Toggle>
              </Label>

              </Column>
              <Column>

              <div hidden={(this.state.fake_gps_enabled===false)}>
              <ButtonMenu>
                <Button onClick={() => sendTriggerMsg(this.state.currentRBXNamespace + "/rbx/reset_fake_gps")}>{"Reset Fake GPS"}</Button>
              </ButtonMenu>
              </div>

              </Column>
              </Columns>


              </div>
              </Section>

      </React.Fragment>
    )
  }

  renderImageViewer() {
    return (
      <React.Fragment>
        <Columns>
          <Column equalWidth={false}>
            <CameraViewer
              imageTopic={this.state.image_topic}
              title={""}
              hideQualitySelector={false}
            />
          </Column>
        </Columns>
      </React.Fragment>
    )
  }


  render() {
    const robotSelected = (this.state.currentRBXNamespace != null)
    const ImageName = this.state.imageText_0
    
    return (
      <Columns>
        <Column>

        <div hidden={(!robotSelected)}>
            <NepiDeviceInfo
                  deviceNamespace={this.state.currentRBXNamespace}
                  status_topic={"/rbx/info"}
                  status_msg_type={"nepi_ros_interfaces/RBXInfo"}
                  name_update_topic={"/rbx/update_device_name"}
                  name_reset_topic={"/rbx/reset_device_name"}
                  title={"NepiRobotInfo"}
              />
          </div>

          {this.renderImageViewer()}

      
          <div hidden={!robotSelected}>
            <Nepi_IF_SaveData
                saveNamespace={this.state.currentRBXNamespace}
                title={"Nepi_IF_SaveData"}
            />
          </div>

          <div hidden={(!robotSelected && this.state.show_controls)}>
            <NepiRobotMessages
                rbxNamespace={this.state.currentRBXNamespace}
                title={"NepiRobotMessages"}
            />
          </div>

        </Column>
        <Column>
          {this.renderSensorSelection()}


{/*
          <div hidden={(!robotSelected && this.state.show_controls)}>
            <NepiRobotControls
                rbxNamespace={this.state.currentRBXNamespace}
                title={"NepiRobotControls"}
            />
          </div>
    */}



          <div hidden={(!robotSelected && this.state.show_settings)}>
            <Nepi_IF_Settings
              settingsNamespace={this.state.currentRBXNamespace}
              title={"Nepi_IF_Settings"}
            />
          </div>

         </Column>
      </Columns>
    )
  }
}

export default NepiControlsRobots
