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
import BooleanIndicator from "./BooleanIndicator"
import Toggle from "react-toggle"
import Label from "./Label"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
import Select, { Option } from "./Select"
import Input from "./Input"


function roundWithSuffix(value, decimals, suffix) {
  return value && (value.toFixed(decimals) + " " + suffix)
}

@inject("ros")
@observer

// Component that contains the IDX Sensor controls
class NepiSensorsImagingSaveData extends Component {
  constructor(props) {
    super(props)

    // these states track the values through IDX Status messages
    this.state = {
      show_save_data: true,
      reset_save_data: false,
      saveRatesMsg: "",
      saveDataPrefix: "",
      saveDataEnabled: false,
      saveDataNavEnabled: false,
      saveDataRate: "1.0",
      saveNamesList: [],
      saveRatesList: [],
      selectedDataProducts: [],

      listener: null,

      disabled: false,
    }


    this.updateSaveListener = this.updateSaveListener.bind(this)
    this.SaveStatusListener = this.SaveStatusListener.bind(this)

    this.updateSaveLists = this.updateSaveLists.bind(this)
    this.getSaveNamesList = this.getSaveNamesList.bind(this)
    this.getSaveRatesList = this.getSaveRatesList.bind(this)
    this.getSaveConfigString = this.getSaveConfigString.bind(this)
    this.getSaveRateValue = this.getSaveRateValue.bind(this)
    this.getSaveRateData = this.getSaveRateData.bind(this)

    this.onChangeBoolSaveDataNavValue = this.onChangeBoolSaveDataNavValue.bind(this)
    this.getSaveDataValue = this.getSaveDataValue.bind(this)
    this.onChangeBoolSaveDataValue = this.onChangeBoolSaveDataValue.bind(this)
    this.getSaveDataNavValue = this.getSaveDataNavValue.bind(this)
    this.onUpdateInputSaveDataRateValue = this.onUpdateInputSaveDataRateValue.bind(this)
    this.onKeySaveInputSaveDataRateValue = this.onKeySaveInputSaveDataRateValue.bind(this)
    this.onUpdateInputSaveDataPrefixValue = this.onUpdateInputSaveDataPrefixValue.bind(this)
    this.onKeySaveInputSaveDataPrefixValue = this.onKeySaveInputSaveDataPrefixValue.bind(this)
    this.onToggleDataProductSelection = this.onToggleDataProductSelection.bind(this)

    this.updateSelectedDataProducts = this.updateSelectedDataProducts.bind(this)
    this.getSelectedDataProducts = this.getSelectedDataProducts.bind(this)
    this.getDiskUsageRate = this.getDiskUsageRate.bind(this)

    this.sendSaveRateUpdates = this.sendSaveRateUpdates.bind(this)

    this.convertStrListToMenuList = this.convertStrListToMenuList.bind(this)
    
    this.doNothing = this.doNothing.bind(this)

    //this.updateSaveListener()
  }

  // Callback for handling ROS Status messages
  SaveStatusListener(message) {
    const saveDataRates = message.save_data_rates
    const saveDirPrefix = message.current_folder_prefix
    const saveNamePrefix = message.current_filename_prefix
    const saveDataMsg = message.save_data
    const saveData = saveDataMsg.save_continuous
    var saveDataPrefix = ""
    if (saveDirPrefix === ""){
      saveDataPrefix = saveNamePrefix
    } else {
      saveDataPrefix = saveDirPrefix + "/" + saveNamePrefix
    }
    this.setState({
      saveRatesMsg: saveDataRates,
      saveDataPrefix: saveDataPrefix,
      saveDataEnabled: saveData
    })
    this.updateSaveLists()
    this.updateSelectedDataProducts()
  }

  // Function for configuring and subscribing to Status
  updateSaveListener() {
    const { saveNamespace, title } = this.props
    const statusNamespace = saveNamespace + "/save_data_status"
    if (this.state.saveListener) {
      this.state.saveListener.unsubscribe()
    }

    if (title) {
      var saveListener = this.props.ros.setupSaveDataStatusListener(
        statusNamespace,
        this.SaveStatusListener
      )
      this.setState({ saveListener: saveListener, disabled: false })
    } else {
      this.setState({ disabled: true })
    }
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { saveNamespace } = this.props
    if (prevProps.saveNamespace !== saveNamespace) {
      this.updateSaveListener()
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
  }


  // Function for creating configs options list from capabilities
  updateSaveLists() {
    var saveRatesStr = this.state.saveRatesMsg
    saveRatesStr = saveRatesStr.replaceAll("[","")
    saveRatesStr = saveRatesStr.replaceAll("]","")
    const saveRatesStrList = saveRatesStr.split(",")
    var NamesList = []
    var RatesList = []
    var new_config = true
    var entry = ""
    for (let ind = 0; ind < saveRatesStrList.length; ind++){
      entry = saveRatesStrList[ind]
      if (new_config === true){
        NamesList.push(entry)
        new_config = false
      } else {
        RatesList.push(entry)
        new_config = true
      }
    }
    // add None and All options to lists
    NamesList.push("NONE")
    RatesList.push("0.0")
    NamesList.push("ALL")
    RatesList.push(this.state.saveDataRate)
    this.setState({saveNamesList:NamesList})
    this.setState({saveRatesList:RatesList})
  }


  getSaveNamesList(){
    const list = this.state.saveNamesList
    return list
  }

  getSaveRatesList(){
    const list = this.state.saveRatesList
    return list
  }


  getSaveConfigString() {
    const namesList = this.state.saveNamesList
    const ratesList = this.state.saveRatesList
    var configsStr = ""
    var entryStr
    var configsStrList = [""]
    for (let ind = 0; ind < namesList.length; ind++) {
      if (namesList[ind] !== "NONE" && namesList[ind] !== "ALL" ){
        entryStr = namesList[ind] + " : " + ratesList[ind] +  " Hz\n"
        configsStrList.push(entryStr)
      }
    }
    var navSaveRate = "0.0"
    if (this.state.saveDataNavEnabled === true){
      navSaveRate = this.state.saveDataRate
    }
    entryStr = ("nav : " + navSaveRate + " Hz\n")
    configsStrList.push(entryStr)
    configsStr = configsStrList.join("")
    return configsStr
  }

  getSaveRateValue(dataName) {
    const configsStrList = this.getsaveRatesAsList()
    const configInd = configsStrList.indexOf(dataName)
    return configsStrList[configInd + 1]
  }

  getSaveRateData(dataName) {
    const configValue = this.getSaveRateValue(dataName)
    return parseFloat(configValue)
  }

  sendSaveRateUpdates() {
    const {updateSaveDataRate}  = this.props.ros
    const saveNamesList = this.getSaveNamesList()
    const selectedList = this.getSelectedDataProducts()
    const saveDataRate = this.state.saveDataRate
    // create updated Configs List
    var updatedSelectedList = []
    var noneSel = selectedList.indexOf("NONE") !== -1
    var allSel = selectedList.indexOf("ALL") !== -1
    var saveRateStr = ""
    var rate = 0
    var data_product = null
    for (let ind = 0; ind < saveNamesList.length; ind++) {
      data_product = saveNamesList[ind]
      if (data_product !== "NONE" && data_product !== "ALL"){
        if (allSel) {
          saveRateStr = saveDataRate
          updatedSelectedList.push(data_product)
        } else if (noneSel){
          saveRateStr = "0.0"
        } else if (selectedList.indexOf(data_product) !== -1){
          saveRateStr = saveDataRate
          updatedSelectedList.push(data_product)
        } else {
          saveRateStr = "0.0"
        }
        rate = parseFloat(saveRateStr)
        if (isNaN(rate) === false) {
          updateSaveDataRate(this.props.saveNamespace,data_product,rate)
        }
      }
    }
    this.setState({selectedDataProducts:updatedSelectedList})
    if (this.save_data_nav_enabled){
      rate = parseFloat(this.saveDataRate)
      if (isNaN(rate) === false) {
        const nsStrList = this.props.saveNamespace.split("/")
        const baseNamespace = nsStrList[0] + "/" + nsStrList[1] + "/nav_pose_mgr"
        updateSaveDataRate(baseNamespace,"nav_pose",rate)
      }
    }
  }


  updateSelectedDataProducts() {
    const NamesList = this.state.saveNamesList
    const RatesList = this.state.saveRatesList
    var selectedList = []
    var name = ""
    for (let ind = 0; ind < NamesList.length; ind++){
      name = NamesList[ind]
      if (name !== "NONE" && name !== "ALL"){
        if (parseFloat(RatesList[ind]) > 0) {
          selectedList.push(NamesList[ind])
        }
      }
    }
    this.setState({selectedDataProducts:selectedList})
  }

  getSelectedDataProducts(){
    const list =  this.state.selectedDataProducts
    return list
  }

  doNothing(){
    var ret = false
    return ret
  }
 
  onToggleDataProductSelection(event){
    const data_product = event.target.getAttribute("data-product")
    var selectedList = this.getSelectedDataProducts()
    const ind = selectedList.indexOf(data_product)
    if ( ind !== -1 ){
      delete selectedList[ind]
    } else {
      selectedList.push(data_product)
    }
    this.setState({selectedDataProducts:selectedList})
    this.sendSaveRateUpdates()
  }

  getSaveDataValue(){
    const saveData = (this.state.saveDataEnabled === true)
    return saveData
  }

  onChangeBoolSaveDataValue(){
    const {updateSaveDataEnable}  = this.props.ros
    const enabled = (this.state.saveDataEnabled === false)
    const saveNavEnabled = (this.state.saveDataNavEnabled === true)
    this.sendSaveRateUpdates()
    updateSaveDataEnable(this.props.saveNamespace,enabled)
    if (saveNavEnabled === true){
      const nsStrList = this.props.saveNamespace.split("/")
      const navNamespace = "/" + nsStrList[1] + "/" + nsStrList[2] + "/nav_pose_mgr"
      updateSaveDataEnable(navNamespace,enabled)
    }

  }

  getSaveDataNavValue(){
    const saveDataNav = (this.state.saveDataNavEnabled === true)
    return saveDataNav
  }

  onChangeBoolSaveDataNavValue(){
    const enabled = (this.state.saveDataNavEnabled === false)
    this.setState({saveDataNavEnabled:enabled})
  }



  onUpdateInputSaveDataRateValue(event) {
    this.setState({ saveDataRate: event.target.value })
    document.getElementById("input_rate").style.color = Styles.vars.colors.red
    this.render()
  }

  onKeySaveInputSaveDataRateValue(event) {
    if(event.key === 'Enter'){
      const rate = parseFloat(event.target.value)
      if (isNaN(rate)){
        this.setState({saveDataRate: "0.0"})
      } else {
        this.setState({saveDataRate: event.target.value })
        this.sendSaveRateUpdates()
      }
      document.getElementById("input_rate").style.color = Styles.vars.colors.black
    }
  }

  onUpdateInputSaveDataPrefixValue(event) {
    this.setState({ saveDataPrefix: event.target.value })
    document.getElementById("input_prefix").style.color = Styles.vars.colors.red
    this.render()
  }

  onKeySaveInputSaveDataPrefixValue(event) {
    const { updateSaveDataPrefix} = this.props.ros
    const key = event.key
    const value = event.target.value
    const navEnabled = (this.state.saveDataNavEnabled === true)
    if(key === 'Enter'){
      document.getElementById("input_prefix").style.color = Styles.vars.colors.black
      updateSaveDataPrefix(this.props.saveNamespace,value)
    }
    if (key === 'Enter' && navEnabled === true) {
      const nsStrList = this.props.saveNamespace.split("/")
      const navNamespace = "/" + nsStrList[1] + "/" + nsStrList[2] + "/nav_pose_mgr"
      updateSaveDataPrefix(navNamespace,value)
    }
  }
  

  convertStrListToMenuList(strList){
    var menuList = []
    for (let ind = 0; ind < strList.length; ind++){
      menuList.push(<Option>{strList[ind]}</Option>)
    } 
    return menuList
  }

  getDiskUsageRate(){
    const {systemStatusDiskRate} = this.props.ros
    return systemStatusDiskRate
  }

  render() {
    const { resetSaveDataTriggered, onSnapshotEventTriggered} = this.props.ros
    const saveDataEnabled = this.getSaveDataValue()
    const saveDataNavEnabled = this.getSaveDataNavValue()
    const dataProdcutSources = this.getSaveNamesList()
    const selectedDataProducts = this.getSelectedDataProducts()
    const diskUsage = this.getDiskUsageRate()
    
    return (
      <Section title={"Save Data"}>

         <div align={"left"} textAlign={"left"}  hidden={!this.state.show_save_data}>
        
        <Columns>
            <Column>
              <div align={"left"} textAlign={"left"}>
              <ButtonMenu>
                  <Button onClick={() => onSnapshotEventTriggered(this.props.saveNamespace)}>{"Take Snapshot"}</Button>
                </ButtonMenu>
              </div>
              <Label title={"Save Data"}>
                <Toggle
                  checked={ (saveDataEnabled === true) }
                  onClick={() => {this.onChangeBoolSaveDataValue()}}
                />
              </Label>
              <Label title={"Set Save Rate (Hz)"}>
                <Input id="input_rate" 
                    value={this.state.saveDataRate} 
                    onChange={this.onUpdateInputSaveDataRateValue} 
                    onKeyDown= {this.onKeySaveInputSaveDataRateValue} />
            </Label>

            <Label title={"Set Save Prefix"}>
              <Input id="input_prefix" 
                  value={this.state.saveDataPrefix} 
                  onChange={this.onUpdateInputSaveDataPrefixValue} 
                  onKeyDown= {this.onKeySaveInputSaveDataPrefixValue} />
            </Label>

            <Label title="Selected Message Topics">
              <div onClick={this.doNothing} style={{backgroundColor: Styles.vars.colors.grey0}}>
                <Select style={{width: "10px"}}/>
              </div>
              <div hidden={false}>
              {dataProdcutSources.map((data_product) =>
              <div onClick={this.onToggleDataProductSelection}
                style={{
                  textAlign: "center",
                  padding: `${Styles.vars.spacing.xs}`,
                  color: Styles.vars.colors.black,
                  backgroundColor: (selectedDataProducts.includes(data_product))? Styles.vars.colors.blue : Styles.vars.colors.grey0,
                  cursor: "pointer",
                  }}>
                  <body data-product={data_product} style={{color: Styles.vars.colors.black}}>{data_product}</body>
              </div>
              )}
              </div>
            </Label>
            <Label title={"Enable Nav Data Saving"}>
                <Toggle
                  checked={ (saveDataNavEnabled === true) }
                  onClick={() => {this.onChangeBoolSaveDataNavValue()}}
                />
              </Label>
            </Column>
            <Column>
              <ButtonMenu>
                <Button onClick={() => resetSaveDataTriggered(this.props.saveNamespace)}>{"Reset Save Settings"}</Button>
              </ButtonMenu>
            </Column>
          </Columns>
       
          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
          <Columns>
            <Column>
              <Label title={"Saving"}>
                <BooleanIndicator value={(this.getSaveDataValue() === true)} />
              </Label>

              <Label title={"Data Save Rate"}>
                <Input disabled value={roundWithSuffix(diskUsage, 3, "MB/s")} />
              </Label>

              <Label title={"Data Product Save Settings"}>
              </Label>

              <pre style={{ height: "200px", overflowY: "auto" }}>
                {this.getSaveConfigString()}
              </pre>
            </Column>
            <Column>
            </Column>
          </Columns>

        </div>


      </Section>
    )
  }

}
export default NepiSensorsImagingSaveData
