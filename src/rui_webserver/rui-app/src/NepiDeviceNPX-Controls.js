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
import Button, { ButtonMenu } from "./Button"
import { Column, Columns } from "./Columns"

//import NepiIF3DTransform from "./Nepi_IF_3DTransform"

@inject("ros")
@observer

// Component that contains the NPX Device controls
class NepiDeviceNPXControls extends Component {
  constructor(props) {
    super(props)

    // these states track the values through NPX Status messages
    this.state = {
      frame3D: null,
      age_filter_s: null
    }


  }


  renderControls() {
    const { npxDevices, sendTriggerMsg} = this.props.ros
    const namespace = this.props.namespace ? this.props.namespace : null
    const message = this.props.status_msg ? this.props.status_msg : null
    const capabilities = npxDevices[namespace] ? npxDevices[namespace] : null


    if (namespace != null && capabilities != null && message != null){
      //Unused const update_rate = message.update_rate
      //Unused const navpose_frame = message.navpose_frame
      //Unused const frame_nav = message.frame_nav
      //Unused const frame_altitude = message.frame_altitude
      //Unused const frame_depth = message.frame_depth
      const has_loc = message.has_location
      const has_head = message.has_heading
      const has_orien = message.has_orientation
      const has_pos = message.has_position
      const has_alt = message.has_altitude
      const has_depth = message.has_depth

      const has_transform = message.has_transform
      const updates = message.supports_updates
    
      return (
        <Section title={"NavPose Controls"}>
  
        </Section>
      )
    }
  }

  render() {
    return (
      <Columns>
        <Column>
          {this.renderControls()}
        </Column>
      </Columns>
    )
  }
}

export default NepiDeviceNPXControls