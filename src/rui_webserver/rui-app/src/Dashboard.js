import React, { Component } from "react"
import Toggle from "react-toggle"
import { observer, inject } from "mobx-react"

import Input from "./Input"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Button, { ButtonMenu } from "./Button"
import Select, { Option } from "./Select"

@inject("clock")
@inject("ros")
@observer
class Dashboard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      deviceInfoName: "3DSC-64",
      deviceInfoSerial: "100100",
      deviceClockNTPActive: true,
      deviceClockPPSActive: true,
      deviceLocationLat: "44.968046",
      deviceLocationLng: "-94.420307",
      deviceLocationAlt: "567.4",
      deviceTriggerSWActive: true,
      deviceTriggerDualCamsActive: true,
      deviceTriggerToFCamActive: true,
      deviceTrigger3DSonarActive: true,
      deviceTriggerActualRateHz: "15.5",
      deviceTriggerAutoRateHz: "20",
      deviceStatusTempC: "75 C",
      deviceStatusStorage: "90%",
      deviceStatusStorageCapacityMB: "500000",
      deviceStatusStorageUsedMB: "450000",
      deviceDirectionHeadingDeg: "40.3",
      deviceDirectionSpeedMpS: "2.1",
      deviceOrientationYawAngle: "44.96",
      deviceOrientationYawRate: "1",
      deviceOrientationPitchAngle: "-4.2",
      deviceOrientationPitchRate: ".1",
      deviceOrientationRollAngle: "-2",
      deviceOrientationRollRate: ".2"
    }

    this.renderDeviceInfo = this.renderDeviceInfo.bind(this)
    this.renderSystemClock = this.renderSystemClock.bind(this)
    this.renderLocation = this.renderLocation.bind(this)
    this.renderTriggerSettings = this.renderTriggerSettings.bind(this)
    this.renderSystemStatus = this.renderSystemStatus.bind(this)
    this.renderDirection = this.renderDirection.bind(this)
    this.renderOrientation = this.renderOrientation.bind(this)
    this.renderSystemMessages = this.renderSystemMessages.bind(this)
  }

  renderDeviceInfo() {
    const { deviceInfoName, deviceInfoSerial } = this.state
    return (
      <Section title={"Device Info"}>
        <Label title={"Device Name"}>
          <Input disabled value={deviceInfoName} />
        </Label>
        <Label title={"Device Serial Number"}>
          <Input disabled value={deviceInfoSerial} />
        </Label>
        <Label title={"Firmware Version"}>
          <Input disabled value={"1.001"} />
        </Label>
      </Section>
    )
  }

  renderSystemClock() {
    const { clock } = this.props
    const { deviceClockNTPActive, deviceClockPPSActive } = this.state
    return (
      <Section title={"System Clock"}>
        <Label title={"NTP"}>
          <Toggle disabled checked={deviceClockNTPActive} />
        </Label>
        <Label title={"PPS"}>
          <Toggle disabled checked={deviceClockPPSActive} />
        </Label>
        <Label title={"Time"}>
          <Input disabled value={clock.time.format("h:mm:ss a")} />
        </Label>
        <Label title={"Date"}>
          <Input disabled value={clock.time.format("l")} />
        </Label>
        <Label title={"Timezone"}>
          <Input disabled value={"MDT"} />
        </Label>
      </Section>
    )
  }

  renderLocation() {
    const {
      deviceLocationLat,
      deviceLocationLng,
      deviceLocationAlt
    } = this.state
    return (
      <Section title={"Location"}>
        <Label title={"Latitude"}>
          <Input disabled value={deviceLocationLat} />
        </Label>
        <Label title={"Longitude"}>
          <Input disabled value={deviceLocationLng} />
        </Label>
        <Label title={"Altitude (m)"}>
          <Input disabled value={deviceLocationAlt} />
        </Label>
      </Section>
    )
  }

  renderTriggerSettings() {
    const {
      // deviceTriggerSWActive,
      // deviceTriggerDualCamsActive,
      // deviceTriggerToFCamActive,
      // deviceTrigger3DSonarActive,
      deviceTriggerActualRateHz,
      deviceTriggerAutoRateHz
    } = this.state

    //         <Label title={"Dual Cams"}>
    //   <Toggle disabled checked={deviceTriggerDualCamsActive} />
    // </Label>
    // <Label title={"ToF Cam"}>
    //   <Toggle disabled checked={deviceTriggerToFCamActive} />
    // </Label>
    // <Label title={"3D Sonar"}>
    //   <Toggle disabled checked={deviceTrigger3DSonarActive} />
    // </Label>

    return (
      <Section title={"Trigger Settings"}>
        <Label title={"Trigger Value"}>
          <Select>
            <Option value="1">1</Option>
            <Option value="2">2</Option>
            <Option value="3">3</Option>
          </Select>
        </Label>

        <Label title={"Actual Rate (Hz)"}>
          <Input disabled value={deviceTriggerActualRateHz} />
        </Label>
        <Label title={"Auto Rate (Hz)"}>
          <Input disabled value={deviceTriggerAutoRateHz} />
        </Label>

        <ButtonMenu>
          <Button>{"HW. Trigger Enab."}</Button>
          <Button>{"Manual Trigger"}</Button>
        </ButtonMenu>
      </Section>
    )
  }

  renderSystemStatus() {
    const {
      connectedToROS,
      deviceStatusTempC,
      deviceStatusStorage,
      deviceStatusStorageCapacityMB,
      deviceStatusStorageUsedMB
    } = this.state
    return (
      <Section title={"System Status"}>
        <Label title={"Heartbeat"}>
          <Toggle disabled checked={connectedToROS} />
        </Label>

        <Label title={"Temp (C)"}>
          <Input disabled value={deviceStatusTempC} />
        </Label>

        <Label title={"Storage"}>
          <Input disabled value={deviceStatusStorage} />
        </Label>

        <Label title={"Capacity (MB)"}>
          <Input disabled value={deviceStatusStorageCapacityMB} />
        </Label>

        <Label title={"Used (MB)"}>
          <Input disabled value={deviceStatusStorageUsedMB} />
        </Label>
      </Section>
    )
  }

  renderDirection() {
    const { deviceDirectionHeadingDeg, deviceDirectionSpeedMpS } = this.state
    return (
      <Section title={"Direction"}>
        <Label title={"Heading (deg)"}>
          <Input disabled value={deviceDirectionHeadingDeg} />
        </Label>
        <Label title={"Speed (m/s)"}>
          <Input disabled value={deviceDirectionSpeedMpS} />
        </Label>
      </Section>
    )
  }

  renderOrientation() {
    const {
      deviceOrientationYawAngle,
      deviceOrientationYawRate,
      deviceOrientationPitchAngle,
      deviceOrientationPitchRate,
      deviceOrientationRollAngle,
      deviceOrientationRollRate
    } = this.state
    return (
      <Section title={"Orientation (deg, deg/s)"}>
        <Label title={"Yaw"}>
          <Input
            disabled
            style={{ width: "50%" }}
            value={deviceOrientationYawAngle}
          />
          <Input
            disabled
            style={{ width: "50%" }}
            value={deviceOrientationYawRate}
          />
        </Label>
        <Label title={"Pitch"}>
          <Input
            disabled
            style={{ width: "50%" }}
            value={deviceOrientationPitchAngle}
          />
          <Input
            disabled
            style={{ width: "50%" }}
            value={deviceOrientationPitchRate}
          />
        </Label>
        <Label title={"Roll"}>
          <Input
            disabled
            style={{ width: "50%" }}
            value={deviceOrientationRollAngle}
          />
          <Input
            disabled
            style={{ width: "50%" }}
            value={deviceOrientationRollRate}
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

  render() {
    return (
      <Columns>
        <Column>
          {this.renderDeviceInfo()}
          {this.renderSystemClock()}
          {this.renderLocation()}
        </Column>
        <Column>
          {this.renderTriggerSettings()}
          {this.renderSystemStatus()}
          {this.renderDirection()}
        </Column>
        <Column>
          {this.renderSystemMessages()}
          {this.renderOrientation()}
        </Column>
      </Columns>
    )
  }
}

export default Dashboard
