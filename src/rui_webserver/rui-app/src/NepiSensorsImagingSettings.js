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
import RangeAdjustment from "./RangeAdjustment"
import {RadioButtonAdjustment, SliderAdjustment} from "./AdjustmentWidgets"
import Toggle from "react-toggle"
import Label from "./Label"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
import Select, { Option } from "./Select"
import Input from "./Input"

@inject("ros")
@observer

// Component that contains the IDX Sensor controls
class NepiSensorsImagingSettings extends Component {
  constructor(props) {
    super(props)

    // these states track the values through IDX Status messages
    this.state = {
      show_sensor_settings: false,
      capSettingsTypes: ['Discrete','String','Bool','Int','Float'],
      capSettingsNamesList: [],
      capSettingsTypesList: [],
      settings: null,
      selectedSettingInd: 0,
      selectedSettingName: "",
      selectedSettingType: "",
      selectedSettingValue: "",
      selectedSettingLowerLimit: "",
      selectedSettingUpperLimit: "",
      selectedSettingOptions: null,
      selectedSettingInput: "",
      disabled: false,
    }

    this.updateListener = this.updateListener.bind(this)
    this.idxStatusListener = this.idxStatusListener.bind(this)
    this.sendUpdate = this.sendUpdate.bind(this)
    this.updateCapSettingsLists = this.updateCapSettingsLists.bind(this)
    this.onChangeBoolSettingValue = this.onChangeBoolSettingValue.bind(this)
    this.onChangeDescreteSettingValue = this.onChangeDescreteSettingValue.bind(this)
    this.onUpdateInputSettingValue = this.onUpdateInputSettingValue.bind(this)
    this.onKeySaveInputSettingValue = this.onKeySaveInputSettingValue.bind(this)
    this.convertStrListToMenuList = this.convertStrListToMenuList.bind(this)
    this.getCapSettingOptions = this.getCapSettingOptions.bind(this)
    this.getSettingsList = this.getSettingsList.bind(this)
    this.getSettingValue = this.getSettingValue.bind(this)
    this.getSettingsString = this.getSettingsString.bind(this)
    this.updateSelectedSettingInfo = this.updateSelectedSettingInfo.bind(this)

    this.updateListener()
  }

  // Callback for handling ROS StatusIDX messages
  idxStatusListener(message) {
    this.setState({
      settings: message.settings,
    })
  }

  // Function for configuring and subscribing to StatusIDX
  updateListener() {
    const { idxSensorNamespace, title } = this.props
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }

    if (title) {
      var listener = this.props.ros.setupIDXStatusListener(
        idxSensorNamespace,
        this.idxStatusListener
      )
      this.setState({ listener: listener, disabled: false })
    } else {
      this.setState({ disabled: true })
    }
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { idxSensorNamespace } = this.props
    if (prevProps.idxSensorNamespace !== idxSensorNamespace) {
      this.updateListener()
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to StatusIDX message
  componentWillUnmount() {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
  }

  // Function for sending updated state through rosbridge
  sendUpdate(topic, value, name, throttle = false) {
   this.props.ros.publishAutoManualSelection3DX(
      topic,
      name,
      true,
      value,
      throttle
   )
  }

  // Function for creating settings options list from capabilities
  updateCapSettingsLists(capabilities) {
    if (capabilities !== undefined){
      var capSettingsMsg = capabilities.settings_options
      const capSettingsValid = (capSettingsMsg !== undefined)
      const capSettingsEmpty = (this.state.capSettingsNamesList.length === 0)
      if (capSettingsValid && capSettingsEmpty){
        capSettingsMsg = capSettingsMsg.replace("[","")
        capSettingsMsg = capSettingsMsg.replace("]","")
        capSettingsMsg = capSettingsMsg.replaceAll(" '","")
        capSettingsMsg = capSettingsMsg.replaceAll("'","")
        const capSettingsStrList = capSettingsMsg.split(",")
        var capSettingsNameList = []
        var new_setting = false
        var item = ''
        this.state.capSettingsTypesList.push("None")
        this.state.capSettingsNamesList.push("None")
        for (var i in capSettingsStrList){
          item = capSettingsStrList[i]
          if (this.state.capSettingsTypes.indexOf(item) !== -1){
            this.state.capSettingsTypesList.push(item)
            new_setting = true
          } else if (new_setting && item !== 'None'){
            this.state.capSettingsNamesList.push(item)
            new_setting = false
          }
        }
      }
    }
  }
  
  convertStrListToMenuList(strList){
    var menuList = []
    for (var i in strList){
      menuList.push(<Option>{strList[i]}</Option>)
    } 
    return menuList
  }

  getCapSettingOptions(capSettingName){
    const {idxSensors} = this.props.ros
    const capabilities = idxSensors[this.props.idxSensorNamespace]
    var capSettingOptions = []
    if (capabilities !== undefined){
      var capSettingsMsg = capabilities.settings_options
      capSettingsMsg = capSettingsMsg.replace("[","")
      capSettingsMsg = capSettingsMsg.replace("]","")
      capSettingsMsg = capSettingsMsg.replaceAll(" '","")
      capSettingsMsg = capSettingsMsg.replaceAll("'","")
      const capSettingsStrList = capSettingsMsg.split(",")
      const capInd = capSettingsStrList.indexOf(capSettingName)
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



  updateSelectedSettingInfo(event){
    const ind = event.nativeEvent.target.selectedIndex
    const name = event.nativeEvent.target[ind].text
    this.state.selectedSettingInd = ind
    this.state.selectedSettingName = name
    this.state.selectedSettingType = this.state.capSettingsTypesList[ind]
    this.state.selectedSettingValue = this.getSettingValue(name)
    this.state.selectedSettingOptions = this.getCapSettingOptions(name)
    if (this.state.selectedSettingType === "Int" || this.state.selectedSettingType === "Float" ) {
      this.state.selectedSettingLowerLimit = this.state.selectedSettingOptions.length > 0 ? this.state.selectedSettingOptions[0] : ""
      this.state.selectedSettingUpperLimit = this.state.selectedSettingOptions.length > 1 ? this.state.selectedSettingOptions[1] : ""
    } else {
      this.state.selectedSettingLowerLimit = ""
      this.state.selectedSettingUpperLimit = ""
    }
    this.state.selectedSettingInput = this.state.selectedSettingValue
    this.render()
  }


  onChangeBoolSettingValue(){
    const {updateIdxSetting}  = this.props.ros
    const value = (this.getSettingValue(this.state.selectedSettingName) === "True") ? "False" : "True" 
    updateIdxSetting(this.props.idxSensorNamespace,
      this.state.selectedSettingName,this.state.selectedSettingType,value)
  }

  onChangeDescreteSettingValue(event){
    const {updateIdxSetting}  = this.props.ros
    const ind = event.nativeEvent.target.selectedIndex
    const value = event.nativeEvent.target[ind].text
    updateIdxSetting(this.props.idxSensorNamespace,
      this.state.selectedSettingName,this.state.selectedSettingType,value)
  }

  onUpdateInputSettingValue(event) {
    this.setState({ selectedSettingInput: event.target.value })
    document.getElementById("input_setting").style.color = Styles.vars.colors.red
    this.render()
  }

  onKeySaveInputSettingValue(event) {
    const {updateIdxSetting}  = this.props.ros
    if(event.key === 'Enter'){
      const value = this.state.selectedSettingInput
      updateIdxSetting(this.props.idxSensorNamespace,
        this.state.selectedSettingName,this.state.selectedSettingType,value)
      document.getElementById("input_setting").style.color = Styles.vars.colors.black
      this.updateSelectedSettingInfo()
    }
  }

  getSettingsList() {
    const settings = this.state.settings
    var settingsMsg = settings
    var settingsStrList = []
    if (settingsMsg != null){
      settingsMsg = settingsMsg.replace("[","")
      settingsMsg = settingsMsg.replace("]","")
      settingsMsg = settingsMsg.replaceAll(" '","")
      settingsMsg = settingsMsg.replaceAll("'","")
      settingsStrList = settingsMsg.split(",")
    }
    return settingsStrList
  }

  getSettingValue(settingName) {
    const settingsStrList = this.getSettingsList()
    const settingInd = settingsStrList.indexOf(settingName)
    return settingsStrList[settingInd + 1]
  }


  getSettingsString() {
    var settingsStr = "None"
    const settingsStrList = this.getSettingsList()
    var settingsStrList2 = []
    if (settingsStrList.length > 0){
      let ind = 0   
      for(var i in settingsStrList) {
        if (ind === 0){
          ind = 1
        } else if (ind === 1) {
          settingsStrList2.push(settingsStrList[i])
          settingsStrList2.push(": ")
          ind = 2
        } else {
          settingsStrList2.push(settingsStrList[i])
          settingsStrList2.push("\n")
          ind = 0
        }
      }
      settingsStr =settingsStrList2.join("")
    } 
    return settingsStr
  }


  render() {
    const { idxSensors, resetIdxSettingsTriggered} = this.props.ros
    const capabilities = idxSensors[this.props.idxSensorNamespace]
    this.updateCapSettingsLists(capabilities)
    return (
      <Section title={"Sensor Settings"}>
        <Columns>
          <Column>
            <div align={"left"} textAlign={"left"}>
            <Label title={"Show Settings"}>
          <Toggle
            checked={this.state.show_sensor_settings}
            onClick={() => {this.state.show_sensor_settings=!this.state.show_sensor_settings}}
          />
        </Label>
            </div>
          </Column>
          <Column>
          <div align={"left"} textAlign={"left"}  hidden={!this.state.show_sensor_settings}>
              <ButtonMenu>
                <Button onClick={() => resetIdxSettingsTriggered(this.props.idxSensorNamespace)}>{"Reset Settings"}</Button>
              </ButtonMenu>
            </div>
          </Column>
        </Columns>
        <div hidden={!this.state.show_sensor_settings}>

          <Label title={"Select Setting"}>
            <Select
              id="selectedSettingName"
              onChange={this.updateSelectedSettingInfo}
              value={this.state.capSettingsNamesList[this.state.selectedSettingInd]}
            >
              {this.convertStrListToMenuList(this.state.capSettingsNamesList)}
            </Select>
          </Label>

          <div align={"left"} textAlign={"right"} hidden={this.state.selectedSettingType !== "Bool" }>
            <Label title={this.state.selectedSettingName}>
              <Toggle
                checked={ (this.getSettingValue(this.state.selectedSettingName) === "True")}
                onClick={() => {this.onChangeBoolSettingValue()}}
              />
            </Label>
            </div>

            <div align={"left"} textAlign={"right"} hidden={this.state.selectedSettingType !== "Discrete" }>
            <Label title={this.state.selectedSettingName}>
              <Select
                id="descreteSetting"
                onChange={this.onChangeDescreteSettingValue}
                value={this.getSettingValue(this.state.selectedSettingName)}
              >
                {this.convertStrListToMenuList(this.state.selectedSettingOptions)}
              </Select>
          </Label>
          </div>

          <div align={"left"} textAlign={"right"} 
            hidden={!(this.state.selectedSettingType === "String" ||
            this.state.selectedSettingType === "Int" ||
            this.state.selectedSettingType === "Float")}
          >

              <div align={"left"} textAlign={"right"} hidden={this.state.selectedSettingLowerLimit === ""}>
                  <Label title={"Lower Input Limit"}>
                    <Input disabled value={this.state.selectedSettingLowerLimit} />
                  </Label>
              </div>

              <div align={"left"} textAlign={"right"} hidden={this.state.selectedSettingUpperLimit === ""}>
                  <Label title={"Upper Input Limit"}>
                    <Input disabled value={this.state.selectedSettingUpperLimit} />
                  </Label>
              </div>

              <Label title={this.state.selectedSettingName}>
                <Input id="input_setting" 
                  value={this.state.selectedSettingInput} 
                  onChange={this.onUpdateInputSettingValue} 
                  onKeyDown= {this.onKeySaveInputSettingValue} />
              </Label>
          </div>


          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
          <Label title={"Current Settings"} >
          </Label>
          <pre style={{ height: "400px", overflowY: "auto" }}>
            {this.getSettingsString()}
          </pre>
        </div>
      </Section>
    )
  }

}
export default NepiSensorsImagingSettings
