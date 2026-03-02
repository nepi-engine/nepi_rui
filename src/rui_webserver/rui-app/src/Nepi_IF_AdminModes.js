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
import Toggle from "react-toggle"
import Input from "./Input"
import Button, { ButtonMenu } from "./Button"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Styles from "./Styles"

import {  onChangeSwitchStateValue } from "./Utilities"

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

function styleTextEdited(text_box_element) {
  text_box_element.style.color = Styles.vars.colors.red
  text_box_element.style.fontWeight = "bold"
}

function styleTextUnedited(text_box_element) {
  text_box_element.style.color = Styles.vars.colors.black
  text_box_element.style.fontWeight = "normal"
}

const styles = Styles.Create({
  link_style: {
    color: Styles.vars.colors.blue,
    fontSize: Styles.vars.fontSize.medium,
    //lineHeight: Styles.vars.lineHeights.xl 
  }
})

@inject("ros")
@observer
class NepiIFAdminModes extends Component {
  constructor(props) {
    super(props)
    this.state = {

      mode_selection: null

    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
    this.sendModeSelection = this.sendModeSelection.bind(this)
    this.renderAdminModes = this.renderAdminModes.bind(this)

  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId
    }
    return baseNamespace
  }


  sendModeSelection(mode){
    const base_namespace = this.getBaseNamespace()
    this.props.ros.sendStringMsg(base_namespace + "/set_run_mode", mode)
    this.setState({mode_selection: mode})
  }



  renderAdminModes() {
    const base_namespace = this.getBaseNamespace()
    const run_mode = this.props.ros.systemRunMode

    const develop_mode = run_mode == 'develop'
    const deploy_mode = run_mode == 'deploy'

    const debug_mode = this.props.ros.systemDebugEnabled
    return (


      <React.Fragment>


                <div style={{ display: 'flex' }}>
                        <div style={{ width: '25%' }} >
 
                                <Label title="Develop Mode">
                                      <Toggle
                                      checked={develop_mode == true}
                                      disbled={develop_mode == true}
                                      onClick={() => this.sendModeSelection('develop')}>
                                    </Toggle>
                                </Label>

                        </div>


                        <div style={{ width: '5%' }}>
                        </div>

            
                        <div style={{ width: '25%' }}>

                              <Label title="Deploy Mode">
                                    <Toggle
                                    checked={deploy_mode == true}
                                    disbled={deploy_mode == true}
                                    onClick={() => this.sendModeSelection('deploy')}>
                                  </Toggle>
                              </Label>

                        </div>


                        <div style={{ width: '5%' }}>
                        </div>

                        <div style={{ width: '25%' }} >

                              <Label title="Debug Mode">
                                    <Toggle
                                    checked={debug_mode == true}
                                    onClick={() => this.props.ros.sendBoolMsg(base_namespace + "/enable_debug_mode", !debug_mode)}>
                                  </Toggle>
                              </Label>

                        </div>

                  </div>


      </React.Fragment>



    )
  }



  render() {
    const base_namespace = this.getBaseNamespace()
    const admin_mode_set = this.props.ros.systemAdminModeSet
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const title = (this.props.title !== undefined) ? this.props.title : "SYSTEM RUN MODES"

    if (base_namespace == null || admin_mode_set === false){
      return (
  
        <Columns>
          <Column>
  
  
          </Column>
        </Columns>
      )
    }
    else if (make_section === false){

      return (

          <React.Fragment>

                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
                <Label title={title} />
                  {this.renderAdminModes()}

          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={title}>

              {this.renderAdminModes()}

        </Section>
     )
   }

  }

}
export default NepiIFAdminModes
