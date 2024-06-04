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
class NepiSensorsImagingSaveData extends Component {
  constructor(props) {
    super(props)

    // these states track the values through IDX Status messages
    this.state = {
      saveDataConfigsMsg: [],
      saveDataPrefix: "",
      saveDataNavEnabled: false,
      saveDataEnabled: false,
      show_save_data: false,
      saveDataRateHz: 0,
      saveDataConfigsNamesList: [],
      saveDataConfigsRatesList: [],
      saveDataUpdatesList: [],
      disabled: false,
    }

    this.updateListener = this.updateListener.bind(this)
    this.idxStatusListener = this.idxStatusListener.bind(this)
    this.sendUpdate = this.sendUpdate.bind(this)
    this.updateSaveDataConfigsLists = this.updateSaveDataConfigsLists.bind(this)
    this.onChangeBoolSaveNavDataValue = this.onChangeBoolSaveNavDataValue.bind(this)
    this.onChangeBoolSaveDataValue = this.onChangeBoolSaveDataValue.bind(this)
    this.onUpdateInputSaveDataRateValue = this.onUpdateInputSaveDataRateValue.bind(this)
    this.onKeySaveInputSaveDataRateValue = this.onKeySaveInputSaveDataRateValue.bind(this)
    this.convertStrListToMenuList = this.convertStrListToMenuList.bind(this)
    this.getSaveDataList = this.getSaveDataList.bind(this)
    this.getSaveDataRateValue = this.getSaveDataRateValue.bind(this)
    this.getSaveDataString = this.getSaveDataString.bind(this)
    this.updateSelectedSaveDataInfo = this.updateSelectedSaveDataInfo.bind(this)

    this.updateListener()
  }

  // Callback for handling ROS StatusIDX messages
  idxStatusListener(message) {
    this.setState({
      saveDataConfigsMsg: message.save_data_configs,
      saveDataPrefix: message.save_data_prefix,
      saveDataNavEnabled: message.save_data_nav_enabled,
      saveDataEnabled: message.save_data_enabled
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
  updateSaveDataLists(saveDataConfigsMsg) {
    var saveDataConfigsStr = saveDataConfigsMsg
    saveDataConfigsStr = saveDataConfigsStr.replace("[","")
    saveDataConfigsStr = saveDataConfigsStr.replace("]","")
    saveDataConfigsStr = saveDataConfigsStr.replaceAll(" '","")
    saveDataConfigsStr = saveDataConfigsStr.replaceAll("'","")
    const saveDataConfigsStrList = saveDataConfigsStr.split(",")
    var saveDataConfigsNameList = []
    var new_config = true
    this.state.saveDataConfigsNamesList.push("None")
    this.state.saveDataConfigsRatesList.push("None")
    for (var i in saveDataConfigsStrList){
      if (new_config === true){
        this.state.saveDataConfigsNamesList.push(item)
        new_config = false
      } else {
        this.state.saveDataConfigsRatesList.push(item)
        new_config = true
      }
    }
    this.state.saveDataConfigsNamesList.push("All")
    this.state.saveDataConfigsRatesList.push("All")
      
    
  }
  
  convertStrListToMenuList(strList){
    var menuList = []
    for (var i in strList){
      menuList.push(<Option>{strList[i]}</Option>)
    } 
    return menuList
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
    const { idxSensors, resetIdxSaveDataTriggered} = this.props.ros
    this.updateSaveDataLists(this.state.saveDataConfigsMsg)
    return (
      <Section title={"Save Data"}>
        <Columns>
          <Column>
            <div align={"left"} textAlign={"left"}>
            <Label title={"Show Save Data"}>
          <Toggle
            checked={this.state.show_save_data}
            onClick={() => {this.state.show_save_data=!this.state.show_save_data}}
          />
        </Label>
            </div>
          </Column>
          <Column>
          <div align={"left"} textAlign={"left"}  hidden={!this.state.show_sensor_settings}>
              <ButtonMenu>
                <Button onClick={() => resetIdxSaveDataTriggered(this.props.idxSensorNamespace)}>{"Reset Settings"}</Button>
              </ButtonMenu>
            </div>
          </Column>
        </Columns>
        <div hidden={!this.state.show_sensor_settings}>

          <Label title={"Select Setting"}>
            <Select
              id="selectedSettingName"
              onChange={this.updateSelectedSettingInfo}
              value={this.state.saveDataConfigsNamesList[this.state.selectedSettingInd]}
            >
              {this.convertStrListToMenuList(this.state.saveDataConfigsNamesList)}
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
export default NepiSensorsImagingSaveData
