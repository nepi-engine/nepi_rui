/*
#
# Copyright (c) 2024 Numurus <https://www.numurus.com>.
#
# This file is part of nepi rui (nepi_rui) repo
# (see https://github.com/nepi-engine/nepi_rui)
#
# License: NEPI RUI repo source-code and NEPI Images that use this source-code
# are licensed under the "Numurus Software License", 
# which can be found at: <https://numurus.com/wp-content/uploads/Numurus-Software-License-Terms.pdf>
#
# Redistributions in source code must retain this top-level comment block.
# Plagiarizing this software to sidestep the license obligations is illegal.
#
# Contact Information:
# ====================
# - mailto:nepi@numurus.com
#
 */
import React, { Component } from "react"
//Unused import Toggle from "react-toggle"
import { observer, inject } from "mobx-react"

import Input from "./Input"
import Section from "./Section"
//Unused import Button, { ButtonMenu } from "./Button"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Styles from "./Styles"
//Unused import Select, { Option } from "./Select"
//Unused import {setElementStyleModified, clearElementStyleModified} from "./Utilities"

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer
class NepiIFNavPoseViewer extends Component {
  constructor(props) {
    super(props)

    this.state = {


      mgrName: "navpose_mgr",
      navposesNamespace: null,
      base_namespace: null,

      show_navpose: this.props.show_navpose ? this.props.show_navpose : true,

      message: null,

      listener: null,

      disabled: false,

      connected: false,
      statusListener: null,
      status_msg: null,

      dataListener: null,
      navpose_msg: null,
      navpose_dict: null,

      needs_update: true,
      nav_needs_update: true  
    }


    this.renderNavPose = this.renderNavPose.bind(this)
    this.navposeStatusListener = this.navposeStatusListener.bind(this)
    this.navposeDataListener = this.navposeDataListener.bind(this)
    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.updateNavposeListener = this.updateNavposeListener.bind(this)

  }

  // Callback for handling ROS StatusNPX messages
  navposeStatusListener(message) {

    if (message.navposes_topic === this.state.navposesNamespace) {
      const is_navposes = (this.props.is_navposes != undefined) ? this.props.is_navposes : false
      const selected_frame = (this.props.selected_frame != undefined) ? this.props.selected_frame : this.state.selected_frame
      var status_msg = null
      var frames_list = null
      var frame_index = 0
      if (is_navposes === true){
        frames_list = message.navpose_frames
        frame_index = frames_list.indexOf(selected_frame)
        if ( frame_index !== -1  && selected_frame !== 'None'){
          status_msg = message.navpose_statuses[frame_index]
        }
      }
      else {
        status_msg = message
      }
      this.setState({
        status_msg: status_msg, 
        connected: true
      })
    }
  }

  navposeDataListener(message) {
    //console.log("=====navposeDataListener called=====" + message)
    //console.log("navposeDataListener msg: " + message)
    //Unused const last_navpose_msg = this.state.navpose_msg

    const is_navposes = (this.props.is_navposes != undefined) ? this.props.is_navposes : false
    const selected_frame = (this.props.selected_frame != undefined) ? this.props.selected_frame : this.state.selected_frame
    var navpose_msg = null
    var frames_list = null
    var frame_index = 0
    if (is_navposes === true){
      frames_list = message.navpose_frames
      frame_index = frames_list.indexOf(selected_frame)
      if ( frame_index !== -1 && selected_frame !== 'None'){
        navpose_msg = message.navposes[frame_index]
      }
      else {
        this.setState({ 
          navpose_data: null,
          nav_needs_update: true 
        })        
      }
    }
    else {
      navpose_msg = message
    }
          
    if (navpose_msg != null){
      const navpose_data = {
        navpose_frame: navpose_msg.navpose_frame,
        navpose_description: navpose_msg.navpose_description,
        frame_nav: navpose_msg.frame_nav,
        frame_alt: navpose_msg.frame_alt,
        latitude: navpose_msg.latitude,
        longitude: navpose_msg.longitude,
        altitude: navpose_msg.altitude_m,
        heading: navpose_msg.heading_deg,
        roll: navpose_msg.roll_deg,
        pitch: navpose_msg.pitch_deg,
        yaw: navpose_msg.yaw_deg,
        x_m: navpose_msg.x_m,
        y_m: navpose_msg.y_m,
        z_m: navpose_msg.z_m,
        pan: navpose_msg.pan_deg,
        tilt: navpose_msg.tilt_deg
      }


      this.setState({
        navpose_msg: message,
        navpose_data: navpose_data, 
        connected: true
      })
    }
  }

  updateStatusListener() {
      //console.log("=====updateStatusListener called=====");
      const navposesNamespace = this.state.navposesNamespace 
      const navposeTopic = navposesNamespace + '/status'
      const is_navposes = (this.props.is_navposes != undefined) ? this.props.is_navposes : false
      var statusListener = null
      if (this.state.statusListener) {
        this.state.statusListener.unsubscribe()
      }

    if (navposesNamespace !== 'None' && navposesNamespace != null){
      if (is_navposes === true) {
        statusListener = this.props.ros.setupStatusListener(
          navposeTopic,
          "nepi_interfaces/NavPosesStatus",
          this.navposeStatusListener 
        )
      }
      else {
        statusListener = this.props.ros.setupStatusListener(
          navposeTopic,
          "nepi_interfaces/NavPoseStatus",
          this.navposeStatusListener 
        )
      }
      
      this.setState({ 
        statusListener: statusListener,
      })
    }
    this.setState({ 
      navpose_data: null,
      nav_needs_update: false 
    })
  }

  updateNavposeListener() {
    const navposesNamespace = this.state.navposesNamespace
    const is_navposes = (this.props.is_navposes != undefined) ? this.props.is_navposes : false
    if (this.state.dataListener) {
      this.state.dataListener.unsubscribe()
    }
    var dataListener = null
    if (navposesNamespace !== 'None' && navposesNamespace != null){
      if (is_navposes === true) {
        dataListener = this.props.ros.dataListener(
          navposesNamespace,
          "nepi_interfaces/NavPoses",
          this.navposeDataListener 
        )
      }
      else {
        dataListener = this.props.ros.dataListener(
          navposesNamespace,
          "nepi_interfaces/NavPose",
          this.navposeDataListener 
        )

      }
      
      this.setState({ 
        dataListener: dataListener,
      })
    }
    this.setState({ 
      navpose_data: null,
      nav_needs_update: false 
    })
    
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    var navposesNamespace = (this.props.navposesNamespace != undefined) ? this.props.navposesNamespace : null
    if (prevState.navposesNamespace !== navposesNamespace ){
      if (navposesNamespace != null) {
        this.setState({
          navposesNamespace: navposesNamespace,
        })
        this.updateStatusListener()
        this.updateNavposeListener()
      } 
      else if (navposesNamespace == null){
        this.setState({ disabled: true })
      }
    }
  }
  
  
  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to StatusNPX message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
    if (this.state.dataListener) {
      this.state.dataListener.unsubscribe()
    }
  }


  renderNavPose() {
    const navpose_data = this.state.navpose_data

    if (navpose_data == null) {

      return(
        <Columns>
          <Column>

          </Column>
        </Columns>
      )

    }
    else {
          //Unused const navpose_frame = navpose_data ? navpose_data.navpose_frame : null
          const frame_nav = navpose_data ? navpose_data.frame_nav : null
          const frame_alt = navpose_data ? navpose_data.frame_alt : null
          const lat = navpose_data ? navpose_data.latitude : null
          const long = navpose_data ? navpose_data.longitude : null
          const alt = navpose_data ? navpose_data.altitude : null
          const head = navpose_data ? navpose_data.heading : null
          const x_m = navpose_data ? navpose_data.x_m : null
          const y_m = navpose_data ? navpose_data.y_m : null
          const z_m = navpose_data ? navpose_data.z_m : null
          const roll = navpose_data ? navpose_data.roll : null
          const pitch = navpose_data ? navpose_data.pitch : null
          const yaw = navpose_data ? navpose_data.yaw : null
          const pan = navpose_data ? navpose_data.pan : null
          const tilt = navpose_data ? navpose_data.tilt : null
          return (
              <Columns>
                <Column>
                  <label style={{fontWeight: 'bold'}}>
                    {"Location"}
                  </label>
                  <Label title={"Latitude"}>
                    <Input
                      disabled
                      value={round(lat, 6)}
                      style={{ width: "80%" }}
                    />
                  </Label>
                  <Label title={"Longitude"}>
                    <Input
                      disabled
                      value={round(long, 6)}
                      style={{ width: "80%" }}
                    />
                  </Label>
                  <Label title={"Altitude " + frame_alt + " (m)"}>
                    <Input
                      disabled
                      value={round(alt, 2)}
                      style={{ width: "80%" }}
                    />
                  </Label>

                  <Label title={"Heading (deg)"}>
                    <Input
                      disabled
                      style={{ width: "80%" }}
                      value={round(head, 2)}
                    />
                  </Label>

                </Column>
                <Column>
                  <div style={{ display: "flex", marginLeft: Styles.vars.spacing.regular }}>
                    <label style={{fontWeight: 'bold', flex: 1, textAlign: "left"}}>
                    {"Orientation Frame " + frame_nav}
                    </label>
                  </div>
                  <Label title={"Roll Degs"}>
                    <Input
                      disabled
                      style={{ width: "45%", float: "left" }}
                      value={round(roll, 2)}
                    />
                  </Label>
                  <Label title={"Pitch Degs"}>
                    <Input
                      disabled
                      style={{ width: "45%", float: "left" }}
                      value={round(pitch, 2)}
                    />

                  </Label>
                  <Label title={"Yaw Degs"}>
                    <Input
                      disabled
                      style={{ width: "45%", float: "left" }}
                      value={round(yaw, 2)}
                    />
                  </Label>

                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                  <Label title={"Pan Degs"}>
                    <Input
                      disabled
                      style={{ width: "45%", float: "left" }}
                      value={round(pan, 2)}
                    />
                  </Label>
      {/*
                  <Label title={"Ref. Frame"}>
                    <Input
                      disabled
                      style={{ width: "80%" }}
                      value={navPoseOrientationFrame}
                    />
                  </Label>
      */}
                  </Column>
                <Column>
                  <div style={{ display: "flex", marginLeft: Styles.vars.spacing.regular }}>
                    <label style={{fontWeight: 'bold', flex: 1, textAlign: "left"}}>
                    {"Position Frame " + frame_nav}
                    </label>
                  </div>
                  <Label title={"X Meters"}>
                    <Input
                      disabled
                      style={{ width: "45%", float: "left" }}
                      value={round(x_m, 2)}
                    />
                  </Label>
                  <Label title={"Y Meters"}>
                    <Input
                      disabled
                      style={{ width: "45%", float: "left" }}
                      value={round(y_m, 2)}
                    />
                  </Label>
                  <Label title={"Z Meters"}>
                    <Input
                      disabled
                      style={{ width: "45%", float: "left" }}
                      value={round(z_m, 2)}
                    />
                  </Label>

                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                  <Label title={"Tilt Degs"}>
                    <Input
                      disabled
                      style={{ width: "45%", float: "left" }}
                      value={round(tilt, 2)}
                    />
                  </Label>


                </Column>
              </Columns>

          )
        }
      }

      render() {
        const navpose_data = this.state.navpose_data
        const make_section = this.props.make_section !== undefined ? this.props.make_section : true;
        const view_title = this.props.title  ? this.props.title : "NavPose Data";
        
        if (navpose_data == null) {
    
          return(
            <Columns>
              <Column>
    
              </Column>
            </Columns>
          )
    
        }
        else if (make_section === true) {

              return (
                <Section>
                <Label title={view_title} />

                {this.renderNavPose()}
    
                </Section>
              )
            }
        else {
              
            return (
              <Columns>
              <Column>
              <Label title={view_title} />

              {this.renderNavPose()}
  
              </Column>
            </Columns>
            )
          }
      }


}
export default NepiIFNavPoseViewer
