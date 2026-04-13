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
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Toggle from "react-toggle"
import Select, { Option } from "./Select"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"
import BooleanIndicator from "./BooleanIndicator"


@inject("ros")
@observer

class AiModelsMgr extends Component {
  constructor(props) {
    super(props)

    this.state = {

      mgrName: "ai_models_mgr",

      connectedToNepi: false,
      connectedToAiModelsMgr: false,

      viewable_frameworks: true,

      selected_framework: 'None',
    
      viewable_models: true, 
      selected_model: 'None',

      connected: false,
      needs_update: false

    }

    this.checkConnection = this.checkConnection.bind(this)
    this.getMgrNamespace = this.getMgrNamespace.bind(this)


    this.toggleViewableFrameworks = this.toggleViewableFrameworks.bind(this)
    this.getFrameworkOptions = this.getFrameworkOptions.bind(this)
    this.onToggleFrameworkSelection = this.onToggleFrameworkSelection.bind(this)
    this.getInactiveFrameworkStr = this.getInactiveFrameworkStr.bind(this)
    this.getActiveFrameworkStr = this.getActiveFrameworkStr.bind(this)

    this.toggleViewableModels = this.toggleViewableModels.bind(this)
    this.getModelOptions = this.getModelOptions.bind(this)
    this.onToggleModelSelection = this.onToggleModelSelection.bind(this)
    this.getDisabledModelsStr = this.getDisabledModelsStr.bind(this)
    this.getActiveModelsStr = this.getActiveModelsStr.bind(this)
    this.getModelStatusMsg = this.getModelStatusMsg.bind(this)

  
  }


  getMgrNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var mgrNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      mgrNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.props.ros.aiModelsMgrName
    }
    return mgrNamespace
  }



  async checkConnection() {
    const { connectedToNepi , connectedToAiModelsMgr} = this.props.ros
    if (this.state.connectedToNepi !== connectedToNepi){
      this.setState({connectedToNepi: connectedToNepi,
                    model_status_msg: null,
                    selected_model: 'None', needs_update: true})
    }
    if (this.state.connectedToAiModelsMgr !== connectedToAiModelsMgr )
    {
      this.setState({connected: true, needs_update: true})
    }

    setTimeout(async () => {
      await this.checkConnection()
    }, 1000)
  }





  componentDidMount(){
    this.checkConnection()
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const needs_update = this.state.needs_update
    if (needs_update === true) {
        this.setState({needs_update: false})
      }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    this.setState({connected: false})
  }





  toggleViewableFrameworks() {
    const set = !this.state.viewable_frameworks
    this.setState({viewable_frameworks: set})
  }

  // Function for creating image topic options.
  getFrameworkOptions() {
    const frameworksList = this.props.ros.ai_frameworks_list  
    var items = []
    items.push(<Option value={'None'}>{'None'}</Option>)
    if (frameworksList.length > 0){
      for (var i = 0; i < frameworksList.length; i++) {
          items.push(<Option value={frameworksList[i]}>{frameworksList[i]}</Option>)
     }
    }

    return items
  }


  onToggleFrameworkSelection(event){
    const framework_name = event.target.value
    this.setState({selected_framework: framework_name})
    this.setState({needs_update: true})
  }

  getActiveFrameworkStr(){
    const active_aifs =  this.props.ros.ai_frameworks_active_list
    var active_str_list = []
    for (var i = 0; i < active_aifs.length; i++) {
        active_str_list.push(active_aifs[i])
        active_str_list.push("\n")
    }
    const inactive_str =active_str_list.join("")
    return inactive_str
  }

  
  getInactiveFrameworkStr(){
    const aif_list = this.props.ros.ai_frameworks_list 
    const active_aifs =  this.props.ros.ai_frameworks_active_list
    var inactive_str_list = []
    for (var i = 0; i < aif_list.length; i++) {
      if (active_aifs.indexOf(aif_list[i]) === -1){
        inactive_str_list.push(aif_list[i])
        inactive_str_list.push("\n")
      }
    }
    const inactive_str =inactive_str_list.join("")
    return inactive_str
  }

 


  renderFrameworkConfig() {
    const mgrNamespace = this.getMgrNamespace()
    const viewable_frameworks = this.state.viewable_frameworks
    const framework_options = this.getFrameworkOptions()
    const selected_framework = this.state.selected_framework
    const active_frameworks = this.props.ros.ai_frameworks_active_list
    const framework_state = (active_frameworks.indexOf(selected_framework) !== -1)
    return (


    <Section title={'AI Frameworks'}>
      <Columns equalWidth={true}>
      <Column>

      <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Select AI Framework"}
         </label>

          <div onClick={this.toggleViewableFrameworks} style={{backgroundColor: Styles.vars.colors.grey0}}>
            <Select style={{width: "10px"}}/>
          </div>
          <div hidden={!viewable_frameworks}>
          {framework_options.map((framework) =>
          <div onClick={this.onToggleFrameworkSelection}
            style={{
              textAlign: "center",
              padding: `${Styles.vars.spacing.xs}`,
              color: Styles.vars.colors.black,
              backgroundColor: (framework.props.value === selected_framework) ?
                Styles.vars.colors.green :
                (active_frameworks.indexOf(framework.props.value) !== -1) ? Styles.vars.colors.blue : Styles.vars.colors.grey0,
              cursor: "pointer",
              }}>
              <body framework-topic ={framework} style={{color: Styles.vars.colors.black}}>{framework}</body>
          </div>
          )}
          </div>

        </Column>
        <Column>



        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {this.state.selected_framework}
          </label>

          <div hidden={(this.state.selected_framework === "None")}>

        <Label title="Enable AI Framework"> 
          <Toggle
            checked={framework_state }
            onClick={() => this.props.ros.sendUpdateBoolMsg(mgrNamespace + "/update_framework_state", this.state.selected_framework, !framework_state)}>
        </Toggle>
        </Label>

          </div>

       <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(mgrNamespace + "/refresh_frameworks")}>{"Refresh"}</Button>
        </ButtonMenu>

          <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(mgrNamespace + "/enable_all_frameworks")}>{"Enable All"}</Button>
        </ButtonMenu>

        <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(mgrNamespace + "/disable_all_frameworks")}>{"Disable All"}</Button>
        </ButtonMenu>



        </Column>
        <Column>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Active AI Frameworks"}
          </label>

        <pre style={{ height: "20px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
        {this.getActiveFrameworkStr()}
        </pre>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Disabled AI Frameworks"}
          </label>

        <pre style={{ height: "200px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
        {this.getInactiveFrameworkStr()}
        </pre>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        </Column>
        </Columns> 
      </Section>  
    )
  }


  toggleViewableModels() {
    const set = !this.state.viewable_models
    this.setState({viewable_models: set})
  }

  // Function for creating image topic options.
  getModelOptions() {
    const models_list = this.props.ros.ai_models_list  
    const models_name_list = this.props.ros.ai_models_name_list
    const models_aifs = this.props.ros.ai_models_framework_list
    const sel_aif = this.state.selected_framework

    var items = []
    if (models_list.length > 0){
      for (var i = 0; i < models_list.length; i++) {
          if (models_aifs[i] === sel_aif){
            items.push(<Option value={models_list[i]}>{models_name_list[i]}</Option>)
          }
     }
    }
    else{
      items.push(<Option value={'None'}>{'None'}</Option>)
      //items.push(<Option value={'TEST1'}>{'TEST1'}</Option>)
      //items.push(<Option value={'TEST2'}>{'TEST2'}</Option>)
    }
    return items
  }


  onToggleModelSelection(event){
    const model_name = event.target.value
    this.setState({selected_model: model_name})
    this.setState({needs_update: true})
  }


  getActiveModelsStr(){
    const models_list = this.props.ros.ai_models_list  
    const models_name_list = this.props.ros.ai_models_name_list 
    const models_aifs = this.props.ros.ai_models_framework_list
    const models_active= this.props.ros.ai_models_active_list
    const sel_aif = this.state.selected_framework
    var active_str_list = []
    var model = ""
    var model_name = ""
    var model_aif = ""
    for (var i = 0; i < models_list.length; i++) {
      model = models_list[i]
      model_name = models_name_list[i]
      model_aif = models_aifs[i]
      if (model_aif === sel_aif && models_active.indexOf(model) !== -1){
        active_str_list.push(model_name)
        active_str_list.push("\n")
      }
    }
    const active_str =active_str_list.join("")
    return active_str
  }

  
  getDisabledModelsStr(){
    const models_list = this.props.ros.ai_models_list  
    const models_name_list = this.props.ros.ai_models_name_list 
    const models_aifs = this.props.ros.ai_models_framework_list
    const models_active= this.props.ros.ai_models_active_list
    const sel_aif = this.state.selected_framework
    var active_str_list = []
    var model = ""
    var model_name = ""
    var model_aif = ""
    for (var i = 0; i < models_list.length; i++) {
      model = models_list[i]
      model_name = models_name_list[i]
      model_aif = models_aifs[i]
      if (model_aif === sel_aif && models_active.indexOf(model) === -1){
        active_str_list.push(model_name)
        active_str_list.push("\n")
      }
    }
    const active_str =active_str_list.join("")
    return active_str
  }
 

  getModelStatusMsg(model_name){
    const ai_models_list = this.props.ros.ai_models_list
    const model_status_msgs = this.props.ros.ai_models_status_list
    const model_index = ai_models_list.indexOf(model_name)

    const status_length = model_status_msgs.length
    const has_status = (status_length > model_index)
    var model_status_msg = model_status_msgs[model_index]
    if  (model_index !== -1 && model_name !== 'None' && has_status === true ){
        model_status_msg = model_status_msgs[model_index]
    }
    else {
      model_status_msg = null
    }
    
    return model_status_msg
  } 


  renderModelConfig() {

    const mgrNamespace = this.getMgrNamespace()
    const sel_framework = this.state.selected_framework
    const selected_model = this.state.selected_model

    const model_options = this.getModelOptions()
    const has_models = (model_options.length > 1)

    const viewable_models = this.state.viewable_models
    var model_status_msg = null
    if  (selected_model !== 'None'){
        model_status_msg = this.getModelStatusMsg(selected_model)
    }


    const display_name = (model_status_msg != null) ? model_status_msg.display_name : ''
    const description = (model_status_msg != null) ? model_status_msg.description : ''
    const framework = (model_status_msg != null) ? model_status_msg.framework : ''
    const type = (model_status_msg != null) ? model_status_msg.type : ''
    const node_name = (model_status_msg != null) ? model_status_msg.node_name : ''
        
    const enabled = (model_status_msg != null) ? model_status_msg.enabled : false
    const running = (model_status_msg != null) ? model_status_msg.running : false
    const msg_str = (model_status_msg != null) ? model_status_msg.msg_str : ''

    const disable_enable = (enabled === false && running === true)



    const active_frameworks = this.props.ros.ai_frameworks_active_list
    const active_frameworks_folders = this.props.ros.ai_frameworks_folder_list

    const active_ind = active_frameworks.indexOf(sel_framework)
    const aif_active = (active_ind !== -1)
    const sel_framework_folder = (aif_active === true) ? active_frameworks_folders[active_ind] : "None"

  
    const active_model_list = this.props.ros.ai_models_active_list



    if (sel_framework === "None" || aif_active === false){
      return(
        <Columns>
        <Column>

        </Column>
          </Columns> 
      )
    }

    else if (has_models === false){

    return (<Section >

      <pre style={{ height: "200px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
      {"No models found for selected framework: " + sel_framework + '.' +
       "\nAdd models to the ai_modols/" + sel_framework_folder + " folder on the NEPI user storage drive"
      }
      </pre>

    </Section>)


    }

    else {


    return (
      <React.Fragment>

        <Section title={display_name}>

  

      <Columns equalWidth={true}>
      <Column>




                <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                    {"Select AI Model"}
                  </label>

                    <div onClick={this.toggleViewableModels} style={{backgroundColor: Styles.vars.colors.grey0}}>
                      <Select style={{width: "10px"}}/>
                    </div>
                    <div hidden={!viewable_models}>
                    {model_options.map((model) =>
                    <div onClick={this.onToggleModelSelection}
                      style={{
                        textAlign: "center",
                        padding: `${Styles.vars.spacing.xs}`,
                        color: Styles.vars.colors.black,
                        backgroundColor: (model.props.value === selected_model) ?
                          Styles.vars.colors.green :
                          (active_model_list.includes(model.props.value)) ? Styles.vars.colors.blue : Styles.vars.colors.grey0,
                        cursor: "pointer",
                        }}>
                        <body model-topic ={model} style={{color: Styles.vars.colors.black}}>{model}</body>
                    </div>
                    )}
                    </div>

            </Column>
            <Column>

                <div hidden={selected_model === 'None'}>
                        <Columns equalWidth={true}>
                        <Column>


                            <Label title="Enable/Disable Model"> 
                              <Toggle
                                checked={enabled===true}
                                onClick={() => this.props.ros.sendUpdateBoolMsg(mgrNamespace + "/update_model_state", selected_model, !enabled)}
                                disabled={disable_enable}>
                              </Toggle>
                          </Label>


                          </Column>
                          <Column>


                          <Label title={"Model Running"}>
                              <BooleanIndicator value={running} />
                            </Label>


                        </Column>
                        </Columns> 


                          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                              <label style={{fontWeight: 'bold'}}>
                                  {"Model Info"}
                                </label>


                          <pre style={{ height: "150px", overflowY: "auto" }}>
                          {"\nDescription: " + description + 
                          "\nStatus: " + msg_str +
                          "\nType: " + type  + "     Node: " + node_name  + "     Framework: " + framework
                          }
                          </pre>

                  </div>


            </Column>
            <Column>

                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
                  <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                    {"Active Models "}
                    </label>

                  <pre style={{ height: "200px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
                  {this.getActiveModelsStr()}
                  </pre>

                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
                  <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                    {"Disabled Models "}
                    </label>

                  <pre style={{ height: "200px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
                  {this.getDisabledModelsStr()}
                  </pre>

                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>



        </Column>
        </Columns>


        </Section>

        
      </React.Fragment>
      )
    }
  }



render() {
  const connected = this.state.connected
    return (

      <React.Fragment>
       

      <Columns>
      <Column>

      { (connected === true) ? this.renderFrameworkConfig() : null}
      </Column>
        <Column>

      { (connected === true) ? this.renderModelConfig() : null}
     


       </Column>
     </Columns>
         
      </React.Fragment>
          

    )
  }

}


export default AiModelsMgr
