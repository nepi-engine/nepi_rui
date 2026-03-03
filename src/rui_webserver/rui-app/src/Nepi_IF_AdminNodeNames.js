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


@inject("ros")
@observer
class NepiIFAdminNodeName extends Component {
  constructor(props) {
    super(props)
    this.state = {

    device_names: [],
    device_aliases: [],

    needs_update: true

    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
   
    this.sendNodeNameUpdate = this.sendNodeNameUpdate.bind(this)
    this.sendNodeNameClear = this.sendNodeNameClear.bind(this)
    this.renderAdminNodeName = this.renderAdminNodeName.bind(this)

    this.onUpdateInputDeviceNameValue = this.onUpdateInputDeviceNameValue.bind(this)
    this.onKeySaveInputDeviceNameValue = this.onKeySaveInputDeviceNameValue.bind(this)

    this.getUpdatedAliases = this.getUpdatedAliases.bind(this)
  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId
    }
    return baseNamespace
  }


  sendNodeNameUpdate(name,alias){
    const base_namespace = this.getBaseNamespace()
    this.props.ros.sendUpdateStringMsg(base_namespace + "/update_node_name", name,alias)
  }

  sendNodeNameClear(name){
    const base_namespace = this.getBaseNamespace()
    this.props.ros.sendStringMsg(base_namespace + "/clear_node_name", name)

  }




  onUpdateInputDeviceNameValue(event, name, index) {
    this.setState({ needs_update: false })
    const value = event.target.value
    var aliases = this.state.device_aliases
    aliases[index] = value
    this.setState({ device_aliases: aliases })
    document.getElementById(name).style.color = Styles.vars.colors.red
    //this.render()
  }

  onKeySaveInputDeviceNameValue(event, name, index) {
    const {sendStringMsg}  = this.props.ros
    const device_name_update_topic = this.props.deviceNamespace + this.props.name_update_topic
    const BAD_NAME_CHAR_LIST = [" ","/","'","-","$","#"]
    const {systemNodeNameAliases} = this.props.ros
    var aliases = this.state.device_aliases

    if(event.key === 'Enter'){
      const value = event.target.value
      var good_name = true
      for(let ind = 0; ind < BAD_NAME_CHAR_LIST.length; ind++) {
        if (value.indexOf(BAD_NAME_CHAR_LIST[ind]) !== -1){
          good_name = false
          aliases[index] = 'Bad Chars In Name'
          this.setState({ device_aliases: aliases })
        }
      }
      
      if (systemNodeNameAliases.indexOf(value) !== -1){
        good_name = false
        aliases[index] = 'Name Already Used'
        this.setState({ device_aliases: aliases })
      }
   
      if (good_name === true){
        aliases[index] = value
        this.setState({ device_aliases: aliases })
        this.sendNodeNameClear(name,value)
        this.setState({ needs_update: true })


      }
      
      document.getElementById(name).style.color = Styles.vars.colors.black
    }
  }


    
    renderAdminDeviceNames(name, alias, index) {
    const base_namespace = this.getBaseNamespace()

    return (

      <React.Fragment>

                <div style={{ display: 'flex' }}>
                        <div style={{ width: '80%' }} >
 

                        <Label title={name}>

                          <Input id={name} 
                              value={alias} 
                              onChange={(event) => this.onUpdateInputDeviceNameValue(event,name,index)} 
                              onKeyDown= {(event) => this.onKeySaveInputDeviceNameValue(event,name,index)} />


                        <ButtonMenu>
                            <Button onClick={this.sendNodeNameClear(name)}>{"Clear"}</Button>
                        </ButtonMenu>

                        </Label>

                        </div>


                        <div style={{ width: '20%' }}>
                        </div>

          

                  </div>


      </React.Fragment>
    )
  }



  getUpdatedAliases(){
    const {systemNodeNameKeys} = this.props.ros
    const {systemNodeNameAliases} = this.props.ros
    
    
    system_devices_updated = JSON.stringify(systemNodeNameAliases) === JSON.stringify(this.state.last_system_devices)
    system_aliases_updated = JSON.stringify(systemNodeNameAliases) === JSON.stringify(this.state.last_system_aliases)
    needs_update = (system_aliases_updated || system_devices_updated)  && (this.state.needs_update === true)
    if (needs_update === true) {
      this.setState({needs_update: false,
                    device_names: systemNodeNameKeys,
                    device_aliases: systemNodeNameAliases
      })
    }


  } 

  renderAdminNodeName() {


    return (





      <React.Fragment>


                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                <Label title={'Device Name Aliases'}> </Label>


                  <div>
                    {/* Map over the restriction options array */}
                    {this.state.device_names.map((name, index) => (
                      this.renderAdminDeviceNames(name, this.state.device_aliases[index], index)
                    ))}
                  </div>


      </React.Fragment>
    )
  }






  render() {
    const base_namespace = this.getBaseNamespace()
    const admin_mode_set = this.props.ros.systemAdminModeSet
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const title = (this.props.title !== undefined) ? this.props.title : "SYSTEM RUI CONFIG"

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
                {this.renderAdminNodeName()}


          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={title}>

                  {this.renderAdminNodeName()}


        </Section>
     )
   }

  }

}
export default NepiIFAdminNodeName
