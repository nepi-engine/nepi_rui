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
      const softwareMgrStatus = this.props.ros.softwareMgrStatus
      const { onSwitchNepitImage } = this.props.ros


      const active_str = softwareMgrStatus? softwareMgrStatus.active_rootfs + ": " + softwareMgrStatus.firmware_version : ""
      const inactive_str = softwareMgrStatus? softwareMgrStatus.inactive_rootfs + ": " + softwareMgrStatus.inactive_rootfs_fw_version : ""

      const stale_active_inactive = softwareMgrStatus && (softwareMgrStatus.warnings.flags[3] === true)
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
            <Input disabled value={softwareMgrStatus? softwareMgrStatus.max_boot_fail_count : ""} style={{width: '100%'}}/>
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
      const softwareMgrStatus = this.props.ros.softwareMgrStatus
      const { onInstallFullSysImg } = this.props.ros

      const selected_image = softwareMgrStatus.sys_img_update_selected
      const NoneOption = <Option>None</Option>

      
      const systemSoftwareInstallMenu = createMenuListFromStrList(softwareMgrStatus.softwareInstallOptions,false,[],[],[])
      

      return (
        <Section title={"NEPI Image Import"}>
          <Label title={"Select Source"}>
            <Select
              id="selected_source_control"
              onChange={this.onImageTopicSelected}
              value={selected_image}
            >
              {softwareMgrStatus.systemSoftwareInstallOptions ? systemSoftwareInstallMenu : NoneOption}
            </Select>
          </Label>
          <Label title={"Image Filename"}>
            <Input disabled value={softwareMgrStatus? softwareMgrStatus.new_sys_img : ""} style={{width: '100%'}}/>
          </Label>
          <Label title={"Image Version"}>
            <Input disabled value={softwareMgrStatus? softwareMgrStatus.new_sys_img_version : ""} style={{width: '100%'}}/>
          </Label>
          <Label title={"Image Size"}>
            <Input disabled value={softwareMgrStatus? softwareMgrStatus.new_sys_img_size_mb.toFixed(0) + "GB" : ""} style={{width: '100%'}}/>
          </Label>
          <Label title={"Status"}>
            <Input disabled value={softwareMgrStatus? softwareMgrStatus.sys_img_update_status : ""} style={{width: '100%'}}/> 
          </Label>
          <Label title={"Progress"}>
            <progress value={softwareMgrStatus? softwareMgrStatus.sys_img_update_progress : 0.0} style={{width: '100%'}}/>
          </Label>          
          <ButtonMenu>
            {/*<Button onClick={callSoftwareStatusQueryService}>{"Check"}</Button>*/}
            {(softwareMgrStatus && (softwareMgrStatus.new_sys_img !== 'none detected')) &&
                <Button onClick={() => onInstallFullSysImg(softwareMgrStatus.new_sys_img)}>{"Install"}</Button>
            }
          </ButtonMenu>
        </Section>
      )
    }

    renderSysArchive() {
      const {onStartSysBackup} = this.props.ros
      const softwareMgrStatus = this.props.ros.softwareMgrStatus

      // const formatMbToGb = (mb) => (mb / 1024).toFixed(2);

      // const active_rootfs_size_gb = formatMbToGb(softwareMgrStatus.active_rootfs_size_mb);

      // const new_sys_img_staging_free_gb = formatMbToGb(softwareMgrStatus.new_sys_img_staging_free_mb);


      


      const source_str = softwareMgrStatus? 
        softwareMgrStatus.active_rootfs + ":  (" + softwareMgrStatus.active_rootfs_size_mb + "GB)": 
        ""
      
      const dest_str = softwareMgrStatus?
        softwareMgrStatus.new_sys_img_staging + ":  (" + softwareMgrStatus.new_sys_img_staging_free_mb + "GB free)":
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
            <Input disabled value={softwareMgrStatus? softwareMgrStatus.sys_img_archive_filename : ""} style={{width: '100%'}}/>
          </Label>
          <Label title={"Status"}>
            <Input disabled value={softwareMgrStatus? softwareMgrStatus.sys_img_archive_status : ""} style={{width: '100%'}}/> 
          </Label>
          <Label title={"Progress"}>
            <progress value={softwareMgrStatus? softwareMgrStatus.sys_img_archive_progress : 0.0} style={{width: '100%'}}/>
          </Label>
          <ButtonMenu>
            <Button onClick={() => onStartSysBackup()}>{"Archive"}</Button>
          </ButtonMenu>  
        </Section>
      )
    }

    render() {

      const {
        softwareMgrStatus
      } = this.props.ros

      if (softwareMgrStatus == null){
        return (
            <Columns>
            <Column>

            </Column>
          </Columns>
        )
      }
      else{
        return (
          <Columns>
          <Column>
            {softwareMgrStatus.has_ab_fs && this.renderSysPartitionSettings()}
            {this.renderSysArchive()}
          </Column>
          <Column>
            {this.renderSysSoftwareUpdate()}  
          </Column>
        </Columns>

        )
      }
    }
}

export default NepiSystemSoftware
