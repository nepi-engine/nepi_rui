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
//import Button, { ButtonMenu } from "./Button"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
//import BooleanIndicator from "./BooleanIndicator"

import NepiIFConfig from "./Nepi_IF_Config"

import {onChangeSwitchStateValue} from "./Utilities"

@inject("ros")
@observer

// Component that contains the NPX Device controls
class NepiDeviceNPXControls extends Component {
  constructor(props) {
    super(props)

    // these states track the values through NPX Status messages
    this.state = {

      namespace: null,
      status_msg: null,
      show_controls: (this.props.show_controls != undefined) ? this.props.show_controls : false,

    }

    this.renderControlData = this.renderControlData.bind(this)
    this.renderControlPanel = this.renderControlPanel.bind(this)

    
    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

    
  }

  // Callback for handling ROS StatusIDX messages
  statusListener(message) {
    const last_msg = this.state.status_msg
    this.setState({
      status_msg: message,
    })

  }

  // Function for configuring and subscribing to StatusIDX
  updateStatusListener() {
    const { namespace } = this.props
    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
      this.setState({ status_msg: null, statusListener: null})
    }
    if (namespace !== 'None'){
      var statusListener = this.props.ros.setupNPXStatusListener(
        namespace,
        this.statusListener
      )
      this.setState({ statusListener: statusListener})
    }
    this.setState({ namespace: namespace})

  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { namespace } = this.props
    if (namespace !== this.state.namespace){
      if (namespace !== null) {
        this.updateStatusListener()
      } 
    }
  }

  componentDidMount() {
    this.updateStatusListener()
    }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to StatusIDX message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
  }



  renderControlData() {

    const namespace = this.props.namespace ? this.props.namespace : null
 
    const status_msg = this.state.status_msg

    
      return (
          <React.Fragment>



          </React.Fragment>
        )
 
  }

  renderControlPanel() {

    const namespace = this.props.namespace ? this.props.namespace : null
    
    const status_msg = this.state.status_msg
    //Unused const update_rate = status_msg.update_rate
    //Unused const navpose_frame = status_msg.navpose_frame
    //Unused const frame_nav = status_msg.frame_nav
    //Unused const frame_altitude = status_msg.frame_altitude
    //Unused const frame_depth = status_msg.frame_depth
    const has_loc = status_msg.has_location
    const has_head = status_msg.has_heading
    const has_orien = status_msg.has_orientation
    const has_pos = status_msg.has_position
    const has_alt = status_msg.has_altitude
    const has_depth = status_msg.has_depth
    const has_transform = status_msg.has_transform
    const updates = status_msg.supports_updates

    // const devices = this.props.ros.npxDevices
 
    // const devicesList = Object.keys(devices)
    // if (devicesList.indexOf(namespace) !== -1){
    //   const capabilities = devices[namespace]

    // }


    const never_show_controls = (this.props.never_show_controls != undefined) ? this.props.never_show_controls : false
    const allways_show_controls = (this.props.allways_show_controls != undefined) ? this.props.allways_show_controls : false
    const show_controls = (allways_show_controls === true) ? true : (this.props.show_controls != undefined) ? this.props.show_controls : this.state.show_controls


    if (never_show_controls === true){
              <Columns>
                <Column>

                </Column>
              </Columns>

    }

    else if (show_controls === false){
      return(
              <Columns>
                <Column>

                    <Label title="Show Controls">
                        <Toggle
                          checked={show_controls===true}
                          onClick={() => onChangeSwitchStateValue.bind(this)("show_controls",show_controls)}>
                        </Toggle>
                    </Label>

                </Column>
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

                    {(allways_show_controls === false) ?
                    <Label title="Show Controls">
                        <Toggle
                          checked={show_controls===true}
                          onClick={() => onChangeSwitchStateValue.bind(this)("show_controls",show_controls)}>
                        </Toggle>
                    </Label>
                    : null }

                  </Column>
                  <Column>

                  </Column>
                </Columns>

                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                  <NepiIFConfig
                      namespace={namespace}
                      title={"Nepi_IF_Conig"}
                />


          </React.Fragment>
        )
    }
  }


  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true

    const status_msg = this.state.status_msg
    if (status_msg == null){
      return (
        <Columns>
        <Column>
       
        </Column>
        </Columns>
      )


    }
    else if (make_section === false){

      return (

          <Columns>
            <Column >

              { this.renderControlData()}
              { this.renderControlPanel()}


            </Column>
          </Columns>
      )
    }
    else {
      return (

          <Section title={(this.props.title != undefined) ? this.props.title : ""}>

              { this.renderControlData()}
              { this.renderControlPanel()}


        </Section>
     )
   }

  }


}

export default NepiDeviceNPXControls