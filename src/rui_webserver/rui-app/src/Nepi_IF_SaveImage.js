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
//import EnableAdjustment from "./EnableAdjustment"
import Button, { ButtonMenu } from "./Button"
import BooleanIndicator from "./BooleanIndicator"
import Toggle from "react-toggle"
import Label from "./Label"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
import Select, { Option } from "./Select"
import Input from "./Input"


import NepiIFConfig from "./Nepi_IF_Config"

function roundWithSuffix(value, decimals, suffix) {
  return value && (value.toFixed(decimals) + " " + suffix)
}

@inject("ros")
@observer

// Component that contains the Save Data Controls
class NepiIFSaveImage extends Component {
  constructor(props) {
    super(props)

    // these states track the values through the components Save Data Status messages
    this.state = {
      saveNamespace: 'None',
      capabilities: null,
      saveRatesMsg: "",
      hasNavpose: false,
      logNavPose: false,
      saveDataPrefix: "",
      saveDataSubfolder: "",
      saveUtcTz: false,
      exp_filename: "",
      saveDataEnabled: false,
      saveDataRate: "1.0",
      saveNamesList: [],
      saveRatesList: [],
      selectedDataProducts: [],

      showControls: this.props.showControls ? this.props.showControls : false,

      needs_update: true,
      saveStatusListener: null
    }


    this.updateSaveStatusListener = this.updateSaveStatusListener.bind(this)
    this.saveStatusListener = this.saveStatusListener.bind(this)

    this.updateSaveLists = this.updateSaveLists.bind(this)
    this.getSaveNamesList = this.getSaveNamesList.bind(this)
    this.getSaveRatesList = this.getSaveRatesList.bind(this)
    this.getSaveConfigString = this.getSaveConfigString.bind(this)
    this.getSaveRateValue = this.getSaveRateValue.bind(this)
    this.getSaveRateData = this.getSaveRateData.bind(this)
    this.onClickToggleShowSettings = this.onClickToggleShowSettings.bind(this)


    this.getSaveDataValue = this.getSaveDataValue.bind(this)
    this.getSaveNavValue = this.getSaveNavValue.bind(this)
    this.getSaveNavRate = this.getSaveNavRate.bind(this)
    this.onChangeBoolSaveDataValue = this.onChangeBoolSaveDataValue.bind(this)
    this.onChangeBoolSaveNavValue = this.onChangeBoolSaveNavValue.bind(this)
    this.onChangeBoolUtcTzValue = this.onChangeBoolUtcTzValue.bind(this)
    this.onUpdateInputSaveDataRateValue = this.onUpdateInputSaveDataRateValue.bind(this)
    this.onKeySaveInputSaveDataRateValue = this.onKeySaveInputSaveDataRateValue.bind(this)
    this.onUpdateInputSaveDataPrefixValue = this.onUpdateInputSaveDataPrefixValue.bind(this)
    this.onKeySaveInputSaveDataPrefixValue = this.onKeySaveInputSaveDataPrefixValue.bind(this)
    this.onUpdateInputSaveDataSubfolderValue = this.onUpdateInputSaveDataSubfolderValue.bind(this)
    this.onKeySaveInputSaveDataSubfolderValue = this.onKeySaveInputSaveDataSubfolderValue.bind(this)
    this.onToggleDataProductSelection = this.onToggleDataProductSelection.bind(this)
    this.sendSaveRateUpdate = this.sendSaveRateUpdate.bind(this)
    
    this.updateSelectedDataProducts = this.updateSelectedDataProducts.bind(this)
    this.getSelectedDataProducts = this.getSelectedDataProducts.bind(this)
    this.getDiskUsageRate = this.getDiskUsageRate.bind(this)

    this.updateCapabilities = this.updateCapabilities.bind(this)

    this.convertStrListToMenuList = this.convertStrListToMenuList.bind(this)
    
    this.doNothing = this.doNothing.bind(this)

    this.onSnapshotTriggered = this.onSnapshotTriggered.bind(this)

  }

  // CAllback for handling ROS Status messages
  saveStatusListener(message) {
    const do_updates = ((this.state.saveDirPrefix !== message.filename_prefix) ||  (this.state.saveDataSubfolder !== message.save_subfolder))

    this.setState({
      saveRatesMsg: message.save_data_rates,
      logNavPose: message.log_navpose_enabled,
      saveUtcTz: message.save_data_utc,
      exp_filename: message.example_filename,
      saveDataEnabled: message.save_data_enabled
    })

    if (do_updates === true) {
      this.setState({
        saveDataPrefix: message.filename_prefix,
        saveDataSubfolder: message.save_subfolder,
      })
    }
    this.updateSaveLists()
    this.updateSelectedDataProducts()
  }

  // Function for configuring and subscribing to Status
  updateSaveStatusListener() {
    const saveNamespace = this.props.saveNamespace 
    if (this.state.saveStatusListener) {
      this.state.saveStatusListener.unsubscribe()
    }
    if (saveNamespace !== 'None'){
      var saveStatusListener = this.props.ros.setupSaveDataStatusListener(
            saveNamespace,
            this.saveStatusListener
          )
      this.setState({ saveNamespace: saveNamespace})
      this.setState({ saveStatusListener: saveStatusListener,
        needs_update: false})
    }
  }

  // Lifecycle method cAlled when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const saveNamespace = this.props.saveNamespace ? this.props.saveNamespace : 'None'
    const namespace_updated = (prevState.saveNamespace !== saveNamespace && saveNamespace !== 'None')
  
    if ((namespace_updated) && !saveNamespace.includes("null")) {
      this.updateSaveStatusListener()
    }
  }

  // Lifecycle method cAlled just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.saveStatusListener) {
      this.state.saveStatusListener.unsubscribe()
    }
  }



  // Function for creating settings options list from capabilities
  updateCapabilities() {
    const {saveDataCaps} = this.props.ros
    const saveNamespace = this.props.saveNamespace
    var capabilities = null
    if (saveDataCaps){
      capabilities = saveDataCaps[saveNamespace]
    }    
    if (capabilities != null && this.state.saveNamespace !== saveNamespace){
      this.setState({
        capabilities: capabilities,
        hasNavpose: capabilities.hasNavpose
      })
    }
    else if (capabilities == null) {
      this.setState({
        capabilities: null,
      })
    }
    this.setState({saveNamespace:  saveNamespace})
  }


  // Function for creating configs options list from capabilities
  updateSaveLists() {
    var saveRatesMsg = this.state.saveRatesMsg
    var NamesList = []
    var RatesList = []
    var name = ""
    var rate_int = 0
    var rate_str = ""
    var saveRateMsg = null
    // add None and All options to lists
    NamesList.push("None")
    RatesList.push("0.0")
    NamesList.push("All")
    RatesList.push(this.state.saveDataRate)
    for (let ind = 0; ind < saveRatesMsg.length; ind++){
        saveRateMsg =saveRatesMsg[ind]
        name = saveRateMsg.data_product
        rate_int = saveRateMsg.save_rate_hz
        rate_str = rate_int.toFixed(2)
        NamesList.push(name)
        RatesList.push(rate_str)
    }
    this.setState({saveNamesList:NamesList})
    this.setState({saveRatesList:RatesList})
  }

  onClickToggleShowSettings(){
    const currentVal = this.state.showControls 
    this.setState({showControls: !currentVal})
    this.render()
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
      if (namesList[ind] !== "None" && namesList[ind] !== "All" ){
        entryStr = namesList[ind] + " : " + ratesList[ind] +  " Hz\n"
        configsStrList.push(entryStr)
      }
    }
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

  sendSaveRateUpdate(data_product,rate) {
    const {updateSaveDataRate}  = this.props.ros
    if (isNaN(rate) === false){
      updateSaveDataRate(this.state.saveNamespace,data_product,rate)
    }
  }

  updateSelectedDataProducts() {
    const NamesList = this.state.saveNamesList
    const RatesList = this.state.saveRatesList
    var selectedList = []
    var name = ""
    for (let ind = 0; ind < NamesList.length; ind++){
      name = NamesList[ind]
      if (name !== "None" && name !== "All"){
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
    const saveDataRate = this.state.saveDataRate
    const rate = parseFloat(saveDataRate)
    const ind = selectedList.indexOf(data_product)
    if ( ind !== -1 ){
      delete selectedList[ind]
      this.sendSaveRateUpdate(data_product,0.0)
    } else {
      selectedList.push(data_product)
      this.sendSaveRateUpdate(data_product,rate)
    }
  }

  getSaveDataValue(){
    const saveData = (this.state.saveDataEnabled === true)
    return saveData
  }


  getSaveNavValue(){
    const saveData = (this.state.saveDataEnabled === true)
    return saveData
  }

  getSaveNavRate(){
    const saveData = (this.state.saveDataEnabled === true)
    return saveData
  }

  onChangeBoolSaveDataValue(){
    const {sendBoolMsg}  = this.props.ros
    const enabled = (this.state.saveDataEnabled === false)
    const saveDataRate = this.state.saveDataRate
    const rate = parseFloat(saveDataRate)
    this.sendSaveRateUpdate('Active',rate)
    sendBoolMsg(this.state.saveNamespace + '/save_data_enable',enabled)

  }

  onChangeBoolSaveNavValue(){
    const {sendBoolMsg}  = this.props.ros
    const enabled = (this.state.logNavPose === false)
    const saveDataRate = this.state.saveDataRate
    const rate = parseFloat(saveDataRate)
    this.sendSaveRateUpdate('Active',rate)
    sendBoolMsg(this.state.saveNamespace + '/log_navpose_enable',enabled)

  }


  onChangeBoolUtcTzValue(e){
    const {sendBoolMsg}  = this.props.ros
    const enabled = e.target.checked
    sendBoolMsg(this.state.saveNamespace + '/save_data_utc',enabled)
  }


  onUpdateInputSaveDataRateValue(event) {
    this.setState({ saveDataRate: event.target.value })
    document.getElementById("input_rate").style.color = Styles.vars.colors.red
    this.render()
  }

  onKeySaveInputSaveDataRateValue(event) {
    const saveDataRate = this.state.saveDataRate
    //Unused const rate = parseFloat(saveDataRate)
    if(event.key === 'Enter'){
      const rate = parseFloat(event.target.value)
      if (!isNaN(rate)){
        this.setState({saveDataRate: event.target.value })
        this.sendSaveRateUpdate('Active',rate)
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
    const { sendStringMsg} = this.props.ros
    const key = event.key
    const value = event.target.value
    if(key === 'Enter'){
      sendStringMsg(this.state.saveNamespace + '/save_data_prefix',value)
      document.getElementById("input_prefix").style.color = Styles.vars.colors.black
    }
  }

  onUpdateInputSaveDataSubfolderValue(event) {
    this.setState({ saveDataSubfolder: event.target.value })
    document.getElementById("input_subfolder").style.color = Styles.vars.colors.red
    this.render()
  }

  onKeySaveInputSaveDataSubfolderValue(event) {
    const { sendStringMsg} = this.props.ros
    const key = event.key
    const value = event.target.value
    if(key === 'Enter'){
      sendStringMsg(this.state.saveNamespace + '/save_data_subfolder',value)
      document.getElementById("input_subfolder").style.color = Styles.vars.colors.black
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


  onSnapshotTriggered(){
    const { sendTriggerMsg} = this.props.ros
    sendTriggerMsg(this.state.saveNamespace + '/snapshot_trigger')
  }

  render() {
    const saveDataEnabled = this.getSaveDataValue()
    const saveNavEnabled = this.getSaveNavValue()
    const saveNavRate = this.getSaveNavRate()
    const diskUsage = this.getDiskUsageRate()
    const saveNamespace = this.state.saveNamespace ? this.state.saveNamespace : 'None'
    const show_save_options = (this.props.show_save_options != undefined) ? this.props.show_save_options : false

    
    return (

      <React.Fragment>
                    <div style={{ display: 'flex' }}>


                        <div style={{ width: '15%' }}>

                          <Input disabled value={roundWithSuffix(diskUsage, 3, "MB/s")} />

                        </div>

                        <div style={{ width: '10%' }}>
                          {}
                        </div>

            

                        <div style={{ width: '10%' }}>
                          {}
                        </div>


                        <div style={{ width: '10%' }}>
                          {}
                        </div>

                        <div style={{ width: '10%' }}>
                          {}
                        </div>



                        <div style={{ width: '10%' }}>
                           
                             <Label title={"Save Data"}>
                            <Toggle
                              checked={ (saveDataEnabled === true) }
                              onClick={() => {this.onChangeBoolSaveDataValue()}}
                            />
                          </Label>

                        </div>



                        <div style={{ width: '10%' }}>
                          {}
                        </div>


                       <div style={{ width: '10%' }}>

                       <ButtonMenu >
                        <Button onClick={this.onSnapshotTriggered}>{"Take Snapshot"}</Button>
                      </ButtonMenu>

                        </div>

                  </div>





                    <div style={{ display: 'flex' }} hidden={show_save_options === false}>


                        <div style={{ width: '25%' }}>

                            <Label title={"Set Save Prefix"}>
                              <Input id="input_prefix" 
                                  value={this.state.saveDataPrefix} 
                                  onChange={this.onUpdateInputSaveDataPrefixValue} 
                                  onKeyDown= {this.onKeySaveInputSaveDataPrefixValue} />
                            </Label>

                        </div>


                        <div style={{ width: '5%' }}>
                          {}
                        </div>

                        <div style={{ width: '25%' }}>

                                <Label title={"Set Save Subfolder"}>
                                  <Input id="input_subfolder" 
                                      value={this.state.saveDataSubfolder} 
                                      onChange={this.onUpdateInputSaveDataSubfolderValue} 
                                      onKeyDown= {this.onKeySaveInputSaveDataSubfolderValue} />
                                </Label>

                        </div>

                        <div style={{ width: '10%' }}>
                          {}
                        </div>

                        <div style={{ width: '15%' }} hidden={this.state.hasNavpose === false}>
                            <Label title={"Log NavPose"}>
                                <Toggle
                                  checked={ (this.state.logNavPose === true) }
                                  onClick={() => {this.onChangeBoolSaveNavValue()}}
                                />
                              </Label>

                        </div>

                        <div style={{ width: '5%' }}>
                          {}
                        </div>
            
                        <div style={{ width: '20%' }}>
                        <Label title={"Set Save Rate (Hz)"}>
                            <Input id="input_rate" 
                                value={this.state.saveDataRate} 
                                onChange={this.onUpdateInputSaveDataRateValue} 
                                onKeyDown= {this.onKeySaveInputSaveDataRateValue} />
                        </Label>

                        </div>




                 
                  </div>


      </React.Fragment>
    )
  }

}
export default NepiIFSaveImage
