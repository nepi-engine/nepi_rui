import React, { Component } from "react"
import { observer, inject } from "mobx-react"
import Toggle from "react-toggle"
import { TRIGGER_MASKS } from "./Store"
import Input from "./Input"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Button, { ButtonMenu } from "./Button"

@inject("ros")
@observer
class Settings extends Component {
  constructor(props) {
    super(props)

    this.state = {
      units: "metric",
      unitsResolution: "Low",
      nuid: "Not Available",
      deviceTriggerSWActive: true,
      deviceTriggerDualCamsActive: true,
      deviceTriggerToFCamActive: true,
      deviceTrigger3DSonarActive: true,
      deviceTriggerActualRateHz: "15.5",
      deviceTriggerAutoRateHz: "20",
      ipAddrVal: "0.0.0.0/24"
    }

    this.onIPAddrValChange = this.onIPAddrValChange.bind(this)
    this.onAddButtonPressed = this.onAddButtonPressed.bind(this)
    this.onRemoveButtonPressed = this.onRemoveButtonPressed.bind(this)

    this.renderSaveSettings = this.renderSaveSettings.bind(this)
    this.renderNetworkInfo = this.renderNetworkInfo.bind(this)
    this.renderResetActions = this.renderResetActions.bind(this)
    this.renderTriggerSettings = this.renderTriggerSettings.bind(this)
    this.renderNUID = this.renderNUID.bind(this)

    this.nuidListener = this.nuidListener.bind(this)
    var listener = this.props.ros.setupNUIDListener(this.nuidListener)
  }

  async onIPAddrValChange(e) {
    await this.setState({ipAddrVal: e.target.value})
  }

  async onAddButtonPressed() {
    const { addIPAddr } = this.props.ros
    const { ipAddrVal } = this.state

    addIPAddr(ipAddrVal)
  }

  async onRemoveButtonPressed() {
    const { removeIPAddr } = this.props.ros
    const { ipAddrVal } = this.state

    removeIPAddr(ipAddrVal)
  }

  nuidListener(message) {
    this.setState({
      nuid: message.data
    })
  }
  renderTriggerSettings() {
    const {
      triggerAutoRateHz,
      onChangeTriggerRate,
      triggerMask,
      onPressManualTrigger,
      onToggleHWTriggerOutputEnabled,
      onToggleHWTriggerInputEnabled
    } = this.props.ros

    return (
      <Section title={"Trigger Settings"}>
        <Label title={"Auto Rate (Hz)"}>
          <Input value={triggerAutoRateHz} onChange={onChangeTriggerRate} />
        </Label>

        <ButtonMenu>
          <Button onClick={onPressManualTrigger}>{"Manual Trigger"}</Button>
        </ButtonMenu>
        <Label title={"Hardware Trigger Input Enable"}>
          <Toggle onClick={onToggleHWTriggerInputEnabled} />
        </Label>
        <Label title={"Hardware Trigger Output Enable"}>
          <Toggle
            checked={triggerMask === TRIGGER_MASKS.OUTPUT_ENABLED}
            onClick={onToggleHWTriggerOutputEnabled}
          />
        </Label>
      </Section>
    )
  }

  renderNetworkInfo() {
    const { ip_addrs } = this.props.ros
    const { ipAddrVal } = this.state
    return (
      <Section title={"Network"}>
        <Label title={"Device IP Addresses"}>
          <pre style={{ height: "88px", overflowY: "auto" }}>
            {ip_addrs.join('\n')}
          </pre>
        </Label>
        <Label>
          <Input value={ipAddrVal} onChange={ this.onIPAddrValChange} />
        </Label>
        <ButtonMenu>
          <Button onClick={this.onAddButtonPressed}>{"Add"}</Button>
          <Button onClick={this.onRemoveButtonPressed}>{"Remove"}</Button>
        </ButtonMenu>
      </Section>
    )
  }
  renderNUID() {
    const { nuid } = this.state
    return (
      <Section title={"NEPI"}>
        <Label title={"NUID"}>
          <Input disabled value= {nuid} />
        </Label>
      </Section>
    )
  }

  renderResetActions() {
    return (
      <Section title={"Reset"}>
        <Label>
          <Button>{"User Reset"}</Button>
        </Label>
        <Label>
          <Button>{"Factory Reset"}</Button>
        </Label>
        <Label>
          <Button>{"Reboot System"}</Button>
        </Label>
      </Section>
    )
  }

  render() {
    return (
      <Columns>
        <Column>
          {this.renderNUID()}
          {this.renderTriggerSettings()}
        </Column>
        <Column>
          {this.renderNetworkInfo()}
          {this.renderResetActions()}
        </Column>
      </Columns>
    )
  }
}
export default Settings
