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

import Section from "./Section"
//import EnableAdjustment from "./EnableAdjustment"
import Button from "./Button"
import Select, { Option } from "./Select"
import Toggle from "react-toggle"
import Label from "./Label"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
import Input from "./Input"

import { onChangeSwitchStateValue, createMenuBaseName as createMenuBaseNameUtil, setElementStyleModified, clearElementStyleModified } from "./Utilities"

import NepiIFNavPose from "./Nepi_IF_NavPose"
import NepiIFConfig from "./Nepi_IF_Config"

function createMenuBaseName(optionStr) {
  var parts = optionStr.split('/')
  if (parts.length > 3) {
    var sliced = parts.slice(3)
    if (sliced[0] === 'app_nav_sim' && sliced.length > 1) {
      return sliced[1] + ' sim'
    }
  }
  return createMenuBaseNameUtil(optionStr)
}


@inject("ros")
@observer


class NavPoseMgr extends Component {
  constructor(props) {
    super(props)

    this.state = {
      mgrName: "navpose_mgr",

      selected_frame: 'None',
      selected_frame_name: 'None',
      selected_frame_topic: null,
      selected_frame_solution: null,

      selected_topic_config: 'init',
      selected_frame_ind: -1,

      show_fixed: false,
      show_init: false,
      show_source_replace: false,
      show_source_offset: false,
      show_update_offset: false,
      show_update_reset: false,

      show_edit_frames: false,
      edit_frame_name: '',
      next_custom_num: 1,

      transform_expanded: {},

      connected: false,
      connectedToNavposeMgr: false,

      needs_update: true,

    }

    this.checkConnection = this.checkConnection.bind(this)

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
    this.getMgrNamespace = this.getMgrNamespace.bind(this)

    this.renderFrameSelection = this.renderFrameSelection.bind(this)
    this.renderFrameConfig = this.renderFrameConfig.bind(this)
    this.renderFrameNavPoseComps = this.renderFrameNavPoseComps.bind(this)
    this.renderNavPoseMgr = this.renderNavPoseMgr.bind(this)

    this.onSelectFrame = this.onSelectFrame.bind(this)
  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId 
    }
    return baseNamespace
  }

  getMgrNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var namespace = null
    if (namespacePrefix !== null && deviceId !== null){
      namespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.mgrName
    }
    return namespace
  }




  async checkConnection() {
    const { connectedToNepi, connectedToNavposeMgr } = this.props.ros
    if (this.state.connectedToNepi !== connectedToNepi) {
      this.setState({
        connectedToNepi: connectedToNepi,
        status_msg: null,
        selected_frame: 'None',
        selected_frame_topic: null,
        selected_frame_solution: null,
        selected_frame_ind: -1,
        needs_update: true
      })
    }
    if (this.state.connectedToNavposeMgr !== connectedToNavposeMgr) {
      this.setState({
        connectedToNavposeMgr: connectedToNavposeMgr,
        connected: connectedToNavposeMgr === true,
        needs_update: true
      })
    }

    setTimeout(async () => {
      await this.checkConnection()
    }, 1000)
  }


  componentDidMount(){
    this.checkConnection()
  }

  componentDidUpdate(prevProps, prevState) {
    const { navpose_frames, navpose_frames_topics, navpose_frames_solutions } = this.props.ros
    if (this.state.needs_update === true) {
      this.setState({needs_update: false})
    }
    // Auto-select first frame when frames become available and none is selected
    if (
      this.state.selected_frame_topic === null &&
      navpose_frames && navpose_frames.length > 0
    ) {
      this.setState({
        selected_frame: navpose_frames[0],
        selected_frame_name: navpose_frames[0],
        selected_frame_topic: navpose_frames_topics[0],
        selected_frame_solution: navpose_frames_solutions[0],
        selected_frame_ind: 0
      })
    }
    // Mirror selected frame name into the edit box when selection changes
    if (prevState.selected_frame !== this.state.selected_frame && this.state.selected_frame !== 'None') {
      this.setState({ edit_frame_name: this.state.selected_frame })
    }
    // Keep next_custom_num above any existing custom_N frames
    if (this.props.ros.navpose_frames !== prevProps.ros.navpose_frames) {
      let maxN = 0
      for (const f of (navpose_frames || [])) {
        const m = f.match(/^custom_(\d+)$/)
        if (m) maxN = Math.max(maxN, parseInt(m[1], 10))
      }
      if (maxN + 1 > this.state.next_custom_num) {
        this.setState({ next_custom_num: maxN + 1 })
      }
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    this.setState({connected: false})
  }



  ////////////////////////////////////////////////

  onSelectFrame(ind) {
    const { navpose_frames, navpose_frames_topics, navpose_frames_solutions } = this.props.ros
    if (ind < 0 || ind >= navpose_frames.length) {
      this.setState({
        selected_frame: 'None',
        selected_frame_name: 'None',
        selected_frame_topic: null,
        selected_frame_solution: null,
        selected_frame_ind: -1
      })
    } else {
      this.setState({
        selected_frame: navpose_frames[ind],
        selected_frame_name: navpose_frames[ind],
        selected_frame_topic: navpose_frames_topics[ind],
        selected_frame_solution: navpose_frames_solutions[ind],
        selected_frame_ind: ind
      })
    }
  }
  
 

  renderFrameSelection() {
    const { navpose_frames, navpose_frames_topics } = this.props.ros
    const { selected_frame, selected_frame_topic, show_edit_frames, edit_frame_name, next_custom_num } = this.state
    const mgrNamespace = this.getMgrNamespace()
    const hasSelection = selected_frame_topic !== null && selected_frame !== 'None'
    const canDelete = hasSelection && selected_frame !== 'base_frame'
    const customName = 'custom_' + next_custom_num

    const onNew = () => {
      this.props.ros.sendUpdateStringMsg(mgrNamespace + '/add_frame', customName, customName)
      this.setState({ next_custom_num: next_custom_num + 1 })
    }

    const onCopy = () => {
      this.props.ros.sendUpdateStringMsg(mgrNamespace + '/copy_frame', customName, selected_frame)
      this.setState({ next_custom_num: next_custom_num + 1 })
    }

    const onDelete = () => {
      this.props.ros.sendStringMsg(mgrNamespace + '/delete_frame', selected_frame)
    }

    const onRename = (newName) => {
      if (newName && newName !== selected_frame) {
        this.props.ros.sendUpdateStringMsg(mgrNamespace + '/rename_frame', selected_frame, newName)
      }
    }

    return (
      <React.Fragment>

        <Label title={"Edit Frames"}>
          <Toggle
            checked={show_edit_frames}
            onClick={() => this.setState({ show_edit_frames: !show_edit_frames })}
          />
        </Label>

        {show_edit_frames && (
          <div style={{ marginTop: Styles.vars.spacing.xs }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: Styles.vars.spacing.xs }}>
              <label style={{ fontSize: '0.85em', whiteSpace: 'nowrap' }}>{'Name'}</label>
              <Input
                id={'NavPoseFrameName'}
                style={{ flex: 1, minWidth: 0 }}
                value={edit_frame_name}
                onChange={(e) => {
                  const el = document.getElementById('NavPoseFrameName')
                  setElementStyleModified(el)
                  this.setState({ edit_frame_name: e.target.value })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const el = document.getElementById('NavPoseFrameName')
                    clearElementStyleModified(el)
                    onRename(el.value)
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: Styles.vars.spacing.small }}>
              <Button style={{ flex: 1, padding: '2px 0', fontSize: '0.8em' }} onClick={onNew}>
                {'New'}
              </Button>
              <Button
                style={{ flex: 1, padding: '2px 0', fontSize: '0.8em', opacity: hasSelection ? 1 : 0.4 }}
                disabled={!hasSelection}
                onClick={onCopy}
              >
                {'Copy'}
              </Button>
              <Button
                style={{ flex: 1, padding: '2px 0', fontSize: '0.8em', opacity: canDelete ? 1 : 0.4 }}
                disabled={!canDelete}
                onClick={onDelete}
              >
                {'Delete'}
              </Button>
            </div>
          </div>
        )}

        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Select NavPose Frame"}
        </label>

        <div style={{ marginTop: Styles.vars.spacing.medium }}>
          {(navpose_frames && navpose_frames.length > 0)
            ? navpose_frames.map((name, i) => (
                <div
                  key={navpose_frames_topics[i]}
                  onClick={() => this.onSelectFrame(i)}
                  style={{
                    textAlign: "center",
                    padding: `${Styles.vars.spacing.xs}`,
                    color: Styles.vars.colors.black,
                    backgroundColor: (navpose_frames_topics[i] === selected_frame_topic)
                      ? Styles.vars.colors.blue
                      : Styles.vars.colors.grey0,
                    cursor: "pointer",
                    marginBottom: "2px"
                  }}>
                  {name}
                </div>
              ))
            : <div style={{color: Styles.vars.colors.grey}}> {'None'} </div>
          }
        </div>
      </React.Fragment>
    )
  }


    renderFrameNavPoseComps() {

    const { selected_frame_topic, selected_frame_ind } = this.state
    const { navpose_frames_solutions } = this.props.ros

    const live_solution = (selected_frame_ind >= 0 && navpose_frames_solutions)
      ? navpose_frames_solutions[selected_frame_ind]
      : null

    if (live_solution == null || selected_frame_topic == null){

      return(
        <React.Fragment>

        </React.Fragment>
      )
    }
    else{

      return (

        <React.Fragment>

              <NepiIFNavPose
                navposeNamespace={this.state.selected_frame_topic + '/navpose'}
                title={"NavPose Live Data"}
                show_line={false}
                make_section={false}
                read_only={true}
              />

                




                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
        

                  <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                    {"Show NavPose Components"}
                  </label>

                  <div style={{ display: 'flex' }}>
                          <div style={{ width: '13%' }} hidden={false}>
                                <Label title="Fixed">
                                  <Toggle
                                    checked={this.state.show_fixed===true}
                                    onClick={() => onChangeSwitchStateValue.bind(this)("show_fixed",this.state.show_fixed)}>
                                  </Toggle>
                              </Label>
                          </div>
                          <div style={{ width: '3%' }}>
                          </div>

                          <div style={{ width: '13%' }} hidden={false}>
                                <Label title="Init">
                                  <Toggle
                                    checked={this.state.show_init===true}
                                    onClick={() => onChangeSwitchStateValue.bind(this)("show_init",this.state.show_init)}>
                                  </Toggle>
                              </Label>
                          </div>
                          <div style={{ width: '3%' }}>
                          </div>


                          <div style={{ width: '13%' }} hidden={false}>
                              <Label title="Source Replaces">
                                  <Toggle
                                    checked={this.state.show_source_replace===true}
                                    onClick={() => onChangeSwitchStateValue.bind(this)("show_source_replace",this.state.show_source_replace)}>
                                  </Toggle>
                                </Label>
                          </div>
                          <div style={{ width: '3%' }}>
                          </div>

                          <div style={{ width: '13%' }} hidden={false}>
                              <Label title="Source Offsets">
                                  <Toggle
                                    checked={this.state.show_source_offset===true}
                                    onClick={() => onChangeSwitchStateValue.bind(this)("show_source_offset",this.state.show_source_offset)}>
                                  </Toggle>
                                </Label>
                          </div>

                          <div style={{ width: '3%' }}>
                          </div>


                          <div style={{ width: '13%' }} hidden={false}>
                              <Label title="Update Replaces">
                                  <Toggle
                                    checked={this.state.show_update_reset===true}
                                    onClick={() => onChangeSwitchStateValue.bind(this)("show_update_reset",this.state.show_update_reset)}>
                                  </Toggle>
                                </Label>
                          </div>
                          <div style={{ width: '3%' }}>
                          </div>

                          <div style={{ width: '13%' }} hidden={false}>
                              <Label title="Update Offsets">
                                  <Toggle
                                    checked={this.state.show_update_offset===true}
                                    onClick={() => onChangeSwitchStateValue.bind(this)("show_update_offset",this.state.show_update_offset)}>
                                  </Toggle>
                                </Label>
                          </div>

                    </div>



                    { (this.state.show_fixed === true) ?

                        <NepiIFNavPose
                          navposeNamespace={this.state.selected_frame_topic + '/navpose_fixed'}
                          title={"NavPose Fixed Data"}
                          make_section={false}
                          update_namespace={this.getMgrNamespace() + '/set_frame_fixed_navpose'}
                          frame_name={this.state.selected_frame}
                        />

                    : null }

                    { (this.state.show_init === true) ?

                        <NepiIFNavPose
                          navposeNamespace={this.state.selected_frame_topic + '/navpose_init'}
                          title={"NavPose Init Data"}
                          make_section={false}
                          read_only={true}
                        />

                    : null }

                    { (this.state.show_source_replace === true) ?

                        <NepiIFNavPose
                          navposeNamespace={this.state.selected_frame_topic + '/navpose_source_replace'}
                          title={"NavPose Source Replaces Data"}
                          make_section={false}
                          read_only={true}
                        />

                    : null }

                    { (this.state.show_source_offset === true) ?

                        <NepiIFNavPose
                          navposeNamespace={this.state.selected_frame_topic + '/navpose_source_offset'}
                          title={"NavPose Source Offsets Data"}
                          make_section={false}
                          read_only={true}
                        />

                    : null }

                    { (this.state.show_update_offset === true) ?

                        <NepiIFNavPose
                          navposeNamespace={this.state.selected_frame_topic + '/navpose_update_offset'}
                          title={"NavPose Update Offset Data"}
                          make_section={false}
                          read_only={true}
                        />

                    : null }

                    { (this.state.show_update_reset === true) ?

                        <NepiIFNavPose
                          navposeNamespace={this.state.selected_frame_topic + '/navpose_update_reset'}
                          title={"NavPose Update Reset Data"}
                          make_section={false}
                          read_only={true}
                        />

                    : null }





        </React.Fragment>
    
      )
    }
  }



  renderFrameConfig() {
    const { selected_frame, selected_frame_ind } = this.state
    const mgrNamespace = this.getMgrNamespace()
    const { navpose_frames_solutions } = this.props.ros

    const live_solution = (selected_frame_ind >= 0 && navpose_frames_solutions)
      ? navpose_frames_solutions[selected_frame_ind]
      : null

    if (live_solution == null || mgrNamespace == null) {
      return <React.Fragment />
    }

    const components_info = live_solution.components_info || []

    const renderCompTopicSection = (typeLabel, typeKey, availKey, connectedKey, connectingKey, availableKey, rateKey) => (
      <React.Fragment>
        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {typeLabel}
        </label>
        <div style={{ marginTop: Styles.vars.spacing.small }}>
          {components_info.map((comp) => {
            const availTopics = comp[availKey] || []
            const currentTopic = comp[typeKey] || 'None'
            const isConnected = comp[connectedKey]
            const isConnecting = comp[connectingKey]
            const isAvailable = comp[availableKey]
            const typeShort = typeKey.replace('_topic', '')

            const statusColor = isConnected
              ? Styles.vars.colors.green
              : isConnecting
                ? Styles.vars.colors.orange
                : isAvailable
                  ? Styles.vars.colors.yellow
                  : Styles.vars.colors.grey

            const optionsList = comp[typeShort + '_options_list'] || []
            const currentOption = comp[typeShort + '_option'] || ''

            return (
              <div key={comp.comp_name} style={{ marginBottom: Styles.vars.spacing.small }}>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    backgroundColor: statusColor,
                    marginRight: Styles.vars.spacing.xs,
                    flexShrink: 0
                  }} />
                  <label style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {comp.comp_name}
                  </label>
                </div>

                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Select
                    style={{ flex: 1, minWidth: 0 }}
                    value={currentTopic}
                    onChange={(e) => {
                      this.props.ros.sendUpdateStringMsg(
                        mgrNamespace + '/set_frame_comp_topic',
                        selected_frame,
                        e.target.value,
                        comp.comp_name,
                        typeShort
                      )
                    }}
                  >
                    <Option value={'None'}>{'None'}</Option>
                    {typeShort === 'init' && currentTopic !== 'Fixed' && (
                      <Option value={'Fixed'}>{'Fixed'}</Option>
                    )}
                    {currentTopic !== 'None' && (
                      <Option value={currentTopic}>
                        {createMenuBaseName(currentTopic) + (isAvailable ? '' : ' (unavailable)')}
                      </Option>
                    )}
                    {availTopics.filter(t => t !== currentTopic).map((t) => (
                      <Option key={t} value={t}>{createMenuBaseName(t)}</Option>
                    ))}
                  </Select>

                  {optionsList.length > 0 && currentTopic !== 'None' && (
                    <Select
                      style={{ width: '120px', flexShrink: 0 }}
                      value={currentOption}
                      onChange={(e) => {
                        this.props.ros.sendUpdateStringMsg(
                          mgrNamespace + '/set_frame_comp_option',
                          selected_frame,
                          e.target.value,
                          comp.comp_name,
                          typeShort
                        )
                      }}
                    >
                      {optionsList.map((opt) => (
                        <Option key={opt} value={opt}>{opt}</Option>
                      ))}
                    </Select>
                  )}
                </div>

                {currentTopic !== 'None' && (
                  <div style={{ fontSize: '0.8em', color: Styles.vars.colors.grey1, marginTop: '2px' }}>
                    {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : isAvailable ? 'Available' : 'Unavailable'}
                    {comp[rateKey] > 0 && ` · ${comp[rateKey].toFixed(1)} Hz`}
                  </div>
                )}

                {typeShort === 'init' && currentOption === 'TIMED' && currentTopic !== 'None' && (
                  <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85em', color: Styles.vars.colors.grey0, marginRight: '6px', whiteSpace: 'nowrap' }}>
                      {'Interval (s)'}
                    </label>
                    <Input
                      style={{ width: '70px' }}
                      defaultValue={comp.init_timed_sec != null ? comp.init_timed_sec : 1}
                      key={comp.comp_name + '_timed_' + comp.init_timed_sec}
                      onChange={(e) => setElementStyleModified(e.target)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val) && val >= 0.1) {
                            clearElementStyleModified(e.target)
                            this.props.ros.sendUpdateFloatMsg(
                              mgrNamespace + '/reset_frame_comp_init_timed_sec',
                              selected_frame,
                              val,
                              comp.comp_name
                            )
                          }
                        }
                      }}
                    />
                  </div>
                )}

                {currentTopic !== 'None' && (() => {
                  const tfKey = comp.comp_name + '_' + typeShort
                  const isExpanded = !!this.state.transform_expanded[tfKey]
                  const tf = comp[typeShort + '_topic_transform'] || {}
                  const sendTransform = (overrides) => {
                    this.props.ros.sendUpdateTransformMsg(
                      mgrNamespace + '/set_frame_comp_transform',
                      { ...tf, ...overrides },
                      selected_frame,
                      comp.comp_name,
                      typeShort
                    )
                  }
                  const tfCols = [
                    [
                      { field: 'x_m',       label: 'X (m)'    },
                      { field: 'y_m',       label: 'Y (m)'    },
                      { field: 'z_m',       label: 'Z (m)'    },
                    ],
                    [
                      { field: 'roll_deg',  label: 'Roll (°)' },
                      { field: 'pitch_deg', label: 'Pitch (°)'},
                      { field: 'yaw_deg',   label: 'Yaw (°)'  },
                    ],
                  ]
                  const tfFields = tfCols[0].concat(tfCols[1])
                  const renderTfInput = ({ field, label }) => (
                    <div key={field} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px', gap: '3px' }}>
                      <label style={{ fontSize: '0.75em', width: '46px', flexShrink: 0 }}>{label}</label>
                      <Input
                        defaultValue={tf[field] != null ? Number(tf[field]).toFixed(3) : '0.000'}
                        key={tfKey + '_' + field + '_' + tf[field]}
                        onChange={(e) => setElementStyleModified(e.target)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseFloat(e.target.value)
                            if (!isNaN(val)) {
                              clearElementStyleModified(e.target)
                              sendTransform({ [field]: val })
                            }
                          }
                        }}
                        style={{ width: '70px' }}
                      />
                    </div>
                  )
                  return (
                    <div>
                      <div
                        style={{ cursor: 'pointer', fontSize: '0.8em', color: Styles.vars.colors.grey1, marginTop: '4px', userSelect: 'none' }}
                        onClick={() => this.setState({ transform_expanded: { ...this.state.transform_expanded, [tfKey]: !isExpanded } })}
                      >
                        {'Transform ' + (isExpanded ? '▲' : '▼')}
                      </div>
                      {isExpanded && (
                        <div style={{ marginTop: '4px' }}>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '3px' }}>{tfCols[0].map(renderTfInput)}</div>
                          <div style={{ display: 'flex', gap: '8px' }}>{tfCols[1].map(renderTfInput)}</div>
                          <div
                            style={{ cursor: 'pointer', fontSize: '0.75em', color: Styles.vars.colors.red, marginTop: '4px', textAlign: 'right', userSelect: 'none' }}
                            onClick={() => {
                              const zeros = tfFields.reduce((acc, { field }) => { acc[field] = 0; return acc }, {})
                              sendTransform(zeros)
                            }}
                          >
                            {'Clear Transform'}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

              </div>
            )
          })}
        </div>
      </React.Fragment>
    )

    const { selected_topic_config } = this.state

    const CONFIG_SECTIONS = {
      init: ['NavPose Init Topic Config', 'init_topic', 'available_init_topics', 'init_topic_connected', 'init_topic_connecting', 'init_topic_available', 'init_topic_avg_rate'],
      source: ['NavPose Source Topic Config', 'source_topic', 'available_source_topics', 'source_topic_connected', 'source_topic_connecting', 'source_topic_available', 'source_topic_avg_rate'],
      update: ['NavPose Update Topic Config', 'update_topic', 'available_update_topics', 'update_topic_connected', 'update_topic_connecting', 'update_topic_available', 'update_topic_avg_rate'],
    }

    return (
      <React.Fragment>

        <Select
          style={{ width: '100%', marginBottom: Styles.vars.spacing.small }}
          value={selected_topic_config}
          onChange={(e) => this.setState({ selected_topic_config: e.target.value })}
        >
          <Option value={'init'}>{'Init Topic Config'}</Option>
          <Option value={'source'}>{'Source Topic Config'}</Option>
          <Option value={'update'}>{'Update Topic Config'}</Option>
        </Select>

        {renderCompTopicSection(...CONFIG_SECTIONS[selected_topic_config])}

        <NepiIFConfig
          namespace={this.state.selected_frame_topic}
          title={"Nepi_IF_Config"}
        />

      </React.Fragment>
    )
  }


  renderNavPoseMgr() {
  
    return (

        <React.Fragment>


               <div style={{ display: 'flex' }}>
                        <div style={{ width: '13%' }} >

                          {this.renderFrameSelection()}

                        </div>


                        <div style={{ width: '2%' }} >
                        </div>

                        <div style={{ width: '57%' }}>

                          {this.renderFrameNavPoseComps()}

                        </div>

                        <div style={{ width: '2%' }} >
                        </div>

                        <div style={{ width: '26%' }}>

                          {this.renderFrameConfig()}

                        </div>

                  </div>

        </React.Fragment>

    )
  }




  render() {
    const namespace = this.getMgrNamespace()
    const connected = this.state.connected

    if (namespace == null || connected === false){
      return (
  
        <Columns>
          <Column>
  
  
          </Column>
        </Columns>
      )
    }
    else {
      return (

          <Section title={"NAVPOSE MANAGER"}>

                  {this.renderNavPoseMgr()}


        </Section>
     )
   }

  }

  
}

export default NavPoseMgr
