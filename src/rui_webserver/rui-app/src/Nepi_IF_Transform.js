/*
#
# Copyright (c) 2024 Numurus <https://www.numurus.com>.
#
# This file is part of nepi rui (nepi_rui) repo
# (see https://github.com/nepi-engine/nepi_rui)
#
# License: NEPI RUI repo source_ref_description-code and NEPI Images that use this source_ref_description-code
# are licensed under the "Numurus Software License", 
# which can be found at: <https://numurus.com/wp-content/uploads/Numurus-Software-License-Terms.pdf>
#
# Redistributions in source_ref_description code must retain this top-level comment block.
# Plagiarizing this software to sidestep the license obligations is illegal.
#
# Contact Information:
# ====================
# - mailto:nepi@numurus.com
#
 */
import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Styles from "./Styles"
import Input from "./Input"
import Toggle from "react-toggle"
import Select, { Option } from "./Select"


import NepiIFConfig from "./Nepi_IF_Config"
//import Nepi_IF_SaveData from "./Nepi_IF_SaveData"

import { setElementStyleModified, clearElementStyleModified } from "./Utilities"

// Mirrors nepi_nav.NAVPOSE_3D_FRAME_OPTIONS (the reference frame the transform is defined from)
const NAVPOSE_3D_FRAME_OPTIONS = ['base_frame','nepi_frame','sensor_frame','world_frame']

@inject("ros")
@observer

// Navpose Transform
class NepiIFTransform extends Component {
  constructor(props) {
    super(props)

    this.state = {

      transformNamespace: 'None',
      status_msg: null,
      data_msg: null,

      transform_data: null,
      transform_data_copy: null,

      listener: null,

      expanded: true,

      needs_update: false,
      connected: false

    }

    // Fields the user is currently editing, so the 1Hz latched-transform republish
    // does not overwrite in-progress typing (mirrors Nepi_IF_NavPose).
    this.dirtyFields = new Set()

    this.sendTransformUpdateMessage = this.sendTransformUpdateMessage.bind(this)
    this.sendTransformClearMessage = this.sendTransformClearMessage.bind(this)

    this.onUpdateInputTransformValue = this.onUpdateInputTransformValue.bind(this)
    this.onKeySaveInputTransformValue = this.onKeySaveInputTransformValue.bind(this)

    this.onUpdateInputTransformToggle = this.onUpdateInputTransformToggle.bind(this)

    this.onChangeSourceFrame = this.onChangeSourceFrame.bind(this)

    this.renderTransform = this.renderTransform.bind(this)

    this.updateListener = this.updateListener.bind(this)
    this.statusListener = this.statusListener.bind(this)
  }

  // Callback for handling ROS StatusIDX messages
  statusListener(message) {
    const last_transform_data = this.state.transform_data
    this.setState({
      data_msg: message,
      source_ref_description: message.source_ref_description,
      end_ref_description: message.end_ref_description
    })

    const transform_data = {
      source_ref_description: message.source_ref_description,
      end_ref_description: message.end_ref_description,
      x_m: message.x_m,
      y_m: message.y_m,
      z_m: message.z_m,

      x_invert: message.x_invert,
      y_invert: message.y_invert,
      z_invert: message.z_invert,

      roll_deg: message.roll_deg,
      pitch_deg: message.pitch_deg,
      yaw_deg: message.yaw_deg,

      roll_invert: message.roll_invert,
      pitch_invert: message.pitch_invert,
      yaw_invert: message.yaw_invert,

      heading_deg: message.heading_deg,

      heading_invert: message.heading_invert
    }

    // Preserve any fields the user is mid-edit so the republish doesn't reset them
    const transform_data_from_msg = { ...transform_data }
    if (last_transform_data && this.dirtyFields.size > 0) {
      for (const field of this.dirtyFields) {
        if (field in last_transform_data) {
          transform_data[field] = last_transform_data[field]
        }
      }
    }


    if (JSON.stringify(transform_data) !== JSON.stringify(last_transform_data)) {
      this.setState({
        transform_data: transform_data,
        transform_data_copy: transform_data_from_msg
      })
    }

  }

  // Function for configuring and subscribing to StatusIDX
  updateListener(transformNamespace) {
    if (this.state.listener != null) {
      this.state.listener.unsubscribe()
      this.setState({listener: null, 
                    data_msg: null, 
                    transform_data: null,
                    transform_data_copy: null,
                    connected: false})
    }
    if (transformNamespace !== 'None' && transformNamespace != null){
      this.setState({ transformNamespace: transformNamespace  })
      var listener = this.props.ros.setupTransformListener(
        transformNamespace,
        this.statusListener
      )
      this.setState({ listener: listener, disabled: false })
    }

  }



  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const transformNamespace = this.props.transformNamespace
    if (transformNamespace !== this.state.transformNamespace) {
      this.updateListener(transformNamespace)
    }
  }



  componentDidMount(){
    this.setState({needs_update: true})
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to StatusIDX message
  componentWillUnmount() {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
  }







  sendTransformUpdateMessage(transform_data){
    const {sendUpdateTransformMsg, sendTransformMsg} = this.props.ros
    const transformNamespace = this.state.transformNamespace
    if (transform_data == null) {
      return
    }
    // Device (Transform3DIF) mode: publish a plain Transform to set_3d_transform
    if (this.props.device_transform === true) {
      const setNamespace = (this.props.update_namespace !== undefined)? this.props.update_namespace : transformNamespace + "/set_3d_transform"
      sendTransformMsg(setNamespace, transform_data)
      return
    }
    // NavPose-manager mode: publish an UpdateTransform to update_transform
    const updateNamespace = (this.props.update_namespace !== undefined)? this.props.update_namespace : transformNamespace + "/update_transform"
    const frame_name = (this.props.frame_name !== undefined)? this.props.frame_name : ""
    const comp_name = (this.props.comp_name !== undefined)? this.props.comp_name : ""
    const type_name = (this.props.type_name !== undefined)? this.props.type_name : ""
    sendUpdateTransformMsg(updateNamespace,transform_data,frame_name,comp_name,type_name)
  }


  sendTransformClearMessage(){
    const transform_data = this.props.ros.blankTransform
    this.sendTransformUpdateMessage(transform_data)
  }


  onUpdateInputTransformValue(event, name) {
    this.dirtyFields.add(name)
    var transform_data = this.state.transform_data
    transform_data[name] = event.target.value
    this.setState({ transform_data: transform_data })
    setElementStyleModified(event.target)
  }

  onKeySaveInputTransformValue(event, name) {
    var transform_data = this.state.transform_data
    const transform_data_copy = this.state.transform_data_copy
    if(event.key === 'Enter'){
      const value = parseFloat(event.target.value)
      if (isNaN(value)) {
        transform_data[name] = transform_data_copy[name]
      }
      else{
        transform_data[name] = value
      }
      this.dirtyFields.delete(name)
      this.setState({ transform_data: transform_data })
      this.sendTransformUpdateMessage(transform_data)
      clearElementStyleModified(event.target)
    }
    if(event.key === 'Escape'){
      transform_data[name] = transform_data_copy ? transform_data_copy[name] : 0
      this.dirtyFields.delete(name)
      this.setState({ transform_data: transform_data })
      clearElementStyleModified(event.target)
    }
  }


  onUpdateInputTransformToggle(value, name) {
    var transform_data = this.state.transform_data
    transform_data[name] = value
    this.setState({ transform_data: transform_data })
    this.sendTransformUpdateMessage(transform_data)
    //this.render()
  }


  onChangeSourceFrame(event) {
    const frame = event.target.value
    const transformNamespace = this.state.transformNamespace
    if (transformNamespace == null || transformNamespace === 'None') {
      return
    }
    this.props.ros.sendStringMsg(transformNamespace + '/set_source_ref', frame)
  }


  renderTransform() {
    const transform_data = this.props.transform_data !== undefined ? this.props.transform_data : ((this.state.transform_data != null) ? this.state.transform_data : null)


    if (transform_data == null) {

      return(
        <Columns>
          <Column>

          </Column>
        </Columns>
      )

    }
    else {
      const allow_updates = (this.props.allow_updates !== undefined)? this.props.allow_updates : true

      const { userRestricted} = this.props.ros
      const transform_control_restricted = userRestricted.indexOf('SYSTEM-TRANSFORM_CONTROL') !== -1

      const disabled = transform_control_restricted === true && allow_updates === true

      const show_frame_select = (this.props.show_frame_select !== undefined) ? this.props.show_frame_select : false
      const expanded = this.state.expanded !== false

      const msg = ("Source Desc: " + transform_data.source_ref_description +
      "   End Desc: " + transform_data.end_ref_description)

      const tfCols = [
        [
          { field: 'x_m',       label: 'X (m)',    invertField: 'x_invert'     },
          { field: 'y_m',       label: 'Y (m)',    invertField: 'y_invert'     },
          { field: 'z_m',       label: 'Z (m)',    invertField: 'z_invert'     },
        ],
        [
          { field: 'roll_deg',  label: 'Roll (°)', invertField: 'roll_invert'  },
          { field: 'pitch_deg', label: 'Pitch (°)',invertField: 'pitch_invert' },
          { field: 'yaw_deg',   label: 'Yaw (°)',  invertField: 'yaw_invert'   },
        ],
      ]

      const renderTfInput = ({ field, label, invertField }) => (
        <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <label style={{ fontSize: '0.75em', width: '46px', flexShrink: 0 }}>{label}</label>
            <Input
              value={transform_data[field]}
              id={field}
              disabled={disabled === true}
              onChange={(event) => this.onUpdateInputTransformValue(event, field)}
              onKeyDown={(event) => this.onKeySaveInputTransformValue(event, field)}
              style={{ width: '70px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <label style={{ fontSize: '0.7em', width: '46px', flexShrink: 0, color: Styles.vars.colors.grey1 }}>{'Invert'}</label>
            <div style={{ width: '70px', display: 'flex', justifyContent: 'center' }}>
              <Toggle
                disabled={disabled === true}
                checked={transform_data[invertField]}
                onClick={() => this.onUpdateInputTransformToggle(!transform_data[invertField], invertField)}
              />
            </div>
          </div>
        </div>
      )

      return (
        <React.Fragment>

            <label align={"left"} textAlign={"left"} style={{ fontSize: '0.8em', color: Styles.vars.colors.grey1 }}>
            {msg}
            </label>

            {(show_frame_select === true) ?
            <Label title={"Reference Frame"}>
              <Select
                value={transform_data.source_ref_description}
                disabled={disabled === true}
                onChange={this.onChangeSourceFrame}
              >
                {NAVPOSE_3D_FRAME_OPTIONS.map((f) => <Option value={f}>{f}</Option>)}
              </Select>
            </Label>
            : null }

            <div
              style={{ cursor: 'pointer', fontSize: '0.8em', color: Styles.vars.colors.grey1, marginTop: '4px', userSelect: 'none' }}
              onClick={() => this.setState({ expanded: !expanded })}
            >
              {'Transform ' + (expanded ? '▲' : '▼')}
            </div>

            {(expanded === true) ?
            <div style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>{tfCols[0].map(renderTfInput)}</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>{tfCols[1].map(renderTfInput)}</div>
              <div hidden={disabled === true}
                style={{ cursor: 'pointer', fontSize: '0.75em', color: Styles.vars.colors.red, marginTop: '4px', textAlign: 'right', userSelect: 'none' }}
                onClick={() => this.sendTransformClearMessage()}
              >
                {'Clear Transform'}
              </div>
            </div>
            : null }

        </React.Fragment>
      )
    }
  }

  renderConfigs(){
    const configNamespace = this.state.configNamespace ? this.state.configNamespace : this.state.transformNamespace
    return(
      <Columns>
      <Column>


          <NepiIFConfig
                        namespace={configNamespace}
                        title={"Save Camera Frame Transform"}
          />

        </Column>
        </Columns>


    )

  }

  render() {
    const make_section = (this.props.make_section !== undefined) ? this.props.make_section : true
    const transformNamespace = this.state.transformNamespace ? this.state.transformNamespace : 'None'
    const title = this.props.title  ? this.props.title : "NavPose Transform";
    const show_line = (this.props.show_line !== undefined)? this.props.show_line : true
    const show_config = (this.props.show_config !== undefined)? this.props.show_config : false
    const { userRestricted} = this.props.ros
    const transform_view_restricted = userRestricted.indexOf('SYSTEM-TRANSFORM-VIEW') !== -1


    if (transformNamespace == null || transform_view_restricted === true) {

      return(
        <Columns>
          <Column>

          </Column>
        </Columns>
      )

    }
    else if (make_section === false) {
      return (
          <React.Fragment>
                { (show_line === true) ?
                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
                : null }
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {title}
            </label>
            {this.renderTransform()}
            { (show_config === true) ?
                this.renderConfigs()
            : null }

          </React.Fragment>
      )
    }
    else {
      return (
        <Section title={title}>
          {this.renderTransform()}
            { (show_config === true) ?
                this.renderConfigs()
            : null }
        </Section>

      )
    }
    
  }
  }


export default NepiIFTransform