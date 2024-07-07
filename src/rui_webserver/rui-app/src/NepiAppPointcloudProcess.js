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
class NepiAppPointcloudProcess extends Component {
  constructor(props) {
    super(props)

    // these states track the values through  Status messages
    this.state = {

      range_clip_enabled: null,
      range_clip_min_meters: null,
      range_clip_max_meters: null,
      clip_target_topic: null,
      voxel_downsample_size_m: null,
      uniform_downsample_points: null,
      outlier_k_points: null,
      framesList: null,
      frame_3d: null,

      listener: null,

      disabled: false,
    }

    this.getStrListAsList = this.getStrListAsList.bind(this)
    this.updateFrames3dList = this.updateFrames3dList.bind(this)

    this.updateListener = this.updateListener.bind(this)
    this.StatusListener = this.StatusListener.bind(this)
    
    this.updateListener()
  }

  // Callback for handling ROS Status messages
  StatusListener(message) {
    this.setState({
      range_clip_enabled: message.range_clip_enabled
      range_clip_min_meters: message.range_clip_meters.start_range,
      range_clip_max_meters: message.range_clip_meters.stop_range,
      clip_target_topic: message.clip_target_topic,.
      voxel_downsample_size_m: message.voxel_downsample_size_m,
      uniform_downsample_points: message.uniform_downsample_points,
      outlier_k_points: message.outlier_k_points,
      frame_3d: message.frame_3d
    })
    this.updateFrames3dList(message.available_3d_frames)
  }

  // Function for configuring and subscribing to Status
  // Function for configuring and subscribing to Status
  updateListener() {
    const {title} = this.props
    const { setupPointcloudProcessStatusListener } = this.props.ros
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
    if (this.props.appNamespace.indexOf('null') === -1) {
      const statusNamespace = this.props.appNamespace + "/status"
      var listener = setupPointcloudProcessStatusListener(
        statusNamespace,
        this.StatusListener
      )
      this.setState({ listener: listener, disabled: false })
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


  getStrListAsList(transformsStr) {
    var StrList = []
    if (transformsStr != null){
      transformsStr = transformsStr.replaceAll("[","")
      transformsStr = transformsStr.replaceAll("]","")
      transformsStr = transformsStr.replaceAll(" '","")
      transformsStr = transformsStr.replaceAll("'","")
      StrList = transformsStr.split(",")
    }
    return StrList
  }

  updateFrames3dList(framesListMsg){
    const list = this.getStrListAsList(framesListMsg)
    this.setState({
      framesList: list
    })
  }

  render() {
    const {  sendTriggerMsg, setFrame3d } = this.props.ros
    return (
      <Section title={"Process Controls"}>
        <Columns>
          <Column>
 
          </Column>
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
        
      </Section>
    )
  }

}
export default NepiAppPointcloudProcess
