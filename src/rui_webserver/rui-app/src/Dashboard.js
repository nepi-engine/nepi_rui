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

function round(value, decimals = 0) {
  return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer
class Dashboard extends Component {
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

  renderSledInfo() {
    const {
      sledConnected,
      sledType,
      sledFirmwareVersion,
      eggFirmwareVersion,
    } = this.props.ros
    return (
      <Section title={"Sled Info"}>
        <Label title={"Connected"}>
          <BooleanIndicator value={sledConnected} />
        </Label>
        <Label title={"Type"}>
          <Input disabled value={sledType} />
        </Label>
        <Label title={"Firmware"}>
          <Input disabled value={sledFirmwareVersion} />
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
        {IS_LOCAL &&
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
      systemDefsDiskCapacity,
      diskUsagePercent
    } = this.props.ros

    return (
      <Section title={"System Status"}>
        <Label title={"Heartbeat"}>
          <BooleanIndicator value={heartbeat} />
        </Label>

        <Label title={"Temp (C)"}>
          <Input disabled value={round(systemStatusTempC, 2)} />
        </Label>

        <Label title={"Storage"}>
          <Input disabled value={diskUsagePercent} />
        </Label>

        <Label title={"Capacity (MB)"}>
          <Input disabled value={systemDefsDiskCapacity} />
        </Label>

        <Label title={"Used (MB)"}>
          <Input disabled value={round(systemStatusDiskUsageMB)} />
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
        <Label title={"Save Data"}>
          <Toggle id={"toggle_save_data"} onClick={onToggleSaveData} />
        </Label>
        <Label title={"Save Freq. (Hz)"}>
          <Input id="saveFreqInput" value={this.state.saveFreq} onChange={this.onUpdateSaveFreqText} onKeyDown= {this.onKeySaveFreqText} />
        </Label>
        <Label title={"Data Rate (MB/s)"}>
          <Input disabled value={round(systemStatusDiskRate, 3)} />
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

export default Dashboard
