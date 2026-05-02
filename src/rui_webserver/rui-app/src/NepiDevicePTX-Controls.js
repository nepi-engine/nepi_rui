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
import Select, { Option } from "./Select"
import { Columns, Column } from "./Columns"
import { SliderAdjustment } from "./AdjustmentWidgets"
import Label from "./Label"
import Input from "./Input"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"
//import BooleanIndicator from "./BooleanIndicator"

import {setElementStyleModified, clearElementStyleModified, onChangeSwitchStateValue, round} from "./Utilities"

import NepiIFConfig from "./Nepi_IF_Config"

@inject("ros")
@observer

// Component that contains the PTX controls
class NepiDevicePTXControls extends Component {
  constructor(props) {
    super(props)

    this.state = {
      
      namespace : null,
      status_msg: null,
      show_controls: (this.props.show_controls !== undefined) ? this.props.show_controls : false,
      linkSpeeds: false,

      show_controls: false,

      linkSpeeds: false,
      panHomePos : null,
      tiltHomePos : null,
      panHardStopMin : null,
      tiltHardStopMin : null,
      panHardStopMax : null,
      tiltHardStopMax : null,
      panSoftStopMin : null,
      tiltSoftStopMin : null,
      panSoftStopMax : null,
      tiltSoftStopMax : null,
      moveDecimalPlace : null,
      reportDecimalPlace : null,

      statusListener: null,
  
    }


    this.onUpdateText = this.onUpdateText.bind(this)
    this.onKeyText = this.onKeyText.bind(this)

    this.renderControlPanel = this.renderControlPanel.bind(this)
    this.renderDeviceIF = this.renderDeviceIF.bind(this)
    

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)
  }


  // Callback for handling ROS Status3DX messages
  statusListener(message) {
    const last_status_msg = this.state.status_msg
    this.setState({
      status_msg: message
    })



    const panHomePos = message.pan_home_pos_deg
    const tiltHomePos = message.tilt_home_pos_deg
    const panHardStopMin = message.pan_min_hardstop_deg
    const tiltHardStopMin = message.tilt_min_hardstop_deg
    const panHardStopMax = message.pan_max_hardstop_deg
    const tiltHardStopMax = message.tilt_max_hardstop_deg
    const panSoftStopMin = message.pan_min_softstop_deg
    const tiltSoftStopMin = message.tilt_min_softstop_deg
    const panSoftStopMax = message.pan_max_softstop_deg
    const tiltSoftStopMax = message.tilt_max_softstop_deg
    
    var needs_update = false
    if (last_status_msg == null){
      needs_update = true
    }
    else {
       needs_update = (
          panHomePos !== last_status_msg.pan_home_pos_deg  ||
          tiltHomePos !== last_status_msg.tilt_home_pos_deg  ||
          panHardStopMin !== last_status_msg.pan_min_hardstop_deg  ||
          tiltHardStopMin !== last_status_msg.tilt_min_hardstop_deg  ||
          panHardStopMax !== last_status_msg.pan_max_hardstop_deg  ||
          tiltHardStopMax !== last_status_msg.tilt_max_hardstop_deg  ||
          panSoftStopMin !== last_status_msg.pan_min_softstop_deg  ||
          tiltSoftStopMin !== last_status_msg.tilt_min_softstop_deg  ||
          panSoftStopMax !== last_status_msg.pan_max_softstop_deg  ||
          tiltSoftStopMax !== last_status_msg.tilt_max_softstop_deg  ||
          message.move_decimal_place !== last_status_msg.move_decimal_place  ||
          message.report_decimal_place !== last_status_msg.report_decimal_place
      )
    }
    if (needs_update === true){
      this.setState({
          panHomePos : round(message.pan_home_pos_deg, 1),
          tiltHomePos : round(message.tilt_home_pos_deg, 1),
          panHardStopMin : round(message.pan_min_hardstop_deg, 1),
          tiltHardStopMin : round(message.tilt_min_hardstop_deg, 1),
          panHardStopMax : round(message.pan_max_hardstop_deg, 1),
          tiltHardStopMax : round(message.tilt_max_hardstop_deg, 1),
          panSoftStopMin : round(message.pan_min_softstop_deg, 1),
          tiltSoftStopMin : round(message.tilt_min_softstop_deg, 1),
          panSoftStopMax : round(message.pan_max_softstop_deg, 1),
          tiltSoftStopMax : round(message.tilt_max_softstop_deg, 1),
          moveDecimalPlace : message.move_decimal_place,
          reportDecimalPlace : message.report_decimal_place
      })
    }

  }
  
  // Function for configuring and subscribing to Status
  updateStatusListener() {
    const namespace = (this.props.namespace !== undefined) ? this.props.namespace : null
    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
       this.setState({ status_msg: null, statusListener: null})
      this.setState({panHomePos : null,
                    tiltHomePos : null,
                    panHardStopMin : null,
                    tiltHardStopMin : null,
                    panHardStopMax : null,
                    tiltHardStopMax : null,
                    panSoftStopMin : null,
                    tiltSoftStopMin : null,
                    panSoftStopMax : null,
                    tiltSoftStopMax : null,
                    moveDecimalPlace : null,
                    reportDecimalPlace : null
      })
    }
    if (namespace != null && namespace !== 'None'){
        var statusListener = this.props.ros.setupPTXStatusListener(
              namespace,
              this.statusListener
            )
      this.setState({ statusListener: statusListener})
    }
    this.setState({ namespace: namespace})

}
  
// Lifecycle method called when compnent updates.
// Used to track changes in the topic
componentDidUpdate(prevProps, prevState, snapshot) {
  const namespace = (this.props.namespace !== undefined) ? this.props.namespace : null
   if (namespace !== this.state.namespace){
      this.updateStatusListener()
  }
}

  componentDidMount() {
    this.updateStatusListener()
    }




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
    if ((e.target.id === "PTXPanHomePos") )
    {
      panElement = document.getElementById("PTXPanHomePos")
      setElementStyleModified(panElement)
      this.setState({panHomePos: e.target.value})
    }
    else if ((e.target.id === "PTXTiltHomePos"))
    {      
      tiltElement = document.getElementById("PTXTiltHomePos")
      setElementStyleModified(tiltElement)
      this.setState({tiltHomePos: e.target.value})

    }
    else if ((e.target.id === "PTXPanSoftStopMin"))
    {
      panMinElement = document.getElementById("PTXPanSoftStopMin")
      setElementStyleModified(panMinElement)
      this.setState({panSoftStopMin: e.target.value})
    }
    else if ((e.target.id === "PTXPanSoftStopMax"))
    {
      panMaxElement = document.getElementById("PTXPanSoftStopMax")
      setElementStyleModified(panMaxElement)
      this.setState({panSoftStopMax: e.target.value})
    }
    else if ((e.target.id === "PTXTiltSoftStopMin"))
    {
      tiltMinElement = document.getElementById("PTXTiltSoftStopMin")
      setElementStyleModified(tiltMinElement)
      this.setState({tiltSoftStopMin: e.target.value})
    }
    else if ((e.target.id === "PTXTiltSoftStopMax"))
    {
      tiltMaxElement = document.getElementById("PTXTiltSoftStopMax")
      setElementStyleModified(tiltMaxElement)
      this.setState({tiltSoftStopMax: e.target.value})

    }
    else if (e.target.id === "PTXPanGoto") 
      {
        panElement = document.getElementById("PTXPanGoto")
        setElementStyleModified(panElement)
        this.setState({panGoto: e.target.value})
             
      }
        
    else if  (e.target.id === "PTXTiltGoto")
        {
          tiltElement = document.getElementById("PTXTiltGoto")
          setElementStyleModified(tiltElement)
          this.setState({tiltGoto: e.target.value})         
          
        }

    else if (e.target.id === "PTXPanGoto") 
      {
        panElement = document.getElementById("PTXPanGoto")
        setElementStyleModified(panElement)
        this.setState({panGoto: e.target.value})
             
      }
        
    else if  (e.target.id === "PTXTiltGoto")
        {
          tiltElement = document.getElementById("PTXTiltGoto")
          setElementStyleModified(tiltElement)
          this.setState({tiltGoto: e.target.value})

        }

    else if (e.target.id === "PTXMoveDecimalPlace")
    {
      const el = document.getElementById("PTXMoveDecimalPlace")
      setElementStyleModified(el)
      this.setState({moveDecimalPlace: e.target.value})
    }
    else if (e.target.id === "PTXReportDecimalPlace")
    {
      const el = document.getElementById("PTXReportDecimalPlace")
      setElementStyleModified(el)
      this.setState({reportDecimalPlace: e.target.value})
    }

  }

  onKeyText(e) {
    const {ptxDevices, onSetPTXGotoPos, onSetPTXGotoPanPos, onSetPTXGotoTiltPos, onSetPTXHomePos, onSetPTXSoftStopPos, sendIntMsg} = this.props.ros
    const namespace = (this.props.namespace !== undefined) ? this.props.namespace : 'None'

    const devicesList = Object.keys(ptxDevices)
    var has_sep_pan_tilt = false
    if (devicesList.indexOf(namespace) !== -1){
      const capabilities = ptxDevices[namespace]
      has_sep_pan_tilt = capabilities && (capabilities.has_seperate_pan_tilt_control === true)
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
        if (has_sep_pan_tilt === true){
          onSetPTXGotoPanPos(namespace, Number(panElement.value))
        }
        else {
          onSetPTXGotoPos(namespace, Number(panElement.value),Number(tiltElement.value))
        }            
        clearElementStyleModified(panElement)   
        this.setState({panGoto: null})    
        
      }
      else if  (e.target.id === "PTXTiltGoto")
        {
          
          panElement = document.getElementById("PTXPanGoto")
          tiltElement = document.getElementById("PTXTiltGoto")

          if (has_sep_pan_tilt === true){
            onSetPTXGotoTiltPos(namespace, Number(tiltElement.value))
          }
          else {
            onSetPTXGotoPos(namespace, Number(panElement.value),Number(tiltElement.value))
          }              
          clearElementStyleModified(tiltElement)
          this.setState({tiltGoto: null})      
          
        }

      else if (e.target.id === "PTXPanGoto") 
      {
        panElement = document.getElementById("PTXPanGoto")
        tiltElement = document.getElementById("PTXTiltGoto")                    
        if (has_sep_pan_tilt === true){
          onSetPTXGotoPanPos(namespace, Number(panElement.value))
        }
        else {
          onSetPTXGotoPos(namespace, Number(panElement.value),Number(tiltElement.value))
        }            
        clearElementStyleModified(panElement)   
        this.setState({panGoto: null})    
        
      }
      else if  (e.target.id === "PTXTiltGoto")
        {

          panElement = document.getElementById("PTXPanGoto")
          tiltElement = document.getElementById("PTXTiltGoto")

          if (has_sep_pan_tilt === true){
            onSetPTXGotoTiltPos(namespace, Number(tiltElement.value))
          }
          else {
            onSetPTXGotoPos(namespace, Number(panElement.value),Number(tiltElement.value))
          }
          clearElementStyleModified(tiltElement)
          this.setState({tiltGoto: null})

        }

      else if (e.target.id === "PTXMoveDecimalPlace")
      {
        const el = document.getElementById("PTXMoveDecimalPlace")
        clearElementStyleModified(el)
        sendIntMsg(namespace + "/set_move_decimal_place", Number(el.value))
      }
      else if (e.target.id === "PTXReportDecimalPlace")
      {
        const el = document.getElementById("PTXReportDecimalPlace")
        clearElementStyleModified(el)
        sendIntMsg(namespace + "/set_report_decimal_place", Number(el.value))
      }

    }
  }




  renderControlPanel() {

    const {sendBoolMsg, onPTXSetHomeHere } = this.props.ros
    const namespace = this.props.namespace ? this.props.namespace : 'None'
    const status_msg = this.state.status_msg

    const devices = this.props.ros.ptxDevices
    var has_abs_pos = false
    var has_speed_control = false
    var has_homing = false
    var has_sep_speed = false
    const devicesList = Object.keys(devices)
    if (devicesList.indexOf(namespace) !== -1){
      const capabilities = devices[namespace]
      has_abs_pos = capabilities && (capabilities.has_absolute_positioning === true)
      has_speed_control = capabilities && (capabilities.has_adjustable_speed)
      has_homing = capabilities && (capabilities.has_homing)
      has_sep_speed = capabilities && (capabilities.has_seperate_pan_tilt_speed === true)
    }

    const reversePanEnabled = status_msg.reverse_pan_enabled
    const reverseTiltEnabled = status_msg.reverse_tilt_enabled

    const speedRatio = status_msg.speed_ratio
    const speedPanRatio = status_msg.speed_pan_ratio
    const speedTiltRatio = status_msg.speed_tilt_ratio

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



    const { userRestricted} = this.props.ros
    const device_controls_restricted = userRestricted.indexOf('DEVICE-NPX-CONTROL') !== -1

    const show_controls =  this.state.show_controls



    if ( device_controls_restricted === true){
              <Columns>
                <Column>

                </Column>
              </Columns>

    }

    else {
      return (
        <React.Fragment>


              <Columns>
                <Column>


                    <Label title="Show Controls">
                        <Toggle
                          checked={show_controls===true}
                          onClick={() => onChangeSwitchStateValue.bind(this)("show_controls",show_controls)}>
                        </Toggle>
                    </Label>


                  </Column>
                  <Column>

                  </Column>
                </Columns>



                        <div hidden={(has_speed_control === false)}>

                          {(has_sep_speed === true) ?
                          <Columns>
                            <Column>
                              <Label title="Link Speeds">
                                <Toggle
                                  checked={this.state.linkSpeeds === true}
                                  onClick={() => onChangeSwitchStateValue.bind(this)("linkSpeeds", this.state.linkSpeeds)}>
                                </Toggle>
                              </Label>
                            </Column>
                            <Column></Column>
                          </Columns>
                          : null }

                          {(has_sep_speed === true && this.state.linkSpeeds === false) ? (
                            <React.Fragment>
                              <SliderAdjustment
                                disabled={!has_speed_control}
                                title={"Pan Speed"}
                                msgType={"std_msgs/Float32"}
                                adjustment={speedPanRatio}
                                topic={namespace + "/set_pan_speed_ratio"}
                                scaled={0.01}
                                min={0}
                                max={100}
                                tooltip={"Speed as a percentage (0%=min, 100%=max)"}
                                unit={"%"}
                              />
                              <SliderAdjustment
                                disabled={!has_speed_control}
                                title={"Tilt Speed"}
                                msgType={"std_msgs/Float32"}
                                adjustment={speedTiltRatio}
                                topic={namespace + "/set_tilt_speed_ratio"}
                                scaled={0.01}
                                min={0}
                                max={100}
                                tooltip={"Speed as a percentage (0%=min, 100%=max)"}
                                unit={"%"}
                              />
                            </React.Fragment>
                          ) : (
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
                          )}

                        </div>

                <div hidden={(show_controls===false)}>






                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

   
  
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

                      <Label title={"Move Decimal Place"}>
                        <Input
                          id={"PTXMoveDecimalPlace"}
                          style={{ width: "45%", float: "left" }}
                          value={this.state.moveDecimalPlace}
                          onChange={this.onUpdateText}
                          onKeyDown={this.onKeyText}
                        />
                      </Label>

                      <Label title={"Report Decimal Place"}>
                        <Input
                          id={"PTXReportDecimalPlace"}
                          style={{ width: "45%", float: "left" }}
                          value={this.state.reportDecimalPlace}
                          onChange={this.onUpdateText}
                          onKeyDown={this.onKeyText}
                        />
                      </Label>


                  </div>


          </React.Fragment>
        )
    }
  }

 
  renderDeviceIF() {
    const { onPTXGoHome,onPTXStop} = this.props.ros
    const namespace = (this.props.namespace !== undefined) ? this.props.namespace : null
    const status_msg = this.state.status_msg

    const devices = this.props.ros.ptxDevices
    var has_abs_pos = false
    var has_speed_control = false
    var has_homing = false
    var has_sep_speed = false
    const devicesList = Object.keys(devices)
    if (devicesList.indexOf(namespace) !== -1){
      const capabilities = devices[namespace]
      has_abs_pos = capabilities && (capabilities.has_absolute_positioning === true)
      has_homing = capabilities && (capabilities.has_homing)
      has_speed_control = capabilities && (capabilities.has_adjustable_speed)
      has_sep_speed = capabilities && (capabilities.has_seperate_pan_tilt_speed === true)
    }

     const panPosition = status_msg.pan_now_deg
    const tiltPosition = status_msg.tilt_now_deg

    const panPositionClean = panPosition + .001
    const tiltPositionClean = tiltPosition + .001

    const panMove = status_msg.pan_goal_deg
    const tiltMove = status_msg.tilt_goal_deg

    const panMoveClean = panMove + .001
    const tiltMoveClean = tiltMove + .001


    const speedRatio = status_msg.speed_ratio
    const speedPanRatio = status_msg.speed_pan_ratio
    const speedTiltRatio = status_msg.speed_tilt_ratio

    const speed_pan_dps = status_msg.speed_pan_dps
    const speed_tilt_dps = status_msg.speed_tilt_dps
   
      
      return (
        <React.Fragment>


              {/* <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                {"PT STATE - Angles in ENU frame (Tilt+:Down , Pan+:Left)"}
              </label> */}

          { (has_homing === false) ?


          <ButtonMenu>
            <Button onClick={() => onPTXStop(namespace)}>{"STOP"}</Button>
          </ButtonMenu>

          :

          <ButtonMenu>
            <Button onClick={() => onPTXStop(namespace)}>{"STOP"}</Button>
            <Button disabled={!has_homing} onClick={() => onPTXGoHome(namespace)}>{"GO HOME"}</Button>
          </ButtonMenu>

          }


          <div hidden={(has_abs_pos === false)}>

          <Label title={""} style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Pan"}</div>
            <div style={{ display: "inline-block", width: "45%", float: "left" }}>{"Tilt"}</div>
          </Label>

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


              <Label title={"Current Position"}>
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

              <Label title={"Move Position"}>
                <Input
                  disabled
                  style={{ width: "45%", float: "left" }}
                  value={round(panMoveClean, 2)}
                />
                <Input
                  disabled
                  style={{ width: "45%" }}
                  value={round(tiltMoveClean, 2)}
                />
              </Label>



          </div>



          <div hidden={(has_speed_control === false)}>



            {(has_sep_speed === true && this.state.linkSpeeds === false) ? (
              <React.Fragment>
                <SliderAdjustment
                  disabled={!has_speed_control}
                  title={"Pan Speed"}
                  msgType={"std_msgs/Float32"}
                  adjustment={speedPanRatio}
                  topic={namespace + "/set_pan_speed_ratio"}
                  scaled={0.01}
                  min={0}
                  max={100}
                  tooltip={"Speed as a percentage (0%=min, 100%=max)"}
                  unit={"%"}
                />
                <SliderAdjustment
                  disabled={!has_speed_control}
                  title={"Tilt Speed"}
                  msgType={"std_msgs/Float32"}
                  adjustment={speedTiltRatio}
                  topic={namespace + "/set_tilt_speed_ratio"}
                  scaled={0.01}
                  min={0}
                  max={100}
                  tooltip={"Speed as a percentage (0%=min, 100%=max)"}
                  unit={"%"}
                />
              </React.Fragment>
            ) : (
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
            )}


                {(has_sep_speed === true) ?
                <Columns>

                  <Column>
                  </Column>

                  <Column>
                      <Label title="Link Speeds">
                      <Toggle
                        checked={this.state.linkSpeeds === true}
                        onClick={() => onChangeSwitchStateValue.bind(this)("linkSpeeds", this.state.linkSpeeds)}>
                      </Toggle>
                    </Label>
                  </Column>



                  

                </Columns>
                : null }


          </div>



      </React.Fragment>
      )

  }


  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const namespace = (this.props.namespace !== undefined) ? this.props.namespace : null
    const show_controls = (this.props.show_controls !== undefined) ? this.props.show_controls : true
    const show_config = (this.props.show_config !== undefined) ? this.props.show_config : true
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

    <React.Fragment>

              { (status_msg != null) ? this.renderDeviceIF() : null}
              { (status_msg != null && show_controls === true) ? this.renderControlPanel() : null}
              { (status_msg != null && show_config === true) ?  
                <NepiIFConfig
                namespace={namespace}
                show_save_all={true}
                title={"Nepi_IF_Conig"}
                />
              : null }


    </React.Fragment>
      )
    }
    else {
      return (

          <Section title={(this.props.title !== undefined) ? this.props.title : ""}>

              { (status_msg != null) ? this.renderDeviceIF() : null}
              { (status_msg != null && show_controls === true) ? this.renderControlPanel() : null}
              { (status_msg != null && show_config === true) ?  
                <NepiIFConfig
                namespace={namespace}
                show_save_all={true}
                title={"Nepi_IF_Conig"}
                />
              : null }
        </Section>
     )
    }
  }
}

export default NepiDevicePTXControls
