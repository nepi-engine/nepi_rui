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

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer

// Component that contains the  Pointcloud App Viewer Controls
class NepiPointcloudProcessControls extends Component {
  constructor(props) {
    super(props)

    // these states track the values through  Status messages
    this.state = {
      show_process_controls: false,
      range_clip_enabled: false,
      range_clip_min_m: null,
      range_clip_max_m: null,
      clip_target_topic: null,
      voxel_downsample_size_m: null,
      uniform_downsample_points: null,
      outlier_k_points: null,
      framesList: ['nepi_center_frame','sensor_frame','map'],
      frame_3d: null,
      

      processListener: null,

    }

    this.onChangeProcessShowVal = this.onChangeProcessShowVal.bind(this)
    this.getProcessStrListAsList = this.getProcessStrListAsList.bind(this)

    this.updateProcessListener = this.updateProcessListener.bind(this)
    this.processStatusListener = this.processStatusListener.bind(this)

    this.updateFrames3dList = this.updateFrames3dList.bind(this)
    
    this.onChangeBoolClipRangeEnabled = this.onChangeBoolClipRangeEnabled.bind(this)

    this.onUpdateProcessInputBoxValue = this.onUpdateProcessInputBoxValue.bind(this)
    this.onEnterSendInputBoxFloatValue = this.onEnterSendInputBoxFloatValue.bind(this)

  }

  // Callback for handling ROS Status messages
  processStatusListener(message) {
    this.setState({
      range_clip_enabled: message.range_clip_enabled,
      range_clip_min_m: message.range_clip_meters.start_range,
      range_clip_max_m: message.range_clip_meters.stop_range,
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
    const statusNamespace = this.props.processNamespace + '/status'
    if (this.state.processListener) {
      this.state.processListener.unsubscribe()
    }
    var processListener = this.props.ros.setupPointcloudProcessStatusListener(
          statusNamespace,
          this.processStatusListener
        )
    this.setState({ processListener: processListener})
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { processNamespace } = this.props
    if (prevProps.processNamespace !== processNamespace && processNamespace !== null) {
      if (processNamespace.indexOf('null') === -1){
        this.updateProcessListener()
        this.render()
      } 
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.processListener) {
      this.state.processListener.unsubscribe()
    }
  }



  onChangeProcessShowVal(){
    const new_val = this.state.show_process_controls == false
    this.setState({show_process_controls: new_val})
  }


  updateFrames3dList(framesListMsg){
    const framesList = this.getProcessStrListAsList(framesListMsg)
    this.setState({frames3dlist: framesList})
  }

  getProcessStrListAsList(strList) {
    var temp_list = []
    var out_list = []
    if (strList != null){
      temp_list = strList.replaceAll("[","")
      temp_list = temp_list.replaceAll("]","")
      temp_list = temp_list.replaceAll(" '","")
      temp_list = temp_list.replaceAll("'","")
      out_list = temp_list.split(",")
    }
    return out_list
  }

  onChangeBoolClipRangeEnabled(){
    const updateVal = this.state.range_clip_enabled == false
    this.props.ros.sendBoolMsg(this.props.processNamespace + "/set_clip_range_enable",updateVal)
    this.render()
  }

  onUpdateProcessInputBoxValue(event,stateVarNameStr) {
    var key = stateVarNameStr
    var value = event.target.value
    var obj  = {}
    obj[key] = value
    this.setState(obj)
    document.getElementById(event.target.id).style.color = Styles.vars.colors.red
  }

  onEnterSendInputBoxFloatValue(event, topicName) {
    const {sendFloatMsg} = this.props.ros
    const namespace = this.props.processNamespace + topicName
    if(event.key === 'Enter'){
      const value = parseFloat(event.target.value)
      if (!isNaN(value)){
        sendFloatMsg(namespace,value)
      }
      document.getElementById(event.target.id).style.color = Styles.vars.colors.black
    }
  }


  onEnterSendInputBoxIntValue(event, topicName) {
    const {sendIntMsg} = this.props.ros
    const namespace = this.props.processNamespace + topicName
    if(event.key === 'Enter'){
      const value = parseInt(event.target.value)
      if (!isNaN(value)){
        sendIntMsg(namespace,value)
      }
      document.getElementById(event.target.id).style.color = Styles.vars.colors.black
    }
  }



  onEnterSendInputBoxRangeWindowValue(event, topicName, entryName) {
    const {publishRangeWindow} = this.props.ros
    const namespace = this.props.processNamespace + topicName
    if(event.key === 'Enter'){
      const value = parseFloat(event.target.value)
      if (!isNaN(value)){
        var min = this.state.range_clip_min_m
        var max = this.state.range_clip_max_m
        if (entryName === "min"){
          min = value
        }
        else if (entryName === "max"){
          max = value
        }
        publishRangeWindow(namespace,min,max,false)
      }
      document.getElementById(event.target.id).style.color = Styles.vars.colors.black
    }
  }

  render() {
    const {  sendTriggerMsg, setFrame3d } = this.props.ros
    return (
      <Section title={"Process Controls"}>


      <Columns>
      <Column>
          <Label title="Show Process Controls">
                <Toggle
                checked={this.state.show_process_controls===true}
                onClick={this.onChangeProcessShowVal}>
                </Toggle>
          </Label>
      </Column>
      <Column>

      <div hidden={!this.state.show_process_controls}>
          <ButtonMenu>
                    <Button onClick={() => sendTriggerMsg( this.props.processNamespace + "/reset_controls")}>{"Reset Controls"}</Button>
              </ButtonMenu>
      </div>
      </Column>
      </Columns>

      <div hidden={!this.state.show_process_controls}>

          <Columns>
          <Column>
            <Label title="Clip Range Enabled">
                  <Toggle
                  checked={this.state.range_clip_enabled===true}
                  onClick={this.onChangeBoolClipRangeEnabled}>
                  </Toggle>
            </Label>

            <Label title={"Set Range Clip Ranges (m)"}>
            </Label>

           </Column>
           <Column>


           </Column>
          </Columns>

          <Columns>
          <Column>


          <Label title={"Set Range Clip Min"}>
                    <Input id="set_range_clip_min" 
                      value={this.state.range_clip_min_m} 
                      onChange={(event) => this.onUpdateProcessInputBoxValue(event,"range_clip_min_m")} 
                      onKeyDown= {(event) => this.onEnterSendInputBoxRangeWindowValue(event,"/set_range_clip_m","min")} />
              </Label>
            
              </Column>
              <Column>
                  <Label title={"Set Range Clip Max"}>
                    <Input id="set_range_clip_max" 
                     value={this.state.range_clip_max_m} 
                      onChange={(event) => this.onUpdateProcessInputBoxValue(event,"range_clip_max_m")} 
                      onKeyDown= {(event) => this.onEnterSendInputBoxRangeWindowValue(event,"/set_range_clip_m","max")} />                      
                  </Label>  

           </Column>
          </Columns>  

          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>    


          <Columns>
            <Column>

              <Label title={"Pointclud Filtering"}></Label>
                      
{/*              <Label title={"Uniform Downsample k Points"}>
                <Input id="uniform_downsample_k_points" 
                  value={this.state.uniform_downsample_points} 
                  onChange={(event) => this.onUpdateProcessInputBoxValue(event,"uniform_downsample_points")} 
                  onKeyDown= {(event) => this.onEnterSendInputBoxIntValue(event,"/uniform_downsample_k_points")} />
              </Label>
*/}

              <Label title={"Outlier Removal k Points"}>
                <Input id="outlier_k_points" 
                  value={this.state.outlier_k_points} 
                  onChange={(event) => this.onUpdateProcessInputBoxValue(event,"outlier_k_points")} 
                  onKeyDown= {(event) => this.onEnterSendInputBoxIntValue(event,"/outlier_removal_num_neighbors")} />
              </Label>

              <Label title={"Voxel Downsample Size (m)"}>
                <Input id="voxel_downsample_size_m" 
                  value={this.state.voxel_downsample_size_m} 
                  onChange={(event) => this.onUpdateProcessInputBoxValue(event,"voxel_downsample_size_m")} 
                  onKeyDown= {(event) => this.onEnterSendInputBoxFloatValue(event,"/set_voxel_downsample_size")} />
              </Label>

            </Column>
            <Column>

            </Column>
          </Columns>  

        </div>
        
      </Section>
    )
  }

}
export default NepiPointcloudProcessControls
