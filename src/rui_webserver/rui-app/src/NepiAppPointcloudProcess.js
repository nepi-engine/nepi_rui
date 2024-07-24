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
      framesList: ['nepi_center_frame','sensor_frame','map'],
      frame_3d: null,

      processListener: null,

    }

    this.getStrListAsList = this.getStrListAsList.bind(this)

    this.updateProcessListener = this.updateProcessListener.bind(this)
    this.processStatusListener = this.processStatusListener.bind(this)
    
  }

  // Callback for handling ROS Status messages
  processStatusListener(message) {
    this.setState({
      range_clip_enabled: message.range_clip_enabled,
      range_clip_min_meters: message.range_clip_meters.start_range,
      range_clip_max_meters: message.range_clip_meters.stop_range,
      clip_target_topic: message.clip_target_topic,
      voxel_downsample_size_m: message.voxel_downsample_size_m,
      uniform_downsample_points: message.uniform_downsample_points,
      outlier_k_points: message.outlier_k_points,
      frame_3d: message.frame_3d
    })
    this.updateFrames3dList(message.available_3d_frames)
  }

  // Function for configuring and subscribing to Status
  updateProcessListener() {
    const statusNamespace = this.props.appNamespace + '/status'
    var processListener = this.props.ros.setupPointcloudProcessStatusListener(
          statusNamespace,
          this.processStatusListener
        )
    this.setState({ processListener: processListener})
    this.setState({connected: true})
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { appNamespace } = this.props
    if (prevState.appNamespace !== appNamespace && appNamespace !== null) {
        this.updateProcessListener()
      } 
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.processListener) {
      this.state.processListener.unsubscribe()
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
