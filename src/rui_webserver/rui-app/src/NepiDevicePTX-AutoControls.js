/*
#
# Copyright (c) 2024 Numurus <https://www.numurus.com>.
#
# This file is part of nepi rui (nepi_rui) repo
# (see https://github.com/nepi-engine/nepi_rui)
#
# License: NEPI RUI repo source-code and NEPI Images that use this source-code
# are licensed under the "Numurus Software License", 
# which can be found at: <https://numurus.com/wp-content/uploads/Numurus-Software-License-Terms.pdf>
#
# Redistributions in source code must retain this top-level comment block.
# Plagiarizing this software to sidestep the license obligations is illegal.
#
# Contact Information:
# ====================
# - mailto:nepi@numurus.com
#
 */
import React, { Component } from "react"
import { observer, inject } from "mobx-react"
import Toggle from "react-toggle"

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Select, { Option } from "./Select"
import { SliderAdjustment } from "./AdjustmentWidgets"
import Label from "./Label"
import Input from "./Input"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"
import {setElementStyleModified, clearElementStyleModified, onUpdateSetStateValue} from "./Utilities"
import {createShortValuesFromNamespaces} from "./Utilities"

import NepiDeviceInfo from "./Nepi_IF_DeviceInfo"
import ImageViewer from "./Nepi_IF_ImageViewer"
import NepiIFSettings from "./Nepi_IF_Settings"
//Unused import NepiIFSaveData from "./Nepi_IF_SaveData"
import NepiIFConfig from "./Nepi_IF_Config"
import NepiSystemMessages from "./Nepi_IF_Messages"

//import NepiDevicePTXControls from "./NepiDevicePTX-Controls"
import NepiIF3DTransform from "./Nepi_IF_3DTransform"
import NavPoseViewer from "./Nepi_IF_NavPoseViewer"
import {onChangeSwitchStateValue } from "./Utilities"




function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer

// Component that contains the PTX controls
class NepiDevicePTXControls extends Component {
  constructor(props) {
    super(props)

    this.state = {
      showTransform: false,

      imageTopic: null,
      imageText: null,

      ptSerialNum: null,
      ptHwVersion: null,
      ptSwVersion: null,
      
      panPositionDeg: null,
      tiltPositionDeg: null,

      panGotoDeg: 0.0,
      tiltGotoDeg: 0.0,

      panHomePosEdited: null,
      panHomePosDeg: null,
      tiltHomePosEdited: null,
      tiltHomePosDeg: null,

      show_navpose: false,

      showSettings: false,

      panMaxHardstopDeg: null,
      panMaxHardstopEdited: null,
      tiltMaxHardstopDeg: null,
      tiltMaxHardstopEdited: null,

      panMinHardstopDeg: null,
      panMinHardstopEdited: null,
      tiltMinHardstopDeg: null,
      tiltMinHardstopEdited: null,
      
      panMaxSoftstopDeg: null,
      panMaxSoftstopEdited: null,
      tiltMaxSoftstopDeg: null,
      tiltMaxSoftstopEdited: null,

      panMinSoftstopDeg: null,
      panMinSoftstopEdited: null,
      tiltMinSoftstopDeg: null,
      tiltMinSoftstopEdited: null,



      panNowRatio: null,
      tiltNowRatio: null,
      panGoalRatio: null,
      tiltGoalRatio: null,
      panGoalRatioLast: null,
      tiltGoalRatioLast: null,
      panRatio: null,
      tiltRatio: null,
      speedRatio: null,

      reversePanEnabled: false,
      reverseTiltEnabled: false,

      track_source_namespaces: null,
      track_source_namespace: null,
      track_source_connected: null,

      autoPanEnabled: false,
      autoPanMin: -1,
      autoPanMax: 1,
      autoTiltEnabled: false,
      autoTiltMin: -1,
      autoTiltMax: 1,

      panScanMin: null,
      panScanMax: null,
      tiltScanMin: null,
      tiltScanMax: null,
      /*
      sinPanEnabled: false,
      #sinTiltEnabled: false,
      */

      speed_pan_dps: 0,
      speed_tilt_dps: 0,

      namespace : null,
      
      listener: null,
      disabled: true

    }

    //this.renderNavPose = this.renderNavPose.bind(this)
    //this.renderNavPoseInfo = this.renderNavPoseInfo.bind(this)

    this.onUpdateText = this.onUpdateText.bind(this)
    this.onKeyText = this.onKeyText.bind(this)
    this.createImageTopicsOptions = this.createImageTopicsOptions.bind(this)
    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
    this.onptxDeviceselected = this.onptxDeviceselected.bind(this)
    this.ptxStatusListener = this.ptxStatusListener.bind(this)
    this.renderControlPanel = this.renderControlPanel.bind(this)
    this.createPTXOptions = this.createPTXOptions.bind(this)
    this.onClickToggleShowSettings = this.onClickToggleShowSettings.bind(this)
    this.onClickToggleShowTransform = this.onClickToggleShowTransform.bind(this)

    this.onEnterSendScanRangeWindowValue = this.onEnterSendScanRangeWindowValue.bind(this)
  }

  onUpdateText(e) {
    var panElement = null
    var tiltElement = null
    var panMinElement = null
    var panMaxElement = null
    var tiltMinElement = null
    var tiltMaxElement = null
    if ((e.target.id === "PTXPanHomePos") || (e.target.id === "PTXTiltHomePos"))
    {
      panElement = document.getElementById("PTXPanHomePos")
      setElementStyleModified(panElement)
      
      tiltElement = document.getElementById("PTXTiltHomePos")
      setElementStyleModified(tiltElement)
      
      this.setState({panHomePosEdited: panElement.value,
                     tiltHomePosEdited: tiltElement.value})
    }
    else if ((e.target.id === "PTXPanSoftStopMin") || (e.target.id === "PTXPanSoftStopMax") ||
             (e.target.id === "PTXTiltSoftStopMin") || (e.target.id === "PTXTiltSoftStopMax"))
    {
      panMinElement = document.getElementById("PTXPanSoftStopMin")
      setElementStyleModified(panMinElement)

      panMaxElement = document.getElementById("PTXPanSoftStopMax")
      setElementStyleModified(panMaxElement)

      tiltMinElement = document.getElementById("PTXTiltSoftStopMin")
      setElementStyleModified(tiltMinElement)

      tiltMaxElement = document.getElementById("PTXTiltSoftStopMax")
      setElementStyleModified(tiltMaxElement)

      this.setState({panMinSoftstopEdited: panMinElement.value, panMaxSoftstopEdited: panMaxElement.value, 
                     tiltMinSoftstopEdited: tiltMinElement.value, tiltMaxSoftstopEdited: tiltMaxElement.value})
    }
    else if (e.target.id === "PTXPanGoto") 
      {
        panElement = document.getElementById("PTXPanGoto")
        setElementStyleModified(panElement)
             
        this.setState({panGotoDeg: panElement.value})
      }
        
    else if  (e.target.id === "PTXTiltGoto")
        {
          tiltElement = document.getElementById("PTXTiltGoto")
          setElementStyleModified(tiltElement)
               
          this.setState({tiltGotoDeg: tiltElement.value})                 
          
        }

  }

  onKeyText(e) {
    const {ptxDevices, onSetPTXGotoPos, onSetPTXGotoPanPos, onSetPTXGotoTiltPos, onSetPTXHomePos, onSetPTXSoftStopPos, onSetPTXHardStopPos} = this.props.ros
const namespace = this.props.namespace ? this.props.namespace : 'None'

    //Unused const ptx_id = namespace? namespace.split('/').slice(-1) : "No Pan/Tilt Selected"
    const ptx_caps = ptxDevices[namespace]
    const has_sep_pan_tilt = ptx_caps && (ptx_caps.has_seperate_pan_tilt_control)
    var panElement = null
    var tiltElement = null
    var panMinElement = null
    var panMaxElement = null
    var tiltMinElement = null
    var tiltMaxElement = null
    if(e.key === 'Enter'){
      if ((e.target.id === "PTXPanHomePos") || (e.target.id === "PTXTiltHomePos"))
      {
        panElement = document.getElementById("PTXPanHomePos")
        clearElementStyleModified(panElement)
        
        tiltElement = document.getElementById("PTXTiltHomePos")
        clearElementStyleModified(tiltElement)
                
        onSetPTXHomePos(namespace, Number(panElement.value), Number(tiltElement.value))
        this.setState({panHomePosEdited:null, tiltHomePosEdited:null})
      }
      else if ((e.target.id === "PTXPanSoftStopMin") || (e.target.id === "PTXPanSoftStopMax") ||
               (e.target.id === "PTXTiltSoftStopMin") || (e.target.id === "PTXTiltSoftStopMax"))
      {
        panMinElement = document.getElementById("PTXPanSoftStopMin")
        clearElementStyleModified(panMinElement)

        panMaxElement = document.getElementById("PTXPanSoftStopMax")
        clearElementStyleModified(panMaxElement)

        tiltMinElement = document.getElementById("PTXTiltSoftStopMin")
        clearElementStyleModified(tiltMinElement)

        tiltMaxElement = document.getElementById("PTXTiltSoftStopMax")
        clearElementStyleModified(tiltMaxElement)

        onSetPTXSoftStopPos(namespace, Number(panMinElement.value), Number(panMaxElement.value), 
                            Number(tiltMinElement.value), Number(tiltMaxElement.value))
        this.setState({panMaxSoftstopEdited: null, panMinSoftstopEdited: null, tiltMaxSoftstopEdited: null, tiltMinSoftstopEdited: null})
      }
      else if (e.target.id === "PTXPanGoto") 
        {
          panElement = document.getElementById("PTXPanGoto")
          tiltElement = document.getElementById("PTXTiltGoto")
          clearElementStyleModified(panElement)
                        
          if (has_sep_pan_tilt === true){
            onSetPTXGotoPanPos(namespace, Number(panElement.value))
          }
          else {
            onSetPTXGotoPos(namespace, Number(panElement.value),Number(tiltElement.value))
          }
          
        }
        else if  (e.target.id === "PTXTiltGoto")
          {
            
            panElement = document.getElementById("PTXPanGoto")
            tiltElement = document.getElementById("PTXTiltGoto")
            clearElementStyleModified(tiltElement)
            if (has_sep_pan_tilt === true){
              onSetPTXGotoTiltPos(namespace, Number(tiltElement.value))
            }
            else {
              onSetPTXGotoPos(namespace, Number(panElement.value),Number(tiltElement.value))
            }                    
            
          }

    }
  }

  // Add the missing toggle method
  onClickToggleShowTransform() {
    this.setState({ showTransform: !this.state.showTransform })
  }

  // Function for creating image topic options.
  createImageTopicsOptions() {
    var items = []
    items.push(<Option>{"None"}</Option>) 
    const { imageTopics } = this.props.ros
    var imageTopicShortnames = createShortValuesFromNamespaces(imageTopics)
    for (var i = 0; i < imageTopics.length; i++) {
      items.push(<Option value={imageTopics[i]}>{imageTopicShortnames[i]}</Option>)
    }
    return items
  }

  // Handler for Image topic selection
  onImageTopicSelected(event) {
    var ind = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[ind].text
    var value = event.target.value

    this.setState({
      imageTopic: value,
      imageText: text === "None" ? null : text,
    })
  }

  
  // Callback for handling ROS Status3DX messages
  ptxStatusListener(message) {
    const pan_min_ss = this.state.autoPanMin
    const pan_max_ss = this.state.autoPanMax
    const tilt_min_ss = this.state.autoTiltMin
    const tilt_max_ss = this.state.autoTiltMax
    this.setState({
      ptSerialNum: message.serial_num,
      ptHwVersion: message.hw_version,
      ptSwVersion: message.sw_version,
      panNowRatio: message.pan_now_ratio,
      tiltNowRatio: message.tilt_now_ratio,
      panGoalRatio: message.pan_goal_ratio,
      tiltGoalRatio: message.tilt_goal_ratio,
      speedRatio: message.speed_ratio,
      panPositionDeg: message.pan_now_deg,
      tiltPositionDeg: message.tilt_now_deg,
      panHomePosDeg: message.pan_home_pos_deg,
      tiltHomePosDeg: message.tilt_home_pos_deg,
      panMaxHardstopDeg: message.pan_max_hardstop_deg,
      tiltMaxHardstopDeg: message.tilt_max_hardstop_deg,
      panMinHardstopDeg: message.pan_min_hardstop_deg,
      tiltMinHardstopDeg: message.tilt_min_hardstop_deg,
      panMinSoftstopDeg: message.pan_min_softstop_deg,
      panMaxSoftstopDeg: message.pan_max_softstop_deg,
      tiltMinSoftstopDeg: message.tilt_min_softstop_deg,
      tiltMaxSoftstopDeg: message.tilt_max_softstop_deg,
      reversePanEnabled: message.reverse_pan_enabled,
      reverseTiltEnabled: message.reverse_tilt_enabled,
      track_source_namespaces: message.track_source_namespaces,
      track_source_namespace: message.track_source_namespace,
      track_source_connected: message.track_source_connected,
      autoPanEnabled: message.auto_pan_enabled,
      trackPanEnabled: message.track_pan_enabled,
      autoPanMin: message.auto_pan_range_window.start_range,
      autoPanMax: message.auto_pan_range_window.stop_range,
      autoTiltEnabled: message.auto_tilt_enabled,
      trackTiltEnabled: message.track_tilt_enabled,
      autoTiltMin: message.auto_tilt_range_window.start_range,
      autoTiltMax: message.auto_tilt_range_window.stop_range,
      /*
      sinPanEnabled: message.sin_pan_enabled,
      sinTiltEnabled: message.sin_tilt_enabled,
      */
      speed_pan_dps: message.speed_pan_dps,
      speed_tilt_dps: message.speed_tilt_dps,
    })

    const scan_limits_changed = (pan_min_ss !== this.state.autoPanMin || pan_max_ss !== this.state.autoPanMax ||
                              tilt_min_ss !== this.state.autoTiltMin || tilt_max_ss !== this.state.autoTiltMax)
    if (scan_limits_changed === true){
      this.setState({panScanMin: message.auto_pan_range_window.start_range,
                     panScanMax: message.auto_pan_range_window.stop_range
      })
    }
    if (scan_limits_changed === true){
      this.setState({tiltScanMin: message.auto_tilt_range_window.start_range,
                     tiltScanMax: message.auto_tilt_range_window.stop_range
      })
    }
    
  }

    // Function for configuring and subscribing to StatusIDX
    updateListener() {
      const { namespace } = this.props
      if (this.state.listener) {
        this.state.listener.unsubscribe()
      }
      var listener = this.props.ros.setupPTXStatusListener(
        namespace,
        this.ptxStatusListener
      )
      this.setState({ listener: listener, disabled: false })
  
    }
  
    // Lifecycle method called when compnent updates.
    // Used to track changes in the topic
    componentDidUpdate(prevProps, prevState, snapshot) {
      const { namespace } = this.props
      if (prevProps.namespace !== namespace){
        if (namespace !== null) {
          this.updateListener()
        } else if (namespace === null){
          this.setState({ disabled: true })
        }
      }
    }

  // Function for configuring and subscribing to ptx/status
  onptxDeviceselected(event) {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }

    var ind = event.nativeEvent.target.selectedIndex
    var value = event.target.value

    // Handle the "None" option -- always index 0
    if (ind === 0) {
      this.setState({ disabled: true })
      return
    }

    this.setState({ namespace: value })

    var listener = this.props.ros.setupPTXStatusListener(
        value,
        this.ptxStatusListener
      )
      
    this.setState({ namespace: value, listener: listener, disabled: false })
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
    //var unique_names = createShortUniqueValues(filteredTopics)
    var device_name = ""
    for (i = 0; i < filteredTopics.length; i++) {
      device_name = filteredTopics[i].split('/ptx')[0].split('/').pop()
      items.push(<Option value={filteredTopics[i]}>{device_name}</Option>)
    }

    return items
  }

  // (Removed duplicate updateListener/componentDidUpdate block)



  onClickToggleShowSettings(){
    const currentVal = this.state.showSettings 
    this.setState({showSettings: !currentVal})
    this.render()
  }




onEnterSendScanRangeWindowValue(event, topicName, entryName, other_val) {
  const {publishRangeWindow} = this.props.ros
  const namespace = this.props.namespace ? this.props.namespace : 'None'

  const topic_namespace = namespace + topicName
  var min = -60
  var max = 60
  if(event.key === 'Enter'){
    const value = parseFloat(event.target.value)
    if (!isNaN(value)){
      if (entryName === "min"){
        min = value
        max = other_val
      }
      else if (entryName === "max"){
        min = other_val
        max = value
      }
      publishRangeWindow(topic_namespace,min,max,false)
    }
    document.getElementById(event.target.id).style.color = Styles.vars.colors.black
  }
}



  renderControlPanel() {
    const { ptxDevices, sendBoolMsg, onPTXGoHome, onPTXSetHomeHere } = this.props.ros
    
    const { //Unused ptSerialNum, ptHwVersion, ptSwVersion,
            panPositionDeg, tiltPositionDeg, panHomePosDeg, tiltHomePosDeg,
            panMaxHardstopDeg, tiltMaxHardstopDeg, panMinHardstopDeg, tiltMinHardstopDeg,
            panMinHardstopEdited, tiltMinHardstopEdited, panMaxHardstopEdited, tiltMaxHardstopEdited,
            panMaxSoftstopDeg, tiltMaxSoftstopDeg, panMinSoftstopDeg, tiltMinSoftstopDeg,
            panMinSoftstopEdited, tiltMinSoftstopEdited, panMaxSoftstopEdited, tiltMaxSoftstopEdited,
            speedRatio, panHomePosEdited, tiltHomePosEdited,
            reversePanEnabled, reverseTiltEnabled, autoPanEnabled, autoTiltEnabled, trackPanEnabled, trackTiltEnabled, 
            track_source_connected,
            speed_pan_dps, speed_tilt_dps  } = this.state /*sinPanEnabled ,sinTiltEnabled*/

    const namespace = this.props.namespace ? this.props.namespace : 'None'
    //Unused const ptx_id = namespace? namespace.split('/').slice(-1) : "No Pan/Tilt Selected"

    const panPositionDegClean = panPositionDeg + .001
    const tiltPositionDegClean = tiltPositionDeg + .001

    const ptx_caps = ptxDevices[namespace]
    const has_abs_pos = ptx_caps && (ptx_caps.has_absolute_positioning)
    //Unused const has_timed_pos = ptx_caps && (ptx_caps.has_timed_positioning)
    //Unused const has_sep_pan_tilt = ptx_caps && (ptx_caps.has_seperate_pan_tilt_control)
    const has_auto_pan = ptx_caps && (ptx_caps.has_auto_pan)
    const has_auto_tilt = ptx_caps && (ptx_caps.has_auto_tilt)
    const has_speed_control = ptx_caps && (ptx_caps.has_adjustable_speed)
    const has_homing = ptx_caps && (ptx_caps.has_homing)
    //Unused const has_set_home = ptx_caps && (ptx_caps.has_set_home)
    
    const panHomePos = (panHomePosEdited === null)? round(panHomePosDeg, 1) : panHomePosEdited
    const tiltHomePos = (tiltHomePosEdited === null)? round(tiltHomePosDeg, 1) : tiltHomePosEdited

    const panHardStopMin = (panMinHardstopEdited === null)? round(panMinHardstopDeg, 1) : panMinHardstopEdited
    const tiltHardStopMin = (tiltMinHardstopEdited === null)? round(tiltMinHardstopDeg, 1) : tiltMinHardstopEdited
    const panHardStopMax = (panMaxHardstopEdited === null)? round(panMaxHardstopDeg, 1) : panMaxHardstopEdited
    const tiltHardStopMax = (tiltMaxHardstopEdited === null)? round(tiltMaxHardstopDeg, 1) : tiltMaxHardstopEdited


    const panSoftStopMin = (panMinSoftstopEdited === null)? round(panMinSoftstopDeg, 1) : panMinSoftstopEdited
    const tiltSoftStopMin = (tiltMinSoftstopEdited === null)? round(tiltMinSoftstopDeg, 1) : tiltMinSoftstopEdited
    const panSoftStopMax = (panMaxSoftstopEdited === null)? round(panMaxSoftstopDeg, 1) : panMaxSoftstopEdited
    const tiltSoftStopMax = (tiltMaxSoftstopEdited === null)? round(tiltMaxSoftstopDeg, 1) : tiltMaxSoftstopEdited

    const hide_auto_pan = ((has_auto_pan === false ))
    const hide_auto_tilt = ((has_auto_tilt === false ))

    const hide_track_pan = ((track_source_connected === false || hide_auto_pan === true))
    const hide_track_tilt = ((track_source_connected === false || hide_auto_tilt === true))

    //Unused const {sendTriggerMsg} = this.props.ros

    return (
      <React.Fragment>


        <Label title={"PT Auto CONTROLS"} style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Pan"}</div>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Tilt"}</div>
        </Label>

        <Label title={"Enable Auto Scan"}>
        <div hidden={(hide_auto_pan === true)}>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>
            <Toggle style={{justifyContent: "flex-left"}} checked={autoPanEnabled} onClick={() => sendBoolMsg.bind(this)(namespace + "/set_auto_pan_enable",!autoPanEnabled)} />
          </div>
          </div>

          <div hidden={(hide_auto_tilt === true)}>
          <div style={{ display: "inline-block", width: "45%", float: "right" }}>
            <Toggle style={{justifyContent: "flex-right"}} checked={autoTiltEnabled} onClick={() => sendBoolMsg.bind(this)(namespace + "/set_auto_tilt_enable",!autoTiltEnabled)} />
          </div>
          </div>
        </Label>



        <div hidden={(autoPanEnabled === false && autoTiltEnabled === false)}>

            <Label title={"Min Scan Limits"}>

              <Input id="scan_pan_min" 
                  value={this.state.panScanMin} 
                  style={{ width: "45%", float: "left" }}
                  onChange={(event) => onUpdateSetStateValue.bind(this)(event,"panScanMin")} 
                  onKeyDown= {(event) => this.onEnterSendScanRangeWindowValue(event,"/set_auto_pan_window","min",Number(this.state.panScanMax))} />

              <Input id="scan_tilt_min" 
                  value={this.state.tiltScanMin} 
                  style={{ width: "45%" }}
                  onChange={(event) => onUpdateSetStateValue.bind(this)(event,"tiltScanMin")} 
                  onKeyDown= {(event) => this.onEnterSendScanRangeWindowValue(event,"/set_auto_tilt_window","min",Number(this.state.tiltScanMax))} />

              
            </Label>





            <Label title={"Max Scan Limits"}>

              <Input id="scan_pan_max" 
                value={this.state.panScanMax} 
                style={{ width: "45%", float: "left" }}
                onChange={(event) => onUpdateSetStateValue.bind(this)(event,"panScanMax")} 
                onKeyDown= {(event) => this.onEnterSendScanRangeWindowValue(event,"/set_auto_pan_window","max",Number(this.state.panScanMin))} />     


              <Input id="scan_tilt_max" 
                  value={this.state.tiltScanMax} 
                  style={{ width: "45%" }}
                  onChange={(event) => onUpdateSetStateValue.bind(this)(event,"tiltScanMax")} 
                  onKeyDown= {(event) => this.onEnterSendScanRangeWindowValue(event,"/set_auto_tilt_window","max",Number(this.state.tiltScanMin))} />                      
            </Label>

        </div>



        <Label title={"Enable Tracking"}>
        <div hidden={(hide_track_pan === true)}>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>
            <Toggle style={{justifyContent: "flex-left"}} checked={trackPanEnabled} onClick={() => sendBoolMsg.bind(this)(namespace + "/set_track_pan_enable",!trackPanEnabled)} />
          </div>
          </div>

          <div hidden={(hide_track_tilt === true)}>
          <div style={{ display: "inline-block", width: "45%", float: "right" }}>
            <Toggle style={{justifyContent: "flex-right"}} checked={trackTiltEnabled} onClick={() => sendBoolMsg.bind(this)(namespace + "/set_track_tilt_enable",!trackTiltEnabled)} />
          </div>
          </div>
        </Label>



        </React.Fragment>
    )
  }



  render() {
    const { ptxDevices, onPTXJogPan, onPTXJogTilt, onPTXStop } = this.props.ros
    const { panNowRatio, panGoalRatio, tiltNowRatio, tiltGoalRatio} = this.state
    const namespace = (this.state.namespace !== null) ? this.state.namespace : 'None'

    const ptxImageViewerElement = document.getElementById("ptxImageViewer")
    const tiltSliderHeight = (ptxImageViewerElement)? ptxImageViewerElement.offsetHeight : "100px"

    const ptx_caps = ptxDevices[namespace]
    const has_abs_pos = ptx_caps && (ptx_caps.has_absolute_positioning === true)
    const has_timed_pos = ptx_caps && (ptx_caps.has_timed_positioning === true)
    //Unused const show_navpose = this.state.show_navpose
    //Unused const device_selected = (this.state.namespace != null)
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true

    
    if (make_section === false){
    return (
      <React.Fragment>
        <Columns>
          <Column equalWidth = {false} >


                



            { namespace?
              this.renderControlPanel()
              : null


            }

            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
  
          </Column>
        </Columns>

      </React.Fragment>
    )
  }
  else {
    return (
      <Section>
      <Columns>
      <Column equalWidth = {false} >


            



        { namespace?
          this.renderControlPanel()
          : null


        }

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

      </Column>
    </Columns>
    </Section>
    )
  }
}
}
export default NepiDevicePTXControls
