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
class NepiIFAdmin extends Component {
  constructor(props) {
    super(props)
    this.state = {

      advancedConfigEnabled: false,
      adminPassword: ''

    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
   
    this.renderAdvancedOptions = this.renderAdvancedOptions.bind(this)

    this.onUpdateAdminPasswordText = this.onUpdateAdminPasswordText.bind(this)
    this.onKeyAdminPasswordText = this.onKeyAdminPasswordText.bind(this)
    this.renderAdminSelect = this.renderAdminSelect.bind(this)



  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId
    }
    return baseNamespace
  }



  renderAdvancedOptions() {
    
        return (

          <React.Fragment>

              <Columns>
              <Column>

                  <Label title="Show Advanced Options">
                    <Toggle
                      checked={this.state.advancedConfigEnabled===true}
                      onClick={() => onChangeSwitchStateValue.bind(this)("advancedConfigEnabled",this.state.advancedConfigEnabled)}>
                    </Toggle>
                </Label>



                  </Column>
                  <Column>
 

                </Column>
                  </Columns>

                { (this.state.advancedConfigEnabled===true) ? 
                  this.renderAdminSelect()
                : null }

          </React.Fragment>


        )
  }
    
 /////////////////
  //// ADMIN SECTIONS
  /////////////////

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


  renderAdminSelect() {
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
 
                  { (admin_password_valid === false) ?
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


            { (admin_mode_set === true ) ?
                <ButtonMenu>
                  <Button onClick={() => this.props.ros.sendTriggerMsg( base_namespace + "/save_system_cfgs")}>{"System Save"}</Button>
                  <Button onClick={() => this.props.ros.sendTriggerMsg( base_namespace + "/restore_system_cfgs")}>{"System Reset"}</Button>
                  <Button onClick={() => this.props.ros.sendTriggerMsg( base_namespace + "/restore_factory_cfgs")}>{"Factory Reset"}</Button>
                </ButtonMenu>

            :
                <ButtonMenu>
                  <Button onClick={() => this.props.ros.sendTriggerMsg( base_namespace + "/restore_system_cfgs")}>{"System Reset"}</Button>
                </ButtonMenu>
            }



              <Columns>
              <Column>


                  { (admin_mode_set === true) ?
                    <Label title="Enable Develop Mode">
                        <Toggle
                        checked={develop_mode}
                        onClick={() => this.props.ros.sendBoolMsg(base_namespace + "/develop_mode_enable", !develop_mode)}>
                      </Toggle>
                  </Label>
                  : null }
 

                  </Column>
                  <Column>
 
                  { (admin_mode_set === true) ?
                    <Label title="Enable Debug Mode">
                        <Toggle
                        checked={debug_mode}
                        onClick={() => this.props.ros.sendBoolMsg(base_namespace + "/debug_mode_enable", !debug_mode)}>
                      </Toggle>
                  </Label>
                  : null }

                </Column>
                  </Columns>


      </React.Fragment>
    )
  }






  render() {
    const base_namespace = this.getBaseNamespace()
    const show_advanced_option = (this.props.show_advanced_option !== undefined) ? this.props.show_advanced_option : true
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

                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
        
                { ( show_advanced_option === true) ?
                  this.renderAdvancedOptions()
                :
                  this.renderAdminSelect()
                }

          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={(this.props.title !== undefined) ? this.props.title : "Advanced Controls"}>

                { ( show_advanced_option === true) ?
                  this.renderAdvancedOptions()
                :
                  this.renderAdminSelect()
                }

        </Section>
     )
   }

  }

}
export default NepiIFAdmin
