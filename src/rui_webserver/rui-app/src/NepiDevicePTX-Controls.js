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

import NepiIFConfig from "./Nepi_IF_Config"

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
      
      namespace : null,

      panHomePos : null,
      tiltHomePos : null,
      panHardStopMin : null,
      tiltHardStopMin : null,
      panHardStopMax : null,
      tiltHardStopMax : null,
      tiltSoftStopMin : null,
      panSoftStopMax : null,
      tiltSoftStopMax : null,
            
      statusListener: null,
      status_msg: null,  
    }


    this.onUpdateText = this.onUpdateText.bind(this)
    this.onKeyText = this.onKeyText.bind(this)
    this.createImageTopicsOptions = this.createImageTopicsOptions.bind(this)
    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
    this.onptxDeviceselected = this.onptxDeviceselected.bind(this)

    this.renderControlPanel = this.renderControlPanel.bind(this)
    this.createPTXOptions = this.createPTXOptions.bind(this)
    this.onClickToggleShowSettings = this.onClickToggleShowSettings.bind(this)
    this.onClickToggleShowTransform = this.onClickToggleShowTransform.bind(this)

    this.onEnterSendScanRangeWindowValue = this.onEnterSendScanRangeWindowValue.bind(this)

    this.getNamespace = this.getNamespace.bind(this)
    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)
  }


  getNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var namespace = null
    if (namespacePrefix !== null && deviceId !== null){
      if (this.props.namespace != undefined){
        namespace = this.props.namespace
      }
      else{
        namespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.appName
      }
    }
    return namespace
  }

  // Callback for handling ROS Status3DX messages
  statusListener(message) {
    this.setState({
      status_msg: message
    })


    const panHomePos = round(message.pan_home_pos_deg, 1)
    const tiltHomePos = round(message.tilt_home_pos_deg, 1)
    const panHardStopMin = round(message.pan_max_hardstop_deg, 1)
    const tiltHardStopMin = round(message.tilt_max_hardstop_deg, 1)
    const panHardStopMax = round(message.pan_min_hardstop_deg, 1)
    const tiltHardStopMax = round(message.tilt_min_hardstop_deg, 1)
    const tiltSoftStopMin = round(message.pan_min_softstop_deg, 1)
    const panSoftStopMax = round(message.pan_max_softstop_deg, 1)
    const tiltSoftStopMax = round(message.tilt_min_softstop_deg, 1)
    
    const needs_update = (
          panHomePos !== this.state.panHomePos ||
          tiltHomePos !== this.state.tiltHomePos ||
          panHardStopMin !== this.state.panHardStopMin ||
          tiltHardStopMin !== this.state.tiltHardStopMin ||
          panHardStopMax !== this.state.panHardStopMax ||
          tiltHardStopMax !== this.state.tiltHardStopMax ||
          tiltSoftStopMin !== this.state.tiltSoftStopMin ||
          panSoftStopMax !== this.state.panSoftStopMax ||
          tiltSoftStopMax !== this.state.tiltSoftStopMax
    )
    if (needs_update === true){
      this.setState({  
          panHomePos : null,
          tiltHomePos : tiltHomePos,
          panHardStopMin : panHardStopMin,
          tiltHardStopMin : tiltHardStopMin,
          panHardStopMax : panHardStopMax,
          tiltHardStopMax : tiltHardStopMax,
          tiltSoftStopMin : tiltSoftStopMin,
          panSoftStopMax : panSoftStopMax,
          tiltSoftStopMax : tiltSoftStopMax
      })
    }

  }
  
  // Function for configuring and subscribing to Status
  updateStatusListener(namespace) {
    const statusNamespace = namespace + '/status'
    if (this.state.statusListner) {
      this.state.statusListner.unsubscribe()
      this.setState({status_msg: null,
                    panHomePos : null,
                    tiltHomePos : null,
                    panHardStopMin : null,
                    tiltHardStopMin : null,
                    panHardStopMax : null,
                    tiltHardStopMax : null,
                    tiltSoftStopMin : null,
                    panSoftStopMax : null,
                    tiltSoftStopMax : null
      })
    }
    if (namespace != null && namespace !== 'None' && namespace.indexOf('null') === -1){
        var statusListner = this.props.ros.setupStatusListener(
              statusNamespace,
              "nepi_app_pan_tilt_auto/PanTiltAutoAppStatus",
              this.statusListner
            )
    }
    this.setState({ 
      namespace: namespace,
      statusListner: statusListner,
    })

}
  
// Lifecycle method called when compnent updates.
// Used to track changes in the topic
componentDidUpdate(prevProps, prevState, snapshot) {
  const namespace = this.getNamespace()
  const namespace_updated = (this.state.namespace !== namespace && namespace !== null)
  if (namespace_updated) {
    if (namespace != null){
      this.updateStatusListener(namespace)
    } 
  }
}

componentDidMount(){
  this.setState({needs_update: true})
}
  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status3DX message



  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status3DX message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
      this.setState({statusListener : null})
    }
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

    }
    else if (e.target.id === "PTXPanGoto") 
      {
        panElement = document.getElementById("PTXPanGoto")
        setElementStyleModified(panElement)
             
      }
        
    else if  (e.target.id === "PTXTiltGoto")
        {
          tiltElement = document.getElementById("PTXTiltGoto")
          setElementStyleModified(tiltElement)
                           
          
        }

  }

  onKeyText(e) {
    const {ptxDevices, onSetPTXGotoPos, onSetPTXGotoPanPos, onSetPTXGotoTiltPos, onSetPTXHomePos, onSetPTXSoftStopPos, onSetPTXHardStopPos} = this.props.ros
    const namespace = (this.props.namespace != undefined) ? this.props.namespace : 'None'

    const ptxDevicesList = Object.keys(ptxDevices)
    var has_sep_pan_tilt = false
    if (ptxDevicesList.indexOf(namespace) !== -1){
      const ptx_caps = ptxDevices[namespace]
      has_sep_pan_tilt = ptx_caps && (ptx_caps.has_sep_pan_tilt === true)
    }
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
    const namespace = this.props.namespace ? this.props.namespace : 'None'
    const status_msg = this.state.status_msg

    if (namespace !== 'None' && status_msg == null){
      return (
        <Columns>
          <Column>
          
        </Column>
      </Columns>

      )

    }
    else {



          const ptxDevicesList = Object.keys(ptxDevices)
          var has_abs_pos = false
          var has_timed_pos = false
          var has_speed_control = false
          var has_homing = false
          //Unused var has_set_home =
          if (ptxDevicesList.indexOf(namespace) !== -1){
            const ptx_caps = ptxDevices[namespace]
            has_abs_pos = ptx_caps && (ptx_caps.has_absolute_positioning === true)
            has_timed_pos = ptx_caps && (ptx_caps.has_timed_positioning === true)
            has_speed_control = ptx_caps && (ptx_caps.has_adjustable_speed)
            has_homing = ptx_caps && (ptx_caps.has_homing)
            //Unused has_set_home = ptx_caps && (ptx_caps.has_set_home)
          }

          const reversePanEnabled = status_msg.reverse_pan_enabled
          const reverseTiltEnabled = status_msg.reverse_tilt_enabled

          const speedRatio = status_msg.speed_ratio
          const panPosition = status_msg.pan_now_deg
          const tiltPosition = status_msg.tilt_now_deg

          const speed_pan_dps = status_msg.speed_pan_dps
          const speed_tilt_dps = status_msg.speed_tilt_dps


          const panPositionClean = panPosition + .001
          const tiltPositionClean = tiltPosition + .001


   
          const panHomePos = this.state.panHomePos
          const tiltHomePos = this.state.tiltHomePos
          const panHardStopMin = this.state.panHardStopMin
          const tiltHardStopMin = this.state.tiltHardStopMin
          const panHardStopMax = this.state.panHardStopMax
          const tiltHardStopMax = this.state.tiltHardStopMax
          const panSoftStopMin = this.state.panSoftStopMin
          const tiltSoftStopMin = this.state.tiltSoftStopMin
          const panSoftStopMax = this.state.panSoftStopMax
          const tiltSoftStopMax = this.state.tiltSoftStopMax   


          return (
            <React.Fragment>

              <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                {"PT STATE - Angles in ENU frame (Tilt+:Down , Pan+:Left)"}
              </label>



              <Label title={""}>
                <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Pan"}</div>
                <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Tilt"}</div>
              </Label>



              <div hidden={(has_abs_pos === false)}>

                  <Label title={"Present Position"}>
                    <Input
                      disabled
                      style={{ width: "45%", float: "left" }}
                      value={round(panPositionClean, 2)}
                    />
                    <Input
                      disabled
                      style={{ width: "45%" }}
                      value={round(tiltPositionClean, 2)}
                    />
                  </Label>


                  <Label title={"Current Speed"}>
                    <Input
                      disabled
                      style={{ width: "45%", float: "left" }}
                      value={round(speed_pan_dps, 0)}
                    />
                    <Input
                      disabled
                      style={{ width: "45%" }}
                      value={round(speed_tilt_dps, 0)}
                    />
                  </Label>

                </div>

              <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>


              <Label title={"PT CONTROLS"} style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Pan"}</div>
                <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Tilt"}</div>
              </Label>






                <div hidden={(has_abs_pos === false)}>

                  <Label title={"GoTo Position "}>
                    <Input
                      disabled={!has_abs_pos}
                      id={"PTXPanGoto"}
                      style={{ width: "45%", float: "left" }}
                      value={this.state.panGoto}
                      onChange= {this.onUpdateText}
                      onKeyDown= {this.onKeyText}
                    />
                    <Input
                      disabled={!has_abs_pos}
                      id={"PTXTiltGoto"}
                      style={{ width: "45%" }}
                      value={this.state.tiltGoto}
                      onChange= {this.onUpdateText}
                      onKeyDown= {this.onKeyText}
                    />
                  </Label>

              </div>

              <div hidden={(has_homing === false)}>

              <ButtonMenu>
                <Button disabled={!has_homing} onClick={() => onPTXGoHome(namespace)}>{"Go Home"}</Button>
              </ButtonMenu>

            </div>

              <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>



              <Columns>
                <Column>

                  <Label title="PT SETUP">
                          <Toggle
                            checked={this.state.showSettings===true}
                            onClick={this.onClickToggleShowSettings}>
                          </Toggle>
                        </Label>


                  
                </Column>
                <Column>
      

                </Column>
              </Columns>


              <div hidden={(this.state.showSettings === false)}>


                        <Label title={""}>
                          <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Pan"}</div>
                          <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Tilt"}</div>
                        </Label>

                          <Label title={"Reverse Control"}>
                            <div style={{ display: "inline-block", width: "45%", float: "left" }}>
                              <Toggle style={{justifyContent: "flex-left"}} checked={reversePanEnabled} onClick={() => sendBoolMsg.bind(this)(namespace + "/set_reverse_pan_enable",!reversePanEnabled)} />
                            </div>
                            <div style={{ display: "inline-block", width: "45%", float: "right" }}>
                              <Toggle style={{justifyContent: "flex-right"}} checked={reverseTiltEnabled} onClick={() => sendBoolMsg.bind(this)(namespace + "/set_reverse_tilt_enable",!reverseTiltEnabled)} />
                            </div>
                          </Label>


                        <div hidden={(has_speed_control === false)}>

                        <SliderAdjustment
                          disabled={!has_speed_control}
                          title={"Speed"}
                          msgType={"std_msgs/Float32"}
                          adjustment={speedRatio}
                          topic={namespace + "/set_speed_ratio"}
                          scaled={0.01}
                          min={0}
                          max={100}
                          tooltip={"Speed as a percentage (0%=min, 100%=max)"}
                          unit={"%"}
                        />

                        </div>






                        <div hidden={(has_abs_pos === false)}>

                                <Label title={"Hard Limit Min"}>
                                  <Input
                                    disabled={true}
                                    id={"PTXPanHardStopMin"}
                                    style={{ width: "45%", float: "left" }}
                                    value={panHardStopMin}
                                  />
                                  <Input
                                    disabled={true}
                                    id={"PTXTiltHardStopMin"}
                                    style={{ width: "45%" }}
                                    value={tiltHardStopMin}
                                  />
                                </Label>

                                <Label title={"Hard Limit Max"}>
                                  <Input
                                    disabled={true}
                                    id={"PTXPanHardStopMax"}
                                    style={{ width: "45%", float: "left" }}
                                    value={panHardStopMax}
                                  />
                                  <Input
                                    disabled={true}
                                    id={"PTXTiltHardStopMax"}
                                    style={{ width: "45%" }}
                                    value={tiltHardStopMax}
                                  />
                                </Label>


                                <Label title={"Soft Limit Min"}>
                                  <Input
                                    disabled={!has_abs_pos}
                                    id={"PTXPanSoftStopMin"}
                                    style={{ width: "45%", float: "left" }}
                                    value={panSoftStopMin}
                                    onChange= {this.onUpdateText}
                                    onKeyDown= {this.onKeyText}
                                  />
                                  <Input
                                    disabled={!has_abs_pos}
                                    id={"PTXTiltSoftStopMin"}
                                    style={{ width: "45%" }}
                                    value={tiltSoftStopMin}
                                    onChange= {this.onUpdateText}
                                    onKeyDown= {this.onKeyText}
                                  />
                                </Label>
                                <Label title={"Soft Limit Max"}>
                                  <Input
                                    disabled={!has_abs_pos}
                                    id={"PTXPanSoftStopMax"}
                                    style={{ width: "45%", float: "left" }}
                                    value={panSoftStopMax}
                                    onChange= {this.onUpdateText}
                                    onKeyDown= {this.onKeyText}
                                  />
                                  <Input
                                    disabled={!has_abs_pos}
                                    id={"PTXTiltSoftStopMax"}
                                    style={{ width: "45%" }}
                                    value={tiltSoftStopMax}
                                    onChange= {this.onUpdateText}
                                    onKeyDown= {this.onKeyText}
                                  />
                                </Label>

                        </div>


                        <div hidden={(has_homing === false)}>

                        <Label title={"Home Position"}>
                          <Input
                            disabled={!has_homing}
                            id={"PTXPanHomePos"}
                            style={{ width: "45%", float: "left" }}
                            value={panHomePos}
                            onChange= {this.onUpdateText}
                            onKeyDown= {this.onKeyText}
                          />
                          <Input
                            disabled={!has_homing}
                            id={"PTXTiltHomePos"}
                            style={{ width: "45%" }}
                            value={tiltHomePos}
                            onChange= {this.onUpdateText}
                            onKeyDown= {this.onKeyText}
                          />
                        </Label>


                        <ButtonMenu>
                          <Button disabled={!has_homing} onClick={() => onPTXSetHomeHere(namespace)}>{"Set Home Here"}</Button>
                        </ButtonMenu>

                      </div>


                      <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                            <NepiIFConfig
                                namespace={namespace}
                                title={"Nepi_IF_Conig"}
                          />



                  </div>


                  </React.Fragment>
          )
        }
  }


  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const status_msg = this.state.status_msg
    if (status_msg == null){
      return (
        <Columns>
        <Column>
       
        </Column>
        </Columns>
      )


    }
    else if (make_section === false){

      return (

          <Columns>
            <Column >

              { this.renderControlPanel()}

            </Column>
          </Columns>
      )
    }
    else {
      return (

          <Section title={(this.props.title != undefined) ? this.props.title : ""}>


              {this.renderControlPanel()}

        </Section>
     )
    }
  }
}

export default NepiDevicePTXControls
