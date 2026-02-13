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
import Styles from "./Styles"

import { SliderAdjustment } from "./AdjustmentWidgets"
import Label from "./Label"
import Input from "./Input"
import Toggle from "react-toggle"
import BooleanIndicator from "./BooleanIndicator"

import NepiIFConfig from "./Nepi_IF_Config"


import {onDropdownSelectedSendStr, createMenuListFromStrList, onChangeSwitchStateValue} from "./Utilities"
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
      show_controls: (this.props.show_controls != undefined) ? this.props.show_controls : false,

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

    this.renderControlData = this.renderControlData.bind(this)
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
      var statusListener = this.props.ros.setupLSXStatusListener(
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


  renderControlData() {

    const lsxTempC = this.state.lsxTempC
    const namespace = this.state.namespace

    const devices = this.props.ros.lsxDevices
    var has_standby_mode = false
    var has_on_off_control = false
    var has_intensity_control = false
    var has_color_control = false
    var color_options_list = ["None"]
    var has_kelvin_control = false
    var kelvin_min = 1000
    var kelvin_max = 100
    var has_blink_control = false
    var has_hw_strobe = false
    var reports_temperature = false
    var reports_power = false
    const devicesList = Object.keys(devices)
    if (devicesList.indexOf(namespace) !== -1){
      const capabilities = devices[namespace]
      has_standby_mode = capabilities.has_standby_mode
      has_on_off_control = capabilities.has_on_off_control
      has_intensity_control = capabilities.has_intensity_control
      has_color_control = capabilities.has_color_control
      color_options_list = capabilities.color_options_list
      has_kelvin_control = capabilities.has_kelvin_control
      kelvin_min = capabilities.kelvin_min
      kelvin_max = capabilities.kelvin_max
      has_blink_control = capabilities.has_blink_control
      has_hw_strobe = capabilities.has_hw_strobe
      reports_temperature = capabilities.reports_temperature
      reports_power = capabilities.reports_power
    }



    return (

 <React.Fragment>
            <div hidden={!has_on_off_control}>    
          <Label title="On_Off State">
            <BooleanIndicator value={this.state.lsxOnOffState===true} />
            </Label>
            </div>

 
            <div hidden={!has_standby_mode}>      
          <Label title="Standby State">
            <BooleanIndicator value={this.state.lsxStandbyState===true} />
                 
            </Label>
            </div>



            <div hidden={!has_intensity_control || this.state.lsxOnOffState===false}>    
              <Label title="Intensity %">
                  <Input 
                    value={round(this.state.lsxIntensityRatio,0)} 
                    disabled
                    />
              </Label>
            </div>


            <div hidden={false}> 
            <div hidden={!has_color_control}>    
            <Label title={"Color"}>
                    <Input 
                    value={this.state.lsxColorStr} 
                    disabled
                    />
                    </Label>
                    </div>

            <div hidden={!has_blink_control}>    
              <Label title="Blink Interval (ms)">
                  <Input 
                    value={round(this.state.lsxBlinkInterval,0)} 
                    disabled
                    />
              </Label>
          
            </div>
            

          



            <div hidden={!has_kelvin_control}>    
                <Label title={"Kelvin Setting"}>
                      <Input 
                        value={round(this.state.lsxKelvinVal,0)} 
                        disabled
                        />
                    </Label>
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
            <Label title="Strobe Enabled">
              <BooleanIndicator value={this.state.lsxStrobeState===true} />
            
            </Label>
            </div>

        </React.Fragment>
    )
  }

  
  renderControlPanel() {
    const lsxTempC = this.state.lsxTempC
    const NoneOption = <Option>None</Option>
    const namespace = this.state.namespace

    const devices = this.props.ros.lsxDevices
    var has_standby_mode = false
    var has_on_off_control = false
    var has_intensity_control = false
    var has_color_control = false
    var color_options_list = ["None"]
    var has_kelvin_control = false
    var kelvin_min = 1000
    var kelvin_max = 100
    var has_blink_control = false
    var has_hw_strobe = false
    var reports_temperature = false
    var reports_power = false
    const devicesList = Object.keys(devices)
    if (devicesList.indexOf(namespace) !== -1){
      const capabilities = devices[namespace]
      has_standby_mode = capabilities.has_standby_mode
      has_on_off_control = capabilities.has_on_off_control
      has_intensity_control = capabilities.has_intensity_control
      has_color_control = capabilities.has_color_control
      color_options_list = capabilities.color_options_list
      has_kelvin_control = capabilities.has_kelvin_control
      kelvin_min = capabilities.kelvin_min
      kelvin_max = capabilities.kelvin_max
      has_blink_control = capabilities.has_blink_control
      has_hw_strobe = capabilities.has_hw_strobe
      reports_temperature = capabilities.reports_temperature
      reports_power = capabilities.reports_power
    }


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


          <div hidden={!has_hw_strobe}>    
            <Label title="Set Strobe State">
                  <Toggle
                    checked={this.state.lsxStrobeState===true}
                    onClick={() => this.props.ros.sendBoolMsg(namespace + "/set_strobe_enable",!this.state.lsxStrobeState)}>
                  </Toggle>
            </Label>
            </div>

            <NepiIFConfig
                namespace={namespace}
                title={"Nepi_IF_Conig"}
                show_save_all={true}
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

export default NepiControlsLightsControls
