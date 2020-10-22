import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import Input from "./Input"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Button from "./Button"

@inject("networkInfo")
@inject("ros")
@observer
class Settings extends Component {
  constructor(props) {
    super(props)

    this.state = {
      saveSettingsFileSize: "20.0",
      saveSettingsFilePrefix: "Lake Union",
      units: "metric",
      unitsResolution: "Low",
      nuid: "Not Available"
    }

    this.renderSaveSettings = this.renderSaveSettings.bind(this)
    this.renderNetworkInfo = this.renderNetworkInfo.bind(this)
    this.renderResetActions = this.renderResetActions.bind(this)
    this.renderNUID = this.renderNUID.bind(this)
    this.nuidListener = this.nuidListener.bind(this)
    var listener = this.props.ros.setupNUIDListener(
      "/numurus/3dx/100069",
      this.nuidListener
    )
  }

  componentDidMount() {
    this.props.networkInfo.fetch()
  }

  nuidListener(message) {
    console.log(message)
    this.setState({
      nuid: message.data
    })
  } 

  renderSaveSettings() {
    const { saveSettingsFileSize, saveSettingsFilePrefix } = this.state
    return (
      <Section title={"Save Settings"}>
        <Label title={"Max File Size (MB)"}>
          <Input
            value={saveSettingsFileSize}
            onChange={this.onUpdateSaveSettingFileSize}
          />
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

  onUpdateSaveSettingFileSize(e) {
    this.setState({ saveSettingsFileSize: e.target.value })
  }

  onUpdateSaveSettingFilePrefix(e) {
    this.setState({ saveSettingsFilePrefix: e.target.value })
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
    console.log(this)
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
          {this.renderSaveSettings()}
          {this.renderNUID()}
        </Column>
        <Column>
          {this.renderNetworkInfo()}
          {this.renderResetActions()}
        </Column>
      </Columns>
    )
  }
}
