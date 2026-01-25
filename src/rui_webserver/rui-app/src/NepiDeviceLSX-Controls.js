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

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Select, { Option } from "./Select"

import { SliderAdjustment } from "./AdjustmentWidgets"
import Label from "./Label"
import Input from "./Input"
import Toggle from "react-toggle"

import ImageViewerSelector from "./NepiSelectorImageViewer"
import NepiIFSettings from "./Nepi_IF_Settings"
import NepiIFConfig from "./Nepi_IF_Config"
import NepiSystemMessages from "./Nepi_IF_Messages"


import {onDropdownSelectedSendStr, createMenuListFromStrList} from "./Utilities"
//import {createShortValuesFromNamespaces} from "./Utilities"

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer

// Component that contains the LSX controls
class NepiControlsLightsControls extends Component {
  constructor(props) {

    super(props)

    // these states track the values through IDX Status messages
    this.state = {

      namespace: 'None',
      status_msg: null,

      show_controls: false,

      lxsIdentifier: null,
      lsxSerialNum: null,
      lsxHwVersion: null,
      lsxSwVersion: null,
      lsxDeviceName: null,

      lxsUserName: null,
      
      lsxStandbyState: false,
      lsxOnOffState: false,
      lsxBlinkState: false,
      lsxStrobeState: false,


      lsxBlinkInterval: 1,
      lsxIntensityRatio: 0,


      lsxColorStr: "None",
      lsxKelvinVal: null,
      lsxTempC: null,
      lsxPowerW: null,

      statusListener: null,

    }

    this.renderControlPanel = this.renderControlPanel.bind(this)

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

    
  }

  // Callback for handling ROS StatusIDX messages
  statusListener(message) {
    const last_msg = this.state.status_msg
    this.setState({
      status_msg: message,
      lsxSerialNum: message.serial_num,
      lsxHwVersion: message.hw_version,
      lsxSwVersion: message.sw_version,

      lsxDeviceName: message.user_name ,
      
      lsxStandbyState: message.standby_state ,
      lsxOnOffState: message.on_off_state ,
      lsxIntensityRatio: message.intensity_ratio ,
      lsxBlinkState: message.blink_state ,
      lsxBlinkInterval: message.blink_interval ,
      lsxKelvinVal: message.kelvin_setting ,
      lsxStrobeState: message.strobe_state ,

      lsxColorStr: message.color_setting,
      lsxTempC: message.temp_c ,
      lsxPowerW: message.power_w ,

      lxsIdentifier: message.identifier,
      lxsUserName: message.user_name,
    })

  }

  // Function for configuring and subscribing to StatusIDX
  updateStatusListener() {
    const { namespace } = this.props
    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
      this.setState({ status_msg: null, statusListener: null})
    }
    if (namespace !== 'None'){
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
    if (namespace !== prevState.namespace){
      if (namespace !== null) {
        this.updateStatusListener()
      } 
    }
  }

  componentDidMount() {
    this.updateStatusListener()
    }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to StatusIDX message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
  }


  
  renderControlPanel() {
    const { lsxDevices } = this.props.ros
    const lsxTempC = this.state.lsxTempC
    const namespace = this.state.namespace

    const lsx_caps = lsxDevices[namespace]
    const has_standby_mode = lsx_caps && (lsx_caps['has_standby_mode'] === true)
    const has_on_off_control = lsx_caps && (lsx_caps['has_on_off_control'] === true)
    const has_intensity_control = lsx_caps && (lsx_caps['has_intensity_control'] === true)
    const has_color_control = lsx_caps && (lsx_caps['has_color_control'] === true)
    const color_options_list = lsx_caps ?  lsx_caps['color_options_list'] : ["None"]
    const has_kelvin_control = lsx_caps && (lsx_caps['has_kelvin_control'] === true)
    const kelvin_min = lsx_caps ? lsx_caps['kelvin_min'] : 1000
    const kelvin_max = lsx_caps ? lsx_caps['kelvin_max'] : 100
    const has_blink_control = lsx_caps && (lsx_caps['has_blink_control'] === true)
    const has_hw_strobe = lsx_caps && (lsx_caps['has_hw_strobe'] === true)
    const reports_temperature = lsx_caps && (lsx_caps['reports_temperature'] === true)
    const reports_power = lsx_caps && (lsx_caps['reports_power'] === true)
    const NoneOption = <Option>None</Option>



    return (

 <React.Fragment>
            <div hidden={!has_on_off_control}>    
          <Label title="Set On_Off State">
                  <Toggle
                    checked={this.state.lsxOnOffState===true}
                    onClick={() => this.props.ros.sendBoolMsg(namespace + "/turn_on_off",!this.state.lsxOnOffState)}>
                  </Toggle>
            </Label>
            </div>

 
            <div hidden={!has_standby_mode}>      
          <Label title="Set Standby State">
                  <Toggle
                    checked={this.state.lsxStandbyState===true}
                    onClick={() => this.props.ros.sendBoolMsg(namespace + "/set_standby",!this.state.lsxStandbyState)}>
                  </Toggle>
            </Label>
            </div>



            <div hidden={!has_intensity_control || this.state.lsxOnOffState===false}>    
                <SliderAdjustment
                    title={"Intensity ratio"}
                    msgType={"std_msgs/Float32"}
                    adjustment={this.state.lsxIntensityRatio}
                    topic={namespace + "/set_intensity_ratio"}
                    scaled={.01}
                    min={0}
                    max={100}
                    tooltip={"Speed as a percentage (0%=min, 100%=max)"}
                    unit={"%"}
                  />
            </div>


            <div hidden={false}> 
            <div hidden={!has_color_control}>    
            <Label title={"Select Color"}>
                    <Select
                      id="select_color"
                        onChange={(event) => onDropdownSelectedSendStr.bind(this)(event,namespace + "/set_color")}
                        value={this.state.lsxColorStr}
                      >
                        {this.state.lsxColorStr
                          ? createMenuListFromStrList(color_options_list, false, [],[],[])
                          : NoneOption}
                      </Select>
                    </Label>
                    </div>

            <div hidden={!has_blink_control}>    

            <SliderAdjustment
                    title={"Blink Interval (ms)"}
                    msgType={"std_msgs/Float32"}
                    adjustment={this.state.lsxBlinkInterval}
                    topic={namespace + "/set_blink_interval"}
                    scaled={.01}
                    min={25}
                    max={200}
                    tooltip={""}
                    unit={"ms"}
                  />
            </div>
            

{/*
            <Label title={"Kelvin Setting"}>
                  <Input id="blink_interval" 
                    value={this.state.lsxKelvinVal} 
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event,"lsxKelvinVal")} 
                    onKeyDown= {(event) => onEnterSendIntValue.bind(this)(event,namespace + "/set_kelvin")} />
                </Label>

                disabled={!has_intensity_control}
*/}                



            <div hidden={!has_kelvin_control}>    
                  <SliderAdjustment
                    title={"Kelvin Setting"}
                    msgType={"std_msgs/Int32"}
                    adjustment={this.state.lsxKelvinVal}
                    topic={namespace + "/set_kelvin"}
                    scaled={1}
                    min={kelvin_min}
                    max={kelvin_max}
                    tooltip={"Speed as a percentage (0%=min, 100%=max)"}
                    unit={"K"}
                  />
            </div>


            <div hidden={!reports_temperature}>    
                  <Label title={"Temperature C"}>
                    <Input
                      disabled
                      value={round(lsxTempC, 1)}  />
                  </Label>
                  </div>

                  <div hidden={!reports_power}>    
             <Label title={"Power"}>
                    <Input
                      disabled
                      value={round(this.state.lsxPowerW, 1)}  />
                  </Label>
                  </div>

          </div>

          <div hidden={!has_hw_strobe}>    
            <Label title="Set Strobe State">
                  <Toggle
                    checked={this.state.lsxStrobeState===true}
                    onClick={() => this.props.ros.sendBoolMsg(namespace + "/set_strobe_enable",!this.state.lsxStrobeState)}>
                  </Toggle>
            </Label>
            </div>


        </React.Fragment>
    )
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

export default NepiControlsLightsControls
