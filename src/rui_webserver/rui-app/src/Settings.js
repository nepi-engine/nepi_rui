import React, { Component } from "react"
import { observer, inject } from "mobx-react"
import Toggle from "react-toggle"
import { TRIGGER_MASKS, displayNameFromNodeName, nodeNameFromDisplayName } from "./Store"
import Input from "./Input"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Button, { ButtonMenu } from "./Button"
import Select, { Option } from "./Select"
import Styles from "./Styles"

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
      ipAddrVal: "0.0.0.0/24",
      configSubsys: "All",
      advancedConfigDisabled: true,
      updatedDeviceId: ""
    }

    this.onIPAddrValChange = this.onIPAddrValChange.bind(this)
    this.onAddButtonPressed = this.onAddButtonPressed.bind(this)
    this.onRemoveButtonPressed = this.onRemoveButtonPressed.bind(this)
    this.onSaveCfg = this.onSaveCfg.bind(this)
    this.onUserReset = this.onUserReset.bind(this)
    this.onFactoryReset = this.onFactoryReset.bind(this)
    this.onConfigSubsysSelected = this.onConfigSubsysSelected.bind(this)
    this.onToggleAdvancedConfig = this.onToggleAdvancedConfig.bind(this)
    this.createConfigSubsysOptions = this.createConfigSubsysOptions.bind(this)

    this.onDeviceIdChange = this.onDeviceIdChange.bind(this)
    this.onDeviceIdKey = this.onDeviceIdKey.bind(this)

    this.renderDeviceSettings = this.renderDeviceSettings.bind(this)
    this.renderNetworkInfo = this.renderNetworkInfo.bind(this)
    this.renderConfiguration = this.renderConfiguration.bind(this)
    this.renderTriggerSettings = this.renderTriggerSettings.bind(this)
    this.renderNUID = this.renderNUID.bind(this)

    this.nuidListener = this.nuidListener.bind(this)
    this.props.ros.setupNUIDListener(this.nuidListener)
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

  async onDeviceIdChange(e) {
    this.setState({ updatedDeviceId: e.target.value })
    document.getElementById("device_id_update_text").style.color = Styles.vars.colors.red
  }

  async onDeviceIdKey(e) {
    const {setDeviceID} = this.props.ros
    if(e.key === 'Enter'){
      setDeviceID({newDeviceID: this.state.updatedDeviceId})
      document.getElementById("device_id_update_text").style.color = Styles.vars.colors.black
    }
  }

  nuidListener(message) {
    this.setState({
      nuid: message.data
    })
  }

  renderDeviceSettings() {
    const {deviceId} = this.props.ros
    return (
      <Section title={"Device"}>
        <Label title={this.state.advancedConfigDisabled? "Device ID" : "Updated Device ID"}>
          <Input
            id={"device_id_update_text"}
            value={this.state.advancedConfigDisabled? deviceId : this.state.updatedDeviceId }
            disabled={this.state.advancedConfigDisabled}
            onChange={this.onDeviceIdChange}
            onKeyDown={this.onDeviceIdKey}
          />
        </Label>
      </Section>
    )
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

  nodeNameFromConfigSubsys() {
    const { resetTopics } = this.props.ros
    const { configSubsys } = this.state
    if ((configSubsys === 'All') && (resetTopics.length > 0)){
      return resetTopics[0]
    }
    else {
      var config_sys_node_name = nodeNameFromDisplayName(configSubsys)
      if (config_sys_node_name) {
        for (var i = 1; i < resetTopics.length; i++) {
          var node_name = resetTopics[i].split('/').pop()
          if (node_name === config_sys_node_name) {
            return resetTopics[i]
          }
        }
      }
      return 'UNKNOWN_NODE'
    }
  }

  async onSaveCfg() {
    const { saveCfg } = this.props.ros
    var node_name = this.nodeNameFromConfigSubsys()
    if (node_name !== 'UNKNOWN_NODE') {
      saveCfg({baseTopic: node_name})
    }
  }

  async onUserReset() {
    const { resetCfg } = this.props.ros
    var node_name = this.nodeNameFromConfigSubsys()
    if (node_name !== 'UNKNOWN_NODE') {
      resetCfg({baseTopic: node_name, resetVal: 0}) // Value 0 per Reset.msg
    }
  }

  async onFactoryReset() {
    const { resetCfg } = this.props.ros
    var node_name = this.nodeNameFromConfigSubsys()
    if (node_name !== 'UNKNOWN_NODE') {
      resetCfg({baseTopic: node_name, resetVal: 1}) // Value 1 per Reset.msg
    }
  }

  async onConfigSubsysSelected(e) {
    await this.setState({configSubsys: e.target.value})
  }

  async onToggleAdvancedConfig() {
    var disabled = this.state.advancedConfigDisabled
    this.setState({advancedConfigDisabled: !disabled})
  }

  createConfigSubsysOptions(resetTopics) {
    var subsys_options = []
    subsys_options.push(<Option>{"All"}</Option>)
    for (var i = 1; i < resetTopics.length; i++) { // Skip the first one -- it is global /numurus/3dx/<s/n>
      var node_name = resetTopics[i].split("/").pop()
      var subsys = displayNameFromNodeName(node_name)
      subsys_options.push(<Option>{subsys}</Option>)
    }
    return subsys_options
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

  renderConfiguration() {
    const { resetTopics } = this.props.ros
    const { advancedConfigDisabled } = this.state
    return (
      <Section title={"Configuration"}>
        <Label title={"Subsystem"}>
          <Select
            onChange={this.onConfigSubsysSelected}
            value={this.state.configSubsys}
          >
            {this.createConfigSubsysOptions(resetTopics)}
          </Select>
        </Label>
          <ButtonMenu>
            <Button onClick={this.onSaveCfg}>{"Save"}</Button>
            <Button onClick={this.onUserReset}>{"User Reset"}</Button>
            <Button hidden={advancedConfigDisabled} onClick={this.onFactoryReset}>{"Factory Reset"}</Button>
          </ButtonMenu>
      </Section>
    )
  }

  render() {
    return (
      <Columns>
        <Column>
          <Label title={"Advanced Settings Enable"}>
            <Toggle
              onClick={this.onToggleAdvancedConfig}>
            </Toggle>
          </Label>
          {this.renderDeviceSettings()}
          {this.renderNUID()}
          {this.renderTriggerSettings()}
        </Column>
        <Column>
          {this.renderNetworkInfo()}
          {this.renderConfiguration()}
        </Column>
      </Columns>
    )
  }
}
export default Settings
