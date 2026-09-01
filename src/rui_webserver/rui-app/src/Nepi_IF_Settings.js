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
    this.getSettingNames = this.getSettingNames.bind(this)
    this.getSettingIndex = this.getSettingIndex.bind(this)
    this.getSettingType = this.getSettingType.bind(this)
    this.getSettingMsg = this.getSettingMsg.bind(this)
    this.getSettingValue = this.getSettingValue.bind(this)
    this.getSettingValueString = this.getSettingValueString.bind(this)
    this.getSettingBounds = this.getSettingBounds.bind(this)
    this.getSelectedSettingName = this.getSelectedSettingName.bind(this)

    this.sendSettingValue = this.sendSettingValue.bind(this)
    this.onSelectSetting = this.onSelectSetting.bind(this)
    this.onChangeBoolSettingValue = this.onChangeBoolSettingValue.bind(this)
    this.onChangeDescreteSettingValue = this.onChangeDescreteSettingValue.bind(this)
    this.onUpdateInputSettingValue = this.onUpdateInputSettingValue.bind(this)
    this.onKeySaveInputSettingValue = this.onKeySaveInputSettingValue.bind(this)
    this.onChangeSliderSettingValue = this.onChangeSliderSettingValue.bind(this)
    this.getSelectedSettingSliderInfo = this.getSelectedSettingSliderInfo.bind(this)

    this.getSettingsAsString = this.getSettingsAsString.bind(this)
    this.getSortedStrList = this.getSortedStrList.bind(this)

    this.renderSettings = this.renderSettings.bind(this)
    this.renderSetting = this.renderSetting.bind(this)
    this.renderConfigs = this.renderConfigs.bind(this)
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


  ////////////////////////////////////////////////////////////
  // Status message readers.  A settings status is a ControlsStatus: parallel
  // name/type lists plus one Control message per setting carrying its options,
  // bounds and factory/default/set values.

  getStatusMsg() {
    return (this.props.status_msg !== undefined && this.props.status_msg !== null) ?
      this.props.status_msg : this.state.status_msg
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

  getSettingIndex(name) {
    const status_msg = this.getStatusMsg()
    if (status_msg == null) { return -1 }
    const names = status_msg.controls_name_list || []
    return names.indexOf(name)
  }

  getSettingType(name) {
    const status_msg = this.getStatusMsg()
    const ind = this.getSettingIndex(name)
    if (status_msg == null || ind === -1) { return "" }
    const types = status_msg.controls_type_list || []
    return types[ind]
  }

  getSettingMsg(name) {
    const status_msg = this.getStatusMsg()
    const ind = this.getSettingIndex(name)
    if (status_msg == null || ind === -1) { return null }
    const msgs = status_msg.controls_msg_list || []
    return msgs[ind]
  }

  // The value in its own natural form: an index for Menu, a bool for Bool, a
  // number for Int/Float, a string for Selection/String.
  getSettingValue(name) {
    const type = this.getSettingType(name)
    const msg = this.getSettingMsg(name)
    if (msg == null) { return null }
    if (type === "Menu") { return msg.set_index }
    if (type === "Selection" || type === "String") { return msg.set_string }
    if (type === "Bool") { return msg.set_bool }
    if (type === "Int") { return msg.set_int }
    if (type === "Float" || type === "FloatSlider") { return msg.set_float }
    return null
  }

  // The value as displayed text.  A Menu reads back as its selected option
  // string so the selector and the summary list agree.
  getSettingValueString(name) {
    const type = this.getSettingType(name)
    const msg = this.getSettingMsg(name)
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

  // [minStr, maxStr] for a numeric setting, or ["", ""] when it declares no
  // bounds.  -999 in either slot is the nepi_controls "no limit" sentinel.
  getSettingBounds(name) {
    const type = this.getSettingType(name)
    const msg = this.getSettingMsg(name)
    if (msg == null) { return ["", ""] }
    var bounds = null
    if (type === "Int") { bounds = msg.int_bounds }
    else if (type === "Float" || type === "FloatSlider") { bounds = msg.float_bounds }
    if (bounds == null || bounds.length < 2) { return ["", ""] }
    const lo = (bounds[0] !== -999) ? String(bounds[0]) : ""
    const hi = (bounds[1] !== -999) ? String(bounds[1]) : ""
    return [lo, hi]
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

  onChangeBoolSettingValue() {
    const name = this.getSelectedSettingName()
    const current = (this.getSettingValue(name) === true)
    this.sendSettingValue(name, "Bool", !current)
  }

  onChangeDescreteSettingValue(event) {
    const name = this.getSelectedSettingName()
    const type = this.getSettingType(name)
    const ind = event.nativeEvent.target.selectedIndex
    const text = event.nativeEvent.target[ind].text
    if (type === "Menu") {
      // A Menu's value is the index of its option, not the option text.
      const msg = this.getSettingMsg(name)
      const options = (msg != null) ? (msg.string_options || []) : []
      const option_ind = options.indexOf(text)
      if (option_ind === -1) { return }
      this.sendSettingValue(name, "Menu", option_ind)
    } else {
      this.sendSettingValue(name, type, text)
    }
  }

  onUpdateInputSettingValue(event) {
    const el = document.getElementById("input_setting")
    if (el) { setElementStyleModified(el) }
    this.setState({ selectedSettingInput: event.target.value })
  }

  onKeySaveInputSettingValue(event) {
    if (event.key !== 'Enter') { return }
    const name = this.getSelectedSettingName()
    const type = this.getSettingType(name)
    const el = document.getElementById("input_setting")
    if (el) { clearElementStyleModified(el) }
    this.sendSettingValue(name, type, event.target.value)
  }

  // An Int/Float setting that declares both a lower and an upper bound is
  // dragged rather than typed. Returns null for every other setting -- no
  // bounds means no slider range, so those stay on the typed input box.
  getSelectedSettingSliderInfo(type, minStr, maxStr) {
    if (type !== "Int" && type !== "Float" && type !== "FloatSlider") { return null }
    const min = parseFloat(minStr)
    const max = parseFloat(maxStr)
    if (!Number.isFinite(min) || !Number.isFinite(max)) { return null }
    const range = max - min
    if (!(range > 0)) { return null }

    // Int steps by 1. Float steps by a hundredth of its range, and the text
    // box must not display coarser than that step -- a display coarser than
    // the step re-quantizes the handle, so a [0, 1] control reads as a
    // two-position switch even when the step itself is right.
    var step = 1
    if (type !== "Int") {
      step = range / 100
      if (!Number.isFinite(step) || step <= 0) { step = 1 }
    }
    const displayDecimals = (type === "Int") ? 0 :
      Math.min(6, Math.max(0, Math.ceil(-Math.log10(step))))
    return { min: min, max: max, step: step, displayDecimals: displayDecimals }
  }

  onChangeSliderSettingValue(value, type) {
    const name = this.getSelectedSettingName()
    // Ints go on the wire as integers -- the value is typed now, so there is
    // no string for the backend to reparse.
    const sendValue = (type === "Int") ? Math.round(value) : value
    this.setState({ selectedSettingInput: String(sendValue) })
    this.sendSettingValue(name, type, sendValue)
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
    const selSetType = this.getSettingType(selSetName)
    const selSetMsg = this.getSettingMsg(selSetName)
    if (selSetMsg == null) { return null }

    const bounds = this.getSettingBounds(selSetName)
    const selSetMin = bounds[0]
    const selSetMax = bounds[1]
    const selSetOptions = selSetMsg.string_options || []
    const selValueStr = this.getSettingValueString(selSetName)

    const selOptions = createMenuListFromStrList(selSetOptions,false,[],["Select"],[])

    // Numeric settings with both bounds declared get a slider instead of the
    // typed input box. slider is null for everything else.
    const slider = this.getSelectedSettingSliderInfo(selSetType, selSetMin, selSetMax)
    // The slider handle tracks the local edit value, not the status value, so
    // dragging does not fight the status messages coming back from the node.
    // onSelectSetting resets it whenever a different setting is selected.
    var sliderValue = parseFloat(this.state.selectedSettingInput)
    if (slider !== null) {
      if (!Number.isFinite(sliderValue)) { sliderValue = parseFloat(selValueStr) }
      if (!Number.isFinite(sliderValue)) { sliderValue = slider.min }
      sliderValue = Math.min(Math.max(sliderValue, slider.min), slider.max)
    }

    // The typed box shows the operator's in-progress edit if there is one, and
    // the reported value otherwise.
    const inputValue = (this.state.selectedSettingInput !== "") ?
      this.state.selectedSettingInput : selValueStr

    return (

        <Columns>
        <Column>

          <div align={"left"} textAlign={"right"} hidden={selSetType !== "Bool" }>
            <Label title={selSetName}>
              <AsyncToggle
                checked={ (selValueStr === "True")}
                onClick={() => {this.onChangeBoolSettingValue()}}
              />
            </Label>
          </div>

            

            <div align={"left"} textAlign={"right"} hidden={selSetType !== "Menu" && selSetType !== "Selection" }>
            <Label title={selSetName}>
              <Select
                id="descreteSetting"
                onChange={this.onChangeDescreteSettingValue}
                value={selValueStr}
              >
                {selOptions}
              </Select>
            </Label>
            </div>

          <div align={"left"} textAlign={"right"} 
            hidden={!(selSetType === "String" ||
            selSetType === "Int" ||
            selSetType === "Float" ||
            selSetType === "FloatSlider")}
          >

              <div align={"left"} textAlign={"right"} hidden={selSetMin === ""}>
                  <Label title={"Lower Input Limit"}>
                    <Input disabled value={selSetMin} />
                  </Label>
              </div>

              <div align={"left"} textAlign={"right"} hidden={selSetMax === ""}>
                  <Label title={"Upper Input Limit"}>
                    <Input disabled value={selSetMax} />
                  </Label>
              </div>

              {(slider !== null) ?
                <SliderAdjustment
                  key={selSetName}
                  title={selSetName}
                  topic={this.state.settingsNamespace + "/update_setting"}
                  msgType={"nepi_interfaces/UpdateControl"}
                  adjustment={sliderValue}
                  onSliderChangeOverride={(value) => this.onChangeSliderSettingValue(value, selSetType)}
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  displayDecimals={slider.displayDecimals}
                  scaled={1}
                  tooltip={selSetMsg.description}
                  unit={""}
                />
                :
                <Label title={selSetName}>
                  <Input id="input_setting"
                    value={inputValue}
                    onChange={this.onUpdateInputSettingValue}
                    onKeyDown= {this.onKeySaveInputSettingValue} />
                </Label>
              }

          </div>


        </Column>
      </Columns>



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
