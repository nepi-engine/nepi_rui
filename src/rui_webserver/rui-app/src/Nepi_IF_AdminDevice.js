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
class NepiIFAdminDevice extends Component {
  constructor(props) {
    super(props)
    this.state = {


    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
   
    this.createRunModeMenuOptions = this.createRunModeMenuOptions.bind(this)
    this.onRunModeSelected = this.onRunModeSelected.bind(this)
    // this.onDeviceIdChange = this.onDeviceIdChange.bind(this)
    // this.onDeviceIdKey = this.onDeviceIdKey.bind(this)
    this.renderAdminControls = this.renderAdminControls.bind(this)


  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId
    }
    return baseNamespace
  }



  // Function for creating run mode options menu
  createRunModeMenuOptions() {
    const options = this.props.ros.systemRunModeOptions
    const sel_option = this.props.ros.systemRunModeOptions
    var items = []
    var i
    //var unique_names = createShortUniqueValues(options)
    var display_name = ""

    if (options.length > 0){
      for (i = 0; i < options.length; i++) {
        display_name = options[i]
        items.push(<Option value={options[i]}>{display_name}</Option>)
      }
    }
    //items.push(<Option value={"None Availble"}>{"None"}</Option>)
    return items
  }


  onRunModeSelected(event) {
    const {sendStringMsg} = this.props.ros
    const base_namespace = this.getBaseNamespace() + "/set_run_mode"
    const item = event.target.value
    sendStringMsg(base_namespace,item)
  }



  // async onDeviceIdChange(e) {
  //   this.setState({ updatedDeviceId: e.target.value })
  //   var device_id_textbox = document.getElementById(e.target.id)
  //   styleTextEdited(device_id_textbox)
  // }

  // async onDeviceIdKey(e) {
  //   const {setDeviceID} = this.props.ros
  //   if(e.key === 'Enter'){
  //     setDeviceID({newDeviceID: this.state.updatedDeviceId})
  //     var device_id_textbox = document.getElementById(e.target.id)
  //     styleTextUnedited(device_id_textbox)
  //   }
  // }



  renderAdminControls() {
    const admin_mode_set = this.props.ros.systemAdminModeSet

    if (admin_mode_set === true) {
      return(
              <Columns>
              <Column>


              </Column>
              </Columns>

      )

    }
    else {
        
        const base_namespace = this.getBaseNamespace()
        const run_mode_menu = this.createRunModeMenuOptions()
        const run_mode = this.props.ros.systemRunMode

        //const debug_mode = this.props.ros.systemDebugEnabled
        //const { userRestrictionsEnabled} = this.props.ros
        //const device_restricted = userRestrictionsEnabled.indexOf('device_id') !== -1

        // const { userRestrictionsEnabled} = this.props.ros
        // const device_restricted = userRestrictionsEnabled.indexOf('device_id') !== -1

        // if (this.state.advancedConfigEnabled === false && deviceId !== this.state.updatedDeviceId){
        //   this.setState({updatedDeviceId:deviceId})
        // }
        // //Unused const updatedDeviceId = this.state.updatedDeviceId      

        
        return (

          <React.Fragment>

            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                  <Columns>
                  <Column>

                      <Label title={"Set Run Mode"}>
                          <Select
                              onChange={this.onRunModeSelected}
                              value={run_mode}
                              >
                              {run_mode_menu}
                          </Select>
                      </Label>



                      </Column>
                      <Column>
    
                              {/* 
                              <Label title="System Debug Mode">
                                    <Toggle
                                    checked={debug_mode}
                                    onClick={() => this.props.ros.sendBoolMsg("debug_mode_enable", !debug_mode)}>
                                  </Toggle>
                              </Label>
                              */}

                          {/* <Label title={"Device ID"}>
                              <Input
                                id={"device_id_update_text"}
                                value={deviceId }
                                disabled={device_restricted===true}
                                onChange={this.onDeviceIdChange}
                                onKeyDown={this.onDeviceIdKey}
                              />
                            </Label>

                            <Label title={"Device Type"}>
                              <Input
                                id={"device_type"}
                                value={systemMgrStatus.hw_type}
                                disabled={true}
                              />
                            </Label>

                            <Label title={"Device Model"}>
                              <Input
                                id={"device_model"}
                                value={systemMgrStatus.hw_model}
                                disabled={true}
                              />
                            </Label> */}


                    </Column>
                      </Columns>




                  


          </React.Fragment>
        )
    }
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

                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
        
                {this.renderAdminControls()}

          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={(this.props.title !== undefined) ? this.props.title : "Advanced Controls"}>

              {this.renderAdminControls()}

        </Section>
     )
   }

  }

}
export default NepiIFAdminDevice
