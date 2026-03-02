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


@inject("ros")
@observer
class NepiIFAdminRui extends Component {
  constructor(props) {
    super(props)
    this.state = {


    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
   
    this.sendRuiRestriction = this.sendRuiRestriction.bind(this)
    this.renderAdminRui = this.renderAdminRui.bind(this)



  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId
    }
    return baseNamespace
  }


  sendRuiRestriction(name,value,type){
    const base_namespace = this.getBaseNamespace()
    if (value === true){
      this.props.ros.sendStringMsg(base_namespace + "/add_rui_restriction", name + '-' + type)
    }
    else {
      this.props.ros.sendStringMsg(base_namespace + "/remove_rui_restriction", name + '-' + type)
    }
  }


    
    renderAdminRestriction(name) {
    const base_namespace = this.getBaseNamespace()
    const {ruiRestrictions} = this.props.ros
    const view_restricted = ruiRestrictions.indexOf(name + '-VIEW') !== -1
    const control_restricted = ruiRestrictions.indexOf(name + '-CONTROL') !== -1

    return (

      <React.Fragment>

                <div style={{ display: 'flex' }}>
                        <div style={{ width: '80%' }} >
 

                        <Label title={name}>

                            <Toggle
                            checked={view_restricted}
                            onClick={() => this.sendRuiRestriction(name,!view_restricted,'VIEW')}>
                          </Toggle>


                            <Toggle
                            checked={control_restricted}
                            onClick={() => this.sendRuiRestriction(name,!control_restricted,'CONTROL')}>
                          </Toggle>

                        </Label>

                        </div>


                        <div style={{ width: '20%' }}>
                        </div>

          

                  </div>


      </React.Fragment>
    )
  }

  renderAdminRui() {
    const base_namespace = this.getBaseNamespace()
    const restriction_options = this.props.ros.ruiRestrictionOptions
    const rui_login_enabled = this.props.ros.ruiLoginEnabled
    return (





      <React.Fragment>






               <div style={{ display: 'flex' }}>
                        <div style={{ width: '60%' }} >
 

                        <Label title={'Enable Login Screen'}>

                            <Toggle
                            checked={rui_login_enabled}
                            onClick={() => this.props.ros.sendBoolMsg(base_namespace + '/rui_login_mode_enable',!rui_login_enabled)}>
                          </Toggle>

                        </Label>

                        </div>


                        <div style={{ width: '40%' }}>
                        </div>


                  </div>


                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                <Label title={'RUI Restrictions ( VIEW / CONTROL )'}> </Label>


                  <div>
                    {/* Map over the restriction options array */}
                    {restriction_options.map((name) => (
                      this.renderAdminRestriction(name)
                    ))}
                  </div>


      </React.Fragment>
    )
  }






  render() {
    const base_namespace = this.getBaseNamespace()
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const title = (this.props.title !== undefined) ? this.props.title : "SYSTEM RUI CONFIG"

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
                <Label title={title} />
                {this.renderAdminRui()}


          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={title}>

                  {this.renderAdminRui()}


        </Section>
     )
   }

  }

}
export default NepiIFAdminRui
