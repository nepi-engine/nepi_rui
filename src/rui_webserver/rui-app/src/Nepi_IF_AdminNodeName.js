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

import {  getCleanName } from "./Utilities"

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
class NepiIFAdminNodeName extends Component {
  constructor(props) {
    super(props)
    this.state = {
      updatedNodeName: null

    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
    this.onNodeNameChange = this.onNodeNameChange.bind(this)
    this.onNodeNameKey = this.onNodeNameKey.bind(this)
    this.onNodeNameReset = this.onNodeNameReset.bind(this)
    this.renderAdminNodeNames = this.renderAdminNodeNames.bind(this)


  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId
    }
    return baseNamespace
  }



  onNodeNameChange(e) {
    const clean_node_name = getCleanName(e.target.value)
    this.setState({ updatedNodeName: clean_node_name })
    var node_name_textbox = document.getElementById(e.target.id)
    styleTextEdited(node_name_textbox)
  }

  onNodeNameKey(e) {
    if(e.key === 'Enter'){
      const namespace = (this.props.namespace !== undefined) ? this.props.namespace : 'None'
      const namespace_parts = namespace.split('/')
      const cur_node_name = (this.state.updatedNodeName != null) ? this.state.updatedNodeName :   namespace_parts.pop()
      const updatedNodeName = this.state.updatedNodeName
      if (namespace != null && namespace !== 'None' && updatedNodeName != null && updatedNodeName !== '') {
        this.props.ros.sendUpdateStringMsg(namespace + '/update_node_name',cur_node_name, updatedNodeName)
      }
      else {
        this.setState({ updatedNodeName: null })
      }
      var node_name_textbox = document.getElementById(e.target.id)
      styleTextUnedited(node_name_textbox)
    }
  }


  onNodeNameReset() {
      const node_names = this.props.ros.systemNodeNameKeys
      const node_aliases = this.props.ros.systemNodeNameAliases
      const namespace = (this.props.namespace !== undefined) ? this.props.namespace : 'None'
      const namespace_parts = namespace.split('/')
      const cur_node_name = namespace_parts.pop()

      const index = node_aliases.indexOf(cur_node_name)
      var updatedNodeName = null
      if (index !== -1){
          updatedNodeName = node_names[index]
      }

      this.props.ros.sendStringMsg(namespace + '/reset_node_name',cur_node_name)
      this.setState({ updatedNodeName: updatedNodeName })
  }


    


  renderAdminNodeNames() {
    const base_namespace = this.getBaseNamespace()
    const { userRestricted} = this.props.ros
    const node_names = this.props.ros.systemNodeNameKeys
    const node_aliases = this.props.ros.systemNodeNameAliases


    const show_node_name_title = (this.props.show_node_name_title !== undefined) ? this.props.show_node_name_title : 'Node Name'

    const namespace = (this.props.namespace !== undefined) ? this.props.namespace : 'None'
    const namespace_parts = namespace.split('/')
    const node_name = (this.state.updatedNodeName != null) ? this.state.updatedNodeName :   namespace_parts.pop()
    const node_name_restricted = userRestricted.indexOf('node_name') !== -1
    const needs_reset = (node_aliases.indexOf(node_name) !== -1)

    return (

      <React.Fragment>


              <Columns>
              <Column>

                        <Label title={show_node_name_title}>
                        <Input
                          id={"node_name_update_text"}
                          value={node_name }
                          disabled={node_name_restricted===true}
                          onChange={this.onNodeNameChange}
                          onKeyDown={this.onNodeNameKey}
                        />
                      </Label>




                  </Column>
                  <Column>
 

                      { (needs_reset === true ) ?
                          <ButtonMenu>
                            <Button onClick={() => this.onNodeNameReset() }>{"Reset"}</Button>
                          </ButtonMenu>

                      : null }

                </Column>
                  </Columns>





      </React.Fragment>
    )
  }



  render() {
    const base_namespace = this.getBaseNamespace()
    const namespace = (this.props.namespace !== undefined) ? this.props.namespace : 'None'
    const admin_mode_set = this.props.ros.systemAdminModeSet
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    
    if (base_namespace == null || admin_mode_set === false || namespace === 'None'){
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


                  {this.renderAdminNodeNames()}

          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={(this.props.title !== undefined) ? this.props.title : "Node Name Controls"}>

              {this.renderAdminNodeNames()}

        </Section>
     )
   }

  }

}
export default NepiIFAdminNodeName
