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
import Toggle from "react-toggle"
import { observer, inject } from "mobx-react"

import Input from "./Input"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Button, { ButtonMenu } from "./Button"
import { Option } from "./Select"
import Styles from "./Styles"

import NepiIFSaveData from "./Nepi_IF_SaveData"



import {createShortUniqueValues} from "./Utilities"

// TODO: This is redundant with the one defined in APP.js
//const IS_LOCAL = window.location.hostname === "localhost"

function roundWithSuffix(value, decimals, suffix) {
  return value && (value.toFixed(decimals) + " " + suffix)
}

@inject("ros")
@observer
class NepiDashboardData extends Component {
  constructor(props) {
    super(props)

    this.state = {
      saveSettingsFilePrefix: "",
      currDeviceId: "",
      allowFileDeletion: false,
      saveRate: this.props.ros.saveRateHz,

      viewableSaves: false,
      selected_save: 'NONE'

    }
    this.getBaseNamespace = this.getBaseNamespace.bind(this)
    this.getAllNamespace = this.getAllNamespace.bind(this)

    this.renderMgrSystemStatus = this.renderMgrSystemStatus.bind(this)
    this.renderSaveData = this.renderSaveData.bind(this)
    this.renderDeleteData = this.renderDeleteData.bind(this)

    this.onUpdateSaveRateText = this.onUpdateSaveRateText.bind(this)
    this.onKeySaveRateText = this.onKeySaveRateText.bind(this);
    this.onUpdateSaveSettingFilePrefix = this.onUpdateSaveSettingFilePrefix.bind(this)
    this.onKeySaveSettingFilePrefix = this.onKeySaveSettingFilePrefix.bind(this)
    this.onUpdateSaveSettingFileSubfolder = this.onUpdateSaveSettingFileSubfolder.bind(this)
    this.onKeySaveSettingFileSubfolder = this.onKeySaveSettingFileSubfolder.bind(this)
    this.onToggleDataDeletion = this.onToggleDataDeletion.bind(this)
    this.onToggleSaveData = this.onToggleSaveData.bind(this)
    this.onToggleSaveUTC = this.onToggleSaveUTC.bind(this)

    
  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId 
    }
    return baseNamespace
  }

  getAllNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var allNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      allNamespace = "/" + namespacePrefix + "/" + deviceId + '/save_data'
    }
    return allNamespace
  }

  renderMgrSystemStatus() {
    const {
      systemStatusDiskUsageMB,
      systemDefsDiskCapacityMB,
      diskUsagePercent
    } = this.props.ros

    return (
      <Section title={"Storage Status"}>
        <Label title={"Storage"}>
          <Input disabled value={diskUsagePercent} />
        </Label>

        <Label title={"Capacity"}>
          <Input disabled value={roundWithSuffix(systemDefsDiskCapacityMB / 1000.0, 1, "GB")} />
        </Label>

        <Label title={"Used"}>
          <Input disabled value={roundWithSuffix(systemStatusDiskUsageMB / 1000.0, 1, "GB")} />
        </Label>

      </Section>
    )
  }


  onUpdateSaveRateText(e) {
    this.setState({saveRate: e.target.value})
    document.getElementById(e.target.id).style.color = Styles.vars.colors.red
  }

  onKeySaveRateText(e) {
    const {updateSaveDataRate} = this.props.ros
    const namespace = this.getBaseNamespace()
    if(e.key === 'Enter'){
      updateSaveDataRate(namespace, 'Active', this.state.saveRate)
      document.getElementById(e.target.id).style.color = Styles.vars.colors.black
    }
  }

  onUpdateSaveSettingFilePrefix(e) {
    this.setState({ saveSettingsFilePrefix: e.target.value })
    document.getElementById("file_prefix_input").style.color = Styles.vars.colors.red
  }

  onKeySaveSettingFilePrefix(event) {
    const { sendStringMsg } = this.props.ros
    const key = event.key
    const value = event.target.value
    const namespace = this.getBaseNamespace()
    if(key === 'Enter'){
      sendStringMsg(namespace + '/save_data_prefix',value)
      document.getElementById("file_input_prefix").style.color = Styles.vars.colors.black
    }
  }

  onUpdateSaveSettingFileSubfolder(e) {
    this.setState({ saveSettingsFileSubfolder: e.target.value })
    document.getElementById("file_subfolder_input").style.color = Styles.vars.colors.red
  }

  onKeySaveSettingFileSubfolder(event) {
    const { sendStringMsg} = this.props.ros
    const key = event.key
    const value = event.target.value
    const namespace = this.getBaseNamespace()
    if(key === 'Enter'){
      sendStringMsg(namespace + '/save_data_subfolder',value)
      document.getElementById("file_input_subfolder").style.color = Styles.vars.colors.black
    }
  }


  onToggleDataDeletion(e) {
    this.setState({ allowFileDeletion: e.target.checked})
  }

  onToggleSaveData(e){
    const { onToggleSaveDataAll} = this.props.ros
    const checked = e.target.checked
    onToggleSaveDataAll(checked)
  }

  onToggleSaveUTC(e){
    const {onToggleSaveUTCAll} = this.props.ros
    const checked = e.target.checked
    onToggleSaveUTCAll(checked)
  }

  onToggleLogNavPose(e){
    const {onChangeSaveRateAll} = this.props.ros
    const checked = e.target.checked
    onChangeSaveRateAll(checked)
  }



  renderSaveData() {
    const { systemStatusDiskRate } = this.props.ros
    return (
      <Section title={"Save Data"}>
        <Label title={"Save All Data (Save all enabled data products)"}>
          <Toggle id={"toggle_save_data"} onClick={this.onToggleSaveData} />
        </Label>
        <Label title={"Save Rate (Hz)"}>
          <Input id="saveRateInput" value={this.state.saveRate} onChange={this.onUpdateSaveRateText} onKeyDown= {this.onKeySaveRateText} />
        </Label>
        <Label title={"Disk Usage Rate"}>
          <Input disabled value={roundWithSuffix(systemStatusDiskRate, 3, "MB/s")} />
        </Label>

        <Label title={"File Name Prefix"}>
          <Input
            id={"file_prefix_input"}
            value={this.state.saveSettingsFilePrefix}
            onChange={this.onUpdateSaveSettingFilePrefix}
            onKeyDown={this.onKeySaveSettingFilePrefix}
          />
        </Label>
        <Label title={"File Save Subfolder"}>
          <Input
            id={"file_subfolder_input"}
            value={this.state.saveSettingsFileSubfolder}
            onChange={this.onUpdateSaveSettingFileSubfolder}
            onKeyDown={this.onKeySaveSettingFileSubfolder}
          />
        </Label>
        <Label title={"Use UTC Timezone"}>
          <Toggle id={"toggle_utc"} onClick={this.onToggleSaveUTC} />
        </Label>

        <Label title={"Log NavPose"}>
          <Toggle id={"toggle_log_navpose"} onClick={this.onToggleLogNavPose} />
        </Label>
      </Section>
    )
  }


  renderDeleteData() {
    const { deleteAllData } = this.props.ros
    return (
      <Section title={"Delete Data"}>
        <Label title={"Allow Data Deletion"}>
          <Toggle onClick={this.onToggleDataDeletion} />
        </Label>
        <ButtonMenu>
          <Button
            onClick={deleteAllData}
            hidden={!this.state.allowFileDeletion}>
            {"Delete All Data"}
          </Button>
        </ButtonMenu>

        <pre style={{ height: "34px", overflowY: "auto" }}>
            {""}
          </pre>

        <div hidden={(this.state.allowFileDeletion)}>
        <pre style={{ height: "19px", overflowY: "auto" }}>
            {""}
          </pre>
          </div>
      </Section>
    )
  }



  //disabled={document.getElementById("toggle_save_data").value}>

  render() {

    return (
      <React.Fragment>
      <Columns>
        <Column>
        {this.renderMgrSystemStatus()}
        </Column>
        <Column>
          {this.renderSaveData()}
        </Column>
        <Column>
        {this.renderDeleteData()}
        </Column>
      </Columns>

      <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <NepiIFSaveData
        saveNamespace={this.getAllNamespace()}
        always_show_controls={true}
        make_section={true}
        />

    </React.Fragment>


    )
  }
}

export default NepiDashboardData
