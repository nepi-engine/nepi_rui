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
import {SliderAdjustment} from "./AdjustmentWidgets"
import Label from "./Label"
import { Column, Columns } from "./Columns"
import Input from "./Input"
import Select, { Option } from "./Select"
import Styles from "./Styles"
import BooleanIndicator from "./BooleanIndicator"

import { convertStrToStrList, createMenuListFromStrList, onDropdownSelectedSendStr, onUpdateSetStateValue, onEnterSendFloatValue, onEnterSendIntValue} from "./Utilities"

@inject("ros")
@observer

// Component that contains the  Pointcloud App Viewer Controls
class NepiAppAiTargetingControls extends Component {
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
      target_min_px_ratio: null,
      target_min_dist_m: null,
      target_age_filter: null,

      target_box_size_percent: null,
      pc_box_size_percent: null,

      current_targets_list: [],
      lost_targets_list: [],
      

      targeting_controls_running: false,
      targetingListener: null,
      viewableTopics: false,




    }
  
    this.targetingListenerFunc = this.targetingListenerFunc.bind(this)
    this.updatetargetingListenerFunc = this.updatetargetingListenerFunc.bind(this)
    this.onToggleClassSelection = this.onToggleClassSelection.bind(this)
    this.getClassOptions = this.getClassOptions.bind(this)
    this.toggleViewableTopics = this.toggleViewableTopics.bind(this)


  }

  // Callback for handling ROS Status messages
  targetingListenerFunc(message) {
    this.setState({

targeting_controls_running: message.targeting_running,
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
target_min_px_ratio: message.target_min_px_ratio,
target_min_dist_m: message.target_min_dist_m,
target_age_filter: message.target_age_filter,
target_box_size_percent: message.target_box_size_percent,
pc_box_size_percent: message.pointcloud_box_size_percent,

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

  toggleViewableTopics() {
    const set = !this.state.viewableTopics
    this.setState({viewableTopics: set})
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
    
    const {  sendTriggerMsg,} = this.props.ros
    const classOPtions = this.getClassOptions()
    const selectedClasses = this.state.selected_classes_list
    const NoneOption = <Option>None</Option>
    return (
      <Section title={"Targeting Controls"}>

                    <Columns>
                    <Column>
        <Label title={"Targeting System Running"}>
              <BooleanIndicator value={(this.state.targeting_controls_running !== null)? this.state.targeting_controls_running : false} />
            </Label>


          </Column>
          <Column>

          <ButtonMenu>
            <Button onClick={() => sendTriggerMsg( this.props.targetingNamespace + "/reset_app")}>{"Reset App"}</Button>
          </ButtonMenu>

          </Column>
          </Columns>
      
            <Columns>
            <Column>

            <Label title="Select Target Class Filter"> </Label>

                    <div onClick={this.toggleViewableTopics} style={{backgroundColor: Styles.vars.colors.grey0}}>
                      <Select style={{width: "10px"}}/>
                    </div>
                    <div hidden={this.state.viewableTopics === false}>
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

              </Column>
              <Column>

              <Label title=""> </Label>
              <Label title=""> </Label>
              <Label title=""> </Label>

              <Label title="Select Target Filter"> 

                <Select
                  id="select_target"
                  onChange={(event) => onDropdownSelectedSendStr.bind(this)(event, this.props.targetingNamespace + "/select_target")}
                  value={this.state.selected_target}
                >
                  {this.state.available_targets_list
                    ? createMenuListFromStrList(this.state.available_targets_list, false, [],[],[])
                    : NoneOption}
                </Select>
                </Label>

              </Column>
              </Columns>

      <Columns>
      <Column>


      <Label title={"Vertical Degrees"}>
          <Input id="image_fov_vert_degs" 
            value={this.state.image_fov_vert_degs} 
            onChange={(event) => onUpdateSetStateValue.bind(this)(event,"image_fov_vert_degs")} 
            onKeyDown= {(event) => onEnterSendFloatValue.bind(this)(event,this.props.targetingNamespace + "/set_image_fov_vert")} />
        </Label>
           
        <Label title={"Horzontal Degrees"}>
          <Input id="image_fov_horz_degs" 
            value={this.state.image_fov_horz_degs} 
            onChange={(event) => onUpdateSetStateValue.bind(this)(event,"image_fov_vert_degs")} 
            onKeyDown= {(event) => onEnterSendFloatValue.bind(this)(event,this.props.targetingNamespace + "/set_image_fov_horz")} />
        </Label>

        <Label title={"Default Target Depth (m)"}>
          <Input id="default_target_depth_m" 
            value={this.state.default_target_depth_m} 
            onChange={(event) => onUpdateSetStateValue.bind(this)(event,"default_target_depth_m")} 
            onKeyDown= {(event) => onEnterSendFloatValue.bind(this)(event,this.props.targetingNamespace + "/set_default_target_detpth")} />
        </Label>

        <Label title={"Target Min Points"}>
          <Input id="target_min_points" 
            value={this.state.target_min_points} 
            onChange={(event) => onUpdateSetStateValue.bind(this)(event,"target_min_points")} 
            onKeyDown= {(event) => onEnterSendIntValue.bind(this)(event,this.props.targetingNamespace + "/set_target_min_points")} />
        </Label>

        <Label title={"Target Min Dist (m)"}>
          <Input id="target_min_dist_m" 
            value={this.state.target_min_dist_m} 
            onChange={(event) => onUpdateSetStateValue.bind(this)(event,"target_min_dist_m")} 
            onKeyDown= {(event) => onEnterSendFloatValue.bind(this)(event,this.props.targetingNamespace + "/set_target_min_dist_meters")} />
        </Label>

        <Label title={"Target Age Filter"}>
          <Input id="target_age_filter" 
            value={this.state.target_age_filter} 
            onChange={(event) => onUpdateSetStateValue.bind(this)(event,"target_age_filter")} 
            onKeyDown= {(event) => onEnterSendFloatValue.bind(this)(event,this.props.targetingNamespace + "/set_age_filter")} />
        </Label>

        <Label title={"Set Box Adjust %"}>
          <Input id="target_box_size_percent" 
            value={this.state.target_box_size_percent} 
            onChange={(event) => onUpdateSetStateValue.bind(this)(event,"target_box_size_percent")} 
            onKeyDown= {(event) => onEnterSendIntValue.bind(this)(event,this.props.targetingNamespace + "/set_target_box_size_percent")} />
        </Label>


        <Label title={"Pountcloud Clip Adjust %"}>
          <Input id="pc_box_size_percent" 
            value={this.state.pc_box_size_percent} 
            onChange={(event) => onUpdateSetStateValue.bind(this)(event,"pc_box_size_percent")} 
            onKeyDown= {(event) => onEnterSendIntValue.bind(this)(event,this.props.targetingNamespace + "/set_pointcloud_box_size_percent")} />
        </Label>

        <SliderAdjustment
          title={"Target Min Pixel Ratio"}
          msgType={"std_msgs/float32"}
          adjustment={this.state.target_min_px_ratio}
          topic={this.props.targetingNamespace + "/set_target_min_px_ratio"}
          scaled={0.01}
          min={0}
          max={100}
          tooltip={""}
          unit={"%"}
      />

      </Column>
      </Columns>

      <Columns>
      <Column>

      <ButtonMenu>
            <Button onClick={() => sendTriggerMsg(this.props.targetingNamespace + "/save_config")}>{"Save Config"}</Button>
      </ButtonMenu>

      </Column>
      <Column>

      <ButtonMenu>
            <Button onClick={() => sendTriggerMsg( this.props.targetingNamespace + "/reset_config")}>{"Reset Config"}</Button>
      </ButtonMenu>

      </Column>
      <Column>



       </Column>
      </Columns>



      </Section>
    )
  }

}
export default NepiAppAiTargetingControls
