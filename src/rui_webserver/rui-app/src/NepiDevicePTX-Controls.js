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
//import BooleanIndicator from "./BooleanIndicator"

import {setElementStyleModified, clearElementStyleModified, onChangeSwitchStateValue} from "./Utilities"
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
      status_msg: null,
      show_controls: (this.props.show_controls != undefined) ? this.props.show_controls : false,

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
  
    }


    this.onUpdateText = this.onUpdateText.bind(this)
    this.onKeyText = this.onKeyText.bind(this)

    this.renderControlData = this.renderControlData.bind(this)
    this.renderControlPanel = this.renderControlPanel.bind(this)

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)
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
    const panSoftStopMin = round(message.pan_min_softstop_deg, 1)
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
          panSoftStopMin !== this.state.panSoftStopMin ||
          tiltSoftStopMin !== this.state.tiltSoftStopMin ||
          panSoftStopMax !== this.state.panSoftStopMax ||
          tiltSoftStopMax !== this.state.tiltSoftStopMax
    )
    if (needs_update === true){
      this.setState({  
          panHomePos : panHomePos,
          tiltHomePos : tiltHomePos,
          panHardStopMin : panHardStopMin,
          tiltHardStopMin : tiltHardStopMin,
          panHardStopMax : panHardStopMax,
          tiltHardStopMax : tiltHardStopMax,
          panSoftStopMin : panSoftStopMin,
          tiltSoftStopMin : tiltSoftStopMin,
          panSoftStopMax : panSoftStopMax,
          tiltSoftStopMax : tiltSoftStopMax
      })
    }

  }
  
  // Function for configuring and subscribing to Status
  updateStatusListener() {
    const { namespace } = this.props
    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
       this.setState({ status_msg: null, statusListener: null})
      this.setState({panHomePos : null,
                    tiltHomePos : null,
                    panHardStopMin : null,
                    tiltHardStopMin : null,
                    panHardStopMax : null,
                    tiltHardStopMax : null,
                    tiltSoftStopMin : null,
                    panSoftStopMin : null,
                    panSoftStopMax : null,
                    tiltSoftStopMax : null,
                    statusListener: null
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
  const { namespace } = this.props
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

    const devicesList = Object.keys(ptxDevices)
    var has_sep_pan_tilt = false
    if (devicesList.indexOf(namespace) !== -1){
      const capabilities = ptxDevices[namespace]
      has_sep_pan_tilt = capabilities && (capabilities.has_sep_pan_tilt === true)
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

  

  renderControlData() {
    const { onPTXGoHome,onPTXStop} = this.props.ros
    const namespace = this.props.namespace ? this.props.namespace : 'None'
    const status_msg = this.state.status_msg

    const devices = this.props.ros.ptxDevices
    var has_abs_pos = false
    var has_timed_pos = false
    var has_speed_control = false
    var has_homing = false
    const devicesList = Object.keys(devices)
    if (devicesList.indexOf(namespace) !== -1){
      const capabilities = devices[namespace]
      has_abs_pos = capabilities && (capabilities.has_absolute_positioning === true)
      has_timed_pos = capabilities && (capabilities.has_timed_positioning === true)
      has_speed_control = capabilities && (capabilities.has_adjustable_speed)
      has_homing = capabilities && (capabilities.has_homing)
    }

    const panPosition = status_msg.pan_now_deg
    const tiltPosition = status_msg.tilt_now_deg

    const speed_pan_dps = status_msg.speed_pan_dps
    const speed_tilt_dps = status_msg.speed_tilt_dps


    const panPositionClean = panPosition + .001
    const tiltPositionClean = tiltPosition + .001


      
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


          { (has_homing === false) ?


          <ButtonMenu>
            <Button onClick={() => onPTXStop(namespace)}>{"STOP"}</Button>
          </ButtonMenu>

          :

          <ButtonMenu>
            <Button onClick={() => onPTXStop(namespace)}>{"STOP"}</Button>
            <Button disabled={!has_homing} onClick={() => onPTXGoHome(namespace)}>{"Go Home"}</Button>
          </ButtonMenu>

          }


          <Label title={""} style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
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



      </React.Fragment>
      )

  }


    renderControlPanel() {
    const {sendBoolMsg, onPTXSetHomeHere } = this.props.ros
    const namespace = this.props.namespace ? this.props.namespace : 'None'
    const status_msg = this.state.status_msg

    const devices = this.props.ros.ptxDevices
    var has_abs_pos = false
    var has_timed_pos = false
    var has_speed_control = false
    var has_homing = false
    const devicesList = Object.keys(devices)
    if (devicesList.indexOf(namespace) !== -1){
      const capabilities = devices[namespace]
      has_abs_pos = capabilities && (capabilities.has_absolute_positioning === true)
      has_timed_pos = capabilities && (capabilities.has_timed_positioning === true)
      has_speed_control = capabilities && (capabilities.has_adjustable_speed)
      has_homing = capabilities && (capabilities.has_homing)
    }

    const reversePanEnabled = status_msg.reverse_pan_enabled
    const reverseTiltEnabled = status_msg.reverse_tilt_enabled

    const speedRatio = status_msg.speed_ratio

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



    const never_show_controls = (this.props.never_show_controls != undefined) ? this.props.never_show_controls : false
    const allways_show_controls = (this.props.allways_show_controls != undefined) ? this.props.allways_show_controls : false
    const show_controls = (allways_show_controls === true) ? true : (this.props.show_controls != undefined) ? this.props.show_controls : this.state.show_controls


    if (never_show_controls === true){
              <Columns>
                <Column>

                </Column>
              </Columns>

    }

    else if (show_controls === false){
      return(
              <Columns>
                <Column>

                    <Label title="Show Options">
                        <Toggle
                          checked={show_controls===true}
                          onClick={() => onChangeSwitchStateValue.bind(this)("show_controls",show_controls)}>
                        </Toggle>
                    </Label>

                </Column>
                <Column>

                </Column>
              </Columns>
      )
    }
    else {

      return (
        <React.Fragment>


              <Columns>
                <Column>

                    {(allways_show_controls === false) ?
                    <Label title="Show Controls">
                        <Toggle
                          checked={show_controls===true}
                          onClick={() => onChangeSwitchStateValue.bind(this)("show_controls",show_controls)}>
                        </Toggle>
                    </Label>
                    : null }

                  </Column>
                  <Column>

                  </Column>
                </Columns>

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


      

                            <NepiIFConfig
                                namespace={namespace}
                                title={"Nepi_IF_Conig"}
                          />


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

              { this.renderControlData()}
              { this.renderControlPanel()}

            </Column>
          </Columns>
      )
    }
    else {
      return (

          <Section title={(this.props.title != undefined) ? this.props.title : ""}>


              { this.renderControlData()}
              { this.renderControlPanel()}

        </Section>
     )
    }
  }
}

export default NepiDevicePTXControls
