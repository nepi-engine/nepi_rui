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
//import EnableAdjustment from "./EnableAdjustment"
import Button, { ButtonMenu } from "./Button"
import Toggle from "react-toggle"
import Label from "./Label"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
import Select, { Option } from "./Select"
import Input from "./Input"


@inject("ros")
@observer

// Component that contains the Settings controls
class Nepi_IF_Settings extends Component {
  constructor(props) {
    super(props)

    // these states track the values through  Status messages
    this.state = {
      capSettingsTypes: ['Menu','Discrete','String','Bool','Int','Float'],
      capSettingsNamesList: [],
      capSettingsTypesList: [],
      settings: null,
      selectedSettingInd: 0,
      selectedSettingName: "",
      selectedSettingType: "",
      selectedSettingValue: "",
      selectedSettingLowerLimit: "",
      selectedSettingUpperLimit: "",
      selectedSettingOptions: [],
      selectedSettingInput: "",

      listener: null,

      disabled: false,
    }

    this.updateSettingsListener = this.updateSettingsListener.bind(this)
    this.settingsStatusListener = this.settingsStatusListener.bind(this)

    this.updateCapSettingsLists = this.updateCapSettingsLists.bind(this)
    this.getCapSettingOptions = this.getCapSettingOptions.bind(this)

    this.getSettingsAsList = this.getSettingsAsList.bind(this)
    this.getSettingsAsString = this.getSettingsAsString.bind(this)
    this.getSettingValue = this.getSettingValue.bind(this)

    this.onChangeBoolSettingValue = this.onChangeBoolSettingValue.bind(this)
    this.onChangeDescreteSettingValue = this.onChangeDescreteSettingValue.bind(this)
    this.onUpdateInputSettingValue = this.onUpdateInputSettingValue.bind(this)
    this.onKeySaveInputSettingValue = this.onKeySaveInputSettingValue.bind(this)
    this.convertStrListToMenuList = this.convertStrListToMenuList.bind(this)

    this.updateSelectedSettingInfo = this.updateSelectedSettingInfo.bind(this)
    this.getSelectedSettingInfo = this.getSelectedSettingInfo.bind(this)

    this.updateSettingsListener()
  }

  // Callback for handling ROS Settings Status messages
  settingsStatusListener(message) {
    this.setState({
      settings: message.data,
    })
  }

  // Function for configuring and subscribing to Settings Status
  updateSettingsListener() {
    const { settingsNamespace, title } = this.props
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }

    if (settingsNamespace != null) {
      if (settingsNamespace.indexOf('null') === -1){
        var listener = this.props.ros.setupSettingsStatusListener(
          settingsNamespace,
          this.settingsStatusListener
        )
        this.setState({ listener: listener, disabled: false })
      } else {
        this.setState({ disabled: true })
      }
    } else {
      this.setState({ disabled: true })
    }
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { settingsNamespace } = this.props
    if (prevProps.settingsNamespace !== settingsNamespace) {
      this.updateSettingsListener()
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Settings Status message
  componentWillUnmount() {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
  }

  getSettingsAsList(settingsMsg) {
    var settingsStrList = []
    if (settingsMsg != null){
      settingsMsg = settingsMsg.replaceAll("[","")
      settingsMsg = settingsMsg.replaceAll("]","")
      settingsMsg = settingsMsg.replaceAll(" '","")
      settingsMsg = settingsMsg.replaceAll("'","")
      settingsStrList = settingsMsg.split(",")
    }
    return settingsStrList
  }

  // Function for creating settings options list from capabilities
  updateCapSettingsLists() {
    const {settingsCaps} = this.props.ros
    if (settingsCaps){
      const capabilities = settingsCaps[this.props.settingsNamespace]
      var typesList = []
      var namesList = []
      if (capabilities !== undefined){
        const capSettingsMsg = capabilities.settings_options
        const capSettingsValid = (capSettingsMsg !== undefined)
        const capSettingsEmpty = (this.state.capSettingsNamesList.length === 0)
        if (capSettingsValid && capSettingsEmpty){
          const capSettingsStrList = this.getSettingsAsList(capSettingsMsg)
          var new_setting = false
          var entry = ''
          typesList.push("None")
          namesList.push("None")
          for (let ind = 0; ind < capSettingsStrList.length; ind++){
            entry = capSettingsStrList[ind]
            if (this.state.capSettingsTypes.indexOf(entry) !== -1){
              typesList.push(entry)
              new_setting = true
            } else if (new_setting && entry !== 'None'){
              namesList.push(entry)
              new_setting = false
            }
          }
          this.setState({capSettingsTypesList:typesList})
          this.setState({capSettingsNamesList:namesList})
        }
      }
    }
  }
  
  convertStrListToMenuList(strList) {
    var menuList = []
    for (let ind = 0; ind < strList.length; ind++){
      menuList.push(<Option>{strList[ind]}</Option>)
    } 
    return menuList
  }

  getCapSettingOptions(capSettingName){
    const {settingsCaps} = this.props.ros
    const capabilities = settingsCaps[this.props.settingsNamespace]
    var capSettingOptions = []
    if (capabilities !== undefined){
      const capSettingsMsg = capabilities.settings_options
      const capSettingsStrList = this.getSettingsAsList(capSettingsMsg)
      var capInd = -1
      var lastEntry = 'None'
      var entry = 'None'
      for (let ind = 0; ind < capSettingsStrList.length; ind++){
        entry = capSettingsStrList[ind]
        if (entry === capSettingName && this.state.capSettingsTypes.indexOf(lastEntry) !== -1){
          capInd = ind
          break; 
        }
        lastEntry = entry
      }
      if (capInd !== -1 && capSettingsStrList.length > (capInd + 1) ){
        var optionsInd = capInd + 1
        while ((optionsInd) < capSettingsStrList.length){
          if (this.state.capSettingsTypes.indexOf(capSettingsStrList[optionsInd]) === -1){
            capSettingOptions.push(capSettingsStrList[optionsInd])
          } else {
            return capSettingOptions
          }
          optionsInd++
        }
      }
    } 
    return capSettingOptions
  }

  getSettingValue(settingName) {
    const settings = this.state.settings
    const settingsStrList = this.getSettingsAsList(settings)
    var setInd = -1
    var lastEntry = 'None'
    var entry = 'None'
    for (let ind = 0; ind < settingsStrList.length; ind++){
      entry = settingsStrList[ind]
      if (entry === settingName && this.state.capSettingsTypes.indexOf(lastEntry) !== -1){
        setInd = ind
        break; 
      }
      lastEntry = entry
    }
    setInd++
    var value = settingsStrList[setInd]
    return value
  }

  updateSelectedSettingInfo(event){
    const ind = event.nativeEvent.target.selectedIndex
    const name = event.nativeEvent.target[ind].text
    this.setState({selectedSettingInd : ind })
    this.setState({selectedSettingName  :  name })
    const type = this.state.capSettingsTypesList[ind]
    this.setState({selectedSettingType  :  type }) 
    const value = this.getSettingValue(name) 
    this.setState({selectedSettingValue  : value })
    const options = this.getCapSettingOptions(name)
    this.setState({selectedSettingOptions  :  options })
    if (type === "Int" || type === "Float" ) {
      this.setState({selectedSettingLowerLimit  :  options.length > 0 ? options[0] : "" })
      this.setState({selectedSettingUpperLimit  :  options.length > 1 ? options[1] : "" })
    } else {
      this.setState({selectedSettingLowerLimit  :  "" })
      this.setState({selectedSettingUpperLimit  :  "" })
    }
    this.setState({selectedSettingInput  :  value })
    this.render()
  }

  getSelectedSettingInfo(){
    const info = [this.state.selectedSettingInd, this.state.selectedSettingType , this.state.selectedSettingName , this.state.selectedSettingValue , this.state.selectedSettingLowerLimit , this.state.selectedSettingUpperLimit ]
    return info
  }


  onChangeBoolSettingValue(){
    const {updateSetting}  = this.props.ros
    const value = (this.getSettingValue(this.state.selectedSettingName) === "True") ? "False" : "True" 
    updateSetting(this.props.settingsNamespace,
      this.state.selectedSettingName,this.state.selectedSettingType,value)
  }

  onChangeDescreteSettingValue(event){
    const {updateSetting}  = this.props.ros
    const ind = event.nativeEvent.target.selectedIndex
    const value = event.nativeEvent.target[ind].text
    updateSetting(this.props.settingsNamespace,
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
      updateSetting(this.props.settingsNamespace,
        this.state.selectedSettingName,this.state.selectedSettingType,value)
      document.getElementById("input_setting").style.color = Styles.vars.colors.black
      this.updateSelectedSettingInfo()
    }
  }




  getSettingsAsString() {
    var settingsStr = "None"
    const settings = this.state.settings
    const settingsStrList = this.getSettingsAsList(settings)
    var settingsStrList2 = []
    var counter = 0
    if (settingsStrList.length > 0){
      for(let ind = 0; ind < settingsStrList.length; ind++) {
        if (counter === 0){
          counter = 1
        } else if (counter === 1) {
          settingsStrList2.push(settingsStrList[ind])
          settingsStrList2.push(": ")
          counter = 2
        } else {
          settingsStrList2.push(settingsStrList[ind])
          settingsStrList2.push("\n")
          counter = 0
        }
      }
      settingsStr =settingsStrList2.join("")
    } 
    return settingsStr
  }


  render() {
    const { sendTriggeredMsg} = this.props.ros
    this.updateCapSettingsLists()
    const selSetInfo = this.getSelectedSettingInfo()
    return (
      <Section title={"Settings"}>
        <div hidden={!this.state.show_settings}>
        <Columns>
          <Column>
            <Label title={"Select Setting"}>
              <Select
                id="selectedSettingName"
                onChange={this.updateSelectedSettingInfo}
                value={this.state.capSettingsNamesList[this.state.selectedSettingInd]}
              >
                {this.convertStrListToMenuList(this.state.capSettingsNamesList)}
              </Select>
            </Label>

            <div align={"left"} textAlign={"right"} hidden={selSetInfo[1] !== "Bool" }>
              <Label title={selSetInfo[2]}>
                <Toggle
                  checked={ (this.getSettingValue(selSetInfo[2]) === "True")}
                  onClick={() => {this.onChangeBoolSettingValue()}}
                />
              </Label>
              </div>

              <div align={"left"} textAlign={"right"} hidden={selSetInfo[1] !== "Menu" && selSetInfo[1] !== "Discrete" }>
              <Label title={selSetInfo[2]}>
                <Select
                  id="descreteSetting"
                  onChange={this.onChangeDescreteSettingValue}
                  value={this.getSettingValue(selSetInfo[2])}
                >
                  {this.convertStrListToMenuList(this.state.selectedSettingOptions)}
                </Select>
            </Label>
            </div>

            <div align={"left"} textAlign={"right"} 
              hidden={!(selSetInfo[1] === "String" ||
              selSetInfo[1] === "Int" ||
              selSetInfo[1] === "Float")}
            >

                <div align={"left"} textAlign={"right"} hidden={selSetInfo[4] === ""}>
                    <Label title={"Lower Input Limit"}>
                      <Input disabled value={selSetInfo[4]} />
                    </Label>
                </div>

                <div align={"left"} textAlign={"right"} hidden={selSetInfo[5] === ""}>
                    <Label title={"Upper Input Limit"}>
                      <Input disabled value={selSetInfo[5]} />
                    </Label>
                </div>

                <Label title={selSetInfo[2]}>
                  <Input id="input_setting" 
                    value={this.state.selectedSettingInput} 
                    onChange={this.onUpdateInputSettingValue} 
                    onKeyDown= {this.onKeySaveInputSettingValue} />
                </Label>
                <Label title={"* Some changes may require power cycle"}>
                </Label>
            </div>
          </Column>
          <Column>
          <div align={"left"} textAlign={"left"}  hidden={!this.state.show_settings}>
              <ButtonMenu>
                <Button onClick={() => sendTriggeredMsg(this.props.settingsNamespace + '/reset_settings')}>{"Reset Settings"}</Button>
              </ButtonMenu>
            </div>
          </Column>
        </Columns>

          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
          <Label title={"Current Settings"} >
          </Label>
          <pre style={{ height: "400px", overflowY: "auto" }}>
            {this.getSettingsAsString()}
          </pre>
        </div>
      </Section>
    )
  }

}
export default Nepi_IF_Settings
