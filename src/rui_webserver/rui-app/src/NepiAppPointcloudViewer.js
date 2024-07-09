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
import Input from "./Input"
import Select, { Option } from "./Select"
import Styles from "./Styles"


@inject("ros")
@observer

// Component that contains the  Pointcloud App Viewer Controls
class NepiAppPointcloudViewer extends Component {
  constructor(props) {
    super(props)

    // these states track the values through  Status messages
    this.state = {
      standardImageSizeStrList: null,
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

      listener: null,

      disabled: false,
    }

    this.onUpdateCamText = this.onUpdateCamText.bind(this)
    this.onKeyCamText = this.onKeyCamText.bind(this)

    this.updateListener = this.updateListener.bind(this)
    this.StatusListener = this.StatusListener.bind(this)
    
    this.updateListener()
  }

  // Callback for handling ROS Status messages
  StatusListener(message) {
    this.setState({
      standardImageSizeStrList: message.standard_image_sizes,
      rangeRatioMin: message.range_clip_ratios.start_range,
      rangeRatioMax: message.range_clip_ratios.stop_range,
      rangeLimitMinM: message.range_min_max_m.start_range,
      rangeLimitMaxM: message.range_min_max_m.stop_range,
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
      camRotZ: message.camera_rotation.z,
    })

    const frames3d = this.getSettingsAsList(this.state.frames3d)
    var frames3dlist = ["map"]
    for (let ind = 0; ind < frames3d.length; ind++) {
      frames3dlist.push(frames3d[ind])
    }
    this.setState({frame3dList: frames3dlist})
  }

  // Function for configuring and subscribing to Status
  // Function for configuring and subscribing to Status
  updateListener() {
    const {title} = this.props
    const { setupPointcloudRenderStatusListener } = this.props.ros
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
    if (this.props.appNamespace) {
      if (this.props.appNamespace.indexOf('null') === -1) {
        const statusNamespace = this.props.appNamespace + "/status"
        var listener = setupPointcloudRenderStatusListener(
          statusNamespace,
          this.StatusListener
        )
        this.setState({ listener: listener, disabled: false })
      } else {
        this.setState({ disabled: true })
      }
    } else {
      this.setState({ disabled: true })
    }
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const appNamespace = this.props.appNamespace
    if (prevState.appNamespace !== appNamespace && appNamespace !== null) {
      this.setState({appNamespace: appNamespace})
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

  onUpdateCamText(e) {
    const stateVarName = e.target.id
    const evalStr = 'this.setState({' + stateVarName + ': e.target.value})'
    eval(evalStr);
    document.getElementById(e.target.id).style.color = Styles.vars.colors.red
  }


  onKeyCamText(e,topic, f1, f2, f3) {
    const {sendFloatVector3Msg} = this.props.ros
    var namespace = topic
    var f1s = String(f1)
    var f2s = String(f2)
    var f3s = String(f3)
    if(e.key === 'Enter'){
      sendFloatVector3Msg(namespace,f1s,f2s,f3s)
      document.getElementById(e.target.id).style.color = Styles.vars.colors.black
    }
  }



  render() {
    const {  sendTriggerMsg, setFrame3d } = this.props.ros
    return (
      <Section title={"Controls"}>
        <Columns>
          <Column>
 
          </Column>
          <Column>
          </Column>
        </Columns>
        <div >
          <Columns>
            <Column>

            </Column>
            <Column>
            <div align={"left"} textAlign={"left"} >
                <ButtonMenu>
                  <Button onClick={() => sendTriggerMsg( this.props.appNamespace + "/reset_controls")}>{"Reset Controls"}</Button>
                </ButtonMenu>
              </div>
            </Column>
          </Columns>
        


            <div >
              <RangeAdjustment
                title="Range Clip"
                min={this.state.rangeRatioMin}
                max={this.state.rangeRatioMax}
                min_limit_m={this.state.rangeLimitMinM}
                max_limit_m={this.state.rangeLimitMaxM}
                topic={this.props.appNamespace + "/set_range_ratios"}
                disabled={(!this.state.disabled)? false : true}
                tooltip={"Adjustable range"}
                unit={"m"}
              />
            </div>


            <div >

                <SliderAdjustment
                      title={"Zoom"}
                      msgType={"std_msgs/Float32"}
                      adjustment={this.state.zoomAdjustment}
                      topic={this.props.appNamespace + "/set_zoom_ratio"}
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
                      topic={this.props.appNamespace + "/set_rotate_ratio"}
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
                      topic={this.props.appNamespace + "/set_tilt_ratio"}
                      scaled={0.01}
                      min={0}
                      max={100}
                      disabled={false}
                      tooltip={"Tilt controls for pointcloud image rendering"}
                      unit={"%"}
                  />

              <Label title={"Camera View"}>
              </Label>
              <Columns>
                <Column>

                  <Label title={"X  "}>
                    <Input
                      id="camViewX"
                      value={(this.state.camViewX)}
                      onChange={this.onUpdateCamText}
                      onKeyDown={(event) => this.onKeyCamText(event,(this.props.appNamespace + "/set_camera_view"),this.state.camViewX,this.state.camViewY,this.state.camViewZ)}
                    />
                  </Label>

                </Column>
                <Column>

                <Label title={"Y  "}>
                    <Input
                      id="camViewY"
                      value={(this.state.camViewY)}
                      onChange={this.onUpdateCamText}
                      onKeyDown={(event) => this.onKeyCamText(event,(this.props.appNamespace + "/set_camera_view"),this.state.camViewX,this.state.camViewY,this.state.camViewZ)}
                    />
                  </Label>

                </Column>
                <Column>

                <Label title={"Z  "}>
                    <Input
                      id="camViewZ"
                      value={(this.state.camViewZ)}
                      onChange={this.onUpdateCamText}
                      onKeyDown={(event) => this.onKeyCamText(event,(this.props.appNamespace + "/set_camera_view"),this.state.camViewX,this.state.camViewY,this.state.camViewZ)}
                    />
                  </Label>

                </Column>
              </Columns>


              <Label title={"Camera Position"}>
              </Label>
              <Columns>
                <Column>

                  <Label title={"X  "}>
                    <Input
                      id="camPosX"
                      value={(this.state.camPosX)}
                      onChange={this.onUpdateCamText}
                      onKeyDown={(event) => this.onKeyCamText(event,(this.props.appNamespace + "/set_camera_position"),this.state.camPosX,this.state.camPosY,this.state.camPosZ)}
                    />
                  </Label>

                </Column>
                <Column>

                <Label title={"Y  "}>
                    <Input
                      id="camPosY"
                      value={(this.state.camPosY)}
                      onChange={this.onUpdateCamText}
                      onKeyDown={(event) => this.onKeyCamText(event,(this.props.appNamespace + "/set_camera_position"),this.state.camPosX,this.state.camPosY,this.state.camPosZ)}
                    />
                  </Label>

                </Column>
                <Column>

                <Label title={"Z  "}>
                    <Input
                      id="camPosZ"
                      value={(this.state.camPosZ)}
                      onChange={this.onUpdateCamText}
                      onKeyDown={(event) => this.onKeyCamText(event,(this.props.appNamespace + "/set_camera_position"),this.state.camPosX,this.state.camPosY,this.state.camPosZ)}
                    />
                  </Label>

                </Column>
              </Columns>


              <Label title={"Camera Rotation"}>
              </Label>
              <Columns>
                <Column>

                  <Label title={"X  "}>
                    <Input
                      id="camcamRotX"
                      value={(this.state.camcamRotX)}
                      onChange={this.onUpdateCamText}
                      onKeyDown={(event) => this.onKeyCamText(event,(this.props.appNamespace + "/set_camera_rotation"),this.state.camcamRotX,this.state.camcamRotY,this.state.camcamRotZ)}
                    />
                  </Label>

                </Column>
                <Column>

                <Label title={"Y  "}>
                    <Input
                      id="camcamRotY"
                      value={(this.state.camcamRotY)}
                      onChange={this.onUpdateCamText}
                      onKeyDown={(event) => this.onKeyCamText(event,(this.props.appNamespace + "/set_camera_rotation"),this.state.camcamRotX,this.state.camcamRotY,this.state.camcamRotZ)}
                    />
                  </Label>

                </Column>
                <Column>

                <Label title={"Z  "}>
                    <Input
                      id="camcamRotZ"
                      value={(this.state.camcamRotZ)}
                      onChange={this.onUpdateCamText}
                      onKeyDown={(event) => this.onKeyCamText(event,(this.props.appNamespace + "/set_camera_rotation"),this.state.camcamRotX,this.state.camcamRotY,this.state.camcamRotZ)}
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
export default NepiAppPointcloudViewer
