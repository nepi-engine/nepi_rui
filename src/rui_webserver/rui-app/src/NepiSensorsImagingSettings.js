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
import Button, { ButtonMenu } from "./Button"
import RangeAdjustment from "./RangeAdjustment"
import {RadioButtonAdjustment, SliderAdjustment} from "./AdjustmentWidgets"
import Toggle from "react-toggle"
import Label from "./Label"
import { Column, Columns } from "./Columns"

@inject("ros")
@observer

// Component that contains the IDX Sensor controls
class SensorSettings extends Component {
  constructor(props) {
    super(props)

    // these states track the values through IDX Status messages
    this.state = {
      controlsEnable: null,
      autoAdjust: null,
      resolutionAdjustment: null,
      framerateAdjustment: null,
      contrastAdjustment: null,
      brightnessAdjustment: null,
      thresholdingAdjustment: null,
      rangeMax: null,
      rangeMin: null,
      listener: null,
      frame3D: null,
      show_sensor_settings: false,

      disabled: false,
    }

    this.updateListener = this.updateListener.bind(this)
    this.idxStatusListener = this.idxStatusListener.bind(this)
    this.sendUpdate = this.sendUpdate.bind(this)
    
    this.updateListener()
  }

  // Callback for handling ROS StatusIDX messages
  idxStatusListener(message) {
    this.setState({
      controlsEnable: message.controls_enable,
      autoAdjust: message.auto_adjust,
      resolutionAdjustment: message.resolution_mode,
      framerateAdjustment: message.framerate_mode,
      contrastAdjustment: message.contrast,
      brightnessAdjustment: message.brightness,
      thresholdingAdjustment: message.thresholding,
      rangeMax: message.range_window.stop_range,
      rangeMin: message.range_window.start_range,
      frame3D: message.frame_3d
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

  // Function for sending updated state through rosbridge
  sendUpdate(topic, value, name, throttle = false) {
   this.props.ros.publishAutoManualSelection3DX(
      topic,
      name,
      true,
      value,
      throttle
   )
  }

  render() {
    const { idxSensors} = this.props.ros
    const capabilities = idxSensors[this.props.idxSensorNamespace]

    return (
      <Section title={"Sensor Settings"}>
        <Label title={"Show Sensor Settings"}>
          <Toggle
            checked={this.state.show_sensor_settings}
            onClick={() => {this.state.show_sensor_settings=!this.state.show_sensor_settings}}
          />
        </Label>
        <div hidden={!this.state.show_sensor_settings}>
          <SliderAdjustment
              title={"Brightness"}
              msgType={"std_msgs/Float32"}
              adjustment={this.state.brightnessAdjustment}
              topic={this.props.idxSensorNamespace + "/idx/set_brightness"}
              scaled={0.01}
              min={0}
              max={100}
              disabled={(capabilities && capabilities.adjustable_brightness && !this.state.disabled)? false : true}
              tooltip={"Adjustable brightness"}
              unit={"%"}
          />
        </div>
      </Section>
    )
  }

}
export default SensorSettings
