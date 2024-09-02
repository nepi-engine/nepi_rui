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
import Select, { Option } from "./Select"
import Styles from "./Styles"
import {RadioButtonAdjustment, SliderAdjustment} from "./AdjustmentWidgets"
import Toggle from "react-toggle"
import Label from "./Label"
import Input from "./Input"
import { Column, Columns } from "./Columns"
import { round, onUpdateSetStateValue, onEnterSetStateFloatValue } from "./Utilities"

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
      zoomAdjustment: null,
      rotateAdjustment: null,
      tiltAdjustment: null,
      frame3D: null,

      showTransforms: false,
      transforms_topic_list: [],
      transforms_list: [],
      selectedTransformPointcloud: "",
      selectedTransformInd: 0,
      selectedTransformData: null,
      selectedTransformTX: 0,
      selectedTransformTY: 0,
      selectedTransformTZ: 0,
      selectedTransformRX: 0,
      selectedTransformRY: 0,
      selectedTransformRZ: 0,
      selectedTransformHO: 0,
      age_filter_s: null,

      listener: null,

      disabled: false,
    }


    this.onClickToggleShowTransforms = this.onClickToggleShowTransforms.bind(this)
    this.updateListener = this.updateListener.bind(this)
    this.statusListener = this.statusListener.bind(this)
    
  }

  // Callback for handling ROS StatusIDX messages
  statusListener(message) {
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
    const { idxSensorNamespace } = this.props
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
    var listener = this.props.ros.setupIDXStatusListener(
      idxSensorNamespace,
      this.statusListener
    )
    this.setState({ listener: listener, disabled: false })

  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { idxSensorNamespace } = this.props
    if (prevProps.idxSensorNamespace !== idxSensorNamespace && idxSensorNamespace != null) {
      this.updateListener()
    } else if (idxSensorNamespace == null){
      this.setState({ disabled: true })
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to StatusIDX message
  componentWillUnmount() {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
  }

  onClickToggleShowTransforms(){
    const currentVal = this.state.showTransforms 
    this.setState({showTransforms: !currentVal})
    this.render()
  }

  setSelectedTransform(event){
    const pointcloud = event.target.value
    const pointclouds = this.state.transforms_topic_list
    const transforms = this.state.transforms_list
    const tf_index = pointclouds.indexOf(pointcloud)
    if (tf_index !== -1){
      this.setState({
        selectedTransformPointcloud: pointcloud,
        selectedTransformInd: tf_index
      })
      const transform = transforms[tf_index]
      this.setState({
        selectedTransformTX: round(transform[0]),
        selectedTransformTY: round(transform[1]),
        selectedTransformTZ: round(transform[2]),
        selectedTransformRX: round(transform[3]),
        selectedTransformRY: round(transform[4]),
        selectedTransformRZ: round(transform[5]),
        selectedTransformHO: round(transform[6])
      })
      
    }
  }

  sendTransformUpdateMessage(){
    const {sendFrame3DTransformMsg} = this.props.ros
    const namespace = this.props.idxSensorNamespace + "/idx/set_frame_3d_transform"
    const TX = parseFloat(this.state.selectedTransformTX)
    const TY = parseFloat(this.state.selectedTransformTY)
    const TZ = parseFloat(this.state.selectedTransformTZ)
    const RX = parseFloat(this.state.selectedTransformRX)
    const RY = parseFloat(this.state.selectedTransformRY)
    const RZ = parseFloat(this.state.selectedTransformRZ)
    const HO = parseFloat(this.state.selectedTransformHO)
    const transformList = [TX,TY,TZ,RX,RY,RZ,HO]
    sendFrame3DTransformMsg(namespace,transformList)
  }

  render() {
    const { idxSensors, sendTriggerMsg, setIdxControlsEnable, setIdxAutoAdjust, setFrame3D } = this.props.ros
    const capabilities = idxSensors[this.props.idxSensorNamespace]
    const has_auto_adjust = (capabilities && capabilities.auto_adjustment && !this.state.disabled)
    const has_range_adjust = (capabilities && capabilities.adjustable_range && !this.state.disabled)
    const resetControlsNamespace = this.props.idxSensorNamespace + "/idx/reset_controls"
    const imageName = this.props.idxImageName 
    return (
      <Section title={"Post Process Controls"}>
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
                  <Button onClick={() => sendTriggerMsg(resetControlsNamespace)}>{"Reset Controls"}</Button>
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
                      topic={this.props.idxSensorNamespace + "/idx/set_zoom_ratio"}
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
                      topic={this.props.idxSensorNamespace + "/idx/set_rotate_ratio"}
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
                      topic={this.props.idxSensorNamespace + "/idx/set_tilt_ratio"}
                      scaled={0.01}
                      min={0}
                      max={100}
                      disabled={false}
                      tooltip={"Tilt controls for pointcloud image rendering"}
                      unit={"%"}
                  />
                          </div>
                          </div>


    <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
  <Columns>
    <Column>
    <Label title="Show Data Transform Settings">
                    <Toggle
                      checked={this.state.showTransforms===true}
                      onClick={this.onClickToggleShowTransforms}>
                    </Toggle>
                  </Label>

                  </Column>
                  <Column>
                  </Column>
                  </Columns>


       <div hidden={ this.state.showTransforms === false}>

                         
              <Columns>
                <Column>
                <div align={"left"} textAlign={"left"}>
                  <Label title={"Output Frame"}>
                  </Label>
                </div>
                </Column>
                <Column>
                  <div align={"left"} textAlign={"left"}>
                    <Label title={"Set Output Frame"}>
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
                    disabled={(!this.state.disabled)? false : true}
                    onClick={() => setFrame3D(this.props.idxSensorNamespace + '/idx',"nepi_center_frame")}
                  />
                </div>
     

                </Column>
                <Column>

                <div align={"center"} textAlign={"center"}>
                  <Label title={"SENSOR"} align={"center"}>
                  </Label>
                  <Toggle 
                    checked={this.state.frame3D === "sensor_frame"} 
                    disabled={(!this.state.disabled)? false : true}
                    onClick={() => setFrame3D(this.props.idxSensorNamespace + '/idx',"sensor_frame")}
                  />
                </div>
     

                </Column>
                <Column>
                <div align={"center"} textAlign={"center"}>
                  <Label title={"Earth"} align={"center"}>
                  </Label>
                  <Toggle 
                    checked={this.state.frame3D === "map"} 
                    disabled={(!this.state.disabled)? false : true}
                    onClick={() => setFrame3D(this.props.idxSensorNamespace + '/idx',"map")}
                  />
               </div>

                </Column>
              </Columns>


        <div hidden={ this.state.frame3D  === "sensor_frame"}>

              <Label title={"Nepi center frame tranform"}>
            </Label>

        <Columns>
        <Column>

          <Label title={"X (m)"}>
            <Input
              value={this.state.selectedTransformTX}
              id="XTranslation"
              onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"selectedTransformTX")}
              onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"selectedTransformTX")}
              style={{ width: "80%" }}
            />
          </Label>

          <Label title={"Y (m)"}>
            <Input
              value={this.state.selectedTransformTY}
              id="YTranslation"
              onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"selectedTransformTY")}
              onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"selectedTransformTY")}
              style={{ width: "80%" }}
            />
          </Label>

          <Label title={"Z (m)"}>
            <Input
              value={this.state.selectedTransformTZ}
              id="ZTranslation"
              onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"selectedTransformTZ")}
              onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"selectedTransformTZ")}
              style={{ width: "80%" }}
            />
          </Label>


          <ButtonMenu>
            <Button onClick={() => this.sendTransformUpdateMessage()}>{"Update Transform"}</Button>
          </ButtonMenu>

        </Column>
        <Column>

          <Label title={"Roll (deg)"}>
            <Input
              value={this.state.selectedTransformRX}
              id="XRotation"
              onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"selectedTransformRX")}
              onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"selectedTransformRX")}
              style={{ width: "80%" }}
            />
          </Label>

          <Label title={"Pitch (deg)"}>
            <Input
              value={this.state.selectedTransformRY}
              id="YRotation"
              onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"selectedTransformRY")}
              onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"selectedTransformRY")}
              style={{ width: "80%" }}
            />
          </Label>

        <Label title={"Yaw (deg)"}>
          <Input
            value={this.state.selectedTransformRZ}
            id="ZRotation"
            onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"selectedTransformRZ")}
            onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"selectedTransformRZ")}
            style={{ width: "80%" }}
          />
        </Label>

            </Column>
          </Columns>

          </div>



        </div>
      </Section>
    )
  }

}
export default NepiSensorsImagingControls
