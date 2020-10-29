import React, { Component } from "react"
import { observer, inject } from "mobx-react"
import Toggle from "react-toggle"
import { TRIGGER_MASKS } from "./Store"
import Input from "./Input"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Button, { ButtonMenu } from "./Button"
@inject("networkInfo")
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
      deviceTriggerAutoRateHz: "20"
    }

    this.renderNetworkInfo = this.renderNetworkInfo.bind(this)
    this.renderResetActions = this.renderResetActions.bind(this)
    this.renderTriggerSettings = this.renderTriggerSettings.bind(this)
    this.renderNUID = this.renderNUID.bind(this)
    this.nuidListener = this.nuidListener.bind(this)
    var listener = this.props.ros.setupNUIDListener(this.nuidListener)
  }

  componentDidMount() {
    this.props.networkInfo.fetch()
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
    const { ipAddress } = this.props.networkInfo
    return (
      <Section title={"Network"}>
        <Label title={"IP Address"}>
          <Input value={ipAddress} disabled />
        </Label>
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