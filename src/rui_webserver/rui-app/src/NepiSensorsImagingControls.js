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

// Component that contains the IDX Sensor controls
class NepiSensorsImagingControls extends Component {
  constructor(props) {
    super(props)

    // these states track the values through IDX Status messages
    this.state = {
      show_controls: true,
      controlsEnable: null,
      autoAdjust: null,
      resolutionAdjustment: null,
      framerateAdjustment: null,
      contrastAdjustment: null,
      brightnessAdjustment: null,
      thresholdingAdjustment: null,
      rangeMax: null,
      rangeMin: null,
      rangeLimitMinM: null,
      rangeLimitMaxM: null,
      zoomAdjustment: null,
      rotateAdjustment: null,
      tiltAdjustment: null,
      frame3D: null,

      listener: null,

      disabled: false,
    }

    this.updateListener = this.updateListener.bind(this)
    this.idxStatusListener = this.idxStatusListener.bind(this)
    
    //this.updateListener()
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
      rangeLimitMinM: message.min_range_m,
      rangeLimitMaxM: message.max_range_m,
      zoomAdjustment: message.zoom,
      rotateAdjustment: message.rotate,
      tiltAdjustment: message.tilt,
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


  render() {
    const { idxSensors, resetIdxControlsTriggered, setIdxControlsEnable, setIdxAutoAdjust, setIdxFrame3D } = this.props.ros
    const capabilities = idxSensors[this.props.idxSensorNamespace]
    const has_auto_adjust = (capabilities && capabilities.auto_adjustment && !this.state.disabled)
    const has_range_adjust = (capabilities && capabilities.adjustable_range && !this.state.disabled)
    const imageName = this.props.idxImageName 
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
        <div hidden={!this.state.show_controls}>
          <Columns>
            <Column>
              <div align={"left"} textAlign={"left"}>
                <Label title={"Enable Controls"}>
                  <Toggle
                  checked={this.state.controlsEnable}
                  onClick={() => setIdxControlsEnable(this.props.idxSensorNamespace,!this.state.controlsEnable)}
                  />
                </Label>
              </div>
            </Column>
            <Column>
            <div align={"left"} textAlign={"left"} hidden={!this.state.controlsEnable}>
                <ButtonMenu>
                  <Button onClick={() => resetIdxControlsTriggered(this.props.idxSensorNamespace)}>{"Reset Controls"}</Button>
                </ButtonMenu>
              </div>
            </Column>
          </Columns>
        
          <div hidden={!this.state.controlsEnable }>

            <div hidden={(imageName !== 'bw_2d_image' && imageName !== 'color_2d_image')}>
              <div align={"left"} textAlign={"left"} hidden={!has_auto_adjust && !this.state.controlsEnable}>
                  <Label title={"Auto Adjust"}>
                    <Toggle
                      checked={this.state.autoAdjust}
                      onClick={() => setIdxAutoAdjust(this.props.idxSensorNamespace,!this.state.autoAdjust)}
                    /> 
                  </Label>
              </div>
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
            </div>

            <div hidden={!has_range_adjust || (imageName !== 'depth_image' && imageName !== 'depth_map' && imageName !== 'pointcloud_image')}>
              <RangeAdjustment
                title="Range Clip"
                min={this.state.rangeMin}
                max={this.state.rangeMax}
                min_limit_m={this.state.rangeLimitMinM}
                max_limit_m={this.state.rangeLimitMaxM}
                topic={this.props.idxSensorNamespace + "/idx/set_range_window"}
                disabled={(capabilities && capabilities.adjustable_range && !this.state.disabled)? false : true}
                tooltip={"Adjustable range"}
                unit={"m"}
              />
            </div>


            <div hidden={ imageName !== 'pointcloud_image'}>

                <SliderAdjustment
                      title={"Zoom"}
                      msgType={"std_msgs/Float32"}
                      adjustment={this.state.zoomAdjustment}
                      topic={this.props.idxSensorNamespace + "/idx/set_zoom"}
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
                      topic={this.props.idxSensorNamespace + "/idx/set_rotate"}
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
                      topic={this.props.idxSensorNamespace + "/idx/set_tilt"}
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
                    onClick={() => setIdxFrame3D(this.props.idxSensorNamespace,"nepi_center_frame")}
                  />
                </div>
                </Column>
                <Column>
                <div align={"center"} textAlign={"center"}>
                  <Label title={"Sensor"} align={"center"}>
                  </Label>
                  <Toggle 
                    checked={this.state.frame3D === "sensor_frame"} 
                    disabled={(capabilities && capabilities.has_pointcloud && !this.state.disabled)? false : true}
                    onClick={() => setIdxFrame3D(this.props.idxSensorNamespace,"sensor_frame")}
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
                    onClick={() => setIdxFrame3D(this.props.idxSensorNamespace,"map")}
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
export default NepiSensorsImagingControls
