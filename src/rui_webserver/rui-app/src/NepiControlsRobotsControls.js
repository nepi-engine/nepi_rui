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
import BooleanIndicator from "./BooleanIndicator"

import { round, convertStrToStrList, createShortValuesFromNamespaces, createMenuListFromStrList,
  onDropdownSelectedSendStr, onDropdownSelectedSetState, onDropdownSelectedSendIndex,
  onUpdateSetStateValue, onEnterSendFloatValue, onEnterSetStateFloatValue,
  onChangeSwitchStateValue,
  doNothing} from "./Utilities"

@inject("ros")
@observer

// Component that contains RBX Controls
class NepiRobotControls extends Component {
  constructor(props) {
    super(props)

    // these states track the values through  Status messages
    this.state = {
      show_process_controls: false,

      current_lat: null,
      current_long: null,
      current_altitude: null,
      current_heading: null,
      current_roll: null,
      current_pitch: null,
      current_yaw: null, 
      process_current: null,
      process_last: null,
      ready: null,
      battery: null,
      errors_current: [0,0,0,0,0,0,0],
      errors_prev: [0,0,0,0,0,0,0],
      cmd_success: null,
      manual_ready: null,
      autonomous_ready: null,
      manual_ready:null,
      last_cmd_str: null,
      last_error_message: null,

      rbx_capabilities: null,
      has_battery_feedback: null,
      has_motor_controls: null,
      has_autonomous_controls: null,
      has_set_home: null,
      has_go_home: null,
      has_go_stop: null,
      has_goto_pose: null,
      has_goto_position: null,
      has_goto_location: null,
      has_fake_gps: null,

      action_options: null,
      data_products: null,

      controls_type_list: null,
      controls_type_menu: null,
      selected_control_type: null,

      controls_auto_list: null,
      controls_auto_menu: null,
      selected_auto_control: null,
      actions_list: null,
      actions_menu: null,
      selected_action: null,
      selected_action_index: null,
    
 
      controlsStatusListener : null,

      roll_deg: 0,
      pitch_deg: 0,
      yaw_deg_pose: 0,

      x_meters: 0,
      y_meters: 0,
      z_meters: 0,
      yaw_deg_position: 0,

      location_lat: 0,
      location_long: 0,
      altitude_meters: 0,
      yaw_deg_location: 0,

    }


    this.updateControlsStatusListener = this.updateControlsStatusListener.bind(this)
    this.controlsStatusListener = this.controlsStatusListener.bind(this)

    this.SetLocationCurrent = this.SetLocationCurrent.bind(this)
    this.onDropdownSelectedAction = this.onDropdownSelectedAction.bind(this)
    this.sendActionIndex = this.sendActionIndex.bind(this)
  }



  // Callback for handling ROS Status messages
  controlsStatusListener(message) {
    const {rbxRobots} = this.props.ros
    this.setState({
      current_lat: message.current_lat ,
      current_long: message.current_long ,
      current_altitude: message.current_altitude ,
      current_heading: message.current_heading ,
      current_roll: message.current_roll ,
      current_pitch: message.current_pitch ,
      current_yaw: message.current_yaw , 
      process_current: message.process_current ,
      process_last: message.process_last ,
      ready: message.ready ,
      battery: message.battery ,
      errors_current_x:[message.errors_current.x_m],
      errors_current_x:[message.errors_current.y_m],
      errors_current_x:[message.errors_current.z_m],
      errors_current_x:[message.errors_current.heading_deg],
      errors_current_x:[message.errors_current.roll_deg],
      errors_current_x:[message.errors_current.pitch_deg],
      errors_current_x: [message.errors_current.yaw_deg],
      errors_prev: [message.errors_prev.x_m ,message.errors_prev.x_m, message.errors_prev.x_m, message.errors_prev.heading_deg, message.errors_prev.roll_deg, message.errors_prev.pitch_deg, message.errors_prev.yaw_deg],
      cmd_success: message.cmd_success ,
      manual_ready: message.manual_motor_control_mode_ready ,
      autonomous_ready: message.autonomous_control_mode_ready ,
      manual_ready: message.manual_motor_control_mode_ready,

      last_cmd_str: message.last_cmd_string ,
      last_error_message: message.last_error_message 
    })
    const motorControlsStrList = message.current_motor_control_settings
    if (this.state.rbx_capabilities === null){
      const capabilities = rbxRobots[this.props.rbxNamespace]
      if (capabilities){
        const actions=convertStrToStrList(capabilities.action_options)
        const actions_menu_options=createMenuListFromStrList(actions,false,[],[],[])
        
        this.setState({ 
          rbx_capabilities: capabilities,
          has_battery_feedback: capabilities.has_battery_feedback,
          has_motor_controls: capabilities.has_motor_controls,
          has_autonomous_controls: capabilities.has_autonomous_controls,
          has_set_home: capabilities.has_set_home,
          has_go_home: capabilities.has_go_home,
          has_go_stop: capabilities.has_go_stop,
          has_goto_pose: capabilities.has_goto_pose,
          has_goto_position: capabilities.has_goto_position,
          has_goto_location: capabilities.has_goto_location,
          has_fake_gps: capabilities.has_fake_gps,
          action_options: capabilities.action_options,
          actions_list: actions,
          actions_menu: actions_menu_options,

          data_products: capabilities.data_products,
        })
        var controls_type_list = ["None"]
        if (this.state.has_motor_controls){
          controls_type_list.push("Manual")
        }
        if (this.state.has_autonomous_controls){
          controls_type_list.push("Autonomous")
        }
        const controls_type_menu = createMenuListFromStrList(controls_type_list,false,[],[],[])
        this.setState({
          controls_type_list: controls_type_list,
          controls_type_menu: controls_type_menu
        })
      }

      var controls_auto_list = ["None", "Action"]
      if (this.state.has_goto_pose){
        controls_auto_list.push("Pose")
      }
      if (this.state.has_goto_position){
        controls_auto_list.push("Position")
      }
      if (this.state.has_goto_location){
        controls_auto_list.push("Location")
      }
      const controls_auto_menu = createMenuListFromStrList(controls_auto_list,false,[],[],[])
      this.setState({
        controls_auto_list: controls_auto_list,
        controls_auto_menu: controls_auto_menu
      })

    }
  }

  // Function for configuring and subscribing to Status
  updateControlsStatusListener() {
    const Namespace = this.props.rbxNamespace
    if (this.state.controlsStatusListener ) {
      this.state.controlsStatusListener .unsubscribe()
    }
    var listener = this.props.ros.setupStatusListener(
          Namespace + "/rbx/status",
          "nepi_ros_interfaces/RBXStatus",
          this.controlsStatusListener
        )
    this.setState({ controlsStatusListener : listener})
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { rbxNamespace } = this.props
    if (prevProps.rbxNamespace !== rbxNamespace && rbxNamespace !== null) {
      if (rbxNamespace.indexOf('null') === -1){
        this.updateControlsStatusListener()
        this.render()
      } 
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.controlsStatusListener ) {
      this.state.controlsStatusListener .unsubscribe()
    }
  }

  
  sendActionIndex(){
  const {sendIntMsg} = this.props.ros
  const namespace = this.props.rbxNamespace + "/rbx/go_action"
  if (this.state.selected_action_index !== null) {
      sendIntMsg(namespace,this.state.selected_action_index)
    }
  }

  onDropdownSelectedAction(event) {
    this.setState({
      selected_action: event.target.value,
      selected_action_index: event.target.selectedIndex
    })
  }

  SetLocationCurrent(event) {
    this.setState({
      location_lat: this.state.current_lat,
      location_long: this.state.current_long,
      altitude_meters: this.state.current_altitude,
      yaw_deg_location: this.state.current_yaw,
    })
  }


  render() {
    const {  sendTriggerMsg, sendFloatGotoPoseMsg, sendFloatGotoPositionMsg, sendFloatGotoLocationMsg } = this.props.ros
    const NoneOption = <Option>None</Option>

    return (
      <Section title={"Process Controls"}>

                     <Label title="Show Process Controls">
                    <Toggle
                      checked={this.state.show_process_controls===true}
                      onClick={() => onChangeSwitchStateValue.bind(this)("show_process_controls",this.state.show_process_controls)}>
                    </Toggle>
                  </Label>

                  <div hidden={!this.state.show_process_controls}>

       <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>


            <Columns>
            <Column>

            <Label title={"System Ready"}>
              <BooleanIndicator value={(this.state.ready !== null)? this.state.ready : false} />
            </Label>

            <Label title={"Select Control Type"}>
                    <Select
                      id="selected_control_type"
                      onChange={(event) => onDropdownSelectedSetState.bind(this)(event,"selected_control_type")}
                      value={this.state.selected_control_type}
                    >
                      {this.state.controls_type_list ? this.state.controls_type_menu : NoneOption}
                    </Select>
                    </Label>


            </Column>
            <Column>

            <Label title={"Current Process"}>
              <Input
                disabled value={this.state.process_current}
                id="current_process"
              />
            </Label>

            </Column>
            </Columns>

            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>


            <div hidden={(this.state.selected_control_type!=="Autonomous")}>
            <Columns>
            <Column>

            <Label title={"Autonomous Ready"}>
              <BooleanIndicator value={(this.state.autonomous_ready !== null)? this.state.autonomous_ready : false} />
            </Label>


            </Column>
            <Column>

            <ButtonMenu>
                <Button onClick={() => sendTriggerMsg(this.props.rbxNamespace + "/rbx/go_stop")}>{"stop"}</Button>
            </ButtonMenu>

            </Column>
            <Column>

            <div hidden={(!this.state.has_go_home)}>
            <ButtonMenu>
                <Button onClick={() => sendTriggerMsg(this.props.rbxNamespace + "/rbx/go_home")}>{"Go Home"}</Button>
            </ButtonMenu>
            </div>

            </Column>
            </Columns>
            </div>

            <div hidden={(this.state.selected_control_type!=="Autonomous")}>
            <Columns>
            <Column>
            <Label title={"Select Goto Type"}>
              <Select
                id="selected_auto_control"
                onChange={(event) => onDropdownSelectedSetState.bind(this)(event,"selected_auto_control")}
                value={this.state.selected_auto_control}
              >
                {this.state.controls_auto_list ? this.state.controls_auto_menu : NoneOption}
              </Select>
              </Label>

              </Column>
              <Column>
            </Column>
            </Columns>

            <Label title={""}></Label>

            <div hidden={(this.state.selected_auto_control!=="Pose")}>

            <label style={{fontWeight: 'bold'}}>
                {"GoTo Pose"}
              </label>
            <Columns>
            <Column>

            <Label title={"Roll Deg"}>
                <Input
                  value={this.state.roll_deg}
                  id="roll_deg"
                  onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"roll_deg")}
                  onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"roll_deg")}
                  style={{ width: "80%" }}
                />
              </Label>

            </Column>
            <Column>

            <Label title={"Pitch Deg"}>
                <Input
                  value={this.state.pitch_deg}
                  id="pitch_deg"
                  onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"pitch_deg")}
                  onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"pitch_deg")}
                  style={{ width: "80%" }}
                />
              </Label>

            </Column>
            <Column>

            <Label title={"Yaw Deg"}>
                <Input
                  value={this.state.yaw_deg}
                  id="yaw_deg"
                  onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"yaw_deg_position")}
                  onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"yaw_deg_pose")}
                  style={{ width: "80%" }}
                />
              </Label>

              </Column>
              <Column>

              <ButtonMenu>
                <Button onClick={() => this.state.autonomous_ready ? 
                  sendFloatGotoPoseMsg(this.props.rbxNamespace + "/rbx/goto_pose", this.state.roll_deg, this.state.pitch_deg, this.state.yaw_deg_pose ) :
                  doNothing()
                  }>{"Send"}</Button>
              </ButtonMenu>


            </Column>
            </Columns>
            </div>

              
              
              

              <div hidden={(this.state.selected_auto_control!=="Position")}>
            <label style={{fontWeight: 'bold'}}>
                {"GoTo Position"}
              </label>

            <Columns>
            <Column>

            <Label title={"X (m)"}>
                <Input
                  value={this.state.x_meters}
                  id="x_meters"
                  onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"x_meters")}
                  onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"x_meters")}
                  style={{ width: "80%" }}
                />
              </Label>

            </Column>
            <Column>

            <Label title={"Y (m)"}>
                <Input
                  value={this.state.y_meters}
                  id="y_meters"
                  onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"y_meters")}
                  onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"y_meters")}
                  style={{ width: "80%" }}
                />
              </Label>

            </Column>
            <Column>

            <Label title={"Z (m)"}>
                <Input
                  value={this.state.z_meters}
                  id="z_meters"
                  onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"z_meters")}
                  onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"z_meters")}
                  style={{ width: "80%" }}
                />
              </Label>

              </Column>
              <Column>

              <Label title={"Yaw Deg"}>
                <Input
                  value={this.state.yaw_deg_position}
                  id="yaw_deg_position"
                  onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"yaw_deg_position")}
                  onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"yaw_deg_position")}
                  style={{ width: "80%" }}
                />
              </Label>

              <ButtonMenu>
                <Button onClick={() =>  this.state.autonomous_ready ? 
                  sendFloatGotoPositionMsg(this.props.rbxNamespace + "/rbx/goto_position", this.state.x_meters, this.state.y_meters, this.state.z_meters, this.state.yaw_deg_position ):
                  doNothing()
                  }>{"Send"}</Button>
              </ButtonMenu>

            </Column>
            </Columns>
            </div>             

              <div hidden={(this.state.selected_auto_control!=="Location")}>
            <label style={{fontWeight: 'bold'}}>
                {"GoTo Location"}
              </label>
            <Columns>
            <Column>

            <Label title={"Latitude"}>
                <Input
                  value={this.state.location_lat}
                  id="location_lat"
                  onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"location_lat")}
                  onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"location_lat")}
                  style={{ width: "80%" }}
                />
              </Label>

              <ButtonMenu>
                <Button onClick={() => this.SetLocationCurrent()}>{"Set to Current"}</Button>
              </ButtonMenu>

            </Column>
            <Column>

            <Label title={"Longitude"}>
                <Input
                  value={this.state.location_long}
                  id="location_long"
                  onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"location_long")}
                  onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"location_long")}
                  style={{ width: "80%" }}
                />
              </Label>

            </Column>
            <Column>

            <Label title={"Altitude (m)"}>
                <Input
                  value={this.state.altitude_meters}
                  id="altitude_meters"
                  onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"altitude_meters")}
                  onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"altitude_meters")}
                  style={{ width: "80%" }}
                />
              </Label>

              </Column>
              <Column>

              <Label title={"Yaw Deg"}>
                <Input
                  value={this.state.yaw_deg_location}
                  id="yaw_deg_location"
                  onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"yaw_deg_location")}
                  onKeyDown= {(event) => onEnterSetStateFloatValue.bind(this)(event,"yaw_deg_location")}
                  style={{ width: "80%" }}
                />
              </Label>

              <ButtonMenu>
                <Button onClick={() =>  this.state.autonomous_ready ? 
                  sendFloatGotoLocationMsg(this.props.rbxNamespace + "/rbx/goto_location", this.state.location_lat, this.state.location_long, this.state.altitude_meters, this.state.yaw_deg_location ):
                  doNothing()
                }>{"Send"}</Button>
              </ButtonMenu>

            </Column>
            </Columns>
            </div>

            <Columns>
            <Column>
            <div hidden={(this.state.selected_auto_control!=="Action")}>
            <Label title={"Select Action"}>
              <Select
                id="action_select"
                onChange={(event) => this.onDropdownSelectedAction(event)}
                value={this.state.selected_action}
              >
                {this.state.actions_list ? this.state.actions_menu : NoneOption}
              </Select>
              </Label>
              </div>

              
              </Column>
              <Column>

            <div hidden={(this.state.selected_auto_control!=="Action")}>
            <ButtonMenu>
              <Button onClick={() =>  this.state.autonomous_ready ? 
                this.sendActionIndex():
                doNothing()
              }>{"Send Action"}</Button>
            </ButtonMenu>
            </div>

            </Column>
            </Columns>

            </div>

            <Columns>
            <Column>

            <div hidden={(this.state.selected_control_type!=="Manual")}>
            <Label title={"Manual Ready"}>
              <BooleanIndicator value={(this.state.manual_ready !== null)? this.state.manual_ready : false} />
            </Label>
            </div>

            <Label title={""}></Label>

            </Column>
            </Columns>
            <Columns>
            <Column>
            </Column>
            <Column>
            </Column>
            <Column>

            <Label title={"CMD Success"}>
              <BooleanIndicator value={(this.state. cmd_success !== null)? this.state. cmd_success : false} />
            </Label>

            </Column>
            </Columns>


            <label style={{fontWeight: 'bold'}}>
              {"Current Error: x(m), y(m), z(m), Heading(deg), Roll(deg), Pitch(deg),Yaw(deg)"}
            </label>



            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>


            <Columns>
            <Column>

            <label style={{fontWeight: 'bold'}}>
             {"Errors"}
            </label>



            </Column>
            </Columns>

            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

            <Columns>
            <Column>

            </Column>
            <Column>

            <Columns>
            <Column>

            <Label title={"Last Command"}>
              <Input
                disabled value={this.state.last_cmd_str}
                id="last_command"
              />
            </Label>
            </Column>
            </Columns>

            </Column>
            </Columns>

            <label style={{fontWeight: 'bold'}}>
              {"Nave Pose"}
            </label>

            <Columns>
            <Column>
          
            <Label title={"Latitude"}>
              <Input
                disabled value={this.state.current_lat}
                id="InitLatitude"
              />

            </Label>
            <Label title={"Longitude"}>
              <Input
                disabled value={this.state.current_long}
                id="InitLongitude"
              />

            </Label>
            <Label title={"Altitude (m)"}>
              <Input
                disabled value={this.state.current_altitude}
                id="InitAltitude"
              />

            </Label>
            </Column>
            <Column>
            <Label title={"Roll (deg)"}>
              <Input
                disabled value={this.state.current_roll}
                id="InitRoll"
              />

              </Label>
              <Label title={"Pitch (deg)"}>
                <Input
                  disabled value={this.state.current_pitch}
                  id="InitPitch"
                />

              </Label>
              <Label title={"Yaw (deg)"}>
                <Input
                  disabled value={this.state.current_yaw}
                  id="InitYaw"
                />
              </Label>

              </Column>
              </Columns>



              <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

              <Label title={"Current Battery"}>
                <Input 
                disabled value={this.state.battery}
                  id="current_battery"
                />
              </Label>

              <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
              </div>

      </Section>
    )
  }

}
export default NepiRobotControls
