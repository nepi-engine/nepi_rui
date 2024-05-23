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
      listener: null,
      zoomAdjustment: null,
      rotateAdjustment: null,
      frame3D: null,

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
      rangeLimitMinM: message.min_range_m,
      rangeLimitMaxM: message.max_range_m,
      zoomAdjustment: message.zoom,
      rotateAdjustment: message.rotate,
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
    const { idxSensors, resetIdxControlsTriggered, setIdxControlsEnable, setIdxAutoAdjust, setIdxFrame3D } = this.props.ros
    const capabilities = idxSensors[this.props.idxSensorNamespace]
    const has_auto_adjust = (capabilities && capabilities.auto_adjustment && !this.state.disabled)
    const has_range_adjust = (capabilities && capabilities.adjustable_range && !this.state.disabled)
    const has_zoom = (capabilities && capabilities.zoom && !this.state.disabled)
    const has_rotate = (capabilities && capabilities.rotate && !this.state.disabled)
    const has_pointcloud = (capabilities && capabilities.has_pointcloud && !this.state.disabled)
    const idxSensorNamespace = this.props.idxSensorNamespace
    const imageName = this.props.idxImageName 
    const state = this.state
    return (
      <Section title={"Controls"}>
        <Columns>
          <Column>
            <div align={"left"} textAlign={"left"}>
              <Label title={"Enable Controls"}>
                <Toggle
                checked={state.controlsEnable}
                onClick={() => setIdxControlsEnable(idxSensorNamespace,!state.controlsEnable)}
                />
              </Label>
            </div>
          </Column>
          <Column>
          <div align={"left"} textAlign={"left"} hidden={!state.controlsEnable}>
              <ButtonMenu>
                <Button onClick={() => resetIdxControlsTriggered(idxSensorNamespace)}>{"Reset Controls"}</Button>
              </ButtonMenu>
            </div>
          </Column>
        </Columns>
      
        <div hidden={!state.controlsEnable }>

          <div hidden={(imageName != 'bw_2d_image' && imageName != 'color_2d_image')}>
            <div align={"left"} textAlign={"left"} hidden={!has_auto_adjust && !state.controlsEnable}>
                <Label title={"Auto Adjust"}>
                  <Toggle
                    checked={state.autoAdjust}
                    onClick={() => setIdxAutoAdjust(idxSensorNamespace,!state.autoAdjust)}
                  /> 
                </Label>
            </div>
            <div hidden={state.autoAdjust}>
              <SliderAdjustment
                  title={"Brightness"}
                  msgType={"std_msgs/Float32"}
                  adjustment={state.brightnessAdjustment}
                  topic={idxSensorNamespace + "/idx/set_brightness"}
                  scaled={0.01}
                  min={0}
                  max={100}
                  disabled={(capabilities && capabilities.adjustable_brightness && !state.disabled)? false : true}
                  tooltip={"Adjustable brightness"}
                  unit={"%"}
              />
              <SliderAdjustment
                title={"Contrast"}
                msgType={"std_msgs/Float32"}
                adjustment={state.contrastAdjustment}
                topic={idxSensorNamespace + "/idx/set_contrast"}
                scaled={0.01}
                min={0}
                max={100}
                disabled={(capabilities && capabilities.adjustable_contrast && !state.disabled)? false : true}
                tooltip={"Adjustable contrast"}
                unit={"%"}
              />
              <SliderAdjustment
                  title={"Thresholding"}
                  msgType={"std_msgs/Float32"}
                  adjustment={state.thresholdingAdjustment}
                  topic={idxSensorNamespace + "/idx/set_thresholding"}
                  scaled={0.01}
                  min={0}
                  max={100}
                  disabled={(capabilities && capabilities.adjustable_thresholding && !state.disabled)? false : true}
                  tooltip={"Adjustable thresholding"}
                  unit={"%"}
              />
            </div>
          
            <RadioButtonAdjustment
                title={"Resolution"}
                topic={idxSensorNamespace + '/idx/set_resolution_mode'}
                msgType={"std_msgs/UInt8"}
                adjustment={(capabilities && capabilities.adjustable_resolution)? state.resolutionAdjustment : null}
                disabled={(capabilities && capabilities.adjustable_resolution && !state.disabled)? false : true}
                entries={["Low", "Medium", "High", "Ultra"]}
            />
            <RadioButtonAdjustment
                title={"Framerate"}
                topic={idxSensorNamespace + '/idx/set_framerate_mode'}
                msgType={"std_msgs/UInt8"}
                adjustment={(capabilities && capabilities.adjustable_framerate)? state.framerateAdjustment : null}
                disabled={(capabilities && capabilities.adjustable_framerate && !state.disabled)? false : true}
                entries={["Low", "Medium", "High", "Ultra"]}
            />
          </div>

          <div hidden={!has_range_adjust || (imageName != 'depth_image' && imageName != 'depth_map' && imageName != 'pointcloud_image')}>
            <RangeAdjustment
              title="Range"
              min={state.rangeMin}
              max={state.rangeMax}
              min_limit_m={state.rangeLimitMinM}
              max_limit_m={state.rangeLimitMaxM}
              topic={this.props.idxSensorNamespace + "/idx/set_range_window"}
              disabled={(capabilities && capabilities.adjustable_range && !state.disabled)? false : true}
              tooltip={"Adjustable range"}
              unit={"m"}
            />
          </div>


          <div hidden={!has_pointcloud || imageName != 'pointcloud_image'}>
            <div hidden={!has_zoom}>
              <SliderAdjustment
                    title={"Zoom Pointcloud Image"}
                    msgType={"std_msgs/Float32"}
                    adjustment={state.zoomAdjustment}
                    topic={idxSensorNamespace + "/idx/set_zoom"}
                    scaled={0.01}
                    min={0}
                    max={100}
                    disabled={(capabilities && capabilities.zoom && !state.disabled)? false : true}
                    tooltip={"Zoom controls for pointcloud image rendering"}
                    unit={"%"}
                />
            </div>
            <div hidden={!has_rotate}>
              <SliderAdjustment
                    title={"Rotate Pointcloud Image"}
                    msgType={"std_msgs/Float32"}
                    adjustment={state.rotateAdjustment}
                    topic={idxSensorNamespace + "/idx/set_rotate"}
                    scaled={0.01}
                    min={0}
                    max={100}
                    disabled={(capabilities && capabilities.rotate && !state.disabled)? false : true}
                    tooltip={"Rotate controls for pointcloud image rendering"}
                    unit={"%"}
                />
            </div>
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
                  <Input value = {state.frame3D} />
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
                  checked={state.frame3D === "nepi_center_frame"} 
                  disabled={(capabilities && capabilities.has_pointcloud && !state.disabled)? false : true}
                  onClick={() => setIdxFrame3D(idxSensorNamespace,"nepi_center_frame")}
                />
              </div>
              </Column>
              <Column>
              <div align={"center"} textAlign={"center"}>
                <Label title={"Sensor"} align={"center"}>
                </Label>
                <Toggle 
                  checked={state.frame3D === "idx_center_frame"} 
                  disabled={(capabilities && capabilities.has_pointcloud && !state.disabled)? false : true}
                  onClick={() => setIdxFrame3D(idxSensorNamespace,"idx_center_frame")}
                />
              </div>
              </Column>
              <Column>
              <div align={"center"} textAlign={"center"}>
                <Label title={"Earth"} align={"center"}>
                </Label>
                <Toggle 
                  checked={state.frame3D === "map"} 
                  disabled={(capabilities && capabilities.has_pointcloud && !state.disabled)? false : true}
                  onClick={() => setIdxFrame3D(idxSensorNamespace,"map")}
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
export default NepiSensorsImagingControls
