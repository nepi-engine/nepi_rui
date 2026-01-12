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

import { createMenuListFromStrList } from "./Utilities"

@inject("ros")
@observer

// Component that contains the Settings controls
class Nepi_IF_Settings extends Component {
  constructor(props) {
    super(props)

    // these states track the values through  Status messages
    this.state = {

      settingsNamespace: 'None',
      capabilities: null,

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
    }

    this.updateSettingsListener = this.updateSettingsListener.bind(this)
    this.settingsStatusListener = this.settingsStatusListener.bind(this)

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
  settingsStatusListener(message) {
    const last_values_list = this.state.settingsValuesList
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

  // Function for configuring and subscribing to Settings Status
  updateSettingsListener() {
    const settingsNamespace = this.props.settingsNamespace ? 
        (this.props.settingsNamespace !== 'None' ? this.props.settingsNamespace: 'None') : 'None'
    if (this.state.settingsListener) {
      this.state.settingsListener.unsubscribe()
      this.setState({settingsListener: null})
    }
    else {
      if (settingsNamespace !== 'None'){
        const settingsListener = this.props.ros.setupSettingsStatusListener(
          settingsNamespace + '/status',
          this.settingsStatusListener
        )

        this.setState({capSettingsNamesList: [],
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
        this.setState({settingsNamespace: settingsNamespace})
        this.setState({ settingsListener: settingsListener})
      }
    }
  }


  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const settingsNamespace = this.props.settingsNamespace
    const namespace = this.state.settingsNamespace
    if (settingsNamespace !== namespace) {
      this.updateSettingsListener()
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Settings Status message
  componentWillUnmount() {
    if (this.state.settingsListener) {
      this.state.settingsListener.unsubscribe()
    }
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
    const show_all = this.props.show_all ? this.props.show_all : false
    const capSettingNamesOrdered = this.getSortedStrList(this.state.capSettingsNamesList)

    const settingsHeight = this.state.settingsCount * 25
    const settingsHeightStr = settingsHeight.toString() + 'px'


    if (show_all === false){
      return (
        <React.Fragment>
          <Columns>
            <Column>

              <Columns>
                <Column>
                  <Label title={"Select Setting"}>
                    <Select
                      id="selectedSettingName"
                      onChange={this.updateSelectedSettingInfo}
                      value={this.state.selectedSettingName}
                    >
                      {createMenuListFromStrList(capSettingNamesOrdered, false, [], ['NONE'], [])}
                    </Select>
                  </Label>
                </Column>
                <Column />
              </Columns>
          
              <Columns>
                <Column>

                  {this.renderSetting()}
      
          
                  <div
                    style={{
                      borderTop: "1px solid #ffffff",
                      marginTop: Styles.vars.spacing.medium,
                      marginBottom: Styles.vars.spacing.xs,
                    }}
                  />
          
                  <Label title={"Current Settings"} />
                  <pre style={{ height: settingsHeightStr, overflowY: "auto" }}>
                    {this.getSettingsAsString()}
                  </pre>

                </Column>
              </Columns>

              {this.renderConfigs()}

          </Column>
          </Columns>

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
        <Column>

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
    const make_section = this.props.make_section ? this.props.make_section : true
    const settingsNamespace = this.state.settingsNamespace ? this.state.settingsNamespace : 'None'
    if (settingsNamespace !== 'None' && make_section === true){
      return (
        <Section title={"Device Settings"}>
          {this.renderSettings()}
        </Section>
      )
    }
    else if (settingsNamespace !== 'None' && make_section === false) {
      return (


        <Columns>
          <Column>
          {this.renderSettings()}

          </Column>
        </Columns>
      )
    }
    else {
      return (
        <Columns>
          <Column>

          </Column>
        </Columns>
      )
    }
    
  }

}
export default Nepi_IF_Settings
