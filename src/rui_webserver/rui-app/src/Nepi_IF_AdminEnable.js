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


function styleTextEdited(text_box_element) {
  text_box_element.style.color = Styles.vars.colors.red
  text_box_element.style.fontWeight = "bold"
}

function styleTextUnedited(text_box_element) {
  text_box_element.style.color = Styles.vars.colors.black
  text_box_element.style.fontWeight = "normal"
}

@inject("ros")
@observer
class NepiIFAdminEnable extends Component {
  constructor(props) {
    super(props)
    this.state = {

      advancedConfigEnabled: false,
      adminPassword: '',
      changePassword: ''

    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)

    this.onUpdateAdminPasswordText = this.onUpdateAdminPasswordText.bind(this)
    this.onKeyAdminPasswordText = this.onKeyAdminPasswordText.bind(this)
    this.renderAdminEnable = this.renderAdminEnable.bind(this)



  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix != null && deviceId != null){
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
    if(e.key === 'Enter'){
      const password = this.props.ros.stringEncript(value)
      const base_namespace = this.getBaseNamespace()
    
      const namespace = base_namespace + '/set_admin_password'
      this.props.ros.sendStringMsg(namespace, password)
      this.setState({adminPassword: ''});
      var textbox = document.getElementById(e.target.id)
      styleTextUnedited(textbox)
    }
  }




  renderAdminEnable() {
    const admin_mode = this.props.ros.systemAdminEnabled
    const admin_password_valid = this.props.ros.systemAdminPasswordValid
    const admin_mode_set = this.props.ros.systemAdminModeSet
    const show_link_button = (this.props.show_link_button !== undefined)? this.props.show_link_button : true

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
                          type={"password"}
                          value={this.state.adminPassword}
                          onChange={this.onUpdateAdminPasswordText}
                          onKeyDown={this.onKeyAdminPasswordText}
                        />
                      </Label>
                  : null }


                  </Column>
                  <Column>

                      { (admin_mode_set === true && admin_mode === true && show_link_button === true) ?
                      <ButtonMenu>
                        <Button onClick={() => window.open("/admin", "_blank")}>{"Open Admin Controls"}</Button>
                      </ButtonMenu>
                  : null }

                </Column>
                  </Columns>

      </React.Fragment>
    )
  }






  render() {
    const base_namespace = this.getBaseNamespace()
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const show_line = (this.props.show_line !== undefined)? this.props.show_line : true
    const title = (this.props.title !== undefined) ? this.props.title : "SYSTEM ADMIN ENABLE"

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



                { (show_line === true) ?
                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
                : null }
                <Label title={title} />
                {this.renderAdminEnable()}


          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={title}>

                  {this.renderAdminEnable()}


        </Section>
     )
   }

  }

}
export default NepiIFAdminEnable
