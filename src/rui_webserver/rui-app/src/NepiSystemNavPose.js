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
import { observer, inject } from "mobx-react"

import Section from "./Section"
//import EnableAdjustment from "./EnableAdjustment"
//import Button, { ButtonMenu } from "./Button"
import Select, { Option } from "./Select"
import Toggle from "react-toggle"
import Label from "./Label"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
//import Input from "./Input"

import {  onChangeSwitchStateValue } from "./Utilities"


import NepiIFNavPose from "./Nepi_IF_NavPose"


@inject("ros")
@observer


class NavPoseMgr extends Component {
  constructor(props) {
    super(props)

    this.state = {
      mgrName: "navpose_mgr",

      selected_frame: 'None',
      selected_frame_name: 'None',
      selected_frame_topic: null,
      selected_frame_solution: null,
      selected_frame_ind: -1,

      show_navpose_init: false,
      show_navpose_source_replace: false,
      show_navpose_source_offset: false,
      show_navpose_update_offset: false,
      show_navpose_update_reset: false,

      connected: false,
    
      needs_update: true,

    }

    this.checkConnection = this.checkConnection.bind(this)

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
    this.getMgrNamespace = this.getMgrNamespace.bind(this)

    this.renderFrameSelection = this.renderFrameSelection.bind(this)
    this.renderFrameConfig = this.renderFrameConfig.bind(this)
    this.renderFrameNavPoseComps = this.renderFrameNavPoseComps.bind(this)
    this.renderNavPoseMgr = this.renderNavPoseMgr.bind(this)

    this.getFrameOptions = this.getFrameOptions.bind(this)
    this.toggleViewableFrames = this.toggleViewableFrames.bind(this)
    this.onToggleFrameSelection = this.onToggleFrameSelection.bind(this)
  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId 
    }
    return baseNamespace
  }

  getMgrNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var namespace = null
    if (namespacePrefix !== null && deviceId !== null){
      namespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.mgrName
    }
    return namespace
  }




  async checkConnection() {
    const { connectedToNepi , connectedToNavposeMgr} = this.props.ros
    if (this.state.connectedToNepi !== connectedToNepi){
      this.setState({connectedToNepi: connectedToNepi,
                    status_msg: null,
                    selected_frame: 'None', needs_update: true})
    }
    if (this.state.connectedToNavposeMgr !== connectedToNavposeMgr )
    {
      this.setState({connected: true, needs_update: true})
    }

    setTimeout(async () => {
      await this.checkConnection()
    }, 1000)
  }


  componentDidMount(){
    this.checkConnection()
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const needs_update = this.state.needs_update
    if (needs_update === true) {
        this.setState({needs_update: false})
      }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    this.setState({connected: false})
  }



  ////////////////////////////////////////////////


    
  toggleViewableFrames() {
    this.setState({viewableFrames: true})
  }


  // Function for creating image topic options.
  getFrameOptions() {


    const navpose_frames = this.props.ros.navpose_frames  
    const navpose_frames_names = this.props.ros.navpose_frames
    const navpose_frames_topics = this.props.ros.navpose_frames_topics
    const navpose_frames_solutions = this.props.ros.navpose_frames_solutions

    var selected_frame = this.state.selected_frame
    var selected_frame_name = this.state.selected_frame_name    
    var selected_frame_topic = this.state.selected_frame_topic
    var selected_frame_solution = this.state.selected_frame_solution

    var selected_frame_ind = -1

    var items = []
    if (navpose_frames.length > 0){
      if ( selected_frame_topic == null ){
        selected_frame_ind = 0
      }
      for (var i = 0; i < navpose_frames.length; i++) {
            items.push(<Option value={navpose_frames_topics[i]}>{navpose_frames_names[i]}</Option>)

            if (selected_frame_topic === navpose_frames_topics[i]) {
              selected_frame_ind = i
            }
     }
    }
    else{
      items.push(<Option value={'None'}>{'None'}</Option>)
      //items.push(<Option value={'TEST1'}>{'TEST1'}</Option>)
      //items.push(<Option value={'TEST2'}>{'TEST2'}</Option>)
    }


    // Update Selection if needed
    if (selected_frame_ind !== this.state.selected_frame_ind){
      if (selected_frame_ind === -1){
        selected_frame = 'None'
        selected_frame_name = 'None'
        selected_frame_topic = null
        selected_frame_solution = null
      }
      else {
        selected_frame = navpose_frames[selected_frame_ind]
        selected_frame_name = navpose_frames_names[selected_frame_ind]
        selected_frame_topic = navpose_frames_topics[selected_frame_ind]
        selected_frame_solution = navpose_frames_solutions[selected_frame_ind]
      }
      this.setState({
        selected_frame: selected_frame,
        selected_frame_name: selected_frame_name,
        selected_frame_topic:  selected_frame_topic,
        selected_frame_ind: selected_frame_ind,
        selected_frame_solution: selected_frame_solution
      })

    }

    return items
  }
  


  onToggleFrameSelection(event){
    const navpose_frames = this.props.ros.navpose_frames  
    const navpose_frames_names = this.props.ros.navpose_frames
    const navpose_frames_topics = this.props.ros.navpose_frames_topics
    const navpose_frames_solutions = this.props.ros.navpose_frames_solutions

    var selected_frame_topic = event.target.value

    var selected_frame = this.state.selected_frame
    var selected_frame_name = this.state.selected_frame_name    
    var selected_frame_solution = this.state.selected_frame_solution
    var selected_frame_ind = navpose_frames_topics.indexOf(selected_frame_topic)
      if (selected_frame_ind === -1){
        selected_frame = 'None'
        selected_frame_name = 'None'
        selected_frame_topic = null
        selected_frame_solution = null
      }
      else {
        selected_frame = navpose_frames[selected_frame_ind]
        selected_frame_name = navpose_frames_names[selected_frame_ind]
        selected_frame_topic = navpose_frames_topics[selected_frame_ind]
        selected_frame_solution = navpose_frames_solutions[selected_frame_ind]
      }
      this.setState({
        selected_frame: selected_frame,
        selected_frame_name: selected_frame_name,
        selected_frame_topic:  selected_frame_topic,
        selected_frame_ind: selected_frame_ind,
        selected_frame_solution: selected_frame_solution
      })
  }
  
 

  renderFrameSelection() {
    const selected_frame_topic = this.state.selected_frame_topic
    const frame_options = this.getFrameOptions()
    const hide_frame_list = !this.state.viewableFrames && !this.state.connected
    return (

        <React.Fragment>

                

                                    <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                                      {"Select NavPose Frame"}
                                    </label>

                                    <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                                      <div onClick={this.toggleViewableFrames} style={{backgroundColor: Styles.vars.colors.grey0}}>
                                        <Select style={{width: "10px"}}/>
                                      </div>
                                      <div hidden={hide_frame_list}>
                                      {frame_options.map((frame) =>
                                      <div onClick={this.onToggleFrameSelection}
                                        style={{
                                          textAlign: "center",
                                          padding: `${Styles.vars.spacing.xs}`,
                                          color: Styles.vars.colors.black,
                                          backgroundColor: (frame.props.value === selected_frame_topic) ?
                                            Styles.vars.colors.blue : Styles.vars.colors.grey0,
                                          cursor: "pointer",
                                          }}>
                                          <body frame-topic ={frame} style={{color: Styles.vars.colors.black}}>{frame}</body>
                                      </div>
                                      )}
                                      </div>

        </React.Fragment>

    )
  }


    renderFrameNavPoseComps() {

    const selected_frame_topic = this.state.selected_frame_topic
    const selected_frame_solution = this.state.selected_frame_solution


    if (selected_frame_solution == null || selected_frame_topic == null){

      return(
        <React.Fragment>
          
        </React.Fragment>
      )
    }
    else{

      const show_fixed = selected_frame_solution.has_fixed 
      return (
        
        <React.Fragment>

              <NepiIFNavPose
                navposeNamespace={this.state.selected_frame_topic + '/navpose'}
                title={"NavPose Fixed Data"}
                show_line={false}
                make_section={false}
              />



                <div align={"left"} textAlign={"left"} hidden={(show_fixed !== true)}>

                        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                        <NepiIFNavPose
                          navposeNamespace={this.state.selected_frame_topic + '/navpose_fixed'}
                          title={"NavPose Fixed Data"}
                          make_section={false}
                        />

                      </div>

                




                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
        

                  <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                    {"Show NavPose Components"}
                  </label>

                  <div style={{ display: 'flex' }}>
                          <div style={{ width: '15%' }} hidden={false}>
                                <Label title="Init">
                                  <Toggle
                                    checked={this.state.show_init===true}
                                    onClick={() => onChangeSwitchStateValue.bind(this)("show_init",this.state.show_init)}>
                                  </Toggle>
                              </Label>
                          </div>
                          <div style={{ width: '5%' }}>
                          </div>

              
                          <div style={{ width: '15%' }} hidden={false}>
                              <Label title="Source Replaces">
                                  <Toggle
                                    checked={this.state.show_source_replace===true}
                                    onClick={() => onChangeSwitchStateValue.bind(this)("show_source_replace",this.state.show_source_replace)}>
                                  </Toggle>
                                </Label>
                          </div>
                          <div style={{ width: '5%' }}>
                          </div>

                          <div style={{ width: '15%' }} hidden={false}>
                              <Label title="Source Offsets">
                                  <Toggle
                                    checked={this.state.show_source_offset===true}
                                    onClick={() => onChangeSwitchStateValue.bind(this)("show_source_offset",this.state.show_source_offset)}>
                                  </Toggle>
                                </Label>
                          </div>

                          <div style={{ width: '5%' }}>
                          </div>


                          <div style={{ width: '15%' }} hidden={false}>
                              <Label title="Update Replaces">
                                  <Toggle
                                    checked={this.state.show_update_offset===true}
                                    onClick={() => onChangeSwitchStateValue.bind(this)("show_update_offset",this.state.show_update_offset)}>
                                  </Toggle>
                                </Label>
                          </div>
                          <div style={{ width: '5%' }}>
                          </div>

                          <div style={{ width: '15%' }} hidden={false}>
                              <Label title="Update Offsets">
                                  <Toggle
                                    checked={this.state.show_update_reset===true}
                                    onClick={() => onChangeSwitchStateValue.bind(this)("show_update_reset",this.state.show_update_reset)}>
                                  </Toggle>
                                </Label>
                          </div>

                    </div>



                    { (this.state.show_init === true) ?

                        <NepiIFNavPose
                          navposeNamespace={this.state.selected_frame_topic + '/navpose_init'}
                          title={"NavPose Init Data"}
                          make_section={false}
                        />

                    : null }

                    { (this.state.show_source_replace === true) ?

                        <NepiIFNavPose
                          navposeNamespace={this.state.selected_frame_topic + '/navpose_source_replace'}
                          title={"NavPose Source Replaces Data"}
                          make_section={false}
                        />

                    : null }

                    { (this.state.show_offset === true) ?

                        <NepiIFNavPose
                          navposeNamespace={this.state.selected_frame_topic + '/navpose_source_offset'}
                          title={"NavPose Source Offsets Data"}
                          make_section={false}
                        />

                    : null }

                    { (this.state.show_update_offset === true) ?

                        <NepiIFNavPose
                          navposeNamespace={this.state.selected_frame_topic + '/navpose_update_offset'}
                          title={"NavPose Update Offset Data"}
                          make_section={false}
                        />

                    : null }

                    { (this.state.show_update_reset === true) ?

                        <NepiIFNavPose
                          navposeNamespace={this.state.selected_frame_topic + '/navpose_update_reset'}
                          title={"NavPose Update Reset Data"}
                          make_section={false}
                        />

                    : null }





        </React.Fragment>
    
      )
    }
  }



    renderFrameConfig() {

    return (

        <React.Fragment>

                


        </React.Fragment>

    )
  }


  renderNavPoseMgr() {
  
    return (

        <React.Fragment>


               <div style={{ display: 'flex' }}>
                        <div style={{ width: '20%' }} >                     

                          {this.renderFrameSelection()}

                        </div>


                        <div style={{ width: '5%' }} >
                        </div>

                        <div style={{ width: '40%' }}>

                          {this.renderFrameNavPoseComps()}

                        </div>

                        <div style={{ width: '5%' }} >
                        </div>
                        
                        <div style={{ width: '40%' }}>

                          {this.renderFrameConfig()}

                        </div>

                  </div>

        </React.Fragment>

    )
  }




  render() {
    const namespace = this.getMgrNamespace()
    const connected = this.state.connected

    if (namespace == null || connected === false){
      return (
  
        <Columns>
          <Column>
  
  
          </Column>
        </Columns>
      )
    }
    else {
      return (

          <Section title={"NAVPOSE MANAGER"}>

                  {this.renderNavPoseMgr()}


        </Section>
     )
   }

  }

  
}

export default NavPoseMgr
