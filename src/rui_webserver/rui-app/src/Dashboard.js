import React, { Component } from "react"
import Toggle from "react-toggle"
import { observer, inject } from "mobx-react"

import Input from "./Input"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Button, { ButtonMenu } from "./Button"
import BooleanIndicator from "./BooleanIndicator"

function round(value, decimals = 0) {
  return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer
class Dashboard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      saveSettingsFilePrefix: "Lake Union"
    }

    this.renderDeviceInfo = this.renderDeviceInfo.bind(this)
    this.renderSystemClock = this.renderSystemClock.bind(this)
    this.renderLocation = this.renderLocation.bind(this)
    this.renderSystemStatus = this.renderSystemStatus.bind(this)
    this.renderDirection = this.renderDirection.bind(this)
    this.renderOrientation = this.renderOrientation.bind(this)
    this.renderSystemMessages = this.renderSystemMessages.bind(this)
    this.renderSaveData = this.renderSaveData.bind(this)
  }

  renderDeviceInfo() {
    const {
      deviceName,
      deviceSerial,
      systemDefsFirmwareVersion,
      deviceInWater,
      onToggleDeviceInWater
    } = this.props.ros
    return (
      <Section title={"Device Info"}>
        <Label title={"Name"}>
          <Input disabled value={deviceName} />
        </Label>
        <Label title={"Serial Number"}>
          <Input disabled value={deviceSerial} />
        </Label>
        <Label title={"Firmware Version"}>
          <Input disabled value={systemDefsFirmwareVersion} />
        </Label>
        <Label title={"In Water"}>
          <Toggle checked={deviceInWater} onClick={onToggleDeviceInWater} />
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
      clockPPS,
      onSyncUTCToDevice
    } = this.props.ros

    const time = systemStatusTime && systemStatusTime.format("h:mm:ss a")
    const date = systemStatusTime && systemStatusTime.format("l")

    return (
      <Section title={"System Clock"}>
        <Label title={"NTP"}>
          <BooleanIndicator value={clockNTP} />
        </Label>
        <Label title={"PPS"}>
          <BooleanIndicator value={clockPPS} />
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
        <ButtonMenu>
          <Button onClick={onSyncUTCToDevice}>{"Sync Clocks"}</Button>
        </ButtonMenu>
      </Section>
    )
  }

  renderLocation() {
    const {
      navPosLocationLat,
      navPosLocationLng,
      navPosLocationAlt
    } = this.props.ros
    return (
      <Section title={"Location"}>
        <Label title={"Latitude"}>
          <Input disabled value={navPosLocationLat} />
        </Label>
        <Label title={"Longitude"}>
          <Input disabled value={navPosLocationLng} />
        </Label>
        <Label title={"Altitude (m)"}>
          <Input disabled value={navPosLocationAlt} />
        </Label>
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

  renderDirection() {
    const {
      navPosDirectionHeadingDeg,
      navPosDirectionSpeedMpS
    } = this.props.ros
    return (
      <Section title={"Direction"}>
        <Label title={"Heading (deg)"}>
          <Input disabled value={round(navPosDirectionHeadingDeg, 3)} />
        </Label>
        <Label title={"Speed (m/s)"}>
          <Input disabled value={round(navPosDirectionSpeedMpS, 3)} />
        </Label>
      </Section>
    )
  }

  renderOrientation() {
    const {
      navPosOrientationYawAngle,
      navPosOrientationYawRate,
      navPosOrientationPitchAngle,
      navPosOrientationPitchRate,
      navPosOrientationRollAngle,
      navPosOrientationRollRate
    } = this.props.ros
    return (
      <Section title={"Orientation"}>
        <Label title={""}>
          <div style={{ display: "inline-block", width: "45%", float: "left" }}>
            {"deg"}
          </div>
          <div style={{ display: "inline-block", width: "45%" }}>{"deg/s"}</div>
        </Label>
        <Label title={"Yaw"}>
          <Input
            disabled
            style={{ width: "45%", float: "left" }}
            value={round(navPosOrientationYawAngle, 3)}
          />
          <Input
            disabled
            style={{ width: "45%" }}
            value={round(navPosOrientationYawRate, 3)}
          />
        </Label>
        <Label title={"Pitch"}>
          <Input
            disabled
            style={{ width: "45%", float: "left" }}
            value={round(navPosOrientationPitchAngle, 3)}
          />
          <Input
            disabled
            style={{ width: "45%" }}
            value={round(navPosOrientationPitchRate, 3)}
          />
        </Label>
        <Label title={"Roll"}>
          <Input
            disabled
            style={{ width: "45%", float: "left" }}
            value={round(navPosOrientationRollAngle, 3)}
          />
          <Input
            disabled
            style={{ width: "45%" }}
            value={round(navPosOrientationRollRate, 3)}
          />
        </Label>
      </Section>
    )
  }

  renderSystemMessages() {
    return (
      <Section title={"System Messages"}>
        <pre style={{ height: "220px", overflowY: "auto" }}>
          {this.props.ros.messageLog}
        </pre>
      </Section>
    )
  }

  renderSaveData() {
    const { onToggleSaveData, saveFreqHz, onChangeSaveFreq, systemStatusDiskRate } = this.props.ros
    const {saveSettingsFilePrefix} = this.state
    return (
      <Section title={"Save Data"}>
        <Label title={"Save Data"}>
          <Toggle onClick={onToggleSaveData} />
        </Label>
        <Label title={"Save Freq. (Hz)"}>
          <Input value={saveFreqHz} onChange={onChangeSaveFreq} />
        </Label>
        <Label title={"Data Rate (MB/s)"}>
          <Input disabled value={round(systemStatusDiskRate, 3)} />
        </Label>
        <Label title={"File Name Prefix"}>
          <Input
            value={saveSettingsFilePrefix}
            onChange={this.onUpdateSaveSettingFilePrefix}
          />
        </Label>
      </Section>
    )
  }

  onUpdateSaveSettingFilePrefix(e) {
    this.setState({ saveSettingsFilePrefix: e.target.value })
  }

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
          {this.renderDirection()}
        </Column>
        <Column>
          {this.renderSystemMessages()}
          {this.renderOrientation()}
          {this.renderLocation()}
        </Column>
      </Columns>
    )
  }
}

export default Dashboard
