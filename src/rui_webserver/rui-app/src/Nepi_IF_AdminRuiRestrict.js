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
class NepiIFAdminRuiRestrict extends Component {
  constructor(props) {
    super(props)
    this.state = {

      advancedConfigEnabled: false,
      adminPassword: ''

    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
   

    this.renderAdminRuiRestrict = this.renderAdminRuiRestrict.bind(this)



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
                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
                : null }


                { (this.state.advancedConfigEnabled===true) ? 
                  this.renderAdmin()
                : null }

          </React.Fragment>


        )
  }
    

  renderAdminRuiRestrict() {
    const base_namespace = this.getBaseNamespace()
    return (

      <React.Fragment>



              <Columns>
              <Column>

                  <Label title="Rui Restricted">
                        <Toggle
                        checked={false}
                        onClick={() => this.props.ros.sendStringMsg(base_namespace + "/add_rui_restriction", 'None')}>
                      </Toggle>
                  </Label>

 

                  </Column>
                  <Column>
 
            

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

         
                {this.renderAdminRuiRestrict()}


          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={(this.props.title !== undefined) ? this.props.title : "Advanced Controls"}>

                  {this.renderAdminRuiRestrict()}


        </Section>
     )
   }

  }

}
export default NepiIFAdminRuiRestrict
