/*
 * NEPI Dual-Use License
 * Project: nepi_rui
 *
 * This license applies to any user of NEPI Engine software
 *
 * Copyright (C) 2023 Numurus, LLC <https://www.numurus.com>
 * see https://github.com/numurus-nepi/nepi_rui
 *
 * This software is dual-licensed under the terms of either a NEPI software developer license
 * or a NEPI software commercial license.
 *
 * The terms of both the NEPI software developer and commercial licenses
 * can be found at: www.numurus.com/licensing-nepi-engine
 *
 * Redistributions in source code must retain this top-level comment block.
 * Plagiarizing this software to sidestep the license obligations is illegal.
 *
 * Contact Information:
 * ====================
 * - https://www.numurus.com/licensing-nepi-engine
 * - mailto:nepi@numurus.com
 *
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
import createShortUniqueValues, {setElementStyleModified, clearElementStyleModified} from "./Utilities"

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer

// Component that contains the PTX controls
class PTX extends Component {
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
    this.toggleReverseYawControl = this.toggleReverseYawControl.bind(this)
    this.toggleReversePitchControl = this.toggleReversePitchControl.bind(this)
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
    this.setState({
      ptSerialNum: message.serial_num,
      ptHwVersion: message.hw_version,
      ptSwVersion: message.sw_version,
      yawRatioAdjustment: (message.yaw_goal_deg - message.yaw_min_softstop_deg) / (message.yaw_max_softstop_deg - message.yaw_min_softstop_deg),
      pitchRatioAdjustment: (message.pitch_goal_deg - message.pitch_min_softstop_deg) / (message.pitch_max_softstop_deg - message.pitch_min_softstop_deg),
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
      pitchMinSoftstopDeg: message.pitch_min_softstop_deg
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
    }
  }

  // Function for creating topic options for Select input
  createPTXOptions(topics, filter) {
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
    // Check that our current selection hasn't disappeard as an available option
    const { currentIDXNamespace } = this.state
    if ((currentIDXNamespace != null) && (! filteredTopics.includes(currentIDXNamespace))) {
      this.clearTopicIDXSelection()
    }

    return items
  }

  toggleReverseYawControl()
  {
    const current = this.state.reverseYawControl
    this.setState({reverseYawControl: !current})
  }

  toggleReversePitchControl()
  {
    const current = this.state.reversePitchControl
    this.setState({reversePitchControl: !current})
  }

  renderControlPanel() {
    const { ptxNamespace, ptSerialNum, ptHwVersion, ptSwVersion,
            yawPositionDeg, pitchPositionDeg, yawHomePosDeg, pitchHomePosDeg,
            yawMaxHardstopDeg, pitchMaxHardstopDeg, yawMinHardstopDeg, pitchMinHardstopDeg,
            yawMaxSoftstopDeg, pitchMaxSoftstopDeg, yawMinSoftstopDeg, pitchMinSoftstopDeg,
            speedRatioAdjustment, yawHomePosEdited, pitchHomePosEdited,
            yawMinSoftstopEdited, pitchMinSoftstopEdited, yawMaxSoftstopEdited, pitchMaxSoftstopEdited,
            reverseYawControl, reversePitchControl } = this.state
    const { onPTXGoHome, onPTXStop } = this.props.ros
    const ptx_id = ptxNamespace? ptxNamespace.split('/').slice(-1) : "No Pan/Tilt Selected"
    
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
            id={"PTXYawSoftStopMin"}
            style={{ width: "45%", float: "left" }}
            value={yawSoftStopMin}
            onChange= {this.onUpdateText}
            onKeyDown= {this.onKeyText}
          />
          <Input
            id={"PTXPitchSoftStopMin"}
            style={{ width: "45%" }}
            value={pitchSoftStopMin}
            onChange= {this.onUpdateText}
            onKeyDown= {this.onKeyText}
          />
        </Label>
        <Label title={"Operating Position Max"}>
          <Input
            id={"PTXYawSoftStopMax"}
            style={{ width: "45%", float: "left" }}
            value={yawSoftStopMax}
            onChange= {this.onUpdateText}
            onKeyDown= {this.onKeyText}
          />
          <Input
            id={"PTXPitchSoftStopMax"}
            style={{ width: "45%" }}
            value={pitchSoftStopMax}
            onChange= {this.onUpdateText}
            onKeyDown= {this.onKeyText}
          />
        </Label>
        <Label title={"Home Position"}>
          <Input
            id={"PTXYawHomePos"}
            style={{ width: "45%", float: "left" }}
            value={yawHomePos}
            onChange= {this.onUpdateText}
            onKeyDown= {this.onKeyText}
          />
          <Input
            id={"PTXPitchHomePos"}
            style={{ width: "45%" }}
            value={pitchHomePos}
            onChange= {this.onUpdateText}
            onKeyDown= {this.onKeyText}
          />
        </Label>
        <Label title={"Reverse Control"}>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>
            <Toggle style={{justifyContent: "flex-left"}} checked={reverseYawControl} onClick={this.toggleReverseYawControl} />
          </div>
          <div style={{ display: "inline-block", width: "45%", float: "right" }}>
            <Toggle style={{justifyContent: "flex-right"}} checked={reversePitchControl} onClick={this.toggleReversePitchControl} />
          </div>
        </Label>
        <SliderAdjustment
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
        <ButtonMenu>
          <Button onClick={() => onPTXGoHome(ptxNamespace)}>{"Home"}</Button>
          <Button onClick={() => onPTXStop(ptxNamespace)}>{"Stop"}</Button>
        </ButtonMenu>
      </Section>
    )
  }

  render() {
    const { ptxUnits } = this.props.ros
    const { ptxNamespace, yawRatioAdjustment, pitchRatioAdjustment, reverseYawControl, reversePitchControl } = this.state

    const ptxImageViewerElement = document.getElementById("ptxImageViewer")
    const pitchSliderHeight = (ptxImageViewerElement)? ptxImageViewerElement.offsetHeight : "100px"

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
                  reverse={reverseYawControl}
                />
          </Column>
          <Column style={{flex: 0.05}}>
            <SliderAdjustment
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
              reverse={reversePitchControl}
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

export default PTX
