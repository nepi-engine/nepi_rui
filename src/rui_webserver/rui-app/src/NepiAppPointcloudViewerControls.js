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
import Input from "./Input"
import { Column, Columns } from "./Columns"

@inject("ros")
@observer

// Component that contains the  Sensor controls
class NepiAppPointcloudViewerControls extends Component {
  constructor(props) {
    super(props)

    // these states track the values through  Status messages
    this.state = {
      rangeRatioMax: null,
      rangeRatioMin: null,
      rangeLimitMinM: null,
      rangeLimitMaxM: null,
      zoomAdjustment: null,
      rotateAdjustment: null,
      tiltAdjustment: null,
      camViewX: null,
      camViewY: null,
      camViewZ: null,
      camPosX: null,
      camPosY: null,
      camPosZ: null,
      camRotX: null,
      camRotY: null,
      camRotZ: null,
      frame3D: null,

      listener: null,

      disabled: false,
    }

    this.updateListener = this.updateListener.bind(this)
    this.StatusListener = this.StatusListener.bind(this)
    
  }

  // Callback for handling ROS Status messages
  StatusListener(message) {
    this.setState({
      rangeRatioMin: message.range_window.start_range,
      rangeRatioMax: message.range_window.stop_range,
      rangeLimitMinM: message.min_max_range_m.start_range,
      rangeLimitMaxM: message.min_max_range_m.stop_range,
      zoomAdjustment: message.zoom_ratio,
      rotateAdjustment: message.rotate_ratio,
      tiltAdjustment: message.tilt_ratio,
      camViewX: message.camera_view.x,
      camViewY: message.camera_view.y,
      camViewZ: message.camera_view.z,
      camPosX: message.camera_position.x,
      camPosY: message.camera_position.y,
      camPosZ: message.camera_position.z,
      camRotX: message.camera_rotation.x,
      camRotY: message.camera_rotation.y,
      camRotZ: message.camera_rotation.z

    })
  }

  // Function for configuring and subscribing to Status
  updateListener() {
    const { appNamespace, title } = this.props
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }

    if (title) {
      var listener = this.props.ros.setupStatusListener(
        appNamespace,
        this.StatusListener
      )
      this.setState({ listener: listener, disabled: false })
    } else {
      this.setState({ disabled: true })
    }
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { appNamespace } = this.props
    if (prevProps.appNamespace !== appNamespace) {
      this.updateListener()
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
  }


  render() {
    const {  resetControlsTriggered } = this.props.ros
    return (
      <Section title={"Controls"}>
        <Columns>
          <Column>
            <div align={"left"} textAlign={"left"}>
              <Label title={"Show Controls"}>
                <Toggle
                  checked={this.state.show_controls}
                  onClick={() => {this.setState({show_controls:!this.state.show_controls})}}
                />
              </Label>
            </div>
          </Column>
          <Column>
          </Column>
        </Columns>
        <div >
          <Columns>
            <Column>
              <div align={"left"} textAlign={"left"}>
                <Label title={"Enable Controls"}>
                  <Toggle
                  checked={this.state.controlsEnable}
                  onClick={() => setControlsEnable(this.props.SensorNamespace,!this.state.controlsEnable)}
                  />
                </Label>
              </div>
            </Column>
            <Column>
            <div align={"left"} textAlign={"left"} >
                <ButtonMenu>
                  <Button onClick={() => resetControlsTriggered(this.props.SensorNamespace)}>{"Reset Controls"}</Button>
                </ButtonMenu>
              </div>
            </Column>
          </Columns>
        
          <div >

            <div >
              <div align={"left"} textAlign={"left"} >
                  <Label title={"Auto Adjust"}>
                    <Toggle
                      checked={this.state.autoAdjust}
                      onClick={() => setAutoAdjust(this.props.SensorNamespace,!this.state.autoAdjust)}
                    /> 
                  </Label>
              </div>
              <div >
                <SliderAdjustment
                    title={"Brightness"}
                    msgType={"std_msgs/Float32"}
                    adjustment={this.state.brightnessAdjustment}
                    topic={this.props.SensorNamespace + "//set_brightness"}
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
                  topic={this.props.SensorNamespace + "//set_contrast"}
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
                    topic={this.props.SensorNamespace + "//set_thresholding"}
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
                  topic={this.props.SensorNamespace + '//set_resolution_mode'}
                  msgType={"std_msgs/UInt8"}
                  adjustment={(capabilities && capabilities.adjustable_resolution)? this.state.resolutionAdjustment : null}
                  disabled={(capabilities && capabilities.adjustable_resolution && !this.state.disabled)? false : true}
                  entries={["Low", "Medium", "High", "Ultra"]}
              />
              <RadioButtonAdjustment
                  title={"Framerate"}
                  topic={this.props.SensorNamespace + '//set_framerate_mode'}
                  msgType={"std_msgs/UInt8"}
                  adjustment={(capabilities && capabilities.adjustable_framerate)? this.state.framerateAdjustment : null}
                  disabled={(capabilities && capabilities.adjustable_framerate && !this.state.disabled)? false : true}
                  entries={["Low", "Medium", "High", "Ultra"]}
              />
            </div>

            <div >
              <RangeAdjustment
                title="Range Clip"
                min={this.state.rangeRatioMin}
                max={this.state.rangeRatioMax}
                min_limit_m={this.state.rangeLimitMinM}
                max_limit_m={this.state.rangeLimitMaxM}
                topic={this.props.SensorNamespace + "//set_range_ratios"}
                disabled={(capabilities && capabilities.adjustable_range && !this.state.disabled)? false : true}
                tooltip={"Adjustable range"}
                unit={"m"}
              />
            </div>


            <div >

                <SliderAdjustment
                      title={"Zoom"}
                      msgType={"std_msgs/Float32"}
                      adjustment={this.state.zoomAdjustment}
                      topic={this.props.SensorNamespace + "/set_zoom_ratio"}
                      scaled={0.01}
                      min={0}
                      max={100}
                      disabled={false}
                      tooltip={"Zoom controls for pointcloud image rendering"}
                      unit={"%"}
                  />


                <SliderAdjustment
                      title={"Rotate"}
                      msgType={"std_msgs/Float32"}
                      adjustment={this.state.rotateAdjustment}
                      topic={this.props.SensorNamespace + "/set_rotate_ratio"}
                      scaled={0.01}
                      min={0}
                      max={100}
                      disabled={false}
                      tooltip={"Rotate controls for pointcloud image rendering"}
                      unit={"%"}
                  />

                  <SliderAdjustment
                      title={"Tilt"}
                      msgType={"std_msgs/Float32"}
                      adjustment={this.state.tiltAdjustment}
                      topic={this.props.SensorNamespace + "/set_tilt_ratio"}
                      scaled={0.01}
                      min={0}
                      max={100}
                      disabled={false}
                      tooltip={"Tilt controls for pointcloud image rendering"}
                      unit={"%"}
                  />

              <Columns>
                <Column>
                <div align={"left"} textAlign={"left"}>
                  <Label title={"Pointcloud Frame"}>
                  </Label>
                </div>
                </Column>
                <Column>
                  <div align={"left"} textAlign={"left"}>
                    <Label title={"Current Frame"}>
                    <Input value = {this.state.frame3D} />
                    </Label>
                  </div>
                </Column>
              </Columns>
              <Columns>
                <Column>
                <div align={"center"} textAlign={"center"}>
                  <Label title={"NEPI"} align={"center"}>
                  </Label>
                  <Toggle 
                    checked={this.state.frame3D === "nepi_center_frame"} 
                    disabled={(capabilities && capabilities.has_pointcloud && !this.state.disabled)? false : true}
                    onClick={() => setFrame3D(this.props.SensorNamespace,"nepi_center_frame")}
                  />
                </div>
                </Column>
                <Column>
                <div align={"center"} textAlign={"center"}>
                  <Label title={"Earth"} align={"center"}>
                  </Label>
                  <Toggle 
                    checked={this.state.frame3D === "map"} 
                    disabled={(capabilities && capabilities.has_pointcloud && !this.state.disabled)? false : true}
                    onClick={() => setFrame3D(this.props.SensorNamespace,"map")}
                  />
                </div>
                </Column>
              </Columns>

            </div>
            
          </div>
        </div>
      </Section>
    )
  }

}
export default NepiAppPointcloudViewerControls
