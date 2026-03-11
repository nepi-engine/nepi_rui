/*
#
# Copyright (c) 2024 Numurus <https://www.numurus.com>.
#
# This file is part of nepi managers (nepi_managers) repo
# (see https://github.com/nepi-engine/nepi_managers)
#
# License: NEPI MANAGERS repo source-code and NEPI Images that use this source-code
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
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Toggle from "react-toggle"
import Select, { Option } from "./Select"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"
import Input from "./Input"
import BooleanIndicator from "./BooleanIndicator"

import {  onChangeSwitchStateValue } from "./Utilities"


@inject("ros")
@observer
class NepiIFAdminManagers extends Component {
  constructor(props) {
    super(props)
    this.state = {

        selected_manager: 'None',
        
        viewableManagers: true,

    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
    this.getSysManagerNamespace = this.getSysManagerNamespace.bind(this)

    this.sendManagerUpdateOrder = this.sendManagerUpdateOrder.bind(this)
    this.toggleViewableManagers = this.toggleViewableManagers.bind(this)
    this.getManagerOptions = this.getManagerOptions.bind(this)
    this.onToggleManagerSelection = this.onToggleManagerSelection.bind(this)


    this.getDisabledStr = this.getDisabledStr.bind(this)
    this.getActiveStr = this.getActiveStr.bind(this)

    this.renderManagerConfigure = this.renderManagerConfigure.bind(this)
    this.renderAdminManagers = this.renderAdminManagers.bind(this)



  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId
    }
    return baseNamespace
  }


  getSysManagerNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId + "/system_mgr"
    }
    return baseNamespace
  }

    
  toggleViewableManagers() {
    const set = !this.state.viewableManagers
    this.setState({viewableManagers: true})
  }


  // Function for creating image topic options.
  getManagerOptions() {
    const managersList = this.props.ros.managers_list  
    const namesList = this.props.ros.managers_list
    var items = []
    if (managersList.length > 0){
      for (var i = 0; i < managersList.length; i++) {
         
            items.push(<Option value={managersList[i]}>{namesList[i]}</Option>)
          
     }
    }
    else{
      items.push(<Option value={'None'}>{'None'}</Option>)
      //items.push(<Option value={'TEST1'}>{'TEST1'}</Option>)
      //items.push(<Option value={'TEST2'}>{'TEST2'}</Option>)
    }
    return items
  }
  


  onToggleManagerSelection(event){
    const selected_manager = event.target.value
    this.setState({selected_manager: selected_manager})
    this.setState({needs_update: true})
  }


  sendManagerUpdateOrder(){
    const {sendUpdateOrderMsg} = this.props.ros
    var namespace = this.getSysManagerNamespace()
    var selected_manager = this.state.selected_manager
    var move_cmd = this.state.move_cmd
    sendUpdateOrderMsg(namespace + '/update_manager_order',selected_manager,move_cmd)
    this.setState({needs_update: true})
  }



  renderManagerConfigure() {
    const { sendUpdateOrderMsg, sendUpdateBoolMsg, } = this.props.ros
    const namespace = this.getSysManagerNamespace()

    const selected_manager = this.state.selected_manager

    const managers_list = this.props.ros.managers_list
    const managers_active_list = this.props.ros.managers_active_list
    const managers_running_list = this.props.ros.managers_running_list

    const order = (managers_list.indexOf(selected_manager))
    const enabled = (managers_active_list.indexOf(selected_manager) !== -1)
    const running = (managers_running_list.indexOf(selected_manager) !== -1)



    const disable_enable = (enabled === false && running === true)

    if (selected_manager === 'None') {
      return (
        <React.Fragment>

          <Section title={'None'}>


          </Section>

        </React.Fragment>
      )
    }
    else {

      return (
        <React.Fragment>

          <Label  title={selected_manager}></Label>

            <Columns >
            <Column>

                <Label title="Enable/Disable Manager">
                  <Toggle
                    checked={enabled}
                    onClick={() => sendUpdateBoolMsg(namespace + "/update_manager_state", selected_manager, !enabled)}
                    disabled={disable_enable}>
                  </Toggle>
                  </Label>


              </Column>
              <Column>

              <Label title={"Manager Running"}>
                  <BooleanIndicator value={running} />
                </Label>
                
            </Column>
            </Columns>
              
         

          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <Columns equalWidth={true}>
          <Column>
             


                <label style={{fontWeight: 'bold'}}>
                    {"Start Order"}
                  </label>

                  <Input disabled value={order} />
              

              </Column>
              <Column>

                <ButtonMenu>
                <Button onClick={() => sendUpdateOrderMsg(namespace + "/update_manager_order", selected_manager, "top")}>{"Move to Top"}</Button>
                </ButtonMenu>

                <ButtonMenu>
                <Button onClick={() => sendUpdateOrderMsg(namespace + "/update_manager_order", selected_manager, "up")}>{"Move    Up"}</Button>
                </ButtonMenu>

                <ButtonMenu>
                  <Button onClick={() => sendUpdateOrderMsg(namespace + "/update_manager_order", selected_manager, "down")}>{"Move Down"}</Button>
                </ButtonMenu>

                <ButtonMenu>
                  <Button onClick={() => sendUpdateOrderMsg(namespace + "/update_manager_order", selected_manager, "bottom")}>{"Move to Bottom"}</Button>
                </ButtonMenu>


            </Column>
            </Columns>



        
        </React.Fragment>
      )
    }
  }

  
 




  getActiveStr(){
    const active_names =  this.props.ros.managers_active_list
    var config_str_list = []
    for (var i = 0; i < active_names.length; i++) {
      config_str_list.push(active_names[i])
      config_str_list.push("\n")
    }
    const config_str =config_str_list.join("")
    return config_str
  }

  
  getDisabledStr(){
    const installed = this.props.ros.managers_list
    const active_names =  this.props.ros.managers_active_list
    var config_str_list = []
    for (var i = 0; i < installed.length; i++) {
      if (active_names.indexOf(installed[i]) === -1){
        config_str_list.push(installed[i])
        config_str_list.push("\n")
      }
    }
    const config_str =config_str_list.join("")
    return config_str
  }



  renderAdminManagers() {
    const selected_manager = this.state.selected_manager
    const manager_options = this.getManagerOptions()
    const active_manager_list = this.props.ros.managers_active_list
    const hide_manager_list = !this.state.viewableManagers && !this.state.connected
    return (

        <React.Fragment>

                {/* <label >
                    {"Changes Take Affect on Next Startup"}
                  </label> */}

               <div style={{ display: 'flex' }}>
                        <div style={{ width: '25%' }} >                     

                                    <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                                      {"Select Manager"}
                                    </label>

                                    <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                                      <div onClick={this.toggleViewableManagers} style={{backgroundColor: Styles.vars.colors.grey0}}>
                                        <Select style={{width: "10px"}}/>
                                      </div>
                                      <div hidden={hide_manager_list}>
                                      {manager_options.map((manager) =>
                                      <div onClick={this.onToggleManagerSelection}
                                        style={{
                                          textAlign: "center",
                                          padding: `${Styles.vars.spacing.xs}`,
                                          color: Styles.vars.colors.black,
                                          backgroundColor: (manager.props.value === selected_manager) ?
                                            Styles.vars.colors.green :
                                            (active_manager_list.includes(manager.props.value)) ? Styles.vars.colors.blue : Styles.vars.colors.grey0,
                                          cursor: "pointer",
                                          }}>
                                          <body manager-topic ={manager} style={{color: Styles.vars.colors.black}}>{manager}</body>
                                      </div>
                                      )}
                                      </div>

                        </div>


                        <div style={{ width: '5%' }} >
                        </div>

                        <div style={{ width: '45%' }}>

                              {(selected_manager !== 'None') ?
                                this.renderManagerConfigure()
                              : null}

                        </div>

                        <div style={{ width: '5%' }} >
                        </div>
                        
                        <div style={{ width: '20%' }}>

                                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
                                  <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                                      {"Active Managers List "}
                                      </label>

                                  <pre style={{ height: "200px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
                                    {this.getActiveStr()}
                                    </pre>

                                    <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
                                  <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                                      {"Disabled Managers List "}
                                      </label>

                                    <pre style={{ height: "200px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
                                    {this.getDisabledStr()}
                                    </pre>

                        </div>

                  </div>

        </React.Fragment>

    )
  }




  render() {
    const namespace = this.getSysManagerNamespace()
    const admin_mode_set = this.props.ros.systemAdminModeSet
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const title = (this.props.title !== undefined) ? this.props.title : "SYSTEM MANAGERS CONFIG"

    if (namespace == null || admin_mode_set === false){
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
                {this.renderAdminManagers()}


          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={title}>

                  {this.renderAdminManagers()}


        </Section>
     )
   }

  }

}
export default NepiIFAdminManagers
