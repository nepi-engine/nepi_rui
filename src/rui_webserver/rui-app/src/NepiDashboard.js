/*
#
# Copyright (c) 2024 Numurus <https://www.numurus.com>.
#
# This file is part of nepi rui (nepi_rui) repo
# (see https://github.com/nepi-engine/nepi_rui)
#
# License: NEPI RUI repo source-code and NEPI Images that use this source-code
# are licensed under the "Numurus Software License", 
# which can be found at: <https://numurus.com/wp-content/uploads/Numurus-Software-License-Terms.pdf>
#
# Redistributions in source code must retain this top-level comment block.
# Plagiarizing this software to sidestep the license obligations is illegal.
#
# Contact Information:
# ====================
# - mailto:nepi@numurus.com
#
 */
import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import Input from "./Input"
import Select, { Option } from "./Select"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Button, { ButtonMenu } from "./Button"
import BooleanIndicator from "./BooleanIndicator"
import Styles from "./Styles"
import {createShortUniqueValues} from "./Utilities"

import NepiMessagesSelector from "./NepiSelectorMessages"


// TODO: This is redundant with the one defined in APP.js
const IS_LOCAL = window.location.hostname === "localhost"

function roundWithSuffix(value, decimals, suffix) {
  return value && (value.toFixed(decimals) + " " + suffix)
}

@inject("ros")
@observer
class NepiDashboard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      saveSettingsFilePrefix: "",
      currDeviceId: "",
      allowFileDeletion: false,
      saveFreq: this.props.ros.saveFreqHz,

      viewableMessages: false,
      selected_message: 'NONE',

    }

  
    this.renderDeviceInfo = this.renderDeviceInfo.bind(this)
    this.renderSystemClock = this.renderSystemClock.bind(this)
    this.renderMgrSystemStatus = this.renderMgrSystemStatus.bind(this)



  }

  getAllNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var allNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      allNamespace = "/" + namespacePrefix + "/" + deviceId + "/messages"
    }
    return allNamespace
  }


  renderDeviceInfo() {
    const {
      //Unused deviceType,
      deviceId,
      deviceSerial,
      systemDefsFirmwareVersion,
    } = this.props.ros
    return (
      <Section title={"Device Info"}>
        <Label title={"Device ID"}>
          <Input disabled value={deviceId} />
        </Label>
        <Label title={"Serial Number"}>
          <Input disabled value={deviceSerial} />
        </Label>
        <Label title={"Firmware"}>
          <Input disabled value={systemDefsFirmwareVersion} />
        </Label>

        <pre style={{ height: "71px", overflowY: "auto" }}>
            {""}
          </pre>

      </Section>
    )
  }

  renderdeviceInfo() {
    const {
      deviceConnected,
      deviceType,
      deviceFirmwareVersion,
      eggFirmwareVersion,
    } = this.props.ros
    return (
      <Section title={"device Info"}>
        <Label title={"Connected"}>
          <BooleanIndicator value={deviceConnected} />
        </Label>
        <Label title={"Type"}>
          <Input disabled value={deviceType} />
        </Label>
        <Label title={"Firmware"}>
          <Input disabled value={deviceFirmwareVersion} />
        </Label>
        <Label title={"Sensor Firmware"}>
          <Input disabled value={eggFirmwareVersion} />
        </Label>
        
      </Section>
    )
  }


  
  
  renderSystemClock() {
    const {
      timeMgrStatus,
      systemManagesTime,
      clockNTP,
      syncTime2Device,
      systemRestrictions,
      timeStatusTime,
      timeStatusTimeStr,
      timeStatusDateStr,
      timeStatusTimezoneDesc,
    } = this.props.ros


  
 
    var time_str = ""
    var date_str = ""
    var timezone = ""

    var time_sync_restricted = true
    var clock_synced = false
    var auto_sync_clocks = false
    var show_sync_button = false

    if (timeMgrStatus != null){
      time_sync_restricted = systemRestrictions.indexOf('Time_Sync_Clocks') !== -1
      clock_synced = timeMgrStatus.clock_synced
      auto_sync_clocks = timeMgrStatus.auto_sync_clocks
      show_sync_button = (IS_LOCAL === false && systemManagesTime === true && clock_synced === false && auto_sync_clocks === false && time_sync_restricted === false )
      time_str = timeStatusTimeStr
      date_str = timeStatusDateStr
      timezone = timeStatusTimezoneDesc
    }
    
    return (
      <Section title={"System Clock"}>
        <Label title={"Clock Synced"}>
          <BooleanIndicator value={clock_synced} />
        </Label>
        <Label title={"NTP Status"}>
          <BooleanIndicator value={clockNTP} />
        </Label>
        <Label title={"Time"}>
          <Input disabled value={time_str} />
        </Label>
        <Label title={"Date"}>
          <Input disabled value={date_str} />
        </Label>
        <Label title={"Timezone"}>
          <Input disabled value={timezone} />
        </Label>

        <div hidden={show_sync_button===false}>
    

            <Columns>
            <Column>


              <ButtonMenu>
                <Button onClick={syncTime2Device}>{"Sync Clocks"}</Button>
              </ButtonMenu>


            </Column >
            <Column>


            </Column>
            </Columns>
        </div>




      </Section>
    )
  }

  renderMgrSystemStatus() {
    const {
      hearbeatNepi,
      systemStatusDiskUsageMB,
      systemStatusTempC,
      systemDefsDiskCapacityMB,
      //Unused diskUsagePercent
    } = this.props.ros

    const { wifi_query_response } = this.props.ros
    const internet_connected = (wifi_query_response !== null)? wifi_query_response.internet_connected : false
    
    const sys_debug = this.props.ros.systemDebugEnabled
    //Unused const debug_mode = sys_debug ? sys_debug : false
    return (
      <Section title={"System Status"}>
        <Label title={"Heartbeat"}>
          <BooleanIndicator value={hearbeatNepi} />
        </Label>
        
        <Label title={"Temperature"}>
          <Input disabled value={roundWithSuffix(systemStatusTempC, 1, "\u00B0C")} />
        </Label>

        <Label title={"Capacity"}>
          <Input disabled value={roundWithSuffix(systemDefsDiskCapacityMB / 1000.0, 1, "GB")} />
        </Label>

        {/*
        <Label title={"AVAILABLE"}>
          <Input disabled value={1 -diskUsagePercent} />
        </Label>
        */}

        <Label title={"Used"}>
          <Input disabled value={roundWithSuffix(systemStatusDiskUsageMB / 1000.0, 1, "GB")} />
        </Label>


        <Label title={"Internet Connected"}>
          <BooleanIndicator value={internet_connected} />
        </Label>


        <pre style={{ height: "0px", overflowY: "auto" }}>
            {""}
          </pre>

      </Section>
    )
  }


  render() {
    return (
    <React.Fragment>

      <Columns>
        <Column>
          {this.renderDeviceInfo()}



        </Column>
        <Column>
          {this.renderMgrSystemStatus()}


        </Column>
        <Column>
        {this.renderSystemClock()}

        </Column>
      </Columns>

      <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

      <NepiMessagesSelector
        title={"NepiMessagesSelector.js"}
        />

    </React.Fragment>


    )
  }
}

export default NepiDashboard
