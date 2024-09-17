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
import Toggle from "react-toggle"

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Select, { Option } from "./Select"
import CameraViewer from "./CameraViewer"
import { SliderAdjustment } from "./AdjustmentWidgets"
import Label from "./Label"
import Input from "./Input"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"
import {createShortUniqueValues, setElementStyleModified, clearElementStyleModified} from "./Utilities"

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer

// Component that contains the PTX controls
class NepiControlsPanTilt extends Component {
  constructor(props) {
    super(props)

    this.state = {
      imageTopic: null,
      imageText: null,

      ptSerialNum: null,
      ptHwVersion: null,
      ptSwVersion: null,
      
      yawPositionDeg: null,
      pitchPositionDeg: null,

      yawHomePosEdited: null,
      yawHomePosDeg: null,
      pitchHomePosEdited: null,
      pitchHomePosDeg: null,

      yawMaxHardstopDeg: null,
      yawMaxHardstopEdited: null,
      pitchMaxHardstopDeg: null,
      pitchMaxHardstopEdited: null,
      
      yawMaxSoftstopDeg: null,
      yawMaxSoftstopEdited: null,
      pitchMaxSoftstopDeg: null,
      pitchMaxSoftstopEdited: null,

      yawMinSoftstopDeg: null,
      yawMinSoftstopEdited: null,
      pitchMinSoftstopDeg: null,
      pitchMinSoftstopEdited: null,

      yawRatioAdjustment: null,
      pitchRatioAdjustment: null,
      speedRatioAdjustment: null,

      reverseYawControl: false,
      reversePitchControl: false,

      selectedWaypoint: 0,

      listener: null,
      disabled: true
    }

    this.onUpdateText = this.onUpdateText.bind(this)
    this.onKeyText = this.onKeyText.bind(this)
    this.createImageTopicsOptions = this.createImageTopicsOptions.bind(this)
    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
    this.onPTXUnitSelected = this.onPTXUnitSelected.bind(this)
    this.ptxStatusListener = this.ptxStatusListener.bind(this)
    this.renderControlPanel = this.renderControlPanel.bind(this)
    this.createPTXOptions = this.createPTXOptions.bind(this)
    this.createWaypointOptions = this.createWaypointOptions.bind(this)
    this.onWaypointSelected = this.onWaypointSelected.bind(this)
  }

  onUpdateText(e) {
    if ((e.target.id === "PTXYawHomePos") || (e.target.id === "PTXPitchHomePos"))
    {
      var yawElement = document.getElementById("PTXYawHomePos")
      setElementStyleModified(yawElement)
      
      var pitchElement = document.getElementById("PTXPitchHomePos")
      setElementStyleModified(pitchElement)
      
      this.setState({yawHomePosEdited: yawElement.value,
                     pitchHomePosEdited: pitchElement.value})
    }
    else if ((e.target.id === "PTXYawSoftStopMin") || (e.target.id === "PTXYawSoftStopMax") ||
             (e.target.id === "PTXPitchSoftStopMin") || (e.target.id === "PTXPitchSoftStopMax"))
    {
      var yawMinElement = document.getElementById("PTXYawSoftStopMin")
      setElementStyleModified(yawMinElement)

      var yawMaxElement = document.getElementById("PTXYawSoftStopMax")
      setElementStyleModified(yawMaxElement)

      var pitchMinElement = document.getElementById("PTXPitchSoftStopMin")
      setElementStyleModified(pitchMinElement)

      var pitchMaxElement = document.getElementById("PTXPitchSoftStopMax")
      setElementStyleModified(pitchMaxElement)

      this.setState({yawMinSoftstopEdited: yawMinElement.value, yawMaxSoftstopEdited: yawMaxElement.value, 
                     pitchMinSoftstopEdited: pitchMinElement.value, pitchMaxSoftstopEdited: pitchMaxElement.value})
    }
  }

  onKeyText(e) {
    const {onSetPTXHomePos, onSetPTXSoftStopPos} = this.props.ros
    if(e.key === 'Enter'){
      if ((e.target.id === "PTXYawHomePos") || (e.target.id === "PTXPitchHomePos"))
      {
        var yawElement = document.getElementById("PTXYawHomePos")
        clearElementStyleModified(yawElement)
        
        var pitchElement = document.getElementById("PTXPitchHomePos")
        clearElementStyleModified(pitchElement)
                
        onSetPTXHomePos(this.state.ptxNamespace, Number(yawElement.value), Number(pitchElement.value))
        this.setState({yawHomePosEdited:null, pitchHomePosEdited:null})
      }
      else if ((e.target.id === "PTXYawSoftStopMin") || (e.target.id === "PTXYawSoftStopMax") ||
               (e.target.id === "PTXPitchSoftStopMin") || (e.target.id === "PTXPitchSoftStopMax"))
      {
        var yawMinElement = document.getElementById("PTXYawSoftStopMin")
        clearElementStyleModified(yawMinElement)

        var yawMaxElement = document.getElementById("PTXYawSoftStopMax")
        clearElementStyleModified(yawMaxElement)

        var pitchMinElement = document.getElementById("PTXPitchSoftStopMin")
        clearElementStyleModified(pitchMinElement)

        var pitchMaxElement = document.getElementById("PTXPitchSoftStopMax")
        clearElementStyleModified(pitchMaxElement)

        onSetPTXSoftStopPos(this.state.ptxNamespace, Number(yawMinElement.value), Number(yawMaxElement.value), 
                            Number(pitchMinElement.value), Number(pitchMaxElement.value))
        this.setState({yawMaxSoftstopEdited: null, yawMinSoftstopEdited: null, pitchMaxSoftstopEdited: null, pitchMinSoftstopEdited: null})
      }
    }
  }

  // Function for creating image topic options.
  createImageTopicsOptions() {
    var items = []
    items.push(<Option>{""}</Option>) // Blank at the top serves as the "Cancel" operation
    const { imageTopics, imageFilterPTX } = this.props.ros
    var imageTopicShortnames = createShortUniqueValues(imageTopics)
    for (var i = 0; i < imageTopics.length; i++) {
      // Run the filter
      if (imageFilterPTX && !(imageFilterPTX.test(imageTopics[i]))) {
        continue
      }

      items.push(<Option value={imageTopics[i]}>{imageTopicShortnames[i]}</Option>)
    }
    return items
  }

  // Handler for Image topic selection
  onImageTopicSelected(event) {
    var idx = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[idx].text
    var value = event.target.value

    this.setState({
      imageTopic: value,
      imageText: text === "None" ? null : text,
    })
  }

  
  // Callback for handling ROS Status3DX messages
  ptxStatusListener(message) {
    const yaw_ratio_direction_corrected = (message.reverse_yaw_control === false)?
      (message.yaw_goal_deg - message.yaw_min_softstop_deg) / (message.yaw_max_softstop_deg - message.yaw_min_softstop_deg) :
      1.0 - ((message.yaw_goal_deg - message.yaw_min_softstop_deg) / (message.yaw_max_softstop_deg - message.yaw_min_softstop_deg))

    const pitch_ratio_direction_corrected = (message.reverse_pitch_control === false)?
      (message.pitch_goal_deg - message.pitch_min_softstop_deg) / (message.pitch_max_softstop_deg - message.pitch_min_softstop_deg) :
      1.0 - ((message.pitch_goal_deg - message.pitch_min_softstop_deg) / (message.pitch_max_softstop_deg - message.pitch_min_softstop_deg))

    this.setState({
      ptSerialNum: message.serial_num,
      ptHwVersion: message.hw_version,
      ptSwVersion: message.sw_version,
      yawRatioAdjustment: yaw_ratio_direction_corrected,
      pitchRatioAdjustment: pitch_ratio_direction_corrected,
      speedRatioAdjustment: (message.speed_ratio),
      yawPositionDeg: message.yaw_now_deg,
      pitchPositionDeg: message.pitch_now_deg,
      yawHomePosDeg: message.yaw_home_pos_deg,
      pitchHomePosDeg: message.pitch_home_pos_deg,
      yawMaxHardstopDeg: message.yaw_max_hardstop_deg,
      pitchMaxHardstopDeg: message.pitch_max_hardstop_deg,
      yawMinHardstopDeg: message.yaw_min_hardstop_deg,
      pitchMinHardstopDeg: message.pitch_min_hardstop_deg,
      yawMaxSoftstopDeg: message.yaw_max_softstop_deg,
      pitchMaxSoftstopDeg: message.pitch_max_softstop_deg,
      yawMinSoftstopDeg: message.yaw_min_softstop_deg,
      pitchMinSoftstopDeg: message.pitch_min_softstop_deg,
      reverseYawControl: message.reverse_yaw_control,
      reversePitchControl: message.reverse_pitch_control,
    })
  }

  // Function for configuring and subscribing to ptx/status
  onPTXUnitSelected(event) {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }

    var idx = event.nativeEvent.target.selectedIndex
    //var text = event.nativeEvent.target[idx].text
    var value = event.target.value

    // Handle the "None" option -- always index 0
    if (idx === 0) {
      this.setState({ disabled: true })
      return
    }

    this.setState({ ptxNamespace: value })

    var listener = this.props.ros.setupPTXStatusListener(
        value,
        this.ptxStatusListener
      )
      
    this.setState({ ptxNamespace: value, listener: listener, disabled: false })
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status3DX message
  componentWillUnmount() {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
      this.setState({listener : null})
    }
  }

  // Function for creating topic options for Select input
  createPTXOptions(caps_dictionaries, filter) {
    const topics = Object.keys(caps_dictionaries)
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
    items.push(<Option>{""}</Option>)
    var unique_names = createShortUniqueValues(filteredTopics)
    for (i = 0; i < filteredTopics.length; i++) {
      items.push(<Option value={filteredTopics[i]}>{unique_names[i]}</Option>)
    }

    return items
  }

  createWaypointOptions(waypoint_count) {
    var items = []
    for (var i = 0; i < waypoint_count; ++i) {
      items.push(<Option value={i}>{i.toString()}</Option>)
    }
    return items
  }

  onWaypointSelected(event)
  {
    const idx = event.nativeEvent.target.selectedIndex
    this.setState({selectedWaypoint: idx})
  }

  renderControlPanel() {
    const { ptxNamespace, ptSerialNum, ptHwVersion, ptSwVersion,
            yawPositionDeg, pitchPositionDeg, yawHomePosDeg, pitchHomePosDeg,
            yawMaxHardstopDeg, pitchMaxHardstopDeg, yawMinHardstopDeg, pitchMinHardstopDeg,
            yawMaxSoftstopDeg, pitchMaxSoftstopDeg, yawMinSoftstopDeg, pitchMinSoftstopDeg,
            speedRatioAdjustment, yawHomePosEdited, pitchHomePosEdited,
            yawMinSoftstopEdited, pitchMinSoftstopEdited, yawMaxSoftstopEdited, pitchMaxSoftstopEdited,
            reverseYawControl, reversePitchControl, selectedWaypoint } = this.state
    const { ptxUnits, onPTXGoHome, onPTXSetHomeHere, onPTXGotoWaypoint, onPTXSetWaypointHere,
            onSetReverseYawControl, onSetReversePitchControl } = this.props.ros
    const ptx_id = ptxNamespace? ptxNamespace.split('/').slice(-1) : "No Pan/Tilt Selected"

    const ptx_caps = ptxUnits[ptxNamespace]
    const has_abs_positioning = ptx_caps && (ptx_caps['absolute_positioning'] === true)
    const has_speed_control = ptx_caps && (ptx_caps['adjustable_speed'] === true)
    const has_homing = ptx_caps && (ptx_caps['homing'] === true)
    const has_waypoints = ptx_caps && (ptx_caps['waypoints'] === true)
    
    const yawHomePos = (yawHomePosEdited === null)? round(yawHomePosDeg, 1) : yawHomePosEdited
    const pitchHomePos = (pitchHomePosEdited === null)? round(pitchHomePosDeg, 1) : pitchHomePosEdited

    const yawSoftStopMin = (yawMinSoftstopEdited === null)? round(yawMinSoftstopDeg, 1) : yawMinSoftstopEdited
    const pitchSoftStopMin = (pitchMinSoftstopEdited === null)? round(pitchMinSoftstopDeg, 1) : pitchMinSoftstopEdited
    const yawSoftStopMax = (yawMaxSoftstopEdited === null)? round(yawMaxSoftstopDeg, 1) : yawMaxSoftstopEdited
    const pitchSoftStopMax = (pitchMaxSoftstopEdited === null)? round(pitchMaxSoftstopDeg, 1) : pitchMaxSoftstopEdited
    
    return (
      <Section title={ptx_id} >
        <Label title={"Serial Number"}>
          <Input disabled={true} value={ptSerialNum}/>
        </Label>
        <Label title={"H/W Rev."}>
          <Input disabled={true} value={ptHwVersion}/>
        </Label>
        <Label title={"S/W Rev."}>
          <Input disabled={true} value={ptSwVersion}/>
        </Label>
        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
        <Label title={""}>
        <div style={{ display: "inline-block", width: "45%", float: "left" }}>
          {"Yaw"}
        </div>
        <div style={{ display: "inline-block", width: "45%" }}>{"Pitch"}</div>
        </Label>
        <Label title={"Present Position"}>
          <Input
            disabled
            style={{ width: "45%", float: "left" }}
            value={round(yawPositionDeg, 1)}
          />
          <Input
            disabled
            style={{ width: "45%" }}
            value={round(pitchPositionDeg, 1)}
          />
        </Label>
        <Label title={"Hard Position Min"}>
          <Input
            disabled
            style={{ width: "45%" }}
            value={round(yawMinHardstopDeg, 1)}
          />
          <Input
            disabled
            style={{ width: "45%", float: "left" }}
            value={round(pitchMinHardstopDeg, 1)}
          />
        </Label>
        <Label title={"Hard Position Max"}>
          <Input
            disabled
            style={{ width: "45%" }}
            value={round(yawMaxHardstopDeg, 1)}
          />
          <Input
            disabled
            style={{ width: "45%", float: "left" }}
            value={round(pitchMaxHardstopDeg, 1)}
          />
        </Label>        
        <Label title={"Operating Position Min"}>
          <Input
            disabled={!has_abs_positioning}
            id={"PTXYawSoftStopMin"}
            style={{ width: "45%", float: "left" }}
            value={yawSoftStopMin}
            onChange= {this.onUpdateText}
            onKeyDown= {this.onKeyText}
          />
          <Input
            disabled={!has_abs_positioning}
            id={"PTXPitchSoftStopMin"}
            style={{ width: "45%" }}
            value={pitchSoftStopMin}
            onChange= {this.onUpdateText}
            onKeyDown= {this.onKeyText}
          />
        </Label>
        <Label title={"Operating Position Max"}>
          <Input
            disabled={!has_abs_positioning}
            id={"PTXYawSoftStopMax"}
            style={{ width: "45%", float: "left" }}
            value={yawSoftStopMax}
            onChange= {this.onUpdateText}
            onKeyDown= {this.onKeyText}
          />
          <Input
            disabled={!has_abs_positioning}
            id={"PTXPitchSoftStopMax"}
            style={{ width: "45%" }}
            value={pitchSoftStopMax}
            onChange= {this.onUpdateText}
            onKeyDown= {this.onKeyText}
          />
        </Label>
        <Label title={"Home Position"}>
          <Input
            disabled={!has_homing}
            id={"PTXYawHomePos"}
            style={{ width: "45%", float: "left" }}
            value={yawHomePos}
            onChange= {this.onUpdateText}
            onKeyDown= {this.onKeyText}
          />
          <Input
            disabled={!has_homing}
            id={"PTXPitchHomePos"}
            style={{ width: "45%" }}
            value={pitchHomePos}
            onChange= {this.onUpdateText}
            onKeyDown= {this.onKeyText}
          />
        </Label>
        <ButtonMenu>
          <Button disabled={!has_homing} onClick={() => onPTXGoHome(ptxNamespace)}>{"Go Home"}</Button>
          <Button disabled={!has_homing} onClick={() => onPTXSetHomeHere(ptxNamespace)}>{"Set Home Here"}</Button>
        </ButtonMenu>
        <Label title={"Waypoint Selection"}>
          <Select
            disabled={!has_waypoints}
            onChange={this.onWaypointSelected}
            value={selectedWaypoint}>
            {this.createWaypointOptions(has_waypoints? 256 : 0)}
          </Select>
        </Label>
        <ButtonMenu>
          <Button disabled={!has_waypoints} onClick={() => onPTXGotoWaypoint(ptxNamespace, selectedWaypoint)}>{"Goto Waypoint"}</Button>
          <Button disabled={!has_waypoints} onClick={() => onPTXSetWaypointHere(ptxNamespace, selectedWaypoint)}>{"Set Waypoint"}</Button>
        </ButtonMenu>
        <Label title={"Reverse Control"}>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>
            <Toggle style={{justifyContent: "flex-left"}} checked={reverseYawControl} onClick={() => onSetReverseYawControl(ptxNamespace, !reverseYawControl)} />
          </div>
          <div style={{ display: "inline-block", width: "45%", float: "right" }}>
            <Toggle style={{justifyContent: "flex-right"}} checked={reversePitchControl} onClick={() => onSetReversePitchControl(ptxNamespace, !reversePitchControl)} />
          </div>
        </Label>
        <SliderAdjustment
          disabled={!has_speed_control}
          title={"Speed"}
          msgType={"std_msgs/Float32"}
          adjustment={speedRatioAdjustment}
          topic={ptxNamespace + "/ptx/set_speed_ratio"}
          scaled={0.01}
          min={0}
          max={100}
          tooltip={"Speed as a percentage (0%=min, 100%=max)"}
          unit={"%"}
        />
      </Section>
    )
  }

  render() {
    const { ptxUnits, onPTXJogYaw, onPTXJogPitch, onPTXStop,saveConfigTriggered } = this.props.ros
    const { ptxNamespace, yawRatioAdjustment, pitchRatioAdjustment} = this.state

    const ptxImageViewerElement = document.getElementById("ptxImageViewer")
    const pitchSliderHeight = (ptxImageViewerElement)? ptxImageViewerElement.offsetHeight : "100px"

    const ptx_caps = ptxUnits[ptxNamespace]
    const has_abs_positioning = ptx_caps && (ptx_caps['absolute_positioning'] === true)

    return (
      <React.Fragment>
        <Columns>
          <Column equalWidth = {false} >
                <div id="ptxImageViewer">
                  <CameraViewer
                    id="ptxImageViewer"
                    imageTopic={this.state.imageTopic}
                    title={this.state.imageText}
                    hideQualitySelector={false}
                  />
                </div>
                <SliderAdjustment
                  disabled={!has_abs_positioning}
                  title={"Yaw"}
                  msgType={"std_msgs/Float32"}
                  adjustment={yawRatioAdjustment}
                  topic={ptxNamespace + "/ptx/jog_to_yaw_ratio"}
                  scaled={0.01}
                  min={0}
                  max={100}
                  tooltip={"Yaw as a percentage (0%=min, 100%=max)"}
                  unit={"%"}
                  noTextBox={true}
                  noLabel={true}
                />
                <ButtonMenu>
                  <Button 
                    buttonDownAction={() => onPTXJogYaw(ptxNamespace, 1)}
                    buttonUpAction={() => onPTXStop(ptxNamespace)}>
                    {'\u25C0'}
                    </Button>
                  <Button 
                    buttonDownAction={() => onPTXJogYaw(ptxNamespace, -1)}
                    buttonUpAction={() => onPTXStop(ptxNamespace)}>
                    {'\u25B6'}
                  </Button>
                  <Button 
                    buttonDownAction={() => onPTXJogPitch(ptxNamespace, 1)}
                    buttonUpAction={() => onPTXStop(ptxNamespace)}>
                    {'\u25B2'}
                  </Button>
                  <Button 
                    buttonDownAction={() => onPTXJogPitch(ptxNamespace, -1)}
                    buttonUpAction={() => onPTXStop(ptxNamespace)}>
                    {'\u25BC'}
                  </Button>
                  <Button onClick={() => onPTXStop(ptxNamespace)}>{"STOP"}</Button>
                </ButtonMenu>
          </Column>
          <Column style={{flex: 0.05}}>
            <SliderAdjustment
              disabled={!has_abs_positioning}
              title={"Pitch"}
              msgType={"std_msgs/Float32"}
              adjustment={pitchRatioAdjustment}
              topic={ptxNamespace + "/ptx/jog_to_pitch_ratio"}
              scaled={0.01}
              min={0}
              max={100}
              tooltip={"Pitch as a percentage (0%=min, 100%=max)"}
              unit={"%"}
              vertical={true}
              verticalHeight={pitchSliderHeight}
              noTextBox={true}
              noLabel={true}
            />
          </Column>
          <Column>
            <Label title={"Pan/Tilt Unit"}>
              <Select
                onChange={this.onPTXUnitSelected}
                value={this.state.ptxNamespace}
              >
                {this.createPTXOptions(ptxUnits)}
              </Select>
            </Label>
            <Label title={"Selected Image"}>
              <Select
                id="ptxImageTopicSelect"
                onChange={this.onImageTopicSelected}
                value={this.state.imageTopic}
              >
              {this.createImageTopicsOptions()}
              </Select>
            </Label>


            <div align={"left"} textAlign={"left"} hidden={this.state.ptxNamespace === null}>
                    <ButtonMenu>
                      <Button onClick={() => saveConfigTriggered(this.state.ptxNamespace)}>{"Save Config"}</Button>
            </ButtonMenu>


          </div>

            { ptxNamespace?
              this.renderControlPanel()
              : null
            }
          </Column>
        </Columns>
      </React.Fragment>
    )
  }
}

export default NepiControlsPanTilt
