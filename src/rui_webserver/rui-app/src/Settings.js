import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import Input from "./Input"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Button from "./Button"
import Select, { Option } from "./Select"

@inject("networkInfo")
@observer
class Settings extends Component {
  constructor(props) {
    super(props)

    this.state = {
      saveSettingsFileSize: "20.0",
      saveSettingsFilePrefix: "Lake Union",
      units: "metric",
      unitsResolution: "Low"
    }

    this.renderSaveSettings = this.renderSaveSettings.bind(this)
    this.renderUnits = this.renderUnits.bind(this)
    this.renderNetworkInfo = this.renderNetworkInfo.bind(this)
    this.renderResetActions = this.renderResetActions.bind(this)
  }

  componentDidMount() {
    this.props.networkInfo.fetchNetworkInfo()
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

  renderUnits() {
    // const { units, unitsResolution } = this.state
    return (
      <Section title={"Units"}>
        <Label title={"Units"}>
          <Select>
            <Option value="metric">Metric</Option>
            <Option value="imperial">Imperial</Option>
          </Select>
        </Label>
        <Label title={"Resolution"}>
          <Select>
            <Option value="Low">Low</Option>
            <Option value="Med">Med</Option>
            <Option value="High">High</Option>
            <Option value="Full">Full</Option>
          </Select>
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
          {this.renderUnits()}
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
