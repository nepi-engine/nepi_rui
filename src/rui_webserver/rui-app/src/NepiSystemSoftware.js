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
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Button, { ButtonMenu } from "./Button"
import Select, { Option } from "./Select"
import Styles from "./Styles"

import { createMenuListFromStrList } from "./Utilities"


@inject("ros")
@observer
class NepiSystemSoftware extends Component {
    constructor(props) {
        super(props)
    
        this.renderSysSoftwareUpdate = this.renderSysSoftwareUpdate.bind(this),
        this.onImageTopicSelected = this.onImageTopicSelected.bind(this),
        this.state = {
          selected_source_control: null
        }
    }

    renderSysPartitionSettings() {
      const status_msg = this.props.ros.status_msg
      const { onSwitchNepitImage } = this.props.ros


      const active_str = status_msg? status_msg.active_rootfs + ": " + status_msg.firmware_version : ""
      const inactive_str = status_msg? status_msg.inactive_rootfs + ": " + status_msg.inactive_rootfs_fw_version : ""

      const stale_active_inactive = status_msg && (status_msg.warnings.flags[3] === true)
      var active_inactive_style = {width: '100%'}
      if (stale_active_inactive === true) {
        active_inactive_style["color"] = Styles.vars.colors.red
        active_inactive_style["fontWeight"] = "bold"
      }

      return (
        <Section title={"A/B File System Settings"}>
          <Label title={"Active"}>
            <Input disabled value={active_str} style={active_inactive_style}/>
          </Label>
          <Label title={"Inactive"}>
            <Input disabled value={inactive_str} style={active_inactive_style}/>
          </Label>
          <Label title={"Max Boot Fail Count"}>
            <Input disabled value={status_msg? status_msg.max_boot_fail_count : ""} style={{width: '100%'}}/>
          </Label>
          <ButtonMenu>
            <Button onClick={onSwitchNepitImage}>{"Switch Active/Inactive"}</Button>
          </ButtonMenu>                    
        </Section>

      )
    }


  // Handler for Image topic selection
  onImageTopicSelected(event) {
    const { sendStringMsg } = this.props.ros

    var ind = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[ind].text
    var value = event.target.value

    const { namespacePrefix, deviceId } = this.props.ros
    const namespace = '/' + namespacePrefix + '/' + deviceId + '/' + 'select_nepi_image'
    sendStringMsg(namespace, value)
  }


    renderSysSoftwareUpdate() {
      const status_msg = this.props.ros.status_msg
      const { onInstallFullSysImg } = this.props.ros

      const selected_image = status_msg.sys_img_update_selected
      const NoneOption = <Option>None</Option>

      
      const systemSoftwareInstallMenu = createMenuListFromStrList(status_msg.systemSoftwareInstallOptions,false,[],[],[])
      

      return (
        <Section title={"NEPI Image Import"}>
          <Label title={"Select Source"}>
            <Select
              id="selected_source_control"
              onChange={this.onImageTopicSelected}
              value={selected_image}
            >
              {status_msg.systemSoftwareInstallOptions ? systemSoftwareInstallMenu : NoneOption}
            </Select>
          </Label>
          <Label title={"Image Filename"}>
            <Input disabled value={status_msg? status_msg.new_sys_img : ""} style={{width: '100%'}}/>
          </Label>
          <Label title={"Image Version"}>
            <Input disabled value={status_msg? status_msg.new_sys_img_version : ""} style={{width: '100%'}}/>
          </Label>
          <Label title={"Image Size"}>
            <Input disabled value={status_msg? status_msg.new_sys_img_size_mb.toFixed(0) + "GB" : ""} style={{width: '100%'}}/>
          </Label>
          <Label title={"Status"}>
            <Input disabled value={status_msg? status_msg.sys_img_update_status : ""} style={{width: '100%'}}/> 
          </Label>
          <Label title={"Progress"}>
            <progress value={status_msg? status_msg.sys_img_update_progress : 0.0} style={{width: '100%'}}/>
          </Label>          
          <ButtonMenu>
            {/*<Button onClick={callSoftwareStatusQueryService}>{"Check"}</Button>*/}
            {(status_msg && (status_msg.new_sys_img !== 'none detected')) &&
                <Button onClick={() => onInstallFullSysImg(status_msg.new_sys_img)}>{"Install"}</Button>
            }
          </ButtonMenu>
        </Section>
      )
    }

    renderSysArchive() {
      const {onStartSysBackup} = this.props.ros
      const status_msg = this.props.ros.status_msg

      // const formatMbToGb = (mb) => (mb / 1024).toFixed(2);

      // const active_rootfs_size_gb = formatMbToGb(status_msg.active_rootfs_size_mb);

      // const new_sys_img_staging_free_gb = formatMbToGb(status_msg.new_sys_img_staging_free_mb);


      


      const source_str = status_msg? 
        status_msg.active_rootfs + ":  (" + status_msg.active_rootfs_size_mb + "GB)": 
        ""
      
      const dest_str = status_msg?
        status_msg.new_sys_img_staging + ":  (" + status_msg.new_sys_img_staging_free_mb + "GB free)":
        ""
      
        return (
        <Section title={"NEPI Image Export"}>
          <Label title={"Source"}>
            <Input disabled value={source_str} style={{width: '100%'}}/>
          </Label>
          <Label title={"Destination"}>
            <Input disabled value={dest_str} style={{width: '100%'}}/>
          </Label>
          <Label title={"Archive Filename"}>
            <Input disabled value={status_msg? status_msg.sys_img_archive_filename : ""} style={{width: '100%'}}/>
          </Label>
          <Label title={"Status"}>
            <Input disabled value={status_msg? status_msg.sys_img_archive_status : ""} style={{width: '100%'}}/> 
          </Label>
          <Label title={"Progress"}>
            <progress value={status_msg? status_msg.sys_img_archive_progress : 0.0} style={{width: '100%'}}/>
          </Label>
          <ButtonMenu>
            <Button onClick={() => onStartSysBackup()}>{"Archive"}</Button>
          </ButtonMenu>  
        </Section>
      )
    }

    render() {

      const {
        status_msg
      } = this.props.ros
      return (
        <Columns>
        <Column>
          {status_msg.has_ab_fs && this.renderSysPartitionSettings()}
          {this.renderSysArchive()}
        </Column>
        <Column>
          {this.renderSysSoftwareUpdate()}  
        </Column>
      </Columns>

      )
    }
}

export default NepiSystemSoftware
