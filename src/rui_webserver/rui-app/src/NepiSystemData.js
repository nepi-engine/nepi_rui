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
import Toggle from "react-toggle"
import { observer, inject } from "mobx-react"

import Input from "./Input"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Button, { ButtonMenu } from "./Button"
import Styles from "./Styles"

import NepiIFSaveData from "./Nepi_IF_SaveData"




// TODO: This is redundant with the one defined in APP.js
//const IS_LOCAL = window.location.hostname === "localhost"

function roundWithSuffix(value, decimals, suffix) {
  return value && (value.toFixed(decimals) + " " + suffix)
}

@inject("ros")
@observer
class DataMgr extends Component {
  constructor(props) {
    super(props)

    this.state = {
      saveSettingsFilePrefix: "",
      currDeviceId: "",
      allowFileDeletion: false,
      saveRate: this.props.ros.saveRateHz,

      viewableSaves: false,
      selected_save: 'NONE'

    }
    this.getBaseNamespace = this.getBaseNamespace.bind(this)
    this.getAllNamespace = this.getAllNamespace.bind(this)

    this.renderSavePanel = this.renderSavePanel.bind(this)

    this.onToggleDataDeletion = this.onToggleDataDeletion.bind(this)


    
  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId 
    }
    return baseNamespace
  }

  getAllNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var allNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      allNamespace = "/" + namespacePrefix + "/" + deviceId + '/save_data'
    }
    return allNamespace
  }




  onToggleDataDeletion(e) {
    this.setState({ allowFileDeletion: e.target.checked})
  }

  onToggleSaveData(e){
    const { onToggleSaveDataAll} = this.props.ros
    const checked = e.target.checked
    onToggleSaveDataAll(checked)
  }


  renderSavePanel() {
    const {
      systemStatusDiskUsageMB,
      systemDefsDiskCapacityMB,
      systemStatusDiskRate,
      diskUsagePercent,
      deleteAllData
    } = this.props.ros

    const avail_gb = (systemDefsDiskCapacityMB - systemStatusDiskUsageMB) / 1000

    return (
      <React.Fragment>
        <Label title={"Storage"}>
          <Input disabled value={diskUsagePercent} />
        </Label>

        <Label title={"Capacity"}>
          <Input disabled value={roundWithSuffix(systemDefsDiskCapacityMB / 1000.0, 1, "GB")} />
        </Label>

        <Label title={"Used"}>
          <Input disabled value={roundWithSuffix(systemStatusDiskUsageMB / 1000.0, 1, "GB")} />
        </Label>

        <Label title={"Available"}>
          <Input disabled value={roundWithSuffix(avail_gb, 1, "GB")} />
        </Label>

        <Label title={"Disk Usage Rate"}>
          <Input disabled value={roundWithSuffix(systemStatusDiskRate, 3, "MB/s")} />
        </Label>


     <Label title={"Allow Data Deletion"}>
          <Toggle onClick={this.onToggleDataDeletion} />
        </Label>
        <ButtonMenu>
          <Button
            onClick={deleteAllData}
            hidden={!this.state.allowFileDeletion}>
            {"Delete All Data"}
          </Button>
        </ButtonMenu>

        <pre style={{ height: "34px", overflowY: "auto" }}>
            {""}
          </pre>

        <div hidden={(this.state.allowFileDeletion)}>
        <pre style={{ height: "19px", overflowY: "auto" }}>
            {""}
          </pre>
          </div>

      </React.Fragment>
    )
  }




  //disabled={document.getElementById("toggle_save_data").value}>

  render() {

    return (
      <React.Fragment>


      <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>



          <div style={{ display: 'flex' }}>

              <div style={{ width: "73%" }}>


            <NepiIFSaveData
            saveNamespace={this.getAllNamespace()}
            always_show_controls={true}
            make_section={true}
            />

              </div>


              <div style={{ width: '2%' }}>
                    {}
              </div>



              <div style={{ width: "25%"}}>

                <Section title={"Save Data Status"}>

                   {this.renderSavePanel()}

                        
                   </Section>


              </div>

        </div>


    </React.Fragment>


    )
  }
}

export default DataMgr
