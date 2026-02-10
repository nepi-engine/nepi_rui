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
import Select, { Option } from "./Select"

//import EnableAdjustment from "./EnableAdjustment"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"
import Toggle from "react-toggle"
import Label from "./Label"
import Input from "./Input"
import { Column, Columns } from "./Columns"
import {
  round,
  //Unused createShortUniqueValues,
  onUpdateSetStateValue,
  onEnterSetStateFloatValue,
  //Unused onChangeSwitchStateNestedValue,
  createMenuListFromStrList,
  onDropdownSelectedSetState,
  createShortValuesFromNamespaces
} from "./Utilities"


//Unused import NepiIFDeviceInfo from "./Nepi_IF_DeviceInfo"
import NepiIFSettings from "./Nepi_IF_Settings"
import NepiIFSaveData from "./Nepi_IF_SaveData"
import NepiIFNavPoseViewer from "./Nepi_IF_NavPoseViewer"
import NepiIFConfig from "./Nepi_IF_Config"

import moment from "moment"


@inject("ros")
@observer

// NPX Application page
class MgrNavPose extends Component {
  constructor(props) {
    super(props)

    this.state = {
      mgrName: "navpose_mgr",
      namespace: null,
      base_namespace: null,

      selected_frame: 'nepi_base',

      message: null,

      listener: null,

      disabled: false,

      connected: false,
      statusListener: null,
      status_msg: null,

      navposeListener: null,
      navpose_msg: null,

      // NEW: which section to show
      selectedSection: null,

      location_fixed: false,
      heading_fixed: false,
      orientation_mode: false,
      position_fixed: false,
      altitude_fixed: false,
      depth_fixed: false,
      pan_tilt_fixed: false,
      
      fixed_npData_frame_3d: 'nepi_frame',
      fixed_npData_frame_nav: 'ENU',
      fixed_npData_frame_altitude: 'WGS84',
      fixed_npData_frame_depth: 'MSL',
      
      fixed_npData_geoid_height_meters: 0.0,
      
      fixed_npData_has_location: false,
      fixed_npData_time_location: moment.utc().unix(),
      fixed_npData_latitude: 0.0,
      fixed_npData_longitude: 0.0,
      
      fixed_npData_has_heading: false,
      fixed_npData_time_heading: moment.utc().unix(),
      fixed_npData_heading_deg: 0.0,
      
      fixed_npData_has_position: false,
      fixed_npData_time_position: moment.utc().unix(),
      fixed_npData_x_m: 0.0,
      fixed_npData_y_m: 0.0,
      fixed_npData_z_m: 0.0,
      
      fixed_npData_has_orientation: false,
      fixed_npData_time_orientation: moment.utc().unix(),
      fixed_npData_roll_deg: 0.0,
      fixed_npData_pitch_deg: 0.0,
      fixed_npData_yaw_deg: 0.0,
      
      fixed_npData_has_altitude: false,
      fixed_npData_time_altitude: moment.utc().unix(),
      fixed_npData_altitude_m: 0.0,
      
      fixed_npData_has_depth: false,
      fixed_npData_time_depth: moment.utc().unix(),
      fixed_npData_depth_m: 0.0,

      fixed_npData_has_pan_tilt: false,
      fixed_npData_time_pan_tilt: moment.utc().unix(),
      fixed_npData_pan_deg: 0.0,
      fixed_npData_tilt_deg: 0.0,

      showTransformsDict: {
        location: false,
        heading: false,
        orientation: false,
        position: false,
        altitude: false,
        depth: false,
        pan_tilt: false
      },

      transformsDict: {
        location: { 
          transform_msg: null,
          transformTX: 0,
          transformTY: 0,
          transformTZ: 0,
          transformRX: 0,
          transformRY: 0,
          transformRZ: 0,
          transformHO: 0
          },
        heading: { 
          transform_msg: null,
          transformTX: 0,
          transformTY: 0,
          transformTZ: 0,
          transformRX: 0,
          transformRY: 0,
          transformRZ: 0,
          transformHO: 0
          },
        orientation: { 
          transform_msg: null,
          transformTX: 0,
          transformTY: 0,
          transformTZ: 0,
          transformRX: 0,
          transformRY: 0,
          transformRZ: 0,
          transformHO: 0
          },
        position: { 
          transform_msg: null,
          transformTX: 0,
          transformTY: 0,
          transformTZ: 0,
          transformRX: 0,
          transformRY: 0,
          transformRZ: 0,
          transformHO: 0
          },
        altitude: { 
          transform_msg: null,
          transformTX: 0,
          transformTY: 0,
          transformTZ: 0,
          transformRX: 0,
          transformRY: 0,
          transformRZ: 0,
          transformHO: 0
          },
        depth: { 
          transform_msg: null,
          transformTX: 0,
          transformTY: 0,
          transformTZ: 0,
          transformRX: 0,
          transformRY: 0,
          transformRZ: 0,
          transformHO: 0
          },
          pan_tilt: { 
            transform_msg: null,
            transformTX: 0,
            transformTY: 0,
            transformTZ: 0,
            transformRX: 0,
            transformRY: 0,
            transformRZ: 0,
            transformHO: 0
            }
      },
     
      needs_update: true,
      nav_needs_update: true  
    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
    this.getMgrNamespace = this.getMgrNamespace.bind(this)

    this.renderMgrFixedControls = this.renderMgrFixedControls.bind(this)
    this.renderMgrTranformControls = this.renderMgrTranformControls.bind(this)
    this.renderMgrTopicControls = this.renderMgrTopicControls.bind(this)

    this.onUpdateSetTransformValue = this.onUpdateSetTransformValue.bind(this)
    this.onEnterSetTranformValue = this.onEnterSetTranformValue.bind(this)
    this.sendTransformUpdateMessage = this.sendTransformUpdateMessage.bind(this)
    this.sendTransformClearMessage = this.sendTransformClearMessage.bind(this)

    this.statusListener = this.statusListener.bind(this)
    this.navposeListener = this.navposeListener.bind(this)
    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.updateNavposeListener = this.updateNavposeListener.bind(this)
    
    this.onTopicSelected = this.onTopicSelected.bind(this)
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

  // --- helper: force a section to Fixed, then run an action
  ensureFixedAnd = async (name, action) => {
    try {
      const { UpdateNavPoseComp } = this.props.ros
      const namespace = this.state.namespace + "/set_topic"
      // Set to Fixed if not already fixed
      if (!this.state[name + "_fixed"]) {
        await UpdateNavPoseComp(namespace, name, "Fixed", false)
        this.setState({ [name + "_fixed"]: true })
      }
      await action()
    } catch (e) {
      console.error("ensureFixedAnd failed:", e)
    }
  }

  // Callback for handling ROS StatusNPX messages
  statusListener(message) {
    const last_status_msg = this.state.status_msg

    this.setState({
      status_msg: message, 
      connected: true
    })

    const comp_infos = message.comp_infos

    var last_comp_info = null
    var last_transform_msg = null
    var test = null

    for (var i = 0; i < comp_infos.length; i++) {
    
      const comp_info = comp_infos[i]
      const name = comp_info.name
      const transform_msg = comp_info.transform


      var needs_update = false
      var tf_needs_update = false
      if (last_status_msg == null){ 
        needs_update = true 
      }
      else {
        last_comp_info = last_status_msg.comp_infos[i]
        

        last_transform_msg = last_comp_info.transform
        test = (last_transform_msg.translate_vector.x !== transform_msg.translate_vector.x)

        if ( (test === true) || (last_transform_msg.translate_vector.x !== transform_msg.translate_vector.x) ||
              (last_transform_msg.translate_vector.y !== transform_msg.translate_vector.y) ||
                (last_transform_msg.translate_vector.z !== transform_msg.translate_vector.z) ||
                  (last_transform_msg.rotate_vector.x !== transform_msg.rotate_vector.x) ||
                    (last_transform_msg.rotate_vector.y !== transform_msg.rotate_vector.y) ||
                      (last_transform_msg.rotate_vector.z !== transform_msg.rotate_vector.z) ||
                        (last_transform_msg.heading_offset !== transform_msg.heading_offset) ) { 
          tf_needs_update = true 
        }
      }
      
      if ((needs_update === true) || (tf_needs_update == true)) {  
        this.state.transformsDict[name]['transform_msg'] = transform_msg
        this.state.transformsDict[name]['transformTX'] = transform_msg.translate_vector.x
        this.state.transformsDict[name]['transformTY'] = transform_msg.translate_vector.y
        this.state.transformsDict[name]['transformTZ'] = transform_msg.translate_vector.z
        this.state.transformsDict[name]['transformRX'] = transform_msg.rotate_vector.x
        this.state.transformsDict[name]['transformRY'] = transform_msg.rotate_vector.y
        this.state.transformsDict[name]['transformRZ'] = transform_msg.rotate_vector.z
        this.state.transformsDict[name]['transformHO'] = transform_msg.heading_offset
      }
    }
  }

  navposeListener(message) {
    //Unused const last_navpose_msg = this.state.navpose_msg
    const navpose_data = {
      frame_3d: message.frame_3d,
      frame_nav: message.frame_nav,
      frame_alt: message.frame_alt,
      latitude: message.latitude,
      longitude: message.longitude,
      altitude: message.altitude_m,
      heading: message.heading_deg,
      roll: message.roll_deg,
      pitch: message.pitch_deg,
      yaw: message.yaw_deg,
      x_m: message.x_m,
      y_m: message.y_m,
      z_m: message.z_m,
      pan: message.pan_deg,
      tilt: message.tilt_deg
    }
        
    this.setState({
      navpose_msg: message,
      navpose_data: navpose_data, 
      connected: true
    })
  }

  updateStatusListener() {
    const namespace = this.state.base_namespace + "/" + this.state.mgrName;
    const topic = namespace + "/status";
    try {
      var statusListener = this.props.ros.setupStatusListener(
        topic,
        "nepi_interfaces/MgrNavPoseStatus",
        this.statusListener 
      );
      
      this.setState({ 
        statusListener: statusListener,
        needs_update: false 
      });
    } catch (error) {
      console.error("Failed to setup status listener:", error);
    }
  }

  updateNavposeListener() {
    const namespace = this.state.base_namespace
    const navposeTopic = namespace + "/navpose"
    
    if (this.state.navposeListener) {
      this.state.navposeListener.unsubscribe()
    }
    
    var navposeListener = this.props.ros.setupStatusListener(
      navposeTopic,
      "nepi_interfaces/NavPose",
      this.navposeListener 
    )
    
    this.setState({ 
      navposeListener: navposeListener,
      nav_needs_update: false 
    })
  }

  // Lifecycle method called when component updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    var namespace = this.getMgrNamespace();
    var base_namespace = this.getBaseNamespace();

    if (prevState.namespace !== namespace) {
      if (namespace != null) {
        this.setState({
          namespace: namespace,
          base_namespace: base_namespace
        });
        this.updateStatusListener();
        this.updateNavposeListener();
      } else {
        this.setState({ disabled: true });
      }
    }

    // Set default selected section when status arrives
    if (
      prevState.status_msg !== this.state.status_msg &&
      this.state.status_msg &&
      !this.state.selectedSection
    ) {
      var compInfos = this.state.status_msg && this.state.status_msg.comp_infos;
      var first =
        (compInfos && compInfos.length > 0 && compInfos[0] && compInfos[0].name)
          ? compInfos[0].name
          : null;

      if (first) {
        this.setState({ selectedSection: first });
      }
    }
  }

  componentDidMount() {
    this.checkConnection();
  }
  
  async checkConnection() {
    const { namespacePrefix, deviceId } = this.props.ros;
    if (namespacePrefix != null && deviceId != null) {
      const namespace = this.getMgrNamespace();
      const base_namespace = this.getBaseNamespace();
  
      this.setState({
        namespace: namespace,
        base_namespace: base_namespace
      }, () => {
        this.updateStatusListener();
        this.updateNavposeListener();
      });
  
    } else {
      setTimeout(() => {
        this.checkConnection();
      }, 1000);
    }
  }

  // Lifecycle method called just before the component unmounts.
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
    if (this.state.navposeListener) {
      this.state.navposeListener.unsubscribe()
    }
  }

  // Function for creating topic options for Select input
  createTopicOptions(name) {
    //Unused const namespace = this.state.namespace
    const status_msg = this.state.status_msg

    var items = []
    items.push(<Option value={'None'}>{'None'}</Option>)
    if (status_msg != null){
      const comp_names = status_msg.comp_names
      const comp_infos = status_msg.comp_infos
      const index = comp_names.indexOf(name)
      if (index !== -1){
        const infos = comp_infos[index]
        const topics = infos.available_topics
        var topicShortnames = createShortValuesFromNamespaces(topics)

        for (var i = 0; i < topics.length; i++) {
          items.push(<Option value={topics[i]}>{topicShortnames[i]}</Option>)
        }
      }
    }
    return items
  }

  // Handler for IDX Sensor topic selection
  onTopicSelected(event) {
    const {UpdateNavPoseComp} = this.props.ros
    const frame_name = this.selected_frame
    const comp_name = event.target.id
    const topic = event.target.value
    const apply_tf = false
    const namespace = this.state.namespace + "/set_topic"
    UpdateNavPoseComp(namespace,frame_name, comp_name, topic, apply_tf)
  }

  sendTransformUpdateMessage(name){
    const {sendFrame3DTransformUpdateMsg} = this.props.ros
    const namespace = this.state.namespace + "/set_transform"
    const TX = parseFloat(this.state.transformsDict[name]['transformTX'])
    const TY = parseFloat(this.state.transformsDict[name]['transformTY'])
    const TZ = parseFloat(this.state.transformsDict[name]['transformTZ'])
    const RX = parseFloat(this.state.transformsDict[name]['transformRX'])
    const RY = parseFloat(this.state.transformsDict[name]['transformRY'])
    const RZ = parseFloat(this.state.transformsDict[name]['transformRZ'])
    const HO = parseFloat(this.state.transformsDict[name]['transformHO'])
    const transformList = [TX,TY,TZ,RX,RY,RZ,HO]
    sendFrame3DTransformUpdateMsg(namespace, name, transformList)
  }

  sendTransformClearMessage(name){
    const {sendStringMsg} = this.props.ros
    const namespace = this.state.namespace + "/clear_transform"
    sendStringMsg(namespace,name)
  }

  // === REWORKED: render only the selected section, with single topic selector and always-on "Fixed" editors ===
  renderMgrControls() {
    const { namespace } = this.state
    const status_msg = this.state.status_msg

    if (!status_msg) {
      return (
        <Columns>
          <Column>{/* waiting on status */}</Column>
        </Columns>
      )
    }

    const comp_names = status_msg.comp_names || []
    const comp_infos = status_msg.comp_infos || []
    if (comp_names.length === 0 || comp_infos.length === 0) return null

    // Build "Section" menu
    const sectionOptions = createMenuListFromStrList(
      comp_names,   // optionsStrList
      false,        // useShortNames
      [],           // filterOut
      [],           // prefixOptionsStrList
      []            // appendOptionsStrList
    )

    const selected = (this.state.selectedSection !== null && this.state.selectedSection !== undefined)
    ? this.state.selectedSection
    : (comp_infos.length > 0 ? comp_infos[0].name : '')    
    const idx = Math.max(0, comp_names.indexOf(selected))
    const comp_info = comp_infos[idx]
    const name = comp_info.name
    const name_text = name.toUpperCase()

    const topic = (comp_info.topic !== '') ? comp_info.topic : 'None'
    const fixed = (topic === 'Fixed')

    return (
      <React.Fragment>
        <NepiIFConfig namespace={namespace} title={"Nepi_IF_SaveConif"} />
        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }} />

        {/* SECTION DROPDOWN */}
        <Columns>
          <Column>
            <Label title={"Section"}>
              <Select
                id="section-select"
                value={selected}
                onChange={(e) => onDropdownSelectedSetState.call(this, e, 'selectedSection')}
              >
                {sectionOptions}
              </Select>
            </Label>
          </Column>
        </Columns>

        {/* Section header + SINGLE topic selector (kept only here) */}
        <Columns>
          <Column>
            <Columns>
              <Column>
                <label style={{ fontWeight: 'bold' }}>{name_text}</label>

                <Label title={"Select Source Topic"}>
                  <Select
                    id={name}
                    onChange={this.onTopicSelected}
                    value={topic}
                  >
                    {namespace
                      ? this.createTopicOptions(name)
                      : <Option value={'None'}>{'None'}</Option>}
                  </Select>
                </Label>
              </Column>
              <Column />
            </Columns>

            
            
            {this.renderMgrTopicControls(name, comp_info)}

            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }} />
          </Column>
        </Columns>
      </React.Fragment>
    )
  }



  onUpdateSetTransformValue(event,comp_name) {
    const key = event.target.id
    const value = event.target.value
    this.state.transformsDict[comp_name][key] = value
    document.getElementById(event.target.id).style.color = Styles.vars.colors.red
    this.render()
  }


  onEnterSetTranformValue(event, comp_name) {
    if(event.key === 'Enter'){
      const key = event.target.id
      const value = parseFloat(event.target.value)
      if (!isNaN(value)){
        this.state.transformsDict[comp_name][key] = value
      }
      document.getElementById(event.target.id).style.color = Styles.vars.colors.black
    }
  }

  renderMgrTranformControls(name, comp_info) {
    //Unused const namespace = this.state.namespace
    const status_msg = this.state.status_msg
    
    if (status_msg == null){
      return (
        <Columns>
          <Column />
        </Columns>
      )
    } else {
      const topic = (comp_info.topic !== '') ? comp_info.topic : 'None'
      //Unused const msg = comp_info.topic_msg
      //Unused const con = comp_info.connected
      const rate = round(comp_info.avg_rate,3)
      const time = round(comp_info.last_time,3)
      const topic_selected = topic !== 'None' && topic !== 'Fixed' && topic !== ''
      const show_fixed = topic !== 'None' && topic === 'Fixed'
      const show_transform = topic !== 'None' && topic !== 'Fixed' && topic !== ''
      const this_transform = this.state.transformsDict[name]

      return (
        <Columns>
          <Column>


              <div align={"left"} textAlign={"left"} hidden={show_transform === false}>
                <Columns>
                  <Column>
                    <Label title={"X (m)"}>
                      <Input
                        value={this_transform.transformTX}
                        id="transformTX"
                        onChange={(event) => this.onUpdateSetTransformValue(event,name)}
                        onKeyDown={(event) => this.onEnterSetTranformValue(event,name)}
                        style={{ width: "80%" }}
                      />
                    </Label>

                    <Label title={"Y (m)"}>
                      <Input
                        value={this_transform.transformTY}
                        id="transformTY"
                        onChange={(event) => this.onUpdateSetTransformValue(event,name)}
                        onKeyDown={(event) => this.onEnterSetTranformValue(event,name)}
                        style={{ width: "80%" }}
                      />
                    </Label>

                    <Label title={"Z (m)"}>
                      <Input
                        value={this_transform.transformTZ}
                        id="transformTZ"
                        onChange={(event) => this.onUpdateSetTransformValue(event,name)}
                        onKeyDown={(event) => this.onEnterSetTranformValue(event,name)}
                        style={{ width: "80%" }}
                      />
                    </Label>
                  </Column>

                  <Column>
                    <Label title={"Roll (deg)"}>
                      <Input
                        value={this_transform.transformRX}
                        id="transformRX"
                        onChange={(event) => this.onUpdateSetTransformValue(event,name)}
                        onKeyDown={(event) => this.onEnterSetTranformValue(event,name)}
                        style={{ width: "80%" }}
                      />
                    </Label>

                    <Label title={"Pitch (deg)"}>
                      <Input
                        value={this_transform.transformRY}
                        id="transformRY"
                        onChange={(event) => this.onUpdateSetTransformValue(event,name)}
                        onKeyDown={(event) => this.onEnterSetTranformValue(event,name)}
                        style={{ width: "80%" }}
                      />
                    </Label>

                    <Label title={"Yaw (deg)"}>
                      <Input
                        value={this_transform.transformRZ}
                        id="transformRZ"
                        onChange={(event) => this.onUpdateSetTransformValue(event,name)}
                        onKeyDown={(event) => this.onEnterSetTranformValue(event,name)}
                        style={{ width: "80%" }}
                      />
                    </Label>
                  </Column>
                </Columns>

                <Columns>
                  <Column>
                    <ButtonMenu>
                      <Button onClick={() => this.sendTransformUpdateMessage(name)}>{"Update Transform"}</Button>
                    </ButtonMenu>
                  </Column>
                  <Column>
                    <ButtonMenu>
                      <Button onClick={() => this.sendTransformClearMessage(name)}>{"Clear Transform"}</Button>
                    </ButtonMenu>
                  </Column>
                </Columns>
      
            </div>
          </Column>
        </Columns>
      )
    }
  }


  renderMgrFixedControls(name, comp_info) {
    //Unused const {sendTriggerMsg, sendNavPoseMsg} = this.props.ros
    const namespace = this.state.namespace

    // location
    if (name === 'location'){
      return (
        <Columns>
          <Column>
            <label style={{opacity:.8, fontSize:12}}>Fixed Location</label>
            <Columns>
              <Column>
                <Label title={"Latitude"}>
                  <Input
                    value={this.state.fixed_npData_latitude}
                    id="latitude"
                    onChange={(event) =>
                      onUpdateSetStateValue.bind(this)(event, 'fixed_npData_latitude')
                    }
                    onKeyDown={(event) =>
                      onEnterSetStateFloatValue.bind(this)(event, 'fixed_npData_latitude')
                    }
                    style={{ width: '80%' }}
                  />
                </Label>

                <Label title={"Longitude"}>
                  <Input
                    value={this.state.fixed_npData_longitude}
                    id="longitude"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event,'fixed_npData_longitude')}
                    onKeyDown={(event) => onEnterSetStateFloatValue.bind(this)(event,'fixed_npData_longitude')}
                    style={{ width: "80%" }}
                  />
                </Label>
              </Column>
            </Columns>

            <Columns>
              <Column>
                <ButtonMenu>
                  <Button onClick={() => this.ensureFixedAnd('location', async () =>
                    this.props.ros.sendNavPoseLocationMsg(
                      namespace,
                      this.state.fixed_npData_latitude,
                      this.state.fixed_npData_longitude,
                      false
                    )
                  )}>{"Update Fix"}</Button>
                </ButtonMenu>
              </Column>
              <Column>
                <ButtonMenu>
                  <Button onClick={() => this.ensureFixedAnd('location', async () =>
                    this.props.ros.sendNavPoseLocationMsg(
                      namespace,
                      0.0,
                      0.0,
                      false
                    )
                  )}>{"Clear Fix"}</Button>
                </ButtonMenu>                 
              </Column>
            </Columns>
          </Column>
        </Columns>
      )
    }
  
    // heading
    else if (name === 'heading'){
      return (
        <Columns>
          <Column>
            <label style={{opacity:.8, fontSize:12}}>Fixed Heading</label>
            <Columns>
              <Column>
                <Label title={"Heading (Deg)"}>
                  <Input
                    value={this.state.fixed_npData_heading_deg}
                    id="heading"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event,'fixed_npData_heading_deg')}
                    onKeyDown={(event) => onEnterSetStateFloatValue.bind(this)(event,'fixed_npData_heading_deg')}
                    style={{ width: "80%" }}
                  />
                </Label>
              </Column>
              <Column />
            </Columns>

            <Columns>
              <Column>
                <ButtonMenu>
                  <Button onClick={() => this.ensureFixedAnd('heading', async () =>
                    this.props.ros.sendNavPoseHeadingMsg(
                      namespace,
                      this.state.fixed_npData_heading_deg,
                      false
                    )
                  )}>{"Update Fix"}</Button>
                </ButtonMenu>
              </Column>
              <Column>
                <ButtonMenu>
                  <Button onClick={() => this.ensureFixedAnd('heading', async () =>
                    this.props.ros.sendNavPoseHeadingMsg(
                      namespace,
                      0.0,
                      false
                    )
                  )}>{"Clear Fix"}</Button>
                </ButtonMenu>
              </Column>
            </Columns>
          </Column>
        </Columns>
      )
    }
  
    // orientation
    else if (name === 'orientation'){
      return (
        <Columns>
          <Column>
            <label style={{opacity:.8, fontSize:12}}>Fixed Orientation</label>
            <Columns>
              <Column>
                <Label title={"Roll (Deg)"}>
                  <Input
                    value={this.state.fixed_npData_roll_deg}
                    id="roll"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event,'fixed_npData_roll_deg')}
                    onKeyDown={(event) => onEnterSetStateFloatValue.bind(this)(event,'fixed_npData_roll_deg')}
                    style={{ width: "80%" }}
                  />
                </Label>
              </Column>
              <Column>
                <Label title={"Pitch (Deg)"}>
                  <Input
                    value={this.state.fixed_npData_pitch_deg}
                    id="pitch"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event,'fixed_npData_pitch_deg')}
                    onKeyDown={(event) => onEnterSetStateFloatValue.bind(this)(event,'fixed_npData_pitch_deg')}
                    style={{ width: "80%" }}
                  />
                </Label>
              </Column>
              <Column>
                <Label title={"Yaw (Deg)"}>
                  <Input
                    value={this.state.fixed_npData_yaw_deg}
                    id="yaw"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event,'fixed_npData_yaw_deg')}
                    onKeyDown={(event) => onEnterSetStateFloatValue.bind(this)(event,'fixed_npData_yaw_deg')}
                    style={{ width: "80%" }}
                  />
                </Label>
              </Column>
            </Columns>

            <Columns>
              <Column>
                <ButtonMenu>
                  <Button onClick={() => this.ensureFixedAnd('orientation', async () =>
                    this.props.ros.sendNavPoseOrientationMsg(
                      namespace,
                      this.state.fixed_npData_roll_deg,
                      this.state.fixed_npData_pitch_deg,
                      this.state.fixed_npData_yaw_deg,
                      false
                    )
                  )}>{"Update Fix"}</Button>
                </ButtonMenu>
              </Column>
              <Column>
                <ButtonMenu>
                  <Button onClick={() => this.ensureFixedAnd('orientation', async () =>
                    this.props.ros.sendNavPoseOrientationMsg(
                      namespace,
                      0,
                      0,
                      0,
                      false
                    )
                  )}>{"Clear Fix"}</Button>
                </ButtonMenu>
              </Column>
            </Columns>
          </Column>
        </Columns>
      )
    }
  
    // position
    else if (name === 'position'){
      return (
        <Columns>
          <Column>
            <label style={{opacity:.8, fontSize:12}}>Fixed Position</label>
            <Columns>
              <Column>
                <Label title={"X (Meters)"}>
                  <Input
                    value={this.state.fixed_npData_x_m}
                    id="x"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event,'fixed_npData_x_m')}
                    onKeyDown={(event) => onEnterSetStateFloatValue.bind(this)(event,'fixed_npData_x_m')}
                    style={{ width: "80%" }}
                  />
                </Label>
              </Column>
              <Column>
                <Label title={"Y (Meters)"}>
                  <Input
                    value={this.state.fixed_npData_y_m}
                    id="y"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event,'fixed_npData_y_m')}
                    onKeyDown={(event) => onEnterSetStateFloatValue.bind(this)(event,'fixed_npData_y_m')}
                    style={{ width: "80%" }}
                  />
                </Label>
              </Column>
              <Column>
                <Label title={"Z (Meters)"}>
                  <Input
                    value={this.state.fixed_npData_z_m}
                    id="z"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event,'fixed_npData_z_m')}
                    onKeyDown={(event) => onEnterSetStateFloatValue.bind(this)(event,'fixed_npData_z_m')}
                    style={{ width: "80%" }}
                  />
                </Label>
              </Column>
            </Columns>

            <Columns>
              <Column>
                <ButtonMenu>
                  <Button onClick={() => this.ensureFixedAnd('position', async () =>
                    this.props.ros.sendNavPosePositionMsg(
                      namespace,
                      this.state.fixed_npData_x_m,
                      this.state.fixed_npData_y_m,
                      this.state.fixed_npData_z_m,
                      false
                    )
                  )}>{"Update Fix"}</Button>
                </ButtonMenu>
              </Column>
              <Column>
                <ButtonMenu>
                  <Button onClick={() => this.ensureFixedAnd('position', async () =>
                    this.props.ros.sendNavPosePositionMsg(
                      namespace,
                      0,
                      0,
                      0,
                      false
                    )
                  )}>{"Clear Fix"}</Button>
                </ButtonMenu>
              </Column>
            </Columns>
          </Column>
        </Columns>
      )
    }
  
    // altitude
    else if (name === 'altitude'){
      return (
        <Columns>
          <Column>
            <label style={{opacity:.8, fontSize:12}}>Fixed Altitude</label>
            <Columns>
              <Column>
                <Label title={"Altitude (Meters)"}>
                  <Input
                    value={this.state.fixed_npData_altitude_m}
                    id="altitude"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event,'fixed_npData_altitude_m')}
                    onKeyDown={(event) => onEnterSetStateFloatValue.bind(this)(event,'fixed_npData_altitude_m')}
                    style={{ width: "80%" }}
                  />
                </Label>
              </Column>
              <Column />
            </Columns>

            <Columns>
              <Column>
                <ButtonMenu>
                  <Button onClick={() => this.ensureFixedAnd('altitude', async () =>
                    this.props.ros.sendNavPoseAltitudeMsg(
                      namespace,
                      this.state.fixed_npData_altitude_m,
                      false
                    )
                  )}>{"Update Fix"}</Button>
                </ButtonMenu>
              </Column>
              <Column>
                <ButtonMenu>
                  <Button onClick={() => this.ensureFixedAnd('altitude', async () =>
                    this.props.ros.sendNavPoseAltitudeMsg(
                      namespace,
                      0.0,
                      false
                    )
                  )}>{"Clear Fix"}</Button>
                </ButtonMenu>
              </Column>
            </Columns>
          </Column>
        </Columns>
      )
    }
  
    // depth
    else if (name === 'depth'){
      return (
        <Columns>
          <Column>
            <label style={{opacity:.8, fontSize:12}}>Fixed Depth</label>
            <Columns>
              <Column>
                <Label title={"Depth (Meters)"}>
                  <Input
                    value={this.state.fixed_npData_depth_m}
                    id="depth"
                    onChange={(event) => onUpdateSetStateValue.bind(this)(event,'fixed_npData_depth_m')}
                    onKeyDown={(event) => onEnterSetStateFloatValue.bind(this)(event,'fixed_npData_depth_m')}
                    style={{ width: "80%" }}
                  />
                </Label>
              </Column>
              <Column />
            </Columns>

            <Columns>
              <Column>
                <ButtonMenu>
                  <Button onClick={() => this.ensureFixedAnd('depth', async () =>
                    this.props.ros.sendNavPoseDepthMsg(
                      namespace,
                      this.state.fixed_npData_depth_m,
                      false
                    )
                  )}>{"Update Fix"}</Button>
                </ButtonMenu>
              </Column>
              <Column>
                <ButtonMenu>
                  <Button onClick={() => this.ensureFixedAnd('depth', async () =>
                    this.props.ros.sendNavPoseDepthMsg(
                      namespace,
                      0.0,
                      false
                    )
                  )}>{"Clear Fix"}</Button>
                </ButtonMenu>
              </Column>
            </Columns>
          </Column>
        </Columns>
      )
    }
  
    else {
      return (
        <Columns>
          <Column />
        </Columns>
      )
    }
  }


  renderMgrTopicControls(name, comp_info) {
    //Unused const namespace = this.state.namespace
    const status_msg = this.state.status_msg
    
    if (status_msg == null){
      return (
        <Columns>
          <Column />
        </Columns>
      )
    } else {
      const topic = (comp_info.topic !== '') ? comp_info.topic : 'None'
      //Unused const msg = comp_info.topic_msg
      //Unused const con = comp_info.connected
      const rate = round(comp_info.avg_rate,3)
      const time = round(comp_info.last_time,3)
      const topic_selected = topic !== 'None' && topic !== 'Fixed' && topic !== ''
      const show_fixed = topic !== 'None' && topic === 'Fixed'
      const show_transform = topic !== 'None' && topic !== 'Fixed' && topic !== ''
      const this_transform = this.state.transformsDict[name]

      return (
        <Columns>
          <Column>

            {/* NOTE: Removed the duplicate "Select Source Topic" here.
                It now renders ONLY once above in renderMgrControls(). */}

            <div align={"left"} textAlign={"left"} hidden={!topic_selected}>
              <Columns>
                <Column>
                  <pre style={{ height: "80px", overflowY: "auto" }} align={"left"} textAlign={"left"}>
                      {("\nAvg Receive Rate: " + rate + 
                        "\nLast Receive Time Sec: " + time)}
                  </pre>

                  </Column>
                  </Columns>

                  <Columns>
                  <Column>


                </Column>
              </Columns>

              { (show_fixed === true) ?
                this.renderMgrFixedControls(name, comp_info)
                : null }

              { (show_transform === true) ?
                this.renderMgrTranformControls(name, comp_info)
                : null }


            </div>
          </Column>
        </Columns>
      )
    }
  }

  renderMgrSettings() {
    //Unused const {sendTriggerMsg} = this.props.ros
    const connected = (this.state.namespace != null)
    //Unused const namespace = this.state.namespace

    return (
      <React.Fragment>
        <Columns>
          <Column>
            <Section title={"NavPose Solution Controls"}>
              {this.renderMgrControls()}

              <div align={"left"} textAlign={"left"} hidden={!connected}>
                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
              </div>
            </Section>
          </Column>
        </Columns>
      </React.Fragment>
    )
  }

  render() {
    const namespace = this.state.namespace
    //Unused const navpose_data = this.state.navpose_data
    const connected = this.state.connected
    const base_namespace = this.state.base_namespace

    return (
      <div style={{ display: 'flex' }}>
        <div style={{ width: "65%" }}>
          <NepiIFNavPoseViewer
            namespace={base_namespace  + "/navpose"}
            title={"NavPose Data"}
          />
          <div hidden={(!connected)}>
            <NepiIFSaveData
              namespace={namespace + '/save_data'}
              title={"Nepi_IF_SaveData"}
            />
          </div>
        </div>

        <div style={{ width: '5%' }}>
          {}
        </div>

        <div style={{ width: "30%"}}>
          {this.renderMgrSettings()}
        </div>
      </div>
    )
  }
}

export default MgrNavPose
