/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */
import React, { Component } from "react"
import Toggle from "react-toggle"
import { observer, inject } from "mobx-react"

import Input from "./Input"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Button, { ButtonMenu } from "./Button"
import BooleanIndicator from "./BooleanIndicator"
import Styles from "./Styles"

// TODO: This is redundant with the one defined in APP.js
const IS_LOCAL = window.location.hostname === "localhost"

function roundWithSuffix(value, decimals, suffix) {
  return value && (value.toFixed(decimals) + " " + suffix)
}

@inject("ros")
@observer
class NepiDashboard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      saveSettingsFilePrefix: "",
      currDeviceId: "",
      allowFileDeletion: false,
      saveFreq: this.props.ros.saveFreqHz
    }

    this.onUpdateSaveFreqText = this.onUpdateSaveFreqText.bind(this)
    this.onKeySaveFreqText = this.onKeySaveFreqText.bind(this);
    this.renderDeviceInfo = this.renderDeviceInfo.bind(this)
    this.renderSystemClock = this.renderSystemClock.bind(this)
    this.renderSystemStatus = this.renderSystemStatus.bind(this)
    this.renderSystemMessages = this.renderSystemMessages.bind(this)
    this.renderSaveData = this.renderSaveData.bind(this)
    this.onUpdateSaveSettingFilePrefix = this.onUpdateSaveSettingFilePrefix.bind(this)
    this.onKeySaveSettingFilePrefix = this.onKeySaveSettingFilePrefix.bind(this)
    this.onToggleDataDeletion = this.onToggleDataDeletion.bind(this)
  }

  onUpdateSaveFreqText(e) {
    this.setState({saveFreq: e.target.value})
    document.getElementById(e.target.id).style.color = Styles.vars.colors.red
  }

  onKeySaveFreqText(e) {
    const {onChangeSaveFreq} = this.props.ros
    if(e.key === 'Enter'){
      onChangeSaveFreq(this.state.saveFreq)
      document.getElementById(e.target.id).style.color = Styles.vars.colors.black
    }
  }

  renderDeviceInfo() {
    const {
      deviceType,
      deviceId,
      deviceSerial,
      systemDefsFirmwareVersion,
    } = this.props.ros
    return (
      <Section title={"Device Info"}>
        <Label title={"Type"}>
          <Input disabled value={deviceType} />
        </Label>
        <Label title={"Device ID"}>
          <Input disabled value={deviceId} />
        </Label>
        <Label title={"Serial Number"}>
          <Input disabled value={deviceSerial} />
        </Label>
        <Label title={"Firmware"}>
          <Input disabled value={systemDefsFirmwareVersion} />
        </Label>
      </Section>
    )
  }

  renderdeviceInfo() {
    const {
      deviceConnected,
      deviceType,
      deviceFirmwareVersion,
      eggFirmwareVersion,
    } = this.props.ros
    return (
      <Section title={"device Info"}>
        <Label title={"Connected"}>
          <BooleanIndicator value={deviceConnected} />
        </Label>
        <Label title={"Type"}>
          <Input disabled value={deviceType} />
        </Label>
        <Label title={"Firmware"}>
          <Input disabled value={deviceFirmwareVersion} />
        </Label>
        <Label title={"Sensor Firmware"}>
          <Input disabled value={eggFirmwareVersion} />
        </Label>
      </Section>
    )
  }

  renderSystemClock() {
    const {
      systemStatusTime,
      clockUTCMode,
      clockTZ,
      onToggleClockUTCMode,
      clockNTP,
      onSyncUTCToDevice
    } = this.props.ros

    const time = systemStatusTime && systemStatusTime.format("h:mm:ss a")
    const date = systemStatusTime && systemStatusTime.format("l")

    return (
      <Section title={"System Clock"}>
        <Label title={"NTP"}>
          <BooleanIndicator value={clockNTP} />
        </Label>
        <Label title={"Time"}>
          <Input disabled value={time} />
        </Label>
        <Label title={"Date"}>
          <Input disabled value={date} />
        </Label>
        <Label title={"Timezone"}>
          <Input disabled value={clockTZ} />
        </Label>
        <Label title={"UTC"}>
          <Toggle checked={clockUTCMode} onClick={onToggleClockUTCMode} />
        </Label>
        {(IS_LOCAL === false) &&
        <ButtonMenu>
          <Button onClick={onSyncUTCToDevice}>{"Sync Clocks"}</Button>
        </ButtonMenu>}
      </Section>
    )
  }

  renderSystemStatus() {
    const {
      heartbeat,
      systemStatusDiskUsageMB,
      systemStatusTempC,
      systemDefsDiskCapacityMB,
      diskUsagePercent
    } = this.props.ros

    return (
      <Section title={"System Status"}>
        <Label title={"Heartbeat"}>
          <BooleanIndicator value={heartbeat} />
        </Label>
        
        <Label title={"Temperature"}>
          <Input disabled value={roundWithSuffix(systemStatusTempC, 1, "\u00B0C")} />
        </Label>

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

  renderSystemMessages() {
    return (
      <Section title={"System Messages"}>
        <pre style={{ height: "400px", overflowY: "auto" }}>
          {this.props.ros.messageLog}
        </pre>
      </Section>
    )
  }

  onUpdateSaveSettingFilePrefix(e) {
    this.setState({ saveSettingsFilePrefix: e.target.value })
    document.getElementById("file_prefix_input").style.color = Styles.vars.colors.red
  }

  onKeySaveSettingFilePrefix(e) {
    const {saveSettingsFilePrefix} = this.props.ros
    if(e.key === 'Enter'){
      saveSettingsFilePrefix({newFilePrefix: this.state.saveSettingsFilePrefix})
      document.getElementById("file_prefix_input").style.color = Styles.vars.colors.black
    }
  }

  onToggleDataDeletion(e) {
    this.setState({ allowFileDeletion: e.target.checked})
  }

  renderSaveData() {
    const { onToggleSaveData, systemStatusDiskRate, deleteAllData } = this.props.ros
    return (
      <Section title={"Save Data"}>
        <Label title={"Save All Data"}>
          <Toggle id={"toggle_save_data"} onClick={onToggleSaveData} />
        </Label>
        <Label title={"Save Freq. (Hz)"}>
          <Input id="saveFreqInput" value={this.state.saveFreq} onChange={this.onUpdateSaveFreqText} onKeyDown= {this.onKeySaveFreqText} />
        </Label>
        <Label title={"Data Rate"}>
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
      </Section>
    )
  }

  //disabled={document.getElementById("toggle_save_data").value}>

  render() {
    return (
      <Columns>
        <Column>
          {this.renderDeviceInfo()}
          {this.renderSystemClock()}
        </Column>
        <Column>
          {this.renderSystemStatus()}
          {this.renderSaveData()}
        </Column>
        <Column>
          {this.renderSystemMessages()}
        </Column>
      </Columns>
    )
  }
}

export default NepiDashboard
