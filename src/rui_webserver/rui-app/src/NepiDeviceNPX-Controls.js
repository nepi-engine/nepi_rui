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
import NepiIFConfig from "./Nepi_IF_Config"

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
      frame3D: null,
      age_filter_s: null
    }

    this.renderControlPanel = this.renderControlPanel.bind(this)
  }


  renderControlPanel() {
    const { npxDevices, sendTriggerMsg} = this.props.ros
    const namespace = this.props.namespace ? this.props.namespace : null
    const capabilities = npxDevices[namespace] ? npxDevices[namespace] : null
    const status_msg = this.state.status_msg

    if (namespace != null && capabilities != null && status_msg != null){
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
    
      return (
          <React.Fragment>


            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                  <NepiIFConfig
                      namespace={namespace}
                      title={"Nepi_IF_Conig"}
                />


          </React.Fragment>
        )
    }
    else {

      return (
        <Columns>
        <Column>
       
        </Column>
        </Columns>
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

              { this.renderControlPanel()}


            </Column>
          </Columns>
      )
    }
    else {
      return (

          <Section title={(this.props.title != undefined) ? this.props.title : ""}>

              {this.renderControlPanel()}


        </Section>
     )
   }

  }


}

export default NepiDeviceNPXControls