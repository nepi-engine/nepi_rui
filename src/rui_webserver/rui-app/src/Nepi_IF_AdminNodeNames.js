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


    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
   
    this.sendNodeNameUpdate = this.sendNodeNameUpdate.bind(this)
    this.sendNodeNameClear = this.sendNodeNameClear.bind(this)
    this.renderAdminNodeName = this.renderAdminNodeName.bind(this)

    this.onUpdateInputDeviceNameValue = this.onUpdateInputDeviceNameValue.bind(this)
    this.onKeySaveInputDeviceNameValue = this.onKeySaveInputDeviceNameValue.bind(this)
  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId
    }
    return baseNamespace
  }


  sendNodeNameUpdate(name,value,type){
    const base_namespace = this.getBaseNamespace()
    this.props.ros.sendUpdateStringMsg(base_namespace + "/update_node_name", name,value)
  }

  sendNodeNameClear(name){
    const base_namespace = this.getBaseNamespace()
    this.props.ros.sendStringMsg(base_namespace + "/clear_node_name", name)

  }




  onUpdateInputDeviceNameValue(event) {
    this.setState({ device_name: event.target.value })
    document.getElementById("input_device_name").style.color = Styles.vars.colors.red
    this.render()
  }

  onKeySaveInputDeviceNameValue(event) {
    const {sendStringMsg}  = this.props.ros
    const device_name_update_topic = this.props.deviceNamespace + this.props.name_update_topic
    const BAD_NAME_CHAR_LIST = [" ","/","'","-","$","#"]
    if(event.key === 'Enter'){
      const value = event.target.value
      var good_name = true
      for(let ind = 0; ind < BAD_NAME_CHAR_LIST.length; ind++) {
        if (value.indexOf(BAD_NAME_CHAR_LIST[ind]) !== -1){
          good_name = false
        }
      }
      if (good_name === true){
        sendStringMsg(device_name_update_topic,value)
      }
      document.getElementById("input_device_name").style.color = Styles.vars.colors.black
    }
  }


    
    renderAdminDeviceNames(name) {
    const base_namespace = this.getBaseNamespace()
    const {systemNodeNameKeys} = this.props.ros
    const {systemNodeNameAliases} = this.props.ros

    return (

      <React.Fragment>

                <div style={{ display: 'flex' }}>
                        <div style={{ width: '80%' }} >
 

                        <Label title={name}>

                          <Input id="input_device_name" 
                              value={this.state.device_name} 
                              onChange={this.onUpdateInputDeviceNameValue} 
                              onKeyDown= {this.onKeySaveInputDeviceNameValue} />



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

  renderAdminNodeName() {
    const base_namespace = this.getBaseNamespace()
    const restriction_options = this.props.ros.ruiDeviceNamesOptions
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

                <Label title={'RUI DeviceNamess ( VIEW / CONTROL )'}> </Label>


                  <div>
                    {/* Map over the restriction options array */}
                    {restriction_options.map((name) => (
                      this.renderAdminDeviceNames(name)
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
