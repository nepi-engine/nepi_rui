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
import BooleanIndicator from "./BooleanIndicator"

import {  onChangeSwitchStateValue } from "./Utilities"


@inject("ros")
@observer
class NepiIFAdminDeviceName extends Component {
  constructor(props) {
    super(props)
    this.state = {

    devices_name_list: [],
    devices_alias_list: [],

    device_names: [],
    device_aliases: [],

    needs_update: true

    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
   
    this.updateDeviceNames = this.updateDeviceNames.bind(this)

    this.sendDeviceAliasUpdate = this.sendDeviceAliasUpdate.bind(this)
    this.sendDeviceAliasClear = this.sendDeviceAliasClear.bind(this)
    this.renderAdminDeviceName = this.renderAdminDeviceName.bind(this)

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


  sendDeviceAliasUpdate(name,alias){
    const base_namespace = this.getBaseNamespace()
    this.props.ros.sendUpdateStringMsg(base_namespace + "/update_device_alias", name,alias)
  }

  sendDeviceAliasClear(name){
    const base_namespace = this.getBaseNamespace()
    this.props.ros.sendStringMsg(base_namespace + "/clear_device_alias", name)

  }




  onUpdateInputDeviceNameValue(event, name, index) {
    const value = event.target.value
    var aliases = this.state.device_aliases
    aliases[index] = value
    this.setState({ device_aliases: aliases })
    document.getElementById(name).style.color = Styles.vars.colors.red
    //this.render()
  }

  onKeySaveInputDeviceNameValue(event, name, index) {
    const BAD_NAME_CHAR_LIST = [" ","/","'","-","$","#"]
    const {devices_alias_list} = this.props.ros
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
      
      if (devices_alias_list.indexOf(value) !== -1 && devices_alias_list.indexOf(value) !== index){
        good_name = false
        aliases[index] = 'Name Already Used'
        this.setState({ device_aliases: aliases })
      }
   
      if (good_name === true){
        aliases[index] = value
        this.setState({ device_aliases: aliases })
        this.sendDeviceAliasUpdate(name,value)


      }
      
      document.getElementById(name).style.color = Styles.vars.colors.black
    }
  }


    
    renderAdminDeviceNames(name, alias, index) {
    const base_namespace = this.getBaseNamespace()
    const {devices_running_name_list} = this.props.ros
    const running = (devices_running_name_list.indexOf(name) !== -1 || devices_running_name_list.indexOf(alias) !== -1 )
    return (

      <React.Fragment>

                <div style={{ display: 'flex' }}>
                        <div style={{ width: '5%' }} >

                        <BooleanIndicator value={running} />

                        </div>

                        <div style={{ width: '5%' }} >
                        </div>                        

                        <div style={{ width: '35%' }} >
 

                          <label >
                              {name}
                            </label>

                         </div>

  

                        <div style={{ width: '35%' }} >
 
                          <Input id={name} 
                              value={alias} 
                              onChange={(event) => this.onUpdateInputDeviceNameValue(event,name,index)} 
                              onKeyDown= {(event) => this.onKeySaveInputDeviceNameValue(event,name,index)} />


                        </div>


                        <div style={{ width: '5%' }} >
                        </div>              

                        <div style={{ width: '15%' }} >
 

                            <ButtonMenu>
                                <Button buttonUpAction={() => this.sendDeviceAliasClear(name)}>{'Clear'}</Button>
                            </ButtonMenu>

                        </div>

          

                  </div>


      </React.Fragment>
    )
  }



  updateDeviceNames(){
    const {devices_name_list} = this.props.ros
    const {devices_alias_list} = this.props.ros
    
    
    const system_devices_updated = JSON.stringify(devices_name_list) !== JSON.stringify(this.state.devices_name_list)
    const system_aliases_updated = JSON.stringify(devices_alias_list) !== JSON.stringify(this.state.devices_alias_list)
    const needs_update = ( system_devices_updated || system_aliases_updated)
    if (needs_update === true) {
      this.setState({
                    devices_name_list: JSON.parse(JSON.stringify(devices_name_list)),
                    devices_alias_list: JSON.parse(JSON.stringify(devices_alias_list)),
                    device_names: JSON.parse(JSON.stringify(devices_name_list)),
                    device_aliases: JSON.parse(JSON.stringify(devices_alias_list))
      })

    }


  } 

  renderAdminDeviceName() {
    const device_name = (this.props.device_name !== undefined) ? this.props.device_name : null
    this.updateDeviceNames()
    var device_names = this.state.device_names
    var device_aliases = this.state.device_aliases
    if (device_name != null){
      const name_index = device_names.indexOf(device_name)
      const alias_index = device_aliases.indexOf(device_name)
      if ( name_index !== -1 ){
        device_names = device_names[name_index]
        device_aliases = device_aliases[name_index]
      }
      else if ( alias_index !== -1 ){
        device_names = device_names[alias_index]
        device_aliases = device_aliases[alias_index]
      }
    }

    return (

      <React.Fragment>


                <label >
                    {"Changes Take Affect on Next Device Startup"}
                  </label>


                  <div>
                    {/* Map over the restriction options array */}
                    {device_names.map((name, index) => (
                      this.renderAdminDeviceNames(name, device_aliases[index], index)
                    ))}
                  </div>


      </React.Fragment>
    )
  }






  render() {
    const base_namespace = this.getBaseNamespace()
    const admin_mode_set = this.props.ros.systemAdminModeSet
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const title = (this.props.title !== undefined) ? this.props.title : "SYSTEM DEVICE NAMES"
    const driver_mgr_connected = this.props.ros.connectedToDriversMgr
    if (base_namespace == null || admin_mode_set === false || driver_mgr_connected === false){
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
                {this.renderAdminDeviceName()}


          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={title}>

                  {this.renderAdminDeviceName()}


        </Section>
     )
   }

  }

}
export default NepiIFAdminDeviceName
