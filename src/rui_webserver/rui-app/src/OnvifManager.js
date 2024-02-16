/*
 * NEPI Dual-Use License
 * Project: nepi_rui
 *
 * This license applies to any user of NEPI Engine software
 *
 * Copyright (C) 2023 Numurus, LLC <https://www.numurus.com>
 * see https://github.com/numurus-nepi/nepi_rui
 *
 * This software is dual-licensed under the terms of either a NEPI software developer license
 * or a NEPI software commercial license.
 *
 * The terms of both the NEPI software developer and commercial licenses
 * can be found at: www.numurus.com/licensing-nepi-engine
 *
 * Redistributions in source code must retain this top-level comment block.
 * Plagiarizing this software to sidestep the license obligations is illegal.
 *
 * Contact Information:
 * ====================
 * - https://www.numurus.com/licensing-nepi-engine
 * - mailto:nepi@numurus.com
 *
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
import BooleanIndicator from "./BooleanIndicator"
import Styles from "./Styles"


@inject("ros")
@observer
class OnvifManager extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedDeviceUUID: null,
      
      selectedDeviceConfigModified: false,

      selectedDeviceConfigUUID: '',
      selectedDeviceConfigUsername: '',
      selectedDeviceConfigPassword: '',
      selectedDeviceConfigBasename: '',
      selectedDeviceConfigIDXEnabled: false,
      selectedDeviceConfigPTXEnabled: false
    };

    this.handleUUIDSelection = this.handleUUIDSelection.bind(this)
    this.handleNewConfigClick = this.handleNewConfigClick.bind(this)
    this.handleUpdateConfigClick = this.handleUpdateConfigClick.bind(this)
    this.handleDeleteConfigClick = this.handleDeleteConfigClick.bind(this)
    this.onChangeTextField = this.onChangeTextField.bind(this)
  }

  handleUUIDSelection(item) {
    const { onvifDeviceConfigs } = this.props.ros;
    let selectedConfig = null
    for (let i = 0; i < onvifDeviceConfigs.length; i++) {
      const config = onvifDeviceConfigs[i]
      const uuid = config.uuid
      if (uuid === item) {
        selectedConfig = config
        break
      }
    }

    this.setState({ 
      selectedDeviceUUID: item,

      selectedDeviceConfigModified: false,
      selectedDeviceConfigUUID: selectedConfig? selectedConfig.uuid : '',
      selectedDeviceConfigUsername: selectedConfig? selectedConfig.username : '',
      selectedDeviceConfigPassword: selectedConfig? selectedConfig.password : '',
      selectedDeviceConfigBasename: selectedConfig? selectedConfig.node_base_name : '',
      selectedDeviceConfigIDXEnabled: selectedConfig? selectedConfig.idx_enabled : false,
      selectedDeviceConfigPTXEnabled: selectedConfig? selectedConfig.ptx_enabled : false
    });
  };

  handleNewConfigClick() {
    this.setState({
      selectedDeviceUUID: null,
      selectedDeviceConfigModified: true,
      selectedDeviceConfigUUID: 'XXXX-XXXX-XXXX-XXXXXXXXXXXX',
      selectedDeviceConfigUsername: 'admin',
      selectedDeviceConfigPassword: 'admin',
      selectedDeviceConfigBasename: 'new_onvif_device',
      selectedDeviceIDXEnabled: false,
      selectedDevicePTXEnabled: false
    })
  }

  async handleUpdateConfigClick(uuid) {
    const { callOnvifDeviceListQueryService } = this.props.ros
    let updated_config = {
      uuid : uuid,
      username : this.state.selectedDeviceConfigUsername,
      password : this.state.selectedDeviceConfigPassword,
      node_base_name : this.state.selectedDeviceConfigBasename,
      idx_enabled : this.state.selectedDeviceConfigIDXEnabled,
      ptx_enabled : this.state.selectedDeviceConfigPTXEnabled
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
      selectedDeviceConfigUsername: '',
      selectedDeviceConfigPassword: '',
      selectedDeviceConfigBasename: '',
      selectedDeviceConfigIDXEnabled: false,
      selectedDeviceConfigPTXEnabled: false
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

  render() {
    const { onvifDeviceStatuses, onvifDeviceConfigs } = this.props.ros;
    const { selectedDeviceUUID, 
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
    if (onvifDeviceStatuses !== null) {
      for (let i = 0; i < onvifDeviceStatuses.length; i++) {
        const status = onvifDeviceStatuses[i]
        const uuid = status.uuid
        detectedDeviceUUIDsForListBox.push(uuid)
        if ((selectedDeviceUUID !== null) && (uuid === selectedDeviceUUID)) {
          selectedDeviceStatus = status
        }
      }
    }

    let configuredDevicesUUIDsForListBox = []
    if (onvifDeviceConfigs !== null) {
      for (let i = 0; i < onvifDeviceConfigs.length; i++) {
        const config = onvifDeviceConfigs[i]
        const uuid = config.uuid
        configuredDevicesUUIDsForListBox.push(uuid)
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
              items={detectedDeviceUUIDsForListBox} 
              selectedItem={selectedDeviceUUID} 
              onSelect={this.handleUUIDSelection} 
              style={{ color: 'black', backgroundColor: 'white' }}
            />
          </Section>
        </Column>
        <Column>
          <Section title={"Configured Devices"}>
            <ListBox 
              id="runningScriptsListBox" 
              items={configuredDevicesUUIDsForListBox} 
              selectedItem={selectedDeviceUUID}
              onSelect={this.handleUUIDSelection} 
              style={{ color: 'black', backgroundColor: 'white' }} 
            />
          </Section>
        </Column>
        <Column equalWidth={false}>
          <Section title={selectedDeviceUUID? selectedDeviceUUID : ''}>
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
                <Label title={"IDX Running"}>
                  <BooleanIndicator value={selectedDeviceStatus? selectedDeviceStatus.idx_node_running : ''} />
                </Label>
                <Label title={"Connected"}>
                  <BooleanIndicator value={selectedDeviceStatus? selectedDeviceStatus.connectable : ''} />
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
                <Label title={"PTX Running"}>
                  <BooleanIndicator value={selectedDeviceStatus? selectedDeviceStatus.ptx_node_running : ''} />
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
            <Label title={"Username"}>
              <Input
                id={'onvif_username_textbox'} 
                value={selectedDeviceConfigUsername} 
                style={{width: '100%', color: config_text_color, fontWeight: config_text_weight}}
                onChange={this.onChangeTextField}
              />
            </Label>
            <Label title={"Password"}>
              <Input
                id={'onvif_password_textbox'} 
                value={selectedDeviceConfigPassword} 
                style={{width: '100%', color: config_text_color, fontWeight: config_text_weight}}
                onChange={this.onChangeTextField}
              />
            </Label>
            <Label title={"Basename"}>
              <Input
                id={'node_base_name_texbox'} 
                value={selectedDeviceConfigBasename} 
                style={{width: '100%', color: config_text_color, fontWeight: config_text_weight}}
                onChange={this.onChangeTextField}
              />
            </Label>
            <Columns>
              <Column>
                <Label title={"IDX Enabled"}>
                  <Toggle
                    id={'onvif_idx_enabled_toggle'} 
                    checked={selectedDeviceConfigIDXEnabled} 
                    onClick={() => { this.setState({selectedDeviceConfigIDXEnabled : !this.state.selectedDeviceConfigIDXEnabled,
                                                    selectedDeviceConfigModified : true}); }
                            }
                  />
                </Label>
              </Column>
              <Column>
                <Label title={"PTX Enabled"}>
                  <Toggle
                    id={'onvif_ptx_enabled_toggle'} 
                    checked={selectedDeviceConfigPTXEnabled} 
                    onClick={() => { this.setState({selectedDeviceConfigPTXEnabled : !this.state.selectedDeviceConfigPTXEnabled,
                                                    selectedDeviceConfigModified : true}); }
                            } 
                  />
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

export default OnvifManager;
