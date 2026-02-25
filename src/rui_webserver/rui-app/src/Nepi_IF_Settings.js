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
import Label from "./Label"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
import Select from "./Select"
import Input from "./Input"

import NepiIFConfig from "./Nepi_IF_Config"

import { createMenuListFromStrList, onChangeSwitchStateValue} from "./Utilities"

@inject("ros")
@observer

// Component that contains the Settings controls
class Nepi_IF_Settings extends Component {
  constructor(props) {
    super(props)

    // these states track the values through  Status messages
    this.state = {

      settingsNamespace: 'None',
      status_msg: null,
      capabilities: null,

      show_controls: false,

      capSettingsTypes: ['Menu','Discrete','String','Bool','Int','Float'],
      capSettingsNamesList: [],
      capSettingsTypesList: [],
      capSettingsOptionsLists: [],
      settingsNamesList: [],
      settingsTypesList: [],
      settingsValuesList: [],
      settings: null,
      settingsCount: 0,
      selectedSettingInd: 0,
      selectedSettingName: "",
      selectedSettingType: "",
      selectedSettingValue: "",
      selectedSettingLowerLimit: "",
      selectedSettingUpperLimit: "",
      selectedSettingOptions: [],
      selectedSettingInput: "",

      last_caps: null,
      settingsListener: null,
      needs_update: false,
    }

    this.updateSettingsListener = this.updateSettingsListener.bind(this)
    this.settingsListener = this.settingsListener.bind(this)

    this.updateCapabilities = this.updateCapabilities.bind(this)

    this.getSettingsAsString = this.getSettingsAsString.bind(this)
    this.getSettingValue = this.getSettingValue.bind(this)

    this.onChangeBoolSettingValue = this.onChangeBoolSettingValue.bind(this)
    this.onChangeDescreteSettingValue = this.onChangeDescreteSettingValue.bind(this)
    this.onUpdateInputSettingValue = this.onUpdateInputSettingValue.bind(this)
    this.onKeySaveInputSettingValue = this.onKeySaveInputSettingValue.bind(this)

    this.updateSettingsInfo = this.updateSettingsInfo.bind(this)
    this.updateSelectedSettingInfo = this.updateSelectedSettingInfo.bind(this)
    this.getSelectedSettingInfo = this.getSelectedSettingInfo.bind(this)
    this.getSortedStrList = this.getSortedStrList.bind(this)

    this.renderSettings = this.renderSettings.bind(this)
    this.renderSetting = this.renderSetting.bind(this)
    this.renderConfigs = this.renderConfigs.bind(this)
  }

  // Callback for handling ROS Settings Status messages
  settingsListener(message) {
    if (message.settings_topic === this.state.settingsNamespace){
      const lastCaps = this.state.capabilities
      const settings = message.settings_list
      const capabilities = message.setting_caps_list
      var namesList = []
      var typesList = []
      var valuesList = []
      for (let ind = 0; ind < settings.length; ind++){
        namesList.push(settings[ind].name_str)
        typesList.push(settings[ind].type_str)
        valuesList.push(settings[ind].value_str)
      }
      const count = namesList.length

      

      this.setState({
                    status_msg: message,
                    capabilities: capabilities,
                    settingsNamesList:namesList,
                    settingsTypesList:typesList,
                    settingsValuesList:valuesList,
                    settingsCount: count
      })

      if (lastCaps !== capabilities){
        this.updateCapabilities(capabilities) 
      }
    }

  }

  // Function for configuring and subscribing to Settings Status
  updateSettingsListener(settingsNamespace) {
    if (this.state.settingsListener != null ) {
      this.state.settingsListener.unsubscribe()
           this.setState({settingsListener: null})
            this.setState({capSettingsNamesList: [],
              status_msg: null,
              capSettingsTypesList: [],
              capSettingsOptionsLists: [],
              settingsNamesList: [],
              settingsTypesList: [],
              settingsValuesList: [],
              settings: null,
              settingsCount: 0,
              selectedSettingInd: 0,
              selectedSettingName: "",
              selectedSettingType: "",
              selectedSettingValue: "",
              selectedSettingLowerLimit: "",
              selectedSettingUpperLimit: "",
              selectedSettingOptions: [],
              selectedSettingInput: ""
              })
    }
    if (settingsNamespace !== '' &&  settingsNamespace !== 'None'){
      var settingsListener = this.props.ros.setupSettingsStatusListener(
            settingsNamespace + '/status',
            this.settingsListener
          )
      this.setState({ settingsNamespace: settingsNamespace, updateNamespace: null})
      this.setState({ settingsListener: settingsListener})
    }
  }


    componentDidMount() {
      this.setState({needs_update: true})
    }

  // Lifecycle method cAlled when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const settingsNamespace =  (this.props.settingsNamespace !== undefined) ? (this.props.settingsNamespace !== '' && this.props.settingsNamespace !== 'None' && this.props.settingsNamespace !== null) ?
                               this.props.settingsNamespace : 'None' : 'None'
    const needs_update = ((this.state.settingsNamespace !== settingsNamespace))
  
    if (needs_update) {
      this.setState({settingsNamespace: settingsNamespace})
      this.updateSettingsListener(settingsNamespace)
    }
  }

  // Lifecycle method cAlled just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.settingsListener) {
      this.state.settingsListener.unsubscribe()
    }
    this.setState({settingsListener: null, 
                  status_msg: null})
  }





  // Function for creating settings options list from capabilities
  updateCapabilities(cap_settings) {

    var namesList = []
    var typesList = []
    var optionsLists = []
    var ind = 0 
    if (cap_settings != null){
      for ( ind = 0; ind < cap_settings.length; ind++){
        namesList.push(cap_settings[ind].name_str)
        typesList.push(cap_settings[ind].type_str)
        optionsLists.push(cap_settings[ind].options_list)
      }
      this.setState({
        capSettingsNamesList:namesList,      
        capSettingsTypesList:typesList,
        capSettingsOptionsLists:optionsLists
      })
    }
    else if (cap_settings == null) {
      this.setState({
        capSettingsNamesList:['None'],      
        capSettingsTypesList:['None'],
        capSettingsOptionsLists:['None']
      })
    }
  }
  
  getSettingValue(settingName) {
    const namesList = this.state.settingsNamesList
    const valuesList = this.state.settingsValuesList
    const ind = namesList.indexOf(settingName)
    var value = -1
    if (ind !== -1){
      value = valuesList[ind]
    }
    return value
  }

  updateSelectedSettingInfo(event){
    const name_ind = event.nativeEvent.target.selectedIndex
    const name = event.nativeEvent.target[name_ind].text
    const ind = this.state.capSettingsNamesList.indexOf(name)
    this.updateSettingsInfo(ind, name)
  }

  updateSettingsInfo(ind, name) {
    if (ind !== -1) {
      this.setState({ selectedSettingInd: ind });
      this.setState({ selectedSettingName: name });
      const type = this.state.capSettingsTypesList[ind];
      this.setState({ selectedSettingType: type });
      const value = this.getSettingValue(name);
      this.setState({ selectedSettingValue: value });
      const options = this.state.capSettingsOptionsLists[ind];
      this.setState({ selectedSettingOptions: options });
  
      if (type === "Int" || type === "Float") {
        this.setState({
          selectedSettingLowerLimit: options.length > 0 ? options[0] : "",
          selectedSettingUpperLimit: options.length > 1 ? options[1] : ""
        });
      } else {
        this.setState({
          selectedSettingLowerLimit: "",
          selectedSettingUpperLimit: ""
        });
      }
  
      this.setState({ selectedSettingInput: value });
    } else {
      this.setState({
        selectedSettingName: "NONE",
        selectedSettingType: "NONE"
      });
    }
  }

  getSelectedSettingInfo(){
    const info = [this.state.selectedSettingInd, this.state.selectedSettingType , this.state.selectedSettingName ,
       this.state.selectedSettingValue , this.state.selectedSettingLowerLimit , this.state.selectedSettingUpperLimit,
       this.state.selectedSettingOptions
       ]
    return info
  }


  onChangeBoolSettingValue(){
    const {updateSetting}  = this.props.ros
    const value = (this.getSettingValue(this.state.selectedSettingName) === "True") ? "False" : "True" 
    updateSetting(this.state.settingsNamespace,
      this.state.selectedSettingName,this.state.selectedSettingType,value)
  }

  onChangeDescreteSettingValue(event){
    const {updateSetting}  = this.props.ros
    const ind = event.nativeEvent.target.selectedIndex
    const value = event.nativeEvent.target[ind].text
    updateSetting(this.state.settingsNamespace,
      this.state.selectedSettingName,this.state.selectedSettingType,value)
  }

  onUpdateInputSettingValue(event) {
    this.setState({ selectedSettingInput: event.target.value })
    document.getElementById("input_setting").style.color = Styles.vars.colors.red
    this.render()
  }

  onKeySaveInputSettingValue(event) {
    const {updateSetting}  = this.props.ros
    if(event.key === 'Enter'){
      const value = this.state.selectedSettingInput
      updateSetting(this.state.settingsNamespace,
        this.state.selectedSettingName,this.state.selectedSettingType,value)
      document.getElementById("input_setting").style.color = Styles.vars.colors.black
      this.updateSelectedSettingInfo()
    }
  }




  getSettingsAsString() {
    var settingsStr = ""
    const namesList = this.state.settingsNamesList
    const valuesList = this.state.settingsValuesList
    var settingsStrList = []
    var sortedStrList = ["None"]
    var settingStr = ""
    for (let ind = 0; ind < namesList.length; ind++){
      settingStr = namesList[ind] + ": " +  valuesList[ind]
      settingsStrList.push(settingStr)
    }
    if (settingsStrList.length > 0){
      sortedStrList = settingsStrList.sort()
    }
    for (let ind = 0; ind < sortedStrList.length; ind++){
      const current_str = sortedStrList[ind]
      sortedStrList[ind] = current_str + "\n"
    }
    settingsStr =sortedStrList.join("")
    return settingsStr
  }

  getSortedStrList(strList){
    var copiedStrList = []
    var sortedStrList = []
    for (let ind = 0; ind < strList.length; ind++){
      copiedStrList.push(strList[ind])
    }
    if (copiedStrList.length > 0){
      sortedStrList = copiedStrList.sort()
    }
    return sortedStrList
  }

  renderSettings() {
   

    const capSettingNamesOrdered = this.getSortedStrList(this.state.capSettingsNamesList)
    const settingsHeight = this.state.settingsCount * 25
    const settingsHeightStr = settingsHeight.toString() + 'px'


    const allways_show_controls = (this.props.allways_show_controls !== undefined) ? this.props.allways_show_controls : false
    const show_controls = (allways_show_controls === true) ? true : (this.props.show_controls !== undefined) ? this.props.show_controls : this.state.show_controls


    if (show_controls === false){
      return(
              <Columns>
                <Column>

                    <Label title="Show Settings">
                        <Toggle
                          checked={show_controls===true}
                          onClick={() => onChangeSwitchStateValue.bind(this)("show_controls",show_controls)}>
                        </Toggle>
                    </Label>

                </Column>
                <Column>

                </Column>
              </Columns>
      )
    }
    else {
      return (
        <React.Fragment>


              <Columns>
                <Column>

                    {(allways_show_controls === false) ?
                    <Label title="Show Settings">
                        <Toggle
                          checked={show_controls===true}
                          onClick={() => onChangeSwitchStateValue.bind(this)("show_controls",show_controls)}>
                        </Toggle>
                    </Label>
                    : null }

                  </Column>
                  <Column>

                  </Column>
                </Columns>

                  <Label title={"Select Setting"}>
                    <Select
                      id="selectedSettingName"
                      onChange={this.updateSelectedSettingInfo}
                      value={this.state.selectedSettingName}
                    >
                      {createMenuListFromStrList(capSettingNamesOrdered, false, [], ['NONE'], [])}
                    </Select>
                  </Label>
          
              <Columns>
                <Column>

                  {this.renderSetting()}
      
          
                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
          
                  <Label title={"Current Settings"} />
                  <pre style={{ height: settingsHeightStr, overflowY: "auto" }}>
                    {this.getSettingsAsString()}
                  </pre>

                </Column>
              </Columns>

              {this.renderConfigs()}

        </React.Fragment>
      )

    }
  }



  renderSetting(){
    const selSetInfo = this.getSelectedSettingInfo()
    const selSetType = selSetInfo[1]
    const selSetName = selSetInfo[2]
    const selSetMin = selSetInfo[4]
    const selSetMax = selSetInfo[5]
    const selSetOptions = selSetInfo[6]
    const selValue = this.getSettingValue(selSetName)
    
    
    const selOptions = createMenuListFromStrList(selSetOptions,false,[],["Select"],[])
    
    //Unused const capSettingNamesOrdered = this.getSortedStrList(this.state.capSettingsNamesList)
    return (

        <Columns>
        <Column>

          <div align={"left"} textAlign={"right"} hidden={selSetType !== "Bool" }>
            <Label title={selSetName}>
              <Toggle
                checked={ (selValue === "True")}
                onClick={() => {this.onChangeBoolSettingValue()}}
              />
            </Label>
          </div>

            

            <div align={"left"} textAlign={"right"} hidden={selSetType !== "Menu" && selSetType !== "Discrete" }>
            <Label title={selSetName}>
              <Select
                id="descreteSetting"
                onChange={this.onChangeDescreteSettingValue}
                value={selValue}
              >
                {selOptions}
              </Select>
            </Label>
            </div>

          <div align={"left"} textAlign={"right"} 
            hidden={!(selSetType === "String" ||
            selSetType === "Int" ||
            selSetType === "Float")}
          >

              <div align={"left"} textAlign={"right"} hidden={selSetMin === ""}>
                  <Label title={"Lower Input Limit"}>
                    <Input disabled value={selSetMin} />
                  </Label>
              </div>

              <div align={"left"} textAlign={"right"} hidden={selSetMax === ""}>
                  <Label title={"Upper Input Limit"}>
                    <Input disabled value={selSetMax} />
                  </Label>
              </div>

              <Label title={selSetName}>
                <Input id="input_setting" 
                  value={this.state.selectedSettingInput} 
                  onChange={this.onUpdateInputSettingValue} 
                  onKeyDown= {this.onKeySaveInputSettingValue} />
              </Label>

          </div>


        </Column>
      </Columns>



    )

  }

  renderConfigs(){
    const settingsNamespace = this.state.settingsNamespace
    return(
      <Columns>
      <Column>


          <NepiIFConfig
                        namespace={settingsNamespace}
                        title={"Nepi_IF_Config"}
          />

        </Column>
        </Columns>


    )

  }
  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true

    const status_msg = this.state.status_msg

    var has_settings = false
    if ((status_msg != null)){
      if (status_msg.settings_list.length > 1) {
        has_settings = true
      }
      else if (status_msg.settings_list.length === 1 && status_msg.settings_list[0].name_str !== 'None') {
        has_settings = true
      }
    }


    if (has_settings == false){
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

               {this.renderSettings()}


          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={(this.props.title !== undefined) ? this.props.title : "Settings"}>

              {this.renderSettings()}


        </Section>
     )
   }

  }

}
export default Nepi_IF_Settings
