import React, { Component } from "react"
import { observer, inject } from "mobx-react"
import Toggle from "react-toggle"
import { displayNameFromNodeName, nodeNameFromDisplayName } from "./Store"
import Input from "./Input"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Button, { ButtonMenu } from "./Button"
import Select, { Option } from "./Select"
import Styles from "./Styles"

function round(value, decimals = 0) {
  return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer
class Settings extends Component {
  constructor(props) {
    super(props)

    this.state = {
      autoRate: this.props.ros.triggerAutoRateHz,
      autoRateUserEditing: false,
      ipAddrVal: "0.0.0.0/24",
      configSubsys: "All",
      advancedConfigDisabled: true,
      updatedDeviceId: "",
      tx_bandwidth_limit: (this.props.ros.bandwidth_usage_query_response !== null)? this.props.ros.bandwidth_usage_query_response.tx_limit_mbps : -1,
      tx_bandwidth_user_editing: false
    }

    this.onUpdateAutoRateText = this.onUpdateAutoRateText.bind(this)
    this.onKeyAutoRateText = this.onKeyAutoRateText.bind(this)
    this.onUpdateTXRateLimitText = this.onUpdateTXRateLimitText.bind(this)
    this.onKeyTXRateLimitText = this.onKeyTXRateLimitText.bind(this)

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
  }

  onUpdateAutoRateText(e) {
    this.setState({autoRate: e.target.value});
    this.setState({autoRateUserEditing: true});
    document.getElementById(e.target.id).style.color = Styles.vars.colors.red
  }

  onKeyAutoRateText(e) {
    const {onChangeTriggerRate, } = this.props.ros
    if(e.key === 'Enter'){
      this.setState({autoRateUserEditing: false});
      onChangeTriggerRate(this.state.autoRate)
      document.getElementById(e.target.id).style.color = Styles.vars.colors.black
    }
  }

  onUpdateTXRateLimitText(e) {
    this.setState({tx_bandwidth_limit: e.target.value});
    this.setState({tx_bandwidth_user_editing: true});
    document.getElementById(e.target.id).style.color = Styles.vars.colors.red
  }

  onKeyTXRateLimitText(e) {
    const {onChangeTXRateLimit} = this.props.ros
    if(e.key === 'Enter'){
      this.setState({tx_bandwidth_user_editing: false});
      onChangeTXRateLimit(this.state.tx_bandwidth_limit)
      document.getElementById(e.target.id).style.color = Styles.vars.colors.black
    }
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
      //triggerMask,
      onPressManualTrigger,
      //onToggleHWTriggerOutputEnabled,
      //onToggleHWTriggerInputEnabled,
      triggerAutoRateHz
    } = this.props.ros

    return (
      <Section title={"Trigger Settings"}>
        <Label title={"Auto Rate (Hz)"}>
          <Input
            id="autoRateInput"
            value={(this.state.autoRateUserEditing === true)? this.state.autoRate : triggerAutoRateHz}
            onChange={this.onUpdateAutoRateText} onKeyDown={this.onKeyAutoRateText}
          />
        </Label>
        <ButtonMenu>
          <Button onClick={onPressManualTrigger}>{"Manual Trigger"}</Button>
        </ButtonMenu>
        <Label title={"Hardware Trigger Input Enable"}>
          <Toggle
            checked={false}
            disabled={true}
          />
        </Label>
        <Label title={"Hardware Trigger Output Enable"}>
          <Toggle
            checked={true}
            disabled={true}
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
      if (!config_sys_node_name) {
        // Just try with the original name in case this node doesn't have a Display Name
        config_sys_node_name = configSubsys
      }
      for (var i = 1; i < resetTopics.length; i++) {
        var node_name = resetTopics[i].split('/').pop()
        if (node_name === config_sys_node_name) {
          return resetTopics[i]
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
    for (var i = 1; i < resetTopics.length; i++) { // Skip the first one -- it is global /numurus/dev_3dx/<s/n>
      var node_name = resetTopics[i].split("/").pop()
      var subsys = displayNameFromNodeName(node_name)
      subsys_options.push(<Option>{subsys}</Option>)
    }
    return subsys_options
  }

  renderNetworkInfo() {
    const { ip_query_response, onToggleDHCPEnabled, bandwidth_usage_query_response } = this.props.ros
    const { ipAddrVal } = this.state
    return (
      <Section title={"Network"}>
        <Label title={"Device IP Addresses"}>
          <pre style={{ height: "88px", overflowY: "auto" }}>
            {(ip_query_response !== null)? ip_query_response.ip_addrs.join('\n') : null}
          </pre>
        </Label>
        <Label title={"DHCP Enabled"}>
        <Toggle
          checked={(ip_query_response !== null)? ip_query_response.dhcp_enabled : false}
          onClick= {onToggleDHCPEnabled}
        />
        </Label>
        <Label>
          <Input value={ipAddrVal} onChange={ this.onIPAddrValChange} />
        </Label>
        <ButtonMenu>
          <Button onClick={this.onAddButtonPressed}>{"Add"}</Button>
          <Button onClick={this.onRemoveButtonPressed}>{"Remove"}</Button>
        </ButtonMenu>
        <Label title={"TX Data Rate (Mbps)"}>
          <Input disabled value={(bandwidth_usage_query_response !== null)? round(bandwidth_usage_query_response.tx_rate_mbps, 2) : -1.0} />
        </Label>
        <Label title={"RX Data Rate (Mbps)"}>
          <Input disabled value={(bandwidth_usage_query_response !== null)? round(bandwidth_usage_query_response.rx_rate_mbps, 2) : -1.0} />
        </Label>
        <Label title={"TX Rate Limit (Mbps)"}>
          <Input
            id="txRateLimit"
            value={((this.state.tx_bandwidth_user_editing === true) || (bandwidth_usage_query_response === null))?
              this.state.tx_bandwidth_limit : bandwidth_usage_query_response.tx_limit_mbps}
            onChange={this.onUpdateTXRateLimitText}
            onKeyDown={this.onKeyTXRateLimitText}
          />
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
