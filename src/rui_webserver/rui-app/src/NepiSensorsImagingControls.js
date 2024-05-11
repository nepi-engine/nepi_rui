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
class ControlIDX extends Component {
  constructor(props) {
    super(props)

    // these states track the values through IDX Status messages
    this.state = {
      idxControls: null,
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

      disabled: false,
    }

    this.updateListener = this.updateListener.bind(this)
    this.idxStatusListener = this.idxStatusListener.bind(this)
    this.sendUpdate = this.sendUpdate.bind(this)
    this.set3DFrame = this.set3DFrame.bind(this)
    
    this.updateListener()
  }

  // Callback for handling ROS StatusIDX messages
  idxStatusListener(message) {
    this.setState({
      idxControls: message.idx_controls,
      autoAdjust: message.auto,
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

  set3DFrame(topic, value) {
    this.props.ros.publishSetPointcloudTargetFrame(
      topic,
      value
    )
  }

 

  render() {
    const { idxSensors, setIdxControls, setIdxAutoAdjust } = this.props.ros
    const capabilities = idxSensors[this.props.idxSensorNamespace]

    return (
      <Section title={"IDX Controls"}>
        <Label title={"Enable IDX Controls"}>
          <Toggle
            checked={this.state.idxControls}
            onClick={() => setIdxControls(this.props.idxSensorNamespace,!this.state.idxControls)}
          />
        </Label>
        <div hidden={!this.state.idxControls}>
          <Label title={"Auto Adjust"}>
            <Toggle
              checked={this.state.autoAdjust}
              onClick={() => setIdxAutoAdjust(this.props.idxSensorNamespace,!this.state.autoAdjust)}
            /> 
          </Label>
          <div hidden={this.state.autoAdjust}>
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
            <SliderAdjustment
              title={"Contrast"}
              msgType={"std_msgs/Float32"}
              adjustment={this.state.contrastAdjustment}
              topic={this.props.idxSensorNamespace + "/idx/set_contrast"}
              scaled={0.01}
              min={0}
              max={100}
              disabled={(capabilities && capabilities.adjustable_contrast && !this.state.disabled)? false : true}
              tooltip={"Adjustable contrast"}
              unit={"%"}
            />
            <SliderAdjustment
                title={"Thresholding"}
                msgType={"std_msgs/Float32"}
                adjustment={this.state.thresholdingAdjustment}
                topic={this.props.idxSensorNamespace + "/idx/set_thresholding"}
                scaled={0.01}
                min={0}
                max={100}
                disabled={(capabilities && capabilities.adjustable_thresholding && !this.state.disabled)? false : true}
                tooltip={"Adjustable thresholding"}
                unit={"%"}
            />
          </div>
          <RadioButtonAdjustment
              title={"Resolution"}
              topic={this.props.idxSensorNamespace + '/idx/set_resolution_mode'}
              msgType={"std_msgs/UInt8"}
              adjustment={(capabilities && capabilities.adjustable_resolution)? this.state.resolutionAdjustment : null}
              disabled={(capabilities && capabilities.adjustable_resolution && !this.state.disabled)? false : true}
              entries={["Low", "Medium", "High", "Ultra"]}
          />
          <RadioButtonAdjustment
              title={"Framerate"}
              topic={this.props.idxSensorNamespace + '/idx/set_framerate_mode'}
              msgType={"std_msgs/UInt8"}
              adjustment={(capabilities && capabilities.adjustable_framerate)? this.state.framerateAdjustment : null}
              disabled={(capabilities && capabilities.adjustable_framerate && !this.state.disabled)? false : true}
              entries={["Low", "Medium", "High", "Ultra"]}
          />
          <RangeAdjustment
            title="Range"
            min={this.state.rangeMin}
            max={this.state.rangeMax}
            topic={this.props.idxSensorNamespace + "/idx/set_range_window"}
            disabled={(capabilities && capabilities.adjustable_range && !this.state.disabled)? false : true}
            tooltip={"Adjustable range"}
            unit={"%"}
          />
          <div>
            <Columns>
              <Column>
              <div align={"left"} textAlign={"left"}>
                <Label title={"Pointclouds"}>
                </Label>
              </div>
              </Column>
              <Column>
              <div align={"left"} textAlign={"left"}>
                <Label title={"Earth"}>
                </Label>
                <Toggle 
                  checked={this.state.frame3D === "map"} 
                  disabled={(capabilities && capabilities.has_pointclouds && !this.state.disabled)? false : true}
                  onClick={() => {this.set3DFrame(this.props.sensor_namespace, "map")}}
                />
              </div>
              </Column>
              <Column>
              <div align={"left"} textAlign={"left"}>
                <Label title={"Sensor"}>
                </Label>
                <Toggle 
                  checked={this.state.frame3D === "idx_center_frame"}
                  disabled={(capabilities && capabilities.has_pointclouds && !this.state.disabled)? false : true}
                  onClick={() => {this.set3DFrame(this.props.sensor_namespace, "idx_center_frame")}}
                />
              </div>
              </Column>
            </Columns>
          </div>
        </div>
      </Section>
    )
  }
}
export default ControlIDX
