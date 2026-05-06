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
import Select, { Option } from "./Select"

import NepiIFConfig from "./Nepi_IF_Config"

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer
class NepiIFNavPose extends Component {
  constructor(props) {
    super(props)

    this.state = {

      navposeNamespace: 'None',

      statusListener: null,
      status_msg: null,

      dataListener: null,
      data_msg: null,

      navpose_data: null,
      navpose_times: null,

      connected: false,

      needs_update: true,
      data_needs_update: true  
    }


    this.dirtyFields = new Set()

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

    this.updateDataListener = this.updateDataListener.bind(this)
    this.dataListener = this.dataListener.bind(this)

    this.renderSelection = this.renderSelection.bind(this)
    this.renderData = this.renderData.bind(this)

    this.toggleViewableNavpose = this.toggleViewableNavpose.bind(this)
    this.onToggleNavposeSelection = this.onToggleNavposeSelection.bind(this)
    this.getNavposeOptions = this.getNavposeOptions.bind(this)


    this.sendNavposeUpdateMessage = this.sendNavposeUpdateMessage.bind(this)
    this.sendNavposeClearMessage = this.sendNavposeClearMessage.bind(this)

    this.onUpdateInputNavposeValue = this.onUpdateInputNavposeValue.bind(this)
    this.onKeySaveInputNavposeValue = this.onKeySaveInputNavposeValue.bind(this)

  }

  // Callback for handling ROS StatusNPX messages
  statusListener(message) {

    if (message.navpose_topic === this.state.navposeNamespace) {
      this.setState({
        status_msg: message, 
        connected: true
      })
    
    }
  }

  dataListener(message) {


    const last_navpose_data = this.state.navpose_data
    
     const has_pan_tilt = message.has_pan_tilt
     var navpose_data_from_msg = null
     if (has_pan_tilt === true) {
        navpose_data_from_msg = {
            navpose_frame: message.navpose_frame,
            navpose_description: message.navpose_description,

            frame_nav: message.frame_nav,
            frame_altitude: message.frame_altitude,
            frame_depth: message.frame_depth,

            has_location: message.has_location,
            latitude: message.latitude,
            longitude: message.longitude,


            has_heading: message.has_heading,
            heading_deg: message.heading_deg,

            has_orientation: message.has_orientation,
            roll_deg: message.roll_deg,
            pitch_deg: message.pitch_deg,
            yaw_deg: message.yaw_deg,

            has_position: message.has_position,
            x_m: message.x_m,
            y_m: message.y_m,
            z_m: message.z_m,

            has_altitude: message.has_altitude,
            altitude_m: message.altitude_m,
            geoid_height_meters: message.geoid_height_meters,

            has_depth: message.has_depth,
            depth_m: message.depth_m,

            has_pan_tilt: message.has_pan_tilt,
            pan_deg: message.pan_deg,
            tilt_deg: message.tilt_deg
          }
        }
      else {

        navpose_data_from_msg = {
            navpose_frame: message.navpose_frame,
            navpose_description: message.navpose_description,

            frame_nav: message.frame_nav,
            frame_altitude: message.frame_altitude,
            frame_depth: message.frame_depth,

            has_location: message.has_location,
            latitude: message.latitude,
            longitude: message.longitude,


            has_heading: true,
            heading_deg: message.pan_tilt_heading_deg,

            has_orientation: true,
            roll_deg: message.pan_tilt_roll_deg,
            pitch_deg: message.pan_tilt_pitch_deg,
            yaw_deg: message.pan_tilt_yaw_deg,

            has_position: true,
            x_m: message.pan_tilt_x_m,
            y_m: message.pan_tilt_y_m,
            z_m: message.pan_tilt_z_m,

            has_altitude: message.has_altitude,
            altitude_m: message.altitude_m,
            geoid_height_meters: message.geoid_height_meters,

            has_depth: message.has_depth,
            depth_m: message.depth_m,

            has_pan_tilt: message.has_pan_tilt,
            pan_deg: message.pan_deg,
            tilt_deg: message.tilt_deg
          }

      }

      // Preserve fields the user is currently editing so subscription doesn't reset them
      const navpose_data = { ...navpose_data_from_msg }
      if (last_navpose_data && this.dirtyFields.size > 0) {
        for (const field of this.dirtyFields) {
          if (field in last_navpose_data) {
            navpose_data[field] = last_navpose_data[field]
          }
        }
      }

      if (JSON.stringify(navpose_data) !== JSON.stringify(last_navpose_data)){
          this.setState({
            navpose_data: navpose_data,
            navpose_data_copy: navpose_data_from_msg
          })
      }

      this.setState({
        data_msg: message,
        connected: true
      })

  }

  updateStatusListener(navposeNamespace) {
    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
      this.setState({statusListener: null, 
                    status_msg: null, 
                    data_msg: null, 
                    navpose_data: null,
                    navpose_times: null,
                    connected: false})
    }
    if (this.state.statusListener !== 'None') {
        const statusListener = this.props.ros.setupStatusListener(
          navposeNamespace + '/status',
          "nepi_interfaces/NavPoseStatus",
          this.statusListener 
        )
      this.setState({ 
        statusListener: statusListener,
      })
    }
 
  }



  updateDataListener(navposeNamespace) {
    if (this.state.dataListener != null) {
      this.state.dataListener.unsubscribe()
      this.setState({dataListener: null, data_msg: null, 
                    navpose_data: null, data_needs_update: false})
    }
    if (this.state.dataListener !== 'None') {
        const dataListener = this.props.ros.setupDataListener(
            navposeNamespace,
            "nepi_interfaces/NavPose",
            this.dataListener 
          )
        this.setState({ 
          dataListener: dataListener,
        })
    }
 
  }

    componentDidMount() {
      this.setState({needs_update: true, data_needs_update: true})
    }


  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    var navposeNamespace = (this.props.navposeNamespace !== undefined && this.props.navposeNamespace !== '' && this.props.navposeNamespace !== 'None' && this.props.navposeNamespace !== null) ? 
                             this.props.navposeNamespace : this.state.navposeNamespace
    if (this.state.navposeNamespace !== navposeNamespace ){
        this.setState({
          navposeNamespace: navposeNamespace,
        })
        this.updateStatusListener(navposeNamespace)
        this.updateDataListener(navposeNamespace)
      } 

  }
  
  
  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to StatusNPX message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
    if (this.state.dataListener != null) {
      this.state.dataListener.unsubscribe()
      this.setState({dataListener: null, data_msg: null, 
                    navpose_data: null, data_needs_update: false})
    }
  }





  toggleViewableNavpose() {
    const viewable = !this.state.viewableNavpose
    this.setState({viewableNavpose: viewable})
  }


  onToggleNavposeSelection(event){
    const navposeNamespace = event.target.value
    this.setState({navposeNamespace: navposeNamespace})
    const navpose_updated_topic =   (this.props.navpose_updated_topic !== undefined)? this.props.navpose_updated_topic : null
    if (navpose_updated_topic != null) {
      this.props.ros.sendStringMsg(navposeNamespace)


    }
  }


  // Function for creating image topic options.
  getNavposeOptions() {
    const navpose_frames_topics = this.props.ros.navpose_frames_topics
    const navpose_frames = this.props.ros.navpose_frames
    const navposeNamespace = this.state.navposeNamespace
    var items = []

    if (navpose_frames.length === 0){
      items.push(<Option value={'None'}>{'None'}</Option>)
    }
    else {
        for (var i = 0; i < navpose_frames.length; i++) {
            items.push(<Option value={navpose_frames_topics[i]}>{navpose_frames[i]}</Option>)
          }
        if (navposeNamespace === 'None'){
          this.setState({navposeNamespace: navpose_frames_topics[0]})
        }
    }
    return items
  }


  renderSelection() {
    const show_selection = (this.props.show_selection !== undefined)? this.props.show_selection : false
    const navpose_options = this.getNavposeOptions()
    const hide_navpose_list = !this.state.viewableNavpose && !this.state.connected
    if (show_selection === false) {

      return(
        <Columns>
          <Column>

          </Column>
        </Columns>
      )

    }
    else {
    return (
      <React.Fragment>

      <Columns>
        <Column>

        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Select NavPose Navpose"}
         </label>
         

          <div onClick={this.toggleViewableNavpose} style={{backgroundColor: Styles.vars.colors.grey0}}>
            <Select style={{width: "10px"}}/>
          </div>
          <div hidden={hide_navpose_list}>
          {navpose_options.map((navpose) =>
          <div onClick={this.onToggleNavposeSelection}
            style={{
              textAlign: "center",
              padding: `${Styles.vars.spacing.xs}`,
              color: Styles.vars.colors.black,
              backgroundColor: (navpose.props.value === this.state.selected_navpose) ? Styles.vars.colors.blue : Styles.vars.colors.grey0,
              cursor: "pointer",
              }}>
              <body navpose-topic ={navpose} style={{color: Styles.vars.colors.black}}>{navpose}</body>
          </div>
          )}
          </div>

      </Column>
      </Columns>

      </React.Fragment>
    )
    }
  }




  sendNavposeUpdateMessage(navpose_data){
    const {sendUpdateNavposeMsg} = this.props.ros
    const navposeNamespace = this.state.navposeNamespace
    const updateNamespace = (this.props.update_namespace !== undefined)? this.props.update_namespace : navposeNamespace + "/update_navpose"
    const frame_name = (this.props.frame_name !== undefined)? this.props.frame_name : ""
    const comp_name = (this.props.comp_name !== undefined)? this.props.comp_name : ""
    const type_name = (this.props.type_name !== undefined)? this.props.type_name : ""
    if (navpose_data != null) {
      sendUpdateNavposeMsg(updateNamespace,frame_name,navpose_data,comp_name,type_name)
    }
  }


  sendNavposeClearMessage(){
    const navpose_data = this.props.ros.blankNavpose
    this.sendNavposeUpdateMessage(navpose_data)
  }


  onUpdateInputNavposeValue(event, name) {
    const value = event.target.value
    this.dirtyFields.add(name)
    const navpose_data = { ...this.state.navpose_data, [name]: value }
    this.setState({ navpose_data })
    event.target.style.color = Styles.vars.colors.red
    event.target.style.fontWeight = "bold"
  }

  onKeySaveInputNavposeValue(event, name) {
    const navpose_data_copy = this.state.navpose_data_copy
    const force_enable = this.props.update_namespace !== undefined
    const HAS_FLAG_MAP = {
      latitude: 'has_location', longitude: 'has_location',
      heading_deg: 'has_heading',
      roll_deg: 'has_orientation', pitch_deg: 'has_orientation', yaw_deg: 'has_orientation',
      x_m: 'has_position', y_m: 'has_position', z_m: 'has_position',
      altitude_m: 'has_altitude',
      depth_m: 'has_depth',
      pan_deg: 'has_pan_tilt', tilt_deg: 'has_pan_tilt',
    }
    if (event.key === 'Enter') {
      const value = parseFloat(event.target.value)
      const navpose_data = { ...this.state.navpose_data }
      if (isNaN(value)) {
        navpose_data[name] = navpose_data_copy ? navpose_data_copy[name] : 0
      } else {
        navpose_data[name] = value
        if (force_enable && HAS_FLAG_MAP[name]) {
          navpose_data[HAS_FLAG_MAP[name]] = true
        }
      }
      this.dirtyFields.delete(name)
      this.setState({ navpose_data })
      this.sendNavposeUpdateMessage(navpose_data)
      event.target.style.color = Styles.vars.colors.black
      event.target.style.fontWeight = "normal"
    }
    if (event.key === 'Escape') {
      const navpose_data = { ...this.state.navpose_data }
      navpose_data[name] = navpose_data_copy ? navpose_data_copy[name] : 0
      this.dirtyFields.delete(name)
      this.setState({ navpose_data })
      event.target.style.color = Styles.vars.colors.black
      event.target.style.fontWeight = "normal"
    }
  }



  renderData() {
    const navpose_data = this.props.navpose_data !== undefined ? this.props.navpose_data : ((this.state.navpose_data != null) ? this.state.navpose_data : null)

    if (navpose_data == null) {

      return(
        <Columns>
          <Column>

          </Column>
        </Columns>
      )

    }
    else {

          const navpose_frame = navpose_data.navpose_frame
          const navpose_description = navpose_data.navpose_description
          const frame_nav = navpose_data.frame_nav
          const frame_alt =navpose_data.frame_alt
          const frame_depth = navpose_data.frame_depth

          const force_enable = this.props.update_namespace !== undefined

          const has_location = navpose_data.has_location
          const latitude = (force_enable || has_location === true) && navpose_data.latitude !== -999 ? navpose_data.latitude : null
          const longitude = (force_enable || has_location === true) && navpose_data.longitude !== -999 ? navpose_data.longitude : null

          const has_heading = navpose_data.has_heading
          const heading_deg = (force_enable || has_heading === true) && navpose_data.heading_deg !== -999 ? navpose_data.heading_deg : null

          const has_position = navpose_data.has_position
          const x_m = (force_enable || has_position === true) && navpose_data.x_m !== -999 ? navpose_data.x_m : null
          const y_m = (force_enable || has_position === true) && navpose_data.y_m !== -999 ? navpose_data.y_m : null
          const z_m = (force_enable || has_position === true) && navpose_data.z_m !== -999 ? navpose_data.z_m : null

          const has_orientation = navpose_data.has_orientation
          const roll_deg = (force_enable || has_orientation === true) && navpose_data.roll_deg !== -999 ? navpose_data.roll_deg : null
          const pitch_deg = (force_enable || has_orientation === true) && navpose_data.pitch_deg !== -999 ? navpose_data.pitch_deg : null
          const yaw_deg = (force_enable || has_orientation === true) && navpose_data.yaw_deg !== -999 ? navpose_data.yaw_deg : null

          const has_altitude = navpose_data.has_altitude
          const altitude_m = navpose_data.altitude_m !== -999 ? navpose_data.altitude_m : null

          const has_depth = navpose_data.has_depth
          const depth_m = navpose_data.depth_m !== -999 ? navpose_data.depth_m : null

          const has_pan_tilt = navpose_data.has_pan_tilt
          const pan_deg = (force_enable || has_pan_tilt === true) && navpose_data.pan_deg !== -999 ? navpose_data.pan_deg : null
          const tilt_deg = (force_enable || has_pan_tilt === true) && navpose_data.tilt_deg !== -999 ? navpose_data.tilt_deg : null

          const msg = ("\nRef Desc: " + navpose_description +
          "\n\nNav Frame: " + frame_nav + "  Alt Frame: " + frame_alt + "  Depth Frame: " + frame_depth
          )
          
          const allow_updates = (this.props.allow_updates !== undefined)? this.props.allow_updates : false
          const read_only = this.props.read_only === true

          const { userRestricted} = this.props.ros
          const navpose_control_restricted = userRestricted.indexOf('DATA-NAVPOSE_CONTROL') !== -1

          const disabled = navpose_control_restricted === true && allow_updates === true
          const mk_disabled = (has_flag) => read_only || disabled || (!force_enable && !has_flag)




          return (

<React.Fragment>

            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {navpose_frame}
            </label>


            <label align={"left"} textAlign={"left"}>
            {msg}
          </label>

              <Columns>
                <Column>
                  <label style={{fontWeight: 'bold'}}>
                    {"Location"}
                  </label>
                  <Label title={"Latitude"}>
                    <Input
                      id={"latitude"}
                      disabled={mk_disabled(has_location)}
                      value={this.dirtyFields.has('latitude') ? navpose_data.latitude : round(latitude, 6)}
                      style={{ width: "80%" }}
                      onChange= {(event) => this.onUpdateInputNavposeValue(event,"latitude")}
                      onKeyDown= {(event) => this.onKeySaveInputNavposeValue(event,"latitude")}
                    />
                  </Label>
                  <Label title={"Longitude"}>
                    <Input
                      id={"longitude"}
                      disabled={mk_disabled(has_location)}
                      value={this.dirtyFields.has('longitude') ? navpose_data.longitude : round(longitude, 6)}
                      style={{ width: "80%" }}
                      onChange= {(event) => this.onUpdateInputNavposeValue(event,"longitude")}
                      onKeyDown= {(event) => this.onKeySaveInputNavposeValue(event,"longitude")}
                    />
                  </Label>

                  <Label title={"Heading (deg)"}>
                    <Input
                      id={"heading_deg"}
                      disabled={mk_disabled(has_heading)}
                      style={{ width: "80%" }}
                      onChange= {(event) => this.onUpdateInputNavposeValue(event,"heading_deg")}
                      onKeyDown= {(event) => this.onKeySaveInputNavposeValue(event,"heading_deg")}
                      value={this.dirtyFields.has('heading_deg') ? navpose_data.heading_deg : round(heading_deg, 2)}
                    />
                  </Label>

                  <Label title={"Altitude (m) " + frame_alt + " (m)"}>
                    <Input
                      id={"altitude_m"}
                      disabled={read_only || disabled}
                      value={this.dirtyFields.has('altitude_m') ? navpose_data.altitude_m : round(altitude_m, 2)}
                      style={{ width: "80%" }}
                      onChange= {(event) => this.onUpdateInputNavposeValue(event,"altitude_m")}
                      onKeyDown= {(event) => this.onKeySaveInputNavposeValue(event,"altitude_m")}
                    />
                  </Label>

                  <Label title={"Depth (m) " + frame_depth + " (m)"}>
                    <Input
                      id={"depth_m"}
                      disabled={read_only || disabled}
                      value={this.dirtyFields.has('depth_m') ? navpose_data.depth_m : round(depth_m, 2)}
                      style={{ width: "80%" }}
                      onChange= {(event) => this.onUpdateInputNavposeValue(event,"depth_m")}
                      onKeyDown= {(event) => this.onKeySaveInputNavposeValue(event,"depth_m")}
                    />
                  </Label>


                </Column>
                <Column>
                  <div style={{ display: "flex", marginLeft: Styles.vars.spacing.regular }}>
                    <label style={{fontWeight: 'bold', flex: 1, textAlign: "left"}}>
                    {"Orientation Frame " + frame_nav}
                    </label>
                  </div>
                  <Label title={"Roll (deg)"}>
                    <Input
                      id={"roll_deg"}
                      disabled={mk_disabled(has_orientation)}
                      style={{ width: "45%", float: "left" }}
                      value={this.dirtyFields.has('roll_deg') ? navpose_data.roll_deg : round(roll_deg, 2)}
                      onChange= {(event) => this.onUpdateInputNavposeValue(event,"roll_deg")}
                      onKeyDown= {(event) => this.onKeySaveInputNavposeValue(event,"roll_deg")}
                    />
                  </Label>
                  <Label title={"Pitch (deg)"}>
                    <Input
                      id={"pitch_deg"}
                      disabled={mk_disabled(has_orientation)}
                      style={{ width: "45%", float: "left" }}
                      value={this.dirtyFields.has('pitch_deg') ? navpose_data.pitch_deg : round(pitch_deg, 2)}
                      onChange= {(event) => this.onUpdateInputNavposeValue(event,"pitch_deg")}
                      onKeyDown= {(event) => this.onKeySaveInputNavposeValue(event,"pitch_deg")}
                    />

                  </Label>
                  <Label title={"Yaw (deg)"}>
                    <Input
                      id={"yaw_deg"}
                      disabled={mk_disabled(has_orientation)}
                      style={{ width: "45%", float: "left" }}
                      value={this.dirtyFields.has('yaw_deg') ? navpose_data.yaw_deg : round(yaw_deg, 2)}
                      onChange= {(event) => this.onUpdateInputNavposeValue(event,"yaw_deg")}
                      onKeyDown= {(event) => this.onKeySaveInputNavposeValue(event,"yaw_deg")}
                    />
                  </Label>

                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                  <Label title={"Pan (degs)"}>
                    <Input
                      id={"pan_deg"}
                      disabled={mk_disabled(has_pan_tilt)}
                      style={{ width: "45%", float: "left" }}
                      value={this.dirtyFields.has('pan_deg') ? navpose_data.pan_deg : round(pan_deg, 2)}
                      onChange= {(event) => this.onUpdateInputNavposeValue(event,"pan_deg")}
                      onKeyDown= {(event) => this.onKeySaveInputNavposeValue(event,"pan_deg")}
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
                    <label style={{fontWeight: 'bold', flex: 1, textAlign: "left"}}>{" "}</label>
                  </div>

                  <Label title={"X (m)"}>
                    <Input
                      id={"x_m"}
                      disabled={mk_disabled(has_position)}
                      style={{ width: "45%", float: "left" }}
                      value={this.dirtyFields.has('x_m') ? navpose_data.x_m : round(x_m, 2)}
                      onChange= {(event) => this.onUpdateInputNavposeValue(event,"x_m")}
                      onKeyDown= {(event) => this.onKeySaveInputNavposeValue(event,"x_m")}
                    />
                  </Label>
                  <Label title={"Y (m)"}>
                    <Input
                      id={"y_m"}
                      disabled={mk_disabled(has_position)}
                      style={{ width: "45%", float: "left" }}
                      value={this.dirtyFields.has('y_m') ? navpose_data.y_m : round(y_m, 2)}
                      onChange= {(event) => this.onUpdateInputNavposeValue(event,"y_m")}
                      onKeyDown= {(event) => this.onKeySaveInputNavposeValue(event,"y_m")}
                    />
                  </Label>
                  <Label title={"Z (m)"}>
                    <Input
                      id={"z_m"}
                      disabled={mk_disabled(has_position)}
                      style={{ width: "45%", float: "left" }}
                      value={this.dirtyFields.has('z_m') ? navpose_data.z_m : round(z_m, 2)}
                      onChange= {(event) => this.onUpdateInputNavposeValue(event,"z_m")}
                      onKeyDown= {(event) => this.onKeySaveInputNavposeValue(event,"z_m")}
                    />
                  </Label>

                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                  <Label title={"Tilt (deg)"}>
                    <Input
                      id={"tilt_deg"}
                      disabled={mk_disabled(has_pan_tilt)}
                      style={{ width: "45%", float: "left" }}
                      value={this.dirtyFields.has('tilt_deg') ? navpose_data.tilt_deg : round(tilt_deg, 2)}
                      onChange= {(event) => this.onUpdateInputNavposeValue(event,"tilt_deg")}
                      onKeyDown= {(event) => this.onKeySaveInputNavposeValue(event,"tilt_deg")}
                    />
                  </Label>


                </Column>
              </Columns>
        </React.Fragment>
          )
        }
      }


        renderConfigs(){
          const configNamespace = this.state.configNamespace ? this.state.configNamespace : this.state.navposeNamespace
          return(
            <Columns>
            <Column>


                <NepiIFConfig
                              namespace={configNamespace}
                              title={"Nepi_IF_Config"}
                />

              </Column>
              </Columns>


          )

        }

      render() {
        const make_section = this.props.make_section !== undefined ? this.props.make_section : true;
        const show_line = (this.props.show_line !== undefined)? this.props.show_line : true
        const show_config = (this.props.show_config !== undefined)? this.props.show_config : false
        const title = this.props.title  ? this.props.title : "NavPose Data";
        const navposeNamespace = this.state.navposeNamespace
        const { userRestricted} = this.props.ros
        const navpose_view_restricted = userRestricted.indexOf('DATA-NAVPOSE-VIEW') !== -1


        if (navposeNamespace == null || navpose_view_restricted === true) {
    
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
                <Label title={title} />

                {this.renderSelection()}
                {this.renderData()}
                { (show_config === true) ?
                    this.renderConfigs()
                : null }
    
                </Section>
              )
            }
        else {
              
            return (
              <React.Fragment>

                { (show_line === true) ?
                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
                : null }
              <Label title={title} />

              {this.renderSelection()}
              {this.renderData()}
              { (show_config === true) ?
                  this.renderConfigs()
              : null }
  
              </React.Fragment>
            )
          }
      }


}
export default NepiIFNavPose
