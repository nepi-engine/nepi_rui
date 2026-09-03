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
import Toggle from "react-toggle"
import AsyncToggle from "./AsyncToggle"
import Label from "./Label"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
import Select from "./Select"
import Input from "./Input"
import { SliderAdjustment } from "./AdjustmentWidgets"

import NepiIFConfig from "./Nepi_IF_Config"
import Nepi_IF_Control from "./Nepi_IF_Control"

import { createMenuListFromStrList, onChangeSwitchStateValue,
         setElementStyleModified, clearElementStyleModified } from "./Utilities"

@inject("ros")
@observer

// Component that contains the Settings controls.
//
// A node's settings are a nepi_controls controls set, so this renders from a
// nepi_interfaces/ControlsStatus message published at
// "<settings_namespace>/status".  That one message carries both the current
// values and their capabilities -- type, options, bounds, and the factory and
// default tiers -- so there is no capabilities_query service to call.
//
// Nepi_IF_Controls.js is the house pattern for this shape; the difference is
// that a settings box shows one setting at a time behind a selector, and
// publishes every change as a single typed UpdateControl on
// "<settings_namespace>/update_setting".
class Nepi_IF_Settings extends Component {
  constructor(props) {
    super(props)

    // these states track the values through Status messages
    this.state = {

      settingsNamespace: 'None',
      status_msg: null,

      show_controls: (this.props.show_controls !== undefined) ? this.props.show_controls : true,

      selectedSettingName: "",
      selectedSettingInput: "",

      settingsListener: null,
      needs_update: false,
    }

    this.getNamespace = this.getNamespace.bind(this)
    this.updateSettingsListener = this.updateSettingsListener.bind(this)
    this.settingsListener = this.settingsListener.bind(this)

    this.getStatusMsg = this.getStatusMsg.bind(this)
    this.getSelectedSettingName = this.getSelectedSettingName.bind(this)

    this.getSettingNames = this.getSettingNames.bind(this)
    this.getSettingIndex = this.getSettingIndex.bind(this)
    this.getSettingType = this.getSettingType.bind(this)
    this.getSettingMsg = this.getSettingMsg.bind(this)
    this.getSettingValue = this.getSettingValue.bind(this)
    this.getSettingValueString = this.getSettingValueString.bind(this)
    this.getSelectedSettingName = this.getSelectedSettingName.bind(this)

    this.onSelectSetting = this.onSelectSetting.bind(this)

    this.renderSettings = this.renderSettings.bind(this)
    this.renderSetting = this.renderSetting.bind(this)
    this.renderConfigs = this.renderConfigs.bind(this)
    this.renderControl = this.renderControl.bind(this)
  }

  getNamespace() {
    const namespace = (this.props.settingsNamespace !== undefined) ?
      ((this.props.settingsNamespace !== '' && this.props.settingsNamespace !== 'None' &&
        this.props.settingsNamespace !== null) ? this.props.settingsNamespace : 'None') : 'None'
    return namespace
  }

  // Callback for handling ROS ControlsStatus messages on the settings namespace
  settingsListener(message) {
    this.setState({ status_msg: message })
  }

  // Function for configuring and subscribing to the settings status
  updateSettingsListener(settingsNamespace) {
    if (this.state.settingsListener != null ) {
      this.state.settingsListener.unsubscribe()
      this.setState({ settingsListener: null, status_msg: null })
    }
    if (settingsNamespace !== '' && settingsNamespace !== 'None' &&
        settingsNamespace.indexOf('null') === -1) {
      var settingsListener = this.props.ros.setupSettingsStatusListener(
            settingsNamespace + '/status',
            this.settingsListener
          )
      this.setState({ settingsListener: settingsListener })
    }
  }

  componentDidMount() {
    this.setState({needs_update: true})
  }

  // Lifecycle method called when component updates.
  // Used to track changes in the topic.
  componentDidUpdate(prevProps, prevState, snapshot) {
    const settingsNamespace = this.getNamespace()
    const namespace_changed = (settingsNamespace !== this.state.settingsNamespace)

    if (namespace_changed === true || this.state.needs_update === true) {
      this.updateSettingsListener(settingsNamespace)
    }
    // Guarded on the namespace comparison: an unconditional setState here
    // re-enters componentDidUpdate on every render (mobx-react's observer SCU
    // re-renders on any state identity change), which is an infinite update
    // loop that takes down the whole RUI page, and it would also clear the
    // operator's in-progress edit on every frame.  Same fix as
    // Nepi_IF_Controls.js and Nepi_IF_Data.js.
    if (namespace_changed === true || this.state.needs_update === true) {
      this.setState({ settingsNamespace: settingsNamespace,
                      needs_update: false,
                      selectedSettingName: "",
                      selectedSettingInput: "" })
    }
  }

  // Lifecycle method called just before the component unmounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.settingsListener) {
      this.state.settingsListener.unsubscribe()
    }
    this.setState({settingsListener: null, 
                  status_msg: null})
  }




  // Render a single control given its type and Control message.
  // Each block below maps one nepi_controls control type to its RUI widget and
  // the nepi_controls "set_*_control_value" topic it publishes to on change.
  renderControl(control_msg) {
    const namespace = this.state.settingsNamespace
    const control_hidden = control_msg.hidden
      return (

         <Nepi_IF_Control
              namespace={namespace}
              topic={'update_setting'}
              control_msg={control_msg}
              control_hidden={control_hidden}
              show_bounds={true}
            />

      )

  }

  ////////////////////////////////////////////////////////////
  // Status message readers.  A settings status is a ControlsStatus: parallel
  // name/type lists plus one Control message per setting carrying its options,
  // bounds and factory/default/set values.

  getStatusMsg() {
    return (this.props.status_msg !== undefined && this.props.status_msg !== null) ?
      this.props.status_msg : this.state.status_msg
  }

  getSettingMsg(name) {
    const status_msg = this.getStatusMsg()
    const ind = this.getSettingIndex(name)
    if (status_msg == null || ind === -1) { return null }
    const msgs = status_msg.controls_msg_list || []
    return msgs[ind]
  }


  getSettingIndex(name) {
    const status_msg = this.getStatusMsg()
    if (status_msg == null) { return -1 }
    const names = status_msg.controls_name_list || []
    return names.indexOf(name)
  }

    getSettingNames() {
    const status_msg = this.getStatusMsg()
    if (status_msg == null) { return [] }
    const names = status_msg.controls_name_list || []
    const msgs = status_msg.controls_msg_list || []
    // Hidden settings are not offered in the selector, matching the way the
    // retired SettingCap.disabled flag was filtered out of the old caps list.
    var shown = []
    for (let i = 0; i < names.length; i++) {
      if (msgs[i] != null && msgs[i].hidden === true) { continue }
      shown.push(names[i])
    }
    return shown
  }


  getSettingType(name) {
    const status_msg = this.getStatusMsg()
    const ind = this.getSettingIndex(name)
    if (status_msg == null || ind === -1) { return "" }
    const types = status_msg.controls_type_list || []
    return types[ind]
  }

  // The value in its own natural form: an index for Menu, a bool for Bool, a
  // number for Int/Float, a string for Selection/String.
  getSettingValue(name) {
    const msg = this.getSettingMsg(name)
    const type = msg.type
    if (msg == null) { return null }
    if (type === "Menu") { return msg.set_index }
    if (type === "Selection" || type === "Selections" || type === "String") { return msg.set_string }
    if (type === "Trigger") { return msg.set_float }
    if (type === "Bool") { return msg.set_bool }
    if (type === "Int") { return msg.set_int }
    if (type === "Float" || type === "FloatSlider") { return msg.set_float }
    return null
  }

  // The value as displayed text.  A Menu reads back as its selected option
  // string so the selector and the summary list agree.
  getSettingValueString(name) {
    
    const msg = this.getSettingMsg(name)
    const type = msg.type
    if (msg == null) { return "" }
    if (type === "Menu") {
      const options = msg.string_options || []
      const ind = msg.set_index
      return (ind >= 0 && ind < options.length) ? options[ind] : ""
    }
    if (type === "Bool") { return (msg.set_bool === true) ? "True" : "False" }
    const value = this.getSettingValue(name)
    return (value === null || value === undefined) ? "" : String(value)
  }

  // The selected setting, defaulting to the first one present so the box shows
  // something as soon as a status arrives.
  getSelectedSettingName() {
    const names = this.getSettingNames()
    const selected = this.state.selectedSettingName
    if (selected !== "" && names.indexOf(selected) !== -1) { return selected }
    return (names.length > 0) ? names[0] : ""
  }


  ////////////////////////////////////////////////////////////
  // Change handlers.  Every one publishes a single typed UpdateControl.

  sendSettingValue(name, type, value) {
    const { updateSetting } = this.props.ros
    updateSetting(this.state.settingsNamespace, name, type, value)
  }

  onSelectSetting(event) {
    const ind = event.nativeEvent.target.selectedIndex
    const name = event.nativeEvent.target[ind].text
    // Reset the typed-input buffer so the box shows the newly selected
    // setting's value rather than the previous setting's edit.
    this.setState({ selectedSettingName: name,
                    selectedSettingInput: this.getSettingValueString(name) })
  }


  ////////////////////////////////////////////////////////////

  getSettingsAsString() {
    const names = this.getSettingNames()
    var settingsStrList = []
    var sortedStrList = ["None"]
    for (let ind = 0; ind < names.length; ind++){
      settingsStrList.push(names[ind] + ": " + this.getSettingValueString(names[ind]))
    }
    if (settingsStrList.length > 0){
      sortedStrList = settingsStrList.sort()
    }
    for (let ind = 0; ind < sortedStrList.length; ind++){
      sortedStrList[ind] = sortedStrList[ind] + "\n"
    }
    return sortedStrList.join("")
  }

  getSortedStrList(strList){
    var copiedStrList = []
    var sortedStrList = []
    for (let ind = 0; ind < strList.length; ind++){
      copiedStrList.push(strList[ind])
    }
    if (copiedStrList.length > 0){
      sortedStrList = copiedStrList.sort()
    }
    return sortedStrList
  }

  renderSettings() {

    const settingNamesOrdered = this.getSortedStrList(this.getSettingNames())
    const settingsHeight = settingNamesOrdered.length * 25
    const settingsHeightStr = settingsHeight.toString() + 'px'


    const allways_show_controls = (this.props.allways_show_controls !== undefined) ? this.props.allways_show_controls : false
    const show_controls = (allways_show_controls === true) ? true : this.state.show_controls

    const { userRestricted} = this.props.ros
    const ignore_restrictions = (this.props.ignore_restrictions !== undefined) ? this.props.ignore_restrictions : false
    const settings_controls_restricted = userRestricted.indexOf('SYSTEM-SETTINGS-CONTROL') !== -1 && (ignore_restrictions === false)


    if (show_controls === false){
      return(
              <Columns>
                <Column>

                    <Label title="Show Settings">
                        {/* react-toggle (not AsyncToggle): checked is local view state, already immediate -- no backend round trip to confirm. */}
                        <Toggle
                          checked={show_controls===true}
                          onClick={() => onChangeSwitchStateValue.bind(this)("show_controls",show_controls)}>
                        </Toggle>
                    </Label>

                </Column>
                <Column>

                </Column>
              </Columns>
      )
    }
    else {
      return (
        <React.Fragment>


              <Columns>
                <Column>

                    {(allways_show_controls === false) ?
                    <Label title="Show Settings">
                        {/* react-toggle (not AsyncToggle): checked is local view state, already immediate -- no backend round trip to confirm. */}
                        <Toggle
                          checked={show_controls===true}
                          onClick={() => onChangeSwitchStateValue.bind(this)("show_controls",show_controls)}>
                        </Toggle>
                    </Label>
                    : null }

                  </Column>
                  <Column>

                  </Column>
                </Columns>


                  <div hidden={settings_controls_restricted === true} >
                      <Label title={"Select Setting"}>
                        <Select
                          id="selectedSettingName"
                          onChange={this.onSelectSetting}
                          value={this.getSelectedSettingName()}
                        >
                          {createMenuListFromStrList(settingNamesOrdered, false, [], ['NONE'], [])}
                        </Select>
                      </Label>

                  </div>
          
              <Columns>
                <Column>

                  {this.renderSetting()}
      
          
                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
          
                  <Label title={"Current Settings"} />
                  <pre style={{ height: settingsHeightStr, overflowY: "auto" }}>
                    {this.getSettingsAsString()}
                  </pre>

                </Column>
              </Columns>

              {this.renderConfigs()}

        </React.Fragment>
      )

    }
  }



  renderSetting(){
    const selSetName = this.getSelectedSettingName()
    if (selSetName === "") { return null }
    const selSetMsg = this.getSettingMsg(selSetName)
    if (selSetMsg == null) { return null }

    return (

      <React.Fragment>
        {this.renderControl(selSetMsg)}
      </React.Fragment>


    )

  }

  renderConfigs(){
    const settingsNamespace = this.state.settingsNamespace
    return(
      <Columns>
      <Column>


          <NepiIFConfig
                        namespace={settingsNamespace}
                        title={"Nepi_IF_Config"}
          />

        </Column>
        </Columns>


    )

  }
  
  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true

    // A node with no settings reports an empty controls list, so there is
    // nothing to gate on beyond that -- the old 'None' sentinel setting is no
    // longer published (the 'None' type maps to no control type).
    const has_settings = (this.getSettingNames().length > 0)

    const { userRestricted} = this.props.ros
    const ignore_restrictions = (this.props.ignore_restrictions !== undefined) ? this.props.ignore_restrictions : false
    const settings_view_restricted = userRestricted.indexOf('SYSTEM-SETTINGS-VIEW') !== -1 && (ignore_restrictions === false)

    if (has_settings === false || settings_view_restricted === true){
      return (
        <Columns>
        <Column>
       
        </Column>
        </Columns>
      )


    }
    else if (make_section === false){

      return (

          <React.Fragment>

               {this.renderSettings()}


          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={(this.props.title !== undefined) ? this.props.title : "Settings"}>

              {this.renderSettings()}


        </Section>
     )
   }

  }

}
export default Nepi_IF_Settings
