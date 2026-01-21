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

import {onChangeSwitchStateValue} from "./Utilities"

import NepiIFConfig from "./Nepi_IF_Config"

function roundWithSuffix(value, decimals, suffix) {
  return value && (value.toFixed(decimals) + " " + suffix)
}

@inject("ros")
@observer

// Component that contains the Save Data Controls
class NepiIFSaveData extends Component {
  constructor(props) {
    super(props)

    // these states track the values through the components Save Data Status messages
    this.state = {
      saveNamespace: 'None',
      saveRatesMsg: "",
      hasNavpose: false,
      logNavEnabled: false,
      logNavRate: 0.0,
      saveDataPrefix: "",
      saveDataSubfolder: "",
      saveUtcTz: false,
      exp_filename: "",
      saveDataEnabled: false,
      saveDataRate: "1.0",
      saveNamesList: [],
      saveRatesList: [],
      selectedDataProducts: [],
      saveAll: false,

      show_active_settings: true,

      showControls: this.props.showControls ? this.props.showControls : false,

      needs_update: true,
      saveStatusListener: null
    }

    this.getAllNamespace = this.getAllNamespace.bind(this)
    this.updateSaveStatusListener = this.updateSaveStatusListener.bind(this)
    this.saveStatusListener = this.saveStatusListener.bind(this)

    this.updateSaveLists = this.updateSaveLists.bind(this)
    this.getSaveNamesList = this.getSaveNamesList.bind(this)
    this.getSaveRatesList = this.getSaveRatesList.bind(this)
    this.getSaveConfigString = this.getSaveConfigString.bind(this)
    this.getActiveConfigString = this.getActiveConfigString.bind(this)
    this.getSaveRateValue = this.getSaveRateValue.bind(this)
    this.getSaveRateData = this.getSaveRateData.bind(this)
    this.onClickToggleShowSettings = this.onClickToggleShowSettings.bind(this)


    this.getSaveDataValue = this.getSaveDataValue.bind(this)
    this.onChangeBoolSaveDataValue = this.onChangeBoolSaveDataValue.bind(this)
    this.onChangeBoolLogNavValue = this.onChangeBoolLogNavValue.bind(this)
    this.onChangeBoolUtcTzValue = this.onChangeBoolUtcTzValue.bind(this)
    this.onUpdateSaveDataRateValue = this.onUpdateSaveDataRateValue.bind(this)
    this.onKeySaveDataRateValue = this.onKeySaveDataRateValue.bind(this)
    this.onUpdateLogNavRateValue = this.onUpdateLogNavRateValue.bind(this)
    this.onKeyLogNavRateValue = this.onKeyLogNavRateValue.bind(this)
    this.onUpdateInputSaveDataPrefixValue = this.onUpdateInputSaveDataPrefixValue.bind(this)
    this.onKeySaveInputSaveDataPrefixValue = this.onKeySaveInputSaveDataPrefixValue.bind(this)
    this.onUpdateInputSaveDataSubfolderValue = this.onUpdateInputSaveDataSubfolderValue.bind(this)
    this.onKeySaveInputSaveDataSubfolderValue = this.onKeySaveInputSaveDataSubfolderValue.bind(this)
    this.onToggleDataProductSelection = this.onToggleDataProductSelection.bind(this)
    this.sendSaveRateUpdate = this.sendSaveRateUpdate.bind(this)
    this.sendLogRateUpdate = this.sendLogRateUpdate.bind(this)
    
    this.updateSelectedDataProducts = this.updateSelectedDataProducts.bind(this)
    this.getSelectedDataProducts = this.getSelectedDataProducts.bind(this)
    this.getDiskUsageRate = this.getDiskUsageRate.bind(this)


    this.convertStrListToMenuList = this.convertStrListToMenuList.bind(this)
    
    this.doNothing = this.doNothing.bind(this)

    this.onSnapshotTriggered = this.onSnapshotTriggered.bind(this)
    this.renderSaveData = this.renderSaveData.bind(this)

  }

  getAllNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var allNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      allNamespace = "/" + namespacePrefix + "/" + deviceId + '/save_data'
    }
    return allNamespace
  }

  // CAllback for handling ROS Status messages
  saveStatusListener(message) {
    const do_updates = ((this.state.saveDirPrefix !== message.filename_prefix) ||  (this.state.saveDataSubfolder !== message.save_subfolder))

    this.setState({
      saveRatesMsg: message.save_data_rates,
      logNavEnabled: message.log_navposes_enabled,
      logNavRate: message.log_navposes_rate,
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
    const allNamespace = this.getAllNamespace()
    const saveAll = this.state.saveAll
    const propNamespace = this.props.saveNamespace ? this.props.saveNamespace : 'None'
    const saveNamespace = (saveAll === true) ? allNamespace : propNamespace
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
    const allNamespace = this.getAllNamespace()
    const saveAll = this.state.saveAll
    const propNamespace = this.props.saveNamespace ? this.props.saveNamespace : 'None'
    const saveNamespace = (saveAll === true) ? allNamespace : propNamespace
    const namespace_updated = (prevState.saveNamespace !== saveNamespace && saveNamespace !== 'None')
  
    if ((namespace_updated) && !saveNamespace.includes("null") ) {
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




  // Function for creating configs options list from status msg
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
    const {saveDataNamespaces , saveDataCaps} = this.props.ros
    const { namespacePrefix, deviceId} = this.props.ros
    const base_namespace = '/' + namespacePrefix + '/' + deviceId + '/'
    const allNamespace = this.getAllNamespace()
    const saveNamespace = this.state.saveNamespace
    const isAllNamespace = (saveNamespace === allNamespace)
    var topic = ''
    var topic_name = ''
    var namesList = []
    var ratesList = []
    var configsStr = ""
    var entryStr
    var configsStrList = [""]
    if (isAllNamespace === true){
      for (let i = 0; i < saveDataNamespaces.length; i++) {
        topic = saveDataNamespaces[i]
        topic_name = topic.replace
        namesList = []
        ratesList = []
        for (let i2 = 0; i2 < saveDataCaps.length; i2++) {
            namesList = saveDataCaps[i2].data_product
            ratesList = saveDataCaps[i2].save_rate_hz

            for (let ind = 0; ind < namesList.length; ind++) {
              if (topic !== "None" && topic !== allNamespace ){
                
                  entryStr = namesList[ind] + " : " + ratesList[ind] +  " Hz\n"
                  configsStrList.push(entryStr)
                
              }
            }
        }
      }
    } 
    else {

      namesList = this.state.saveNamesList
      ratesList = this.state.saveRatesList

      for (let ind = 0; ind < namesList.length; ind++) {
        if (namesList[ind] !== "None" && namesList[ind] !== "All" ){
         
            entryStr = namesList[ind] + " : " + ratesList[ind] +  " Hz\n"
            configsStrList.push(entryStr)
        
        }
      }
    }
    configsStr = configsStrList.join("")
    return configsStr
  }



  getActiveConfigString() {
    const {saveDataNamespaces , saveDataCaps} = this.props.ros
    const { namespacePrefix, deviceId} = this.props.ros
    const base_namespace = '/' + namespacePrefix + '/' + deviceId + '/'
    const allNamespace = this.getAllNamespace()
    const saveNamespace = this.state.saveNamespace
    const isAllNamespace = (saveNamespace === allNamespace)
    var topic = ''
    var topic_name = ''
    var namesList = []
    var ratesList = []
    var configsStr = ""
    var entryStr
    var configsStrList = [""]
    if (isAllNamespace === true){
      for (let i = 0; i < saveDataNamespaces.length; i++) {
        topic = saveDataNamespaces[i]
        topic_name = topic.replace
        namesList = []
        ratesList = []
        for (let i2 = 0; i2 < saveDataCaps.length; i2++) {
            namesList = saveDataCaps[i2].data_product
            ratesList = saveDataCaps[i2].save_rate_hz

            for (let ind = 0; ind < namesList.length; ind++) {
              if (topic !== "None" && topic !== allNamespace ){
                if (ratesList[ind] > 0){
                  entryStr = namesList[ind] + " : " + ratesList[ind] +  " Hz\n"
                  configsStrList.push(entryStr)
                }
              }
            }
        }
      }
    } 
    else {

      namesList = this.state.saveNamesList
      ratesList = this.state.saveRatesList

      for (let ind = 0; ind < namesList.length; ind++) {
        if (namesList[ind] !== "None" && namesList[ind] !== "All" ){
          if (ratesList[ind] > 0){
            entryStr = namesList[ind] + " : " + ratesList[ind] +  " Hz\n"
            configsStrList.push(entryStr)
          }
        }
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

sendLogRateUpdate(rate) {
    const {sendFloatMsg}  = this.props.ros
    if (isNaN(rate) === false){
      sendFloatMsg(this.state.saveNamespace + '/log_navposes_rate',rate)
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

  onChangeBoolSaveDataValue(){
    const {sendBoolMsg}  = this.props.ros
    const saveAll = this.state.saveAll
    const allNamespace = this.getAllNamespace()
    const enabled = (this.state.saveDataEnabled === false)
    const saveDataRate = this.state.saveDataRate
    const rate = parseFloat(saveDataRate)
    if ((saveAll === false) && (this.state.saveNamespace !== allNamespace)) {
      this.sendSaveRateUpdate('Active',rate)
      sendBoolMsg(this.state.saveNamespace + '/save_data_enable',enabled)
    }
    else {
      sendBoolMsg(allNamespace + '/save_data_enable',enabled)
    }

  }

  onChangeBoolLogNavValue(){
    const {sendBoolMsg}  = this.props.ros
    const enabled = (this.state.logNavEnabled === false)
    const logNavRate = this.state.logNavRate
    const rate = parseFloat(logNavRate)
    this.sendLogRateUpdate(rate)
    sendBoolMsg(this.state.saveNamespace + '/log_navposes_enable',enabled)

  }


  onChangeBoolUtcTzValue(e){
    const {sendBoolMsg}  = this.props.ros
    const enabled = e.target.checked
    sendBoolMsg(this.state.saveNamespace + '/save_data_utc',enabled)
  }


  onUpdateSaveDataRateValue(event) {
    this.setState({ saveDataRate: event.target.value })
    document.getElementById("save_rate").style.color = Styles.vars.colors.red
    this.render()
  }

  onKeySaveDataRateValue(event) {
    const saveDataRate = this.state.saveDataRate
    //Unused const rate = parseFloat(saveDataRate)
    if(event.key === 'Enter'){
      const rate = parseFloat(event.target.value)
      if (!isNaN(rate)){
        this.setState({saveDataRate: event.target.value })
        this.sendSaveRateUpdate('Active',rate)
      }
      document.getElementById("save_rate").style.color = Styles.vars.colors.black
    }
  }



  onUpdateLogNavRateValue(event) {
    this.setState({ saveDataRate: event.target.value })
    document.getElementById("log_rate").style.color = Styles.vars.colors.red
    this.render()
  }

  onKeyLogNavRateValue(event) {
    const saveDataRate = this.state.saveDataRate
    //Unused const rate = parseFloat(saveDataRate)
    if(event.key === 'Enter'){
      const rate = parseFloat(event.target.value)
      if (!isNaN(rate)){
        this.setState({saveDataRate: event.target.value })
        this.sendSaveRateUpdate('Active',rate)
      }
      document.getElementById("log_rate").style.color = Styles.vars.colors.black
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
    
    const saveAll = this.state.saveAll
    const allNamespace = this.getAllNamespace()
    if ((saveAll === false) && (this.state.saveNamespace !== allNamespace)) {
      sendTriggerMsg(this.state.saveNamespace + '/snapshot_trigger')
    }
    else {
      sendTriggerMsg(allNamespace + '/snapshot_trigger')
    }
  }

  renderSaveData() {

    const saveNamespace = this.state.saveNamespace ? this.state.saveNamespace : 'None'
    const saveDataEnabled = this.getSaveDataValue()
    const isNavposeMgr = (saveNamespace.indexOf('navpose_mgr') !== -1)
    const allNamespace = this.getAllNamespace()
    const isAllNamespace = (saveNamespace === allNamespace)
    const dataProdcutSources = this.getSaveNamesList()
    const selectedDataProducts = this.getSelectedDataProducts()
    const diskUsage = this.getDiskUsageRate()
    const saveUtcTz = this.state.saveUtcTz


    const always_show_controls = (this.props.always_show_controls != undefined) ? this.props.always_show_controls : false
    if (always_show_controls === true){
      this.setState({showControls: true})
    }
    
    const showControls = this.state.showControls
    const saveAll = this.state.saveAll
    const show_active_settings = this.state.show_active_settings
    return (

      <React.Fragment>
                    <div style={{ display: 'flex' }}>


                        <div style={{ width: '15%' }}>
                              <div  hidden={always_show_controls === true}>
                                <Label title="Save Controls">
                                <Toggle
                                  checked={showControls===true}
                                  onClick={() => onChangeSwitchStateValue.bind(this)("showControls",showControls)}>
                                </Toggle>
                            </Label>
                            </div>
                        </div>

                        <div style={{ width: '5%' }}>
                          {}
                        </div>


                        <div style={{ width: '15%' }}>
                              <div  hidden={isAllNamespace === true}>
                                      <Label title="Save All">
                                      <Toggle
                                        checked={saveAll===true}
                                        onClick={() => onChangeSwitchStateValue.bind(this)("saveAll",saveAll)}>
                                      </Toggle>
                                  </Label>
                              </div>
                        </div>

                        <div style={{ width: '5%' }}>
                          {}
                        </div>


                        <div style={{ width: '15%' }}>
                          <Input disabled value={roundWithSuffix(diskUsage, 3, "MB/s")} />
                        </div>

                         

                        <div style={{ width: '10%' }}>
                          {}
                        </div>

            

                        <div style={{ width: '15%' }}>
                          <Label title={"Save"}>
                            <Toggle
                              checked={ (saveDataEnabled === true) }
                              onClick={() => {this.onChangeBoolSaveDataValue()}}
                            />
                          </Label>
                        </div>


                        <div style={{ width: '5%' }}>
                          {}
                        </div>


                        <div style={{ width: '15%' }}>
                           
                       <ButtonMenu >
                        <Button onClick={this.onSnapshotTriggered}>{"Snapshot"}</Button>
                      </ButtonMenu>

                        </div>

                  </div>



            <div align={"left"} textAlign={"left"} hidden={this.state.showControls === false}>

                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
              
                <Columns>
                  <Column>


                          <Label title={"Set Save Rate (Hz)"}>
                            <Input id="save_rate" 
                                value={this.state.saveDataRate} 
                                onChange={this.onUpdateSaveDataRateValue} 
                                onKeyDown= {this.onKeySaveDataRateValue} />
                        </Label>

                        <Label title={"Set Save Prefix"}>
                          <Input id="input_prefix" 
                              value={this.state.saveDataPrefix} 
                              onChange={this.onUpdateInputSaveDataPrefixValue} 
                              onKeyDown= {this.onKeySaveInputSaveDataPrefixValue} />
                        </Label>


                        <Label title={"Set Save Subfolder"}>
                          <Input id="input_subfolder" 
                              value={this.state.saveDataSubfolder} 
                              onChange={this.onUpdateInputSaveDataSubfolderValue} 
                              onKeyDown= {this.onKeySaveInputSaveDataSubfolderValue} />
                        </Label>


                        <Label title={"Use UTC Time"}>
                            <Toggle
                              checked={ (saveUtcTz) }
                              onClick={this.onChangeBoolUtcTzValue}
                            />
                          </Label>

                  <div  hidden={isAllNamespace === true}>
                        <Label title={"Selected Message Topics"}>
                          <div onClick={this.doNothing} style={{backgroundColor: Styles.vars.colors.grey0}}>
                            <Select style={{width: "10px"}}/>
                          </div>

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
                        </Label>

                        <div hidden={((isNavposeMgr === true) )}>

                                <Label title={"Log NavPose"}>
                                  <Toggle
                                    checked={ (this.state.logNavEnabled === true) }
                                    onClick={() => {this.onChangeBoolLogNavValue()}}
                                  />
                                </Label>

                                <Label title={"Log Nav Rate (Hz)"}>
                                  <Input id="log_rate" 
                                      value={this.state.logNavRate} 
                                      onChange={this.onUpdateLogNavRateValue} 
                                      onKeyDown= {this.onKeyLogNavRateValue} />
                              </Label>

                        </div>

                  </div>



              

                  </Column>
                  <Column>

                        <Label title={""}>
                        </Label>
                        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                        <Label title={"Saving"}>
                          <BooleanIndicator value={(saveDataEnabled === true)} />
                        </Label>


                        <Label title={"Example Filename"}>
                        </Label>

                        <pre style={{ height: "100px", overflowY: "auto" }}>
                          {this.state.exp_filename}
                        </pre>

                        <Label title="Filter Active">
                            <Toggle
                              checked={show_active_settings===true}
                              onClick={() => onChangeSwitchStateValue.bind(this)("show_active_settings",show_active_settings)}>
                            </Toggle>
                        </Label>

                  <div  hidden={show_active_settings === true}>



                        <Label title={"All Data Save Settings"}>
                        </Label>

                        <pre style={{ height: "400px", overflowY: "auto" }}>
                          {this.getSaveConfigString()}
                        </pre>

              </div>


                  <div  hidden={show_active_settings === false}>


                        <Label title={"Active Data Save Settings"}>
                        </Label>

                        <pre style={{ height: "400px", overflowY: "auto" }}>
                          {this.getActiveConfigString()}
                        </pre>

              </div>


                  </Column>
                </Columns>



                <div align={"left"} textAlign={"left"} hidden={saveNamespace === 'None' || isAllNamespace === true}>

                <NepiIFConfig
                      namespace={saveNamespace}
                      title={"Nepi_IF_Config"}
                />

                </div>




              <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>


          </div>
          


      </React.Fragment>
    )
  }

  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const saveNamespace = this.state.saveNamespace
    if (saveNamespace === 'None'){
      return (
        <Columns>
        <Column>

        </Column>
        </Columns>
      )
    }
    else if (make_section === false){
      return (
        <Columns>
        <Column>
        {this.renderSaveData()}
        </Column>
        </Columns>
      )
    }
    else {
      return (

      <Section>

        {this.renderSaveData()}

      </Section>
      )

    }
  }


}

export default NepiIFSaveData
