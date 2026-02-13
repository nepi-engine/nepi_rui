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
//import Button, { ButtonMenu } from "./Button"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Styles from "./Styles"

import {  onChangeSwitchStateValue } from "./Utilities"

import NepiIFAdminConfig from "./Nepi_IF_AdminConfig"
import NepiIFAdminNodeName from "./Nepi_IF_AdminNodeName"
import NepiIFAdminModes from "./Nepi_IF_AdminModes"

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
class NepiIFAdminEnable extends Component {
  constructor(props) {
    super(props)
    this.state = {

      advancedConfigEnabled: false,
      adminPassword: ''

    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
   
    this.onUpdateAdminPasswordText = this.onUpdateAdminPasswordText.bind(this)
    this.onKeyAdminPasswordText = this.onKeyAdminPasswordText.bind(this)
    this.renderAdminEnable = this.renderAdminEnable.bind(this)



  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId
    }
    return baseNamespace
  }



  onUpdateAdminPasswordText(e) {
    this.setState({adminPassword: e.target.value});
    var textbox = document.getElementById(e.target.id)
    styleTextEdited(textbox)
  }

  onKeyAdminPasswordText(e) {
    const value = e.target.value
    const {sendStringMsg} = this.props.ros
    if(e.key === 'Enter'){
      const base_namespace = this.getBaseNamespace() + "/set_admin_password"
      sendStringMsg(base_namespace,value)
      this.setState({adminPassword: ''});
      var textbox = document.getElementById(e.target.id)
      styleTextUnedited(textbox)
    }
  }


  renderAdminEnable() {
    const admin_mode = this.props.ros.systemAdminEnabled
    const admin_password_valid = this.props.ros.systemAdminPasswordValid
    const admin_mode_set = this.props.ros.systemAdminModeSet
    const develop_mode = this.props.ros.systemDevelopEnabled
    const debug_mode = this.props.ros.systemDebugEnabled
    const base_namespace = this.getBaseNamespace()
    return (

      <React.Fragment>



              <Columns>
              <Column>

                  <Label title="Enable Admin Mode">
                        <Toggle
                        checked={admin_mode}
                        onClick={() => this.props.ros.sendBoolMsg(base_namespace + "/admin_mode_enable", !admin_mode)}>
                      </Toggle>
                  </Label>

 

                  </Column>
                  <Column>
 
                  { (admin_password_valid === false && admin_mode === true) ?
                      <Label title={"Enter Admin Password"}>
                        <Input
                          id="admin_password"
                          value={this.state.adminPassword}
                          onChange={this.onUpdateAdminPasswordText}
                          onKeyDown={this.onKeyAdminPasswordText}
                        />
                      </Label>
                  : null }

                </Column>
                  </Columns>

      </React.Fragment>
    )
  }






  render() {
    const base_namespace = this.getBaseNamespace()
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true



    if (base_namespace == null){
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

         
                {this.renderAdminEnable()}


          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={(this.props.title !== undefined) ? this.props.title : "Advanced Controls"}>

                  {this.renderAdminEnable()}


        </Section>
     )
   }

  }

}
export default NepiIFAdminEnable
