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
//import EnableAdjustment from "./EnableAdjustment"
import Toggle from "react-toggle"
import Label from "./Label"
import Button, { ButtonMenu } from "./Button"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
import Input from "./Input"


@inject("ros")
@observer

// Component that contains the IDX Sensor controls
class NepiSensorsImagingInfo extends Component {
  constructor(props) {
    super(props)

    // these states track the values through IDX Status messages
    this.state = {
      show_advanced_options: false,
      device_name: "",
      serial_num: "",
      hw_version: "",
      sw_version: "",
      identifier: "",

      listener: null,

      disabled: false,
    }

    this.updateListener = this.updateListener.bind(this)
    this.idxStatusListener = this.idxStatusListener.bind(this)

    this.getShowAdvSet = this.getShowAdvSet.bind(this)
    this.getDeviceName = this.getDeviceName.bind(this)
    this.getSerialNum = this.getSerialNum.bind(this)

    this.onUpdateInputDeviceNameValue = this.onUpdateInputDeviceNameValue.bind(this)
    this.onKeySaveInputDeviceNameValue = this.onKeySaveInputDeviceNameValue.bind(this)

    this.updateListener()
  }

  // Callback for handling ROS StatusIDX messages
  idxStatusListener(message) {
    this.setState({
      device_name: message.device_name,
      serial_num: message.serial_num,
      hw_version: message.hw_version,
      sw_version: message.sw_version,
      identifier: message.identifier

    })
  }

  // Function for configuring and subscribing to StatusIDX
  updateListener() {
    const { idxSensorNamespace, title } = this.props
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }

    if (title) {
      var listener = this.props.ros.setupIDXStatusListener(
        idxSensorNamespace,
        this.idxStatusListener
      )
      this.setState({ listener: listener, disabled: false })
    } else {
      this.setState({ disabled: true })
    }
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { idxSensorNamespace } = this.props
    if (prevProps.idxSensorNamespace !== idxSensorNamespace) {
      this.updateListener()
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to StatusIDX message
  componentWillUnmount() {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
  }

  getShowAdvSet() {
    const show = this.state.show_advanced_options
    return show
  }


  getDeviceName() {
    const device_name = this.state.device_name
    return device_name
  }

  getSerialNum() {
    const serial_num = this.state.serial_num
    return serial_num
  }

  onUpdateInputDeviceNameValue(event) {
    this.setState({ device_name: event.target.value })
    document.getElementById("input_device_name").style.color = Styles.vars.colors.red
    this.render()
  }

  onKeySaveInputDeviceNameValue(event) {
    const {updateIdxDeviceName}  = this.props.ros
    const BAD_NAME_CHAR_LIST = [" ","/","'","-","$","#"]
    if(event.key === 'Enter'){
      const value = event.target.value
      var good_name = true
      for(let ind = 0; ind < BAD_NAME_CHAR_LIST.length; ind++) {
        if (value.indexOf(BAD_NAME_CHAR_LIST[ind]) !== -1){
          good_name = false
        }
      }
      if (good_name === true){
        updateIdxDeviceName(this.props.idxSensorNamespace,value)
      }
      document.getElementById("input_device_name").style.color = Styles.vars.colors.black
    }
  }


  render() {
    const {resetIdxDeviceNameTriggered} = this.props.ros
    return (
      <Section title={"Sensor Info"}>
        <Columns>

          <Column>
            <div align={"left"} textAlign={"center"}>
              <Label title={"Device_Name"}>
                <Input disabled value={this.getDeviceName()} />
              </Label>
            </div>
          </Column>
          <Column>
          </Column>
          <Column>

            <div align={"left"} textAlign={"center"}>
              <Label title={"Show Advanced Options"}>
                <Toggle
                  checked={this.getShowAdvSet() === true}
                  onClick={() => {this.setState({show_advanced_options:this.getShowAdvSet() === false})}}
                />
              </Label>
            </div>

            <div align={"left"} textAlign={"left"}  hidden={!this.state.show_advanced_options}>


            <Label title={"Update Device Name"}>
            <Input id="input_device_name" 
                value={this.state.device_name} 
                onChange={this.onUpdateInputDeviceNameValue} 
                onKeyDown= {this.onKeySaveInputDeviceNameValue} />
            </Label>
              <ButtonMenu>
                <Button onClick={() => resetIdxDeviceNameTriggered(this.props.idxSensorNamespace)}>{"Reset Device Name"}</Button>
              </ButtonMenu>
            </div>

          </Column>

        </Columns>
      </Section>
    )
  }

}
export default NepiSensorsImagingInfo
