/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */
import React, { Component } from 'react';
import { observer, inject } from "mobx-react"
import Toggle from "react-toggle"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Input from "./Input"
import Button, { ButtonMenu } from "./Button"
import ListBox from './ListBox';
import './ListBox.css';
import Select, { Option } from "./Select"
import BooleanIndicator from "./BooleanIndicator"
import Styles from "./Styles"


@inject("ros")
@observer
class OnvifMgr extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedDeviceUUID: null,
      
      selectedDeviceConfigModified: false,

      selectedDeviceConfigUUID: '',
      selectedDeviceConfigDevicename: '',
      selectedDeviceConfigUsername: '',
      selectedDeviceConfigPassword: '',
      selectedDeviceConfigBasename: '',
      selectedDeviceConfigIDXEnabled: true,
      selectedDeviceConfigPTXEnabled: false,
      selectedDeviceConfigIDXDriver: '',
      selectedDeviceConfigPTXDriver: ''
    };

    this.handleUUIDSelection = this.handleUUIDSelection.bind(this)
    this.handleNewConfigClick = this.handleNewConfigClick.bind(this)
    this.handleUpdateConfigClick = this.handleUpdateConfigClick.bind(this)
    this.handleDeleteConfigClick = this.handleDeleteConfigClick.bind(this)
    this.onChangeTextField = this.onChangeTextField.bind(this)
    this.onIDXDriverSelected = this.onIDXDriverSelected.bind(this)
    this.onPTXDriverSelected = this.onPTXDriverSelected.bind(this)
    this.createIDXDriverOptions = this.createIDXDriverOptions.bind(this)
    this.createPTXDriverOptions = this.createPTXDriverOptions.bind(this)
  }

  handleUUIDSelection(item) {
    const { onvifDeviceConfigs, onvifIDXDeviceDrivers, onvifPTXDeviceDrivers } = this.props.ros;
    let selectedConfig = null
    for (let i = 0; i < onvifDeviceConfigs.length; i++) {
      const config = onvifDeviceConfigs[i]
      const devname = config.device_name
      if (devname === item) {
        selectedConfig = config
        break
      }
    }

    const defaultIDXDeviceDriver = (onvifIDXDeviceDrivers.length > 0)? onvifIDXDeviceDrivers[0] : ''
    const defaultPTXDeviceDriver = (onvifPTXDeviceDrivers.length > 0)? onvifPTXDeviceDrivers[0] : ''

    this.setState({ 
      selectedDeviceUUID: selectedConfig? selectedConfig.uuid : item,

      selectedDeviceConfigModified: false,
      selectedDeviceConfigUUID: selectedConfig? selectedConfig.uuid : item,
      selectedDeviceConfigDevicename: selectedConfig? selectedConfig.device_name : '',
      selectedDeviceConfigUsername: selectedConfig? selectedConfig.username : '',
      selectedDeviceConfigPassword: selectedConfig? selectedConfig.password : '',
      selectedDeviceConfigBasename: selectedConfig? selectedConfig.node_base_name : '',
      selectedDeviceConfigIDXEnabled: selectedConfig? selectedConfig.idx_enabled : true,
      selectedDeviceConfigPTXEnabled: selectedConfig? selectedConfig.ptx_enabled : false,
      selectedDeviceConfigIDXDriver: selectedConfig? selectedConfig.idx_driver : defaultIDXDeviceDriver,
      selectedDeviceConfigPTXDriver: selectedConfig? selectedConfig.ptx_driver : defaultPTXDeviceDriver,
    });
  };

  handleNewConfigClick() {
    const { onvifIDXDeviceDrivers, onvifPTXDeviceDrivers } = this.props.ros;

    this.setState({
      selectedDeviceUUID: null,
      selectedDeviceConfigModified: true,
      selectedDeviceConfigUUID: 'XXXX-XXXX-XXXX-XXXXXXXXXXXX',
      selectedDeviceConfigDevoceName: 'device_name',
      selectedDeviceConfigUsername: 'admin',
      selectedDeviceConfigPassword: 'admin',
      selectedDeviceConfigBasename: 'new_onvif_device',
      selectedDeviceIDXEnabled: false,
      selectedDevicePTXEnabled: false,
      selectedDeviceConfigIDXDriver: onvifIDXDeviceDrivers[0],
      selectedDeviceConfigPTXDriver: onvifPTXDeviceDrivers[0]
    })
  }

  async handleUpdateConfigClick(uuid) {
    const { callOnvifDeviceListQueryService } = this.props.ros
    let updated_config = {
      uuid : uuid,
      device_name : this.state.selectedDeviceConfigDevicename,
      username : this.state.selectedDeviceConfigUsername,
      password : this.state.selectedDeviceConfigPassword,
      node_base_name : this.state.selectedDeviceConfigBasename,
      idx_enabled : this.state.selectedDeviceConfigIDXEnabled,
      ptx_enabled : this.state.selectedDeviceConfigPTXEnabled,
      idx_driver : this.state.selectedDeviceConfigIDXDriver,
      ptx_driver : this.state.selectedDeviceConfigPTXDriver
    }
    this.props.ros.onOnvifDeviceCfgUpdate(updated_config)
    this.setState({selectedDeviceConfigModified: false})

    await callOnvifDeviceListQueryService(false) // Call a one-shot for more responsive experience
  }

  async handleDeleteConfigClick() {
    const { onOnvifDeviceCfgDelete, callOnvifDeviceListQueryService } = this.props.ros
    onOnvifDeviceCfgDelete(this.state.selectedDeviceConfigUUID)

    this.setState({
      selectedDeviceConfigUUID: '',
      selectedDeviceConfigDevicename: '',
      selectedDeviceConfigUsername: '',
      selectedDeviceConfigPassword: '',
      selectedDeviceConfigBasename: '',
      selectedDeviceConfigIDXEnabled: true,
      selectedDeviceConfigPTXEnabled: false,
      selectedDeviceConfigIDXDriver: '',
      selectedDeviceConfigPTXDriver: ''
    })

    await callOnvifDeviceListQueryService(false) // Call a one-shot for more responsive experience
  };

  onChangeTextField(e) {
    if (e.target.id === "onvif_uuid_textbox")  {
      this.setState({selectedDeviceConfigUUID : e.target.value})
    }
    else if (e.target.id === "onvif_username_textbox") {
      this.setState({selectedDeviceConfigUsername : e.target.value})
    }
    else if (e.target.id === "onvif_password_textbox") {
      this.setState({selectedDeviceConfigPassword : e.target.value})
    }
    else if (e.target.id === "node_base_name_texbox") {
      this.setState({selectedDeviceConfigBasename : e.target.value})
    }
    
    // And in all cases, set the config-modified flag
    this.setState({selectedDeviceConfigModified : true})
  }

  onIDXDriverSelected(event) {
    if (event.target.value !== this.state.selectedDeviceConfigIDXDriver) {
      this.setState({ 
        selectedDeviceConfigIDXDriver:event.target.value,
        selectedDeviceConfigModified : true
      })
    }
  }

  onPTXDriverSelected(event) {
    if (event.target.value !== this.state.selectedDeviceConfigPTXDriver) {
      this.setState({ 
        selectedDeviceConfigPTXDriver:event.target.value,
        selectedDeviceConfigModified : true
      })
    }
  }

  createIDXDriverOptions() {
    const { onvifIDXDeviceDrivers } = this.props.ros;
    var items = []
    for (var i = 0; i < onvifIDXDeviceDrivers.length; i++) {
      if (onvifIDXDeviceDrivers[i].indexOf("Generic") !== -1){
        items.push(<Option value={onvifIDXDeviceDrivers[i]}>{onvifIDXDeviceDrivers[i]}</Option>)
      }
    }
    for (var i2 = 0; i2 < onvifIDXDeviceDrivers.length; i2++) {
      if (onvifIDXDeviceDrivers[i2].indexOf("Generic") === -1){
        items.push(<Option value={onvifIDXDeviceDrivers[i2]}>{onvifIDXDeviceDrivers[i2]}</Option>)
      }
    }
    return items
  }

  createPTXDriverOptions() {
    const { onvifPTXDeviceDrivers } = this.props.ros;
    var items = []
    for (var i = 0; i < onvifPTXDeviceDrivers.length; i++) {
      if (onvifPTXDeviceDrivers[i].indexOf("Generic") !== -1){
        items.push(<Option value={onvifPTXDeviceDrivers[i]}>{onvifPTXDeviceDrivers[i]}</Option>)
      }
    }
    for (var i2 = 0; i2 < onvifPTXDeviceDrivers.length; i2++) {
      if (onvifPTXDeviceDrivers[i2].indexOf("Generic") === -1){
        items.push(<Option value={onvifPTXDeviceDrivers[i2]}>{onvifPTXDeviceDrivers[i2]}</Option>)
      }
    }
    return items
  }

  render() {
    const { onvifDeviceStatuses, onvifDeviceConfigs } = this.props.ros;
    const { selectedDeviceUUID, 
            selectedDeviceConfigDevName,
            selectedDeviceConfigModified,
            selectedDeviceConfigUUID,
            selectedDeviceConfigUsername,
            selectedDeviceConfigPassword,
            selectedDeviceConfigBasename,
            selectedDeviceConfigIDXEnabled,
            selectedDeviceConfigPTXEnabled
          } = this.state

    let selectedDeviceStatus = null
        
    let detectedDeviceUUIDsForListBox = []
    let detectedDeviceDevNamesForListBox = []
    if (onvifDeviceStatuses !== null) {
      for (let i = 0; i < onvifDeviceStatuses.length; i++) {
        const status = onvifDeviceStatuses[i]
        const uuid = status.uuid
        const devname = status.device_name
        detectedDeviceUUIDsForListBox.push(uuid)
        detectedDeviceDevNamesForListBox.push(devname)
        if ((selectedDeviceUUID !== null) && (uuid === selectedDeviceUUID)) {
          selectedDeviceStatus = status
        }
      }
    }

    let configuredDevicesUUIDsForListBox = []
    let configuredDevicesDevNamesForListBox = []
    if (onvifDeviceConfigs !== null) {
      for (let i = 0; i < onvifDeviceConfigs.length; i++) {
        const config = onvifDeviceConfigs[i]
        const uuid = config.uuid
        const devname = config.device_name
        configuredDevicesUUIDsForListBox.push(uuid)
        configuredDevicesDevNamesForListBox.push(devname)
      }
    }

    let config_text_color = (selectedDeviceConfigModified)? Styles.vars.colors.red : Styles.vars.colors.black
    let config_text_weight = (selectedDeviceConfigModified)? "bold" : "normal"

    let uuid_for_config_text_field = (selectedDeviceConfigUUID !== '')?
      selectedDeviceConfigUUID :
      (selectedDeviceUUID !== null)? selectedDeviceUUID : ''
     
    
    return (



      <Columns>
        <Column>
          <Section title={"Detected Devices"}>

            <ListBox 
              id="detectedDevicesListBox" 
              items={detectedDeviceDevNamesForListBox} 
              selectedItem={this.state.selectedDeviceConfigDevicename} 
              onSelect={this.handleUUIDSelection} 
              style={{ color: 'black', backgroundColor: 'white' }}
            />
          </Section>
        </Column>
        <Column>
          <Section title={"Configured Devices"}>
            <ListBox 
              id="runningScriptsListBox" 
              items={configuredDevicesDevNamesForListBox} 
              selectedItem={this.state.selectedDeviceConfigDevicename}
              onSelect={this.handleUUIDSelection} 
              style={{ color: 'black', backgroundColor: 'white' }} 
            />
          </Section>
        </Column>
        <Column equalWidth={false}>
          <Section title={selectedDeviceConfigDevName? selectedDeviceConfigDevName : ''}>
            <label style={{fontWeight: 'bold'}}>
              {"Status"}
            </label>
            <Columns>
              <Column>
                <Label title={"Host/IP"}>
                  <Input 
                    disabled 
                    value={selectedDeviceStatus? selectedDeviceStatus.host : ''} 
                    style={{width: '100%'}} 
                  />
                </Label>
                <Label title={"Manufacturer"}>
                  <Input 
                    disabled 
                    value={selectedDeviceStatus? selectedDeviceStatus.manufacturer : ''} 
                    style={{width: '100%'}} 
                  />
                </Label>
                <Label title={"Hardware ID"}>
                  <Input 
                    disabled 
                    value={selectedDeviceStatus? selectedDeviceStatus.hardware_id : ''} 
                    style={{width: '100%'}} 
                  />
                </Label>

                <Label title={"Connected"}>
                  <BooleanIndicator value={selectedDeviceStatus? selectedDeviceStatus.connectable : ''} />
                </Label>

                <Label title={"Camera Running"}>
                  <BooleanIndicator value={selectedDeviceStatus? selectedDeviceStatus.idx_node_running : ''} />
                </Label>

                <Label title={"PanTilt Running"}>
                  <BooleanIndicator value={selectedDeviceStatus? selectedDeviceStatus.ptx_node_running : ''} />
                </Label>

              </Column>
              <Column>
                <Label title={"Port"}>
                  <Input 
                    disabled 
                    value={selectedDeviceStatus? selectedDeviceStatus.port : ''} 
                    style={{width: '100%'}} 
                  />
                </Label>
                <Label title={"Model"}>
                  <Input 
                    disabled 
                    value={selectedDeviceStatus? selectedDeviceStatus.model : ''} 
                    style={{width: '100%'}} 
                  />
                </Label>
                <Label title={"Firmware"}>
                  <Input 
                    disabled 
                    value={selectedDeviceStatus? selectedDeviceStatus.firmware_version : ''} 
                    style={{width: '100%'}} 
                  />
                </Label>

              </Column>
            </Columns>
            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
            <label style={{fontWeight: 'bold'}}>
              {"Configuration"}
            </label>
            <Label title={"UUID"}>
              <Input
                id={'onvif_uuid_textbox'} 
                value={uuid_for_config_text_field} 
                style={{width: '100%', color: config_text_color, fontWeight: config_text_weight}}
                onChange={this.onChangeTextField}
                disabled={(detectedDeviceUUIDsForListBox.includes(uuid_for_config_text_field))} 
              />
            </Label>
            <Label title={"Device Name (User Defined)"}>
              <Input
                id={'node_base_name_texbox'} 
                value={selectedDeviceConfigBasename} 
                style={{width: '100%', color: config_text_color, fontWeight: config_text_weight}}
                onChange={this.onChangeTextField}
              />
            </Label>
            <Label title={"Login: Username"}>
              <Input
                id={'onvif_username_textbox'} 
                value={selectedDeviceConfigUsername} 
                style={{width: '100%', color: config_text_color, fontWeight: config_text_weight}}
                onChange={this.onChangeTextField}
              />
            </Label>
            <Label title={"Login: Password"}>
              <Input
                id={'onvif_password_textbox'} 
                value={selectedDeviceConfigPassword} 
                style={{width: '100%', color: config_text_color, fontWeight: config_text_weight}}
                onChange={this.onChangeTextField}
              />
            </Label>
            <Columns>
              <Column>
                <Label title={"Enable Camera"}>
                  <Toggle
                    id={'onvif_idx_enabled_toggle'} 
                    checked={selectedDeviceConfigIDXEnabled} 
                    onClick={() => { this.setState({selectedDeviceConfigIDXEnabled : !this.state.selectedDeviceConfigIDXEnabled,
                                                    selectedDeviceConfigModified : true}); }
                            }
                  />
                </Label>
                <Label title={"Enable PanTilt"}>
                  <Toggle
                    id={'onvif_ptx_enabled_toggle'} 
                    checked={selectedDeviceConfigPTXEnabled} 
                    onClick={() => { this.setState({selectedDeviceConfigPTXEnabled : !this.state.selectedDeviceConfigPTXEnabled,
                                                    selectedDeviceConfigModified : true}); }
                            } 
                  />
                </Label>
              </Column>
              <Column>
                <Label title={"Camera Driver"}>
                  <Select
                    onChange={this.onIDXDriverSelected}
                    value={this.state.selectedDeviceConfigIDXDriver}
                  >
                    {this.createIDXDriverOptions()}
                  </Select>
                </Label>
                <Label title={"PanTilt Driver"}>
                  <Select
                    onChange={this.onPTXDriverSelected}
                    value={this.state.selectedDeviceConfigPTXDriver}
                  >
                    {this.createPTXDriverOptions()}
                  </Select>
                </Label>                
              </Column>
            </Columns>
            <ButtonMenu>
              <Button
                id="new_config_button"
                onClick={this.handleNewConfigClick}
              >
                {"New Config"}
              </Button>
              <Button
                id="delete_config_button"
                onClick={this.handleDeleteConfigClick}
                hidden={!(configuredDevicesUUIDsForListBox.includes(selectedDeviceUUID))}
              >
                {"Delete Config"}
              </Button>
              <Button
                id="apply_changes_button"
                onClick={() => {this.handleUpdateConfigClick(uuid_for_config_text_field)}} 
                style={{color: config_text_color}}
                hidden={!selectedDeviceConfigModified}
              >
                {"Apply Changes"}
              </Button>
            </ButtonMenu>
          </Section>
        </Column>
      </Columns>
    )
  }
};

export default OnvifMgr
