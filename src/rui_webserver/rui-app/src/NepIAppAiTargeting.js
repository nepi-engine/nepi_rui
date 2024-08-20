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

import { round, convertStrToStrList, createShortValuesFromNamespaces, createMenuListFromStrList,
  onDropdownSelectedSendStr, onDropdownSelectedSetState, 
  onUpdateSetStateValue, 
  onEnterSendFloatValue, onEnterSetStateFloatValue,
  onEnterSendIntValue, onChangeSwitchStateValue,} from "./Utilities"

@inject("ros")
@observer

// Component that contains the  Pointcloud App Viewer Controls
class NepIAppAiTargeting extends Component {
  constructor(props) {
    super(props)

    // these states track the values through  Status messages
    this.state = {
      classifier_name: null,
      classifier_state: null,

      image_topic: null,
      depth_map_topic: null,
      pointcloud_topic: null,

      available_classes_list: [],
      selected_classes_list:[],
      selected_classes_depth_list: [],

      available_targets_list: [],
      selected_target: null,

      image_fov_vert_degs: null,
      image_fov_horz_degs: null,

      target_box_reduction_percent: null,
      default_target_depth_m: null,
      target_min_points: null,
      target_age_filter: null,

      current_targets_list: [],
      lost_targets_list: [],

      targeting_controls_enabled: false,
      targetingListener: null,




    }
  
    this.targetingListenerFunc = this.targetingListenerFunc.bind(this)
    this.updatetargetingListenerFunc = this.updatetargetingListenerFunc.bind(this)
    this.onToggleClassSelection = this.onToggleClassSelection.bind(this)
    this.getClassOptions = this.getClassOptions.bind(this)

  }

  // Callback for handling ROS Status messages
  targetingListenerFunc(message) {
    this.setState({

targeting_controls_enabled: message.targeting_enabled,
classifier_name: message.classifier_name,
classifier_state: message.classifier_state,
image_topic: message.image_topic,
depth_map_topic: message.depth_map_topic,
pointcloud_topic: message.pointcloud_topic,
selected_target: message.selected_target,
image_fov_vert_degs: message.image_fov_vert_degs,
image_fov_horz_degs: message.image_fov_horz_degs,
target_box_reduction_percent: message.target_box_reduction_percent,
default_target_depth_m: message.default_target_depth_m,
target_min_points: message.target_min_points,
target_age_filter: message.target_age_filter,

available_classes_list: convertStrToStrList(message.available_classes_list),
selected_classes_list: convertStrToStrList(message.selected_classes_list),
selected_classes_depth_list: convertStrToStrList(message.selected_classes_depth_list),
available_targets_list: convertStrToStrList(message.available_targets_list),
current_targets_list: convertStrToStrList(message.current_targets_list),
lost_targets_list: convertStrToStrList(message.lost_targets_list),
    })
  }

  setupStatusListener(namespace, msg_type, callback) {
    if (namespace) {
      return this.addListener({
        name: namespace,
        messageType: msg_type,
        noPrefix: true,
        callback: callback,
        manageListener: false
      })
    }
  }

  // Function for configuring and subscribing to Status
  updatetargetingListenerFunc() {
    const statusNamespace = this.props.targetingNamespace + '/status'
    if (this.state.targetingListener) {
      this.state.targetingListener.unsubscribe()
    }
    var targetingListener = this.props.ros.setupStatusListener(
          statusNamespace,
          "nepi_ros_interfaces/AiTargetingStatus",
          this.targetingListenerFunc
        )
    this.setState({ targetingListener: targetingListener})
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { targetingNamespace } = this.props
    if (prevProps.targetingNamespace !== targetingNamespace && targetingNamespace !== null) {
      if (targetingNamespace.indexOf('null') === -1){
        this.updatetargetingListenerFunc()
        this.render()
      } 
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.targetingListener) {
      this.state.targetingListener.unsubscribe()
    }
  }


   // Function for creating image topic options.
   getClassOptions() {
    const classesList = this.state.available_classes_list
    var items = []
    items.push(<Option>{"None"}</Option>)
    items.push(<Option>{"All"}</Option>)
    if (classesList){
      for (var i = 0; i < classesList.length; i++) {
          items.push(<Option value={classesList[i]}>{classesList[i]}</Option>)
      }
    }
    return items
    }
  
  


  onToggleClassSelection(event){
    const {sendTriggeredMsg, sendStringMsg} = this.props.ros
    const classSelection = event.target.value
    const selectedClassesList = this.state.selected_classes_list
    const addAllNamespace = this.props.targetingNamespace + "/add_all_target_classes"
    const removeAllNamespace = this.props.targetingNamespace + "/remove_all_target_classes"
    const addNamespace = this.props.targetingNamespace + "/add_target_class"
    const removeNamespace = this.props.targetingNamespace + "/remove_target_class"
    if (this.props.targetingNamespace){
      if (classSelection === "NONE"){
          sendTriggeredMsg(removeNamespace,"None")
      }
      else if (classSelection === "All"){
        sendTriggeredMsg(addAllNamespace,"All")
    }
      else if (selectedClassesList.indexOf(classSelection) !== -1){
        sendStringMsg(removeNamespace,classSelection)
      }
      else {
        sendStringMsg(addNamespace,classSelection)
      }
    }
  }


  render() {
    
    const {  sendTriggerMsg, sendBoolMsg, setFrame3d } = this.props.ros
    const classOPtions = this.getClassOptions()
    const selectedClasses = this.state.selected_classes_list
    return (
      <Section title={"Targeting Controls"}>

      <Columns>
      <Column>
          
          <Label title="Targeting Controls Enabled">
                  <Toggle
                  checked={this.state.targeting_controls_enabled===true}
                  onClick={() => sendBoolMsg(this.props.targetingNamespace + "/targeting_enabled",!this.state.targeting_controls_enabled)}>
                  </Toggle>
            </Label>

            <Label title="Select Target Classes">
                    <div onClick={this.toggleViewableTopics} style={{backgroundColor: Styles.vars.colors.grey0}}>
                      <Select style={{width: "10px"}}/>
                    </div>
                    <div hidden={false}>
                    {classOPtions.map((Class) =>
                    <div onClick={this.onToggleClassSelection}
                      style={{
                        textAlign: "center",
                        padding: `${Styles.vars.spacing.xs}`,
                        color: Styles.vars.colors.black,
                        backgroundColor: (selectedClasses.includes(Class.props.value))? Styles.vars.colors.blue : Styles.vars.colors.grey0,
                        cursor: "pointer",
                        }}>
                        <body class_name ={Class} style={{color: Styles.vars.colors.black}}>{Class}</body>
                    </div>
                    )}
                    </div>
            </Label>

      </Column>
      <Column>

      </Column>
      </Columns>


      <div hidden={!this.state.targeting_controls_enabled}>
      <ButtonMenu>
            <Button onClick={() => sendTriggerMsg(this.props.targetingNamespace + "/save_config")}>{"Save Config"}</Button>
      </ButtonMenu>

      <ButtonMenu>
            <Button onClick={() => sendTriggerMsg( this.props.targetingNamespace + "/reset_config")}>{"Reset Config"}</Button>
      </ButtonMenu>
      
      </div>


{/*

      <div hidden={!this.state.show_targeting_controls}>

          <Columns>
          <Column>
            <Label title="Clip Range Enabled">
                  <Toggle
                  checked={this.state.range_clip_enabled===true}
                  onClick={() => sendBoolMsg(this.props.processNamespace + "/set_clip_range_enable",!this.state.range_clip_enabled)}>
                  </Toggle>
            </Label>

            <Label title={"Set Range Clip Ranges (m)"}>AiTargetingStatus

           </Column>
          </Columns>

          <Columns>
          <Column>


          <Label title={"Set Range Clip Min"}>
                    <Input id="set_range_clip_min" 
                      value={this.state.range_clip_min_m} 
                      onChange={(event) => onUpdateSetStateValue.bind(this)(event,"range_clip_min_m")} 
                      onKeyDown= {(event) => this.onEnterSendInputBoxRangeWindowValue(event,"/set_range_clip_m","min")} />
              </Label>
            
              </Column>
              <Column>
                  <Label title={"Set Range Clip Max"}>
                    <Input id="set_range_clip_max" 
                     value={this.state.range_clip_max_m} 
                      onChange={(event) => onUpdateSetStateValue.bind(this)(event,"range_clip_max_m")} 
                      onKeyDown= {(event) => this.onEnterSendInputBoxRangeWindowValue(event,"/set_range_clip_m","max")} />                      
                  </Label>  

           </Column>
          </Columns>  

          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>    


          <Columns>
            <Column>

              <Label title={"Pointclud Filtering"}></Label>
                      
              <Label title={"Outlier Removal k Points"}>
                <Input id="outlier_k_points" 
                  value={this.state.outlier_k_points} 
                  onChange={(event) => onUpdateSetStateValue.bind(this)(event,"outlier_k_points")} 
                  onKeyDown= {(event) => onEnterSendIntValue.bind(this)(event,this.props.processNamespace + "/outlier_removal_num_neighbors")} />
              </Label>

              <Label title={"Voxel Downsample Size (m)"}>
                <Input id="voxel_downsample_size_m" 
                  value={this.state.voxel_downsample_size_m} 
                  onChange={(event) => onUpdateSetStateValue.bind(this)(event,"voxel_downsample_size_m")} 
                  onKeyDown= {(event) => onEnterSendFloatValue(event,this.props.processNamespace + "/set_voxel_downsample_size")} />
              </Label>

            </Column>
            <Column>

            </Column>
          </Columns>  

        </div>
*/}
      </Section>
    )
  }

}
export default NepIAppAiTargeting
