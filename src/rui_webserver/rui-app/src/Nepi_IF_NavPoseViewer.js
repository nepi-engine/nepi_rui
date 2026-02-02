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

      navposeNamespace: 'None',

      statusListener: null,
      status_msg: null,

      dataListener: null,
      data_msg: null,

      show_data: true,

      connected: false,

      needs_update: true,
      data_needs_update: true  
    }


    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

    this.updateDataListener = this.updateDataListener.bind(this)
    this.dataListener = this.dataListener.bind(this)

    this.renderData = this.renderData.bind(this)

  }

  // Callback for handling ROS StatusNPX messages
  statusListener(message) {

    if (message.navpose_topic === this.state.navposeNamespace) {
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

  dataListener(message) {
    
    //console.log("=====dataListener called=====" + message)
    //console.log("dataListener msg: " + message)
    //Unused const last_navpose_msg = this.state.data_msg

    const is_navposes = (this.props.is_navposes != undefined) ? this.props.is_navposes : false
    const selected_frame = (this.props.selected_frame != undefined) ? this.props.selected_frame : this.state.selected_frame
    var data_msg = null
    var frames_list = null
    var frame_index = 0
    if (is_navposes === true){
      frames_list = message.navpose_frames
      frame_index = frames_list.indexOf(selected_frame)
      if ( frame_index !== -1 && selected_frame !== 'None'){
        data_msg = message.navposes[frame_index]
      }
      else {
        this.setState({ 
          navpose_data: null,
          data_needs_update: true 
        })        
      }
    }
    else {
      data_msg = message
    }
          
    if (data_msg != null){
      const navpose_data = {
        navpose_frame: data_msg.navpose_frame,
        navpose_description: data_msg.navpose_description,
        frame_nav: data_msg.frame_nav,
        frame_alt: data_msg.frame_alt,
        latitude: data_msg.latitude,
        longitude: data_msg.longitude,
        altitude: data_msg.altitude_m,
        heading: data_msg.heading_deg,
        roll: data_msg.roll_deg,
        pitch: data_msg.pitch_deg,
        yaw: data_msg.yaw_deg,
        x_m: data_msg.x_m,
        y_m: data_msg.y_m,
        z_m: data_msg.z_m,
        pan: data_msg.pan_deg,
        tilt: data_msg.tilt_deg
      }


      this.setState({
        data_msg: message,
        navpose_data: navpose_data, 
        connected: true
      })
    }
  }

  updateStatusListener() {
      //console.log("=====updateStatusListener called=====");
      const navposeNamespace = this.state.navposeNamespace 
      const navposeTopic = navposeNamespace + '/status'
      const is_navposes = (this.props.is_navposes != undefined) ? this.props.is_navposes : false
      var statusListener = null
      if (this.state.statusListener) {
        this.state.statusListener.unsubscribe()
      }

    if (navposeNamespace !== 'None' && navposeNamespace != null){
      if (is_navposes === true) {
        statusListener = this.props.ros.setupSaveDataStatusListener(
          navposeTopic,
          "nepi_interfaces/NavPosesStatus",
          this.statusListener 
        )
      }
      else {
        statusListener = this.props.ros.setupSaveDataStatusListener(
          navposeTopic,
          "nepi_interfaces/NavPoseStatus",
          this.statusListener 
        )
      }
      
      this.setState({ 
        statusListener: statusListener,
      })
    }
    this.setState({ 
      navpose_data: null,
      data_needs_update: false 
    })
  }

  updateDataListener() {
    const navposeNamespace = this.state.navposeNamespace
    const navposeTopic = navposeNamespace
    const is_navposes = (this.props.is_navposes != undefined) ? this.props.is_navposes : false
    if (this.state.dataListener) {
      this.state.dataListener.unsubscribe()
    }
    var dataListener = null
    if (navposeNamespace !== 'None' && navposeNamespace != null){
      if (is_navposes === true) {
        dataListener = this.props.ros.setupSaveDataStatusListener(
          navposeTopic,
          "nepi_interfaces/NavPoses",
          this.dataListener 
        )
      }
      else {
        dataListener = this.props.ros.setupSaveDataStatusListener(
          navposeTopic,
          "nepi_interfaces/NavPose",
          this.dataListener 
        )

      }
      
      this.setState({ 
        dataListener: dataListener,
      })
    }
    this.setState({ 
      navpose_data: null,
      data_needs_update: false 
    })
    
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    var navposeNamespace = (this.props.navposeNamespace != undefined) ? (this.props.navposeNamespace !== 'None' && this.props.navposeNamespace !== 'None') ? 
                             this.props.navposeNamespace : 'None' : 'None'
    if (this.state.navposeNamespace !== navposeNamespace ){
      if (navposeNamespace !== 'None' &&  navposeNamespace != null) {
        this.setState({
          navposeNamespace: navposeNamespace,
        })
        this.updateStatusListener()
        this.updateDataListener()
      } 
      else if (navposeNamespace == null){
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


  renderData() {
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
        const navposeNamespace = this.state.navposeNamespace
        if (navpose_data == null || navposeNamespace == null) {
    
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

                {this.renderData()}
    
                </Section>
              )
            }
        else {
              
            return (
              <Columns>
              <Column>
              <Label title={view_title} />

              {this.renderData()}
  
              </Column>
            </Columns>
            )
          }
      }


}
export default NepiIFNavPoseViewer
