/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
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


import { onChangeSwitchStateValue, onDropdownSelectedSetState
  } from "./Utilities"

@inject("ros")
@observer

class AiFrameworksMgr extends Component {
  constructor(props) {
    super(props)

    this.state = {
      show_delete_ai: false,
      mgrName: "ai_detector_mgr",
      mgrNamespace: null,

      viewableFws: false,

      ais_list: [],
      last_ais_list: [],
      ais_active_list: [],
      ai_name: 'NONE',
      ai_active_state: null,
      selected_ai: 'NONE',
    
      models_list: [],
      models_active_list: [].
      model_name: 'NONE',
      model_active_state: null,
      selected_model: 'NONE',

      connected: false,

      aisListener: null

    }


    this.getMgrNamespace = this.getMgrNamespace.bind(this)

    this.sendAiUpdateOrder = this.sendAiUpdateOrder.bind(this)
    this.toggleviewableFws = this.toggleviewableFws.bind(this)
    this.getAiOptions = this.getAiOptions.bind(this)
    this.onToggleAiSelection = this.onToggleAiSelection.bind(this)

    this.updateAisStatusListener = this.updateAisStatusListener.bind(this)
    this.aisStatusListener = this.aisStatusListener.bind(this)

    this.getDisabledAiStr = this.getDisabledAiStr.bind(this)
    this.getActiveAiStr = this.getActiveAiStr.bind(this)

  
  }

  getMgrNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var mgrNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      mgrNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.mgrName
    }
    return mgrNamespace
  }

  // Callback for handling ROS Status messages
  aisStatusListener(message) {
    this.setState({
      ais_list: message.ai_frameworks,
      ais_active_list: active_ai_frameworks,
      models_list: message.ai_models,
      selected_ai: message.active_ai_models,
      connected: true
    })    

  }

  // Function for configuring and subscribing to Status
  updateAisStatusListener() {
    const statusNamespace = this.getMgrNamespace() + '/status'
    if (this.state.aisListener) {
      this.state.aisListener.unsubscribe()
    }
    var aisListener = this.props.ros.setupStatusListener(
          statusNamespace,
          "nepi_ros_interfaces/AiFrameworksStatus",
          this.aisStatusListener
        )
    this.setState({ aisListener: aisListener})
  }




  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace = this.getMgrNamespace()
    if (prevState.mgrNamespace !== namespace && namespace !== null) {
      if (namespace.indexOf('null') === -1) {
        this.setState({
          mgrNamespace: namespace
        })
        this.updateAisStatusListener()
      } 
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.aisListener) {
      this.state.aisListener.unsubscribe()
      this.state.aiListener.unsubscribe()
    }
  }

  toggleviewableFws() {
    const set = !this.state.viewableFws
    this.setState({viewableFws: set})
  }

  // Function for creating image topic options.
  getAiOptions() {
    const aisList = this.state.ais_list  
    var items = []
    items.push(<Option>{"NONE"}</Option>) 
    if (aisList.length > 0){
      for (var i = 0; i < aisList.length; i++) {
          items.push(<Option value={aisList[i]}>{aisList[i]}</Option>)
     }
    }
    else{
      items.push(<Option value={'NONE'}>{'NONE'}</Option>)
      //items.push(<Option value={'TEST1'}>{'TEST1'}</Option>)
      //items.push(<Option value={'TEST2'}>{'TEST2'}</Option>)
    }
    return items
  }


  onToggleAiSelection(event){
    const ai_name = event.target.value
    this.setState({selected_ai: ai_name})
  }


  sendAiUpdateState(ai_name){
    const {sendUpdateOrderMsg} = this.props.ros
    var namespace = this.state.mgrNamespace
    var ai_name = this.state.selected_ai
    if (ai_name !== "NONE"){
        const ai_active_list = this.state.ai_active_list
        var new_state = (ai_active_list.indexOf(ai_name) === -1)
        sendUpdateStateMsg(namespace,ai_name,new_state)
    }
  }


  getActiveAiStr(){
    const active =  this.state.ais_active_list
    var config_str_list = []
    for (var i = 0; i < active.length; i++) {
      config_str_list.push(active[i])
      config_str_list.push("\n")
    }
    const config_str =config_str_list.join("")
    return config_str
  }

  
  getDisabledAiStr(){
    const installed = this.state.ais_list
    const active =  this.state.ais_active_list
    var config_str_list = []
    for (var i = 0; i < installed.length; i++) {
      if (active.indexOf(installed[i]) === -1){
        config_str_list.push(installed[i])
        config_str_list.push("\n")
      }
    }
    const config_str =config_str_list.join("")
    return config_str
  }

 


  renderFrameworkConfig() {
    const selected_ai = this.state.selected_ai
    const viewableFws = this.state.viewableFws
    const ai_options = this.getAiOptions()
    const active_ai_list = this.state.ais_active_list
    const hide_fw_list = !this.state.viewableApps && !this.state.connected

    return (

      <Columns equalWidth={true}>
      <Column>

      <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Select AI Framework"}
         </label>

          <div onClick={this.toggleviewableFws} style={{backgroundColor: Styles.vars.colors.grey0}}>
            <Select style={{width: "10px"}}/>
          </div>
          <div hidden={!viewableFws}>
          {ai_options.map((ai) =>
          <div onClick={this.onToggleAiSelection}
            style={{
              textAlign: "center",
              padding: `${Styles.vars.spacing.xs}`,
              color: Styles.vars.colors.black,
              backgroundColor: (ai.props.value === selected_ai) ?
                Styles.vars.colors.green :
                (active_ai_list.includes(ai.props.value)) ? Styles.vars.colors.blue : Styles.vars.colors.grey0,
              cursor: "pointer",
              }}>
              <body ai-topic ={ai} style={{color: Styles.vars.colors.black}}>{ai}</body>
          </div>
          )}
          </div>


        </Column>
        <Column>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Active Ais List "}
          </label>

        <pre style={{ height: "200px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
        {this.getActiveAiStr()}
        </pre>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Disabled Ais List "}
          </label>

        <pre style={{ height: "200px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
        {this.getDisabledAiStr()}
        </pre>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>  
        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Install Ais List "}
          </label>

        <pre style={{ height: "200px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
        {this.getReadyStr()}
        </pre>
        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>


        </Column>
        <Column>


        <div hidden={(this.state.ai_name === "NONE")}>

        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {this.state.ai_name}
          </label>

        <Label title="Enable"> </Label>
          <Toggle
            checked={this.state.ai_active_state===true}
            onClick={() => sendUpdateActiveStateMsg(this.state.mgrNamespace + "/update_state", this.state.ai_name, !this.state.ai_active_state)}>
        </Toggle>

        </div>

        <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(this.state.mgrNamespace + "/enable_all_ais")}>{"Enable All"}</Button>
        </ButtonMenu>

        <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(this.state.mgrNamespace + "/disable_all_ais")}>{"Disable All"}</Button>
        </ButtonMenu>


        <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(this.state.mgrNamespace + "/refresh_ais")}>{"Refresh"}</Button>
        </ButtonMenu>

        <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(this.state.mgrNamespace + "/factory_reset")}>{"Factory Reset"}</Button>
        </ButtonMenu>

        </Column>
        </Columns> 

    )
  }




render() {

    return (

    <Section title={"AI Framework and Model Settings"}>
       
    <Columns>
      <Column>


      {this.renderFrameworkConfig()}

{/*
      {this.renderModelConfig()}
*/}

       </Column>
     </Columns>
         
    </Section>
          

    )
  }

}


export default AiFrameworksMgr
