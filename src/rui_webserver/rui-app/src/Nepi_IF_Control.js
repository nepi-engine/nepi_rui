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

//import Toggle from "react-toggle"
import AsyncToggle from "./AsyncToggle"
//import Section from "./Section"
import { Columns, Column } from "./Columns"
import Select, { Option } from "./Select"
import Label from "./Label"
import Input from "./Input"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"
import { SliderAdjustment } from "./AdjustmentWidgets"
import RangeAdjustment from "./RangeAdjustment"
//import BooleanIndicator from "./BooleanIndicator"
import ColoredIndicator from "./ColoredIndicator"

import { round, rgbToIindicatorColor, setElementStyleModified, clearElementStyleModified, onChangeSwitchStateValue } from "./Utilities"






@inject("ros")
@observer

// Component that contains the ControlIF control. Renders one widget per
// control from a nepierfaces/ControlStatus message.
class Nepi_IF_Control extends Component {
  constructor(props) {
    super(props)

    this.STRING_TYPES = ["String","Selection","Selections"]
    this.BOOL_TYPES = ["Toggle","Toggles"]
    this.INT_TYPES = ["Menu","Int","Ints","IntSlider","ColorRGB"]
    this.FLOAT_TYPES = ["Float","Floats","FloatSlider","RangeSlider"]
    this.TRIGGER_TYPES = ['Button','Buttons']
    // The single-value types, mirroring nepi_controls.SINGLE_TYPES. The engine
    // tests this list FIRST and hands back value[0] for anything in it, so a
    // Selection reports one option string even though it is also a LIST_TYPE.
    // getControlValue has to make the same call in the same order.
    this.SINGLE_TYPES = ["Menu","Button","Toggle",
                         "String","Selection",
                         "Int","IntSlider",
                         "Float","FloatSlider"]

    this.DOUBLE_TYPES = ["RangeSlider"]

    this.TRIPLE_TYPES = ["ColorRGB"]


    this.state = {
      // name -> in-progress edit string for editable text/number inputs
      editValues: {},

      // name -> { baseline, typed, control_type } for values we have sent but not yet
      // seen confirmed in an incoming status. Keeps the optimistic override in
      // editValues alive until statusListener() reconciles it (see below).

      // "Selections" only: whether its option list is expanded. One
      // Nepi_IF_Control renders exactly one control_msg, so this is a plain
      // boolean rather than a name-keyed map. Local view state with no backend
      // round trip -- deliberately not mirrored into the control.
      ddOpen: false,

    }


    this.getControlValue = this.getControlValue.bind(this)

    this.renderIntSliderControl = this.renderIntSliderControl.bind(this)
    this.renderFloatSliderControl = this.renderFloatSliderControl.bind(this)

    this.renderBounds = this.renderBounds.bind(this)
    this.renderControl = this.renderControl.bind(this)

    this.onInputChange = this.onInputChange.bind(this)
    this.onInputKey = this.onInputKey.bind(this)
    this.toggleDropDown = this.toggleDropDown.bind(this)

  }




  
  toggleDropDown() {
    this.setState({ ddOpen: this.state.ddOpen === false })
  }

  // Read the current value a control reports in a status message, by name and
  // control_type. Returns null if the control isn't present or isn't an editable control_type.
  getControlValue() {


    const control_msg = this.props.control_msg !== undefined ? this.props.control_msg : null
    if (control_msg == null) { return null }
    const msg_value = control_msg.value
    const control_type = control_msg.type
    const display_round =  (control_msg.display_round >= 0) ? control_msg.display_round : 6

    const IS_STRING_TYPE = this.STRING_TYPES.indexOf(control_type)
    const IS_BOOL_TYPE =this.BOOL_TYPES.indexOf(control_type)
    const IS_INT_TYPE = this.INT_TYPES.indexOf(control_type)
    const IS_FLOAT_TYPE = this.FLOAT_TYPES.indexOf(control_type)
    const IS_TRIGGER_TYPE = this.TRIGGER_TYPES.indexOf(control_type)

    var values_list = null

    if (IS_STRING_TYPE !== -1){
      values_list = msg_value
    }
    else if (IS_BOOL_TYPE !== -1){
      values_list = msg_value.map(item => item === 'True')
    }
    else if (IS_FLOAT_TYPE !== -1){
      values_list = msg_value.map(item => round(parseFloat(item),display_round))
    }
    else if (IS_INT_TYPE !== -1){
      values_list = msg_value.map(item => parseInt(item))
    }
    else if (IS_TRIGGER_TYPE !== -1){
      values_list = msg_value.map(item => round(parseFloat(item),display_round))
    }

    if (values_list == null) { return null }
    // Control.value is always a string[] on the wire, one entry per component.
    // Single-value types unwrap to their one entry; everything else keeps the
    // list, which is what the multi-component branches map over.
    if (this.SINGLE_TYPES.indexOf(control_type) !== -1 ) {
      return (values_list.length > 0) ? [values_list[0]] : null
    }
    if (this.DOUBLE_TYPES.indexOf(control_type) !== -1 ) {
      return (values_list.length > 1) ? [values_list[0],values_list[1]] : null
    }
    if (this.TRIPLE_TYPES.indexOf(control_type) !== -1 ) {
      return (values_list.length > 2) ? [values_list[0],values_list[1],values_list[2]] : null
    }
    return values_list
  }

  
  // Editable text/number input helpers (PTX control pattern)
  onInputChange(name, e) {
    const el = document.getElementById('csbx_' + name)
    if (el) { setElementStyleModified(el) }
    const editValues = { ...this.state.editValues }
    editValues[name] = e.target.value
    this.setState({ editValues: editValues })
  }

  onInputKey(name, control_type, e) {
    if (e.key !== 'Enter') { return }

    const IS_STRING_TYPE = this.STRING_TYPES.indexOf(control_type)
    const IS_INT_TYPE = this.INT_TYPES.indexOf(control_type)
    const IS_FLOAT_TYPE = this.FLOAT_TYPES.indexOf(control_type)


    const namespace = this.props.namespace !== undefined ? this.props.namespace : null
    const topic = (this.props.topic !== undefined) ? this.props.topic : 'update_control'
    const { sendUpdateControlValue } = this.props.ros
    const el = document.getElementById('csbx_' + name)
    if (el) { clearElementStyleModified(el) }
    const raw = e.target.value
    // Value the control reports right now; statusListener() uses this baseline
    // to detect when the backend has acted on our change.
    const baseline = this.getControlValue()
    var sent = false
    // indexOf returns an index, never true, so none of these branches could
    // fire: pressing Enter in a text box published nothing at all.
    if (IS_STRING_TYPE !== -1) {
      sendUpdateControlValue(namespace  + "/" + topic, name, raw)
    } else if (IS_INT_TYPE !== -1) {
      const val = parseInt(raw, 10)
      if (!Number.isNaN(val)) { sendUpdateControlValue(namespace  + "/" + topic, name, raw); sent = true }
    } else if (IS_FLOAT_TYPE !== -1) {
      const val = parseFloat(raw)
      if (!Number.isNaN(val)) { sendUpdateControlValue(namespace  + "/" + topic, name, raw); sent = true }
    }
    const editValues = { ...this.state.editValues }
    delete editValues[name]
    
    this.setState({ editValues: editValues})
  }



  // Editable text/number input helpers (PTX control pattern)
  onInputChangeIndex(name, index, e) {
    const el = document.getElementById('csbx_' + name)
    if (el) { setElementStyleModified(el) }
    const editValues = { ...this.state.editValues }
    // List form, for the same reason render() needs it: a single-value control
    // reports a scalar, whose .length is undefined, so the guard below was
    // false and a keystroke in the box updated nothing.
    // Seed from any edit already in progress, not from the message: read from
    // the message, typing in one box of a multi-box control (ColorRGB's G)
    // threw away the unsent edit in its siblings (R).
    const current = (name in this.state.editValues) ? this.state.editValues[name] : this.getControlValue()
    var update_values = (current == null) ? [] : (Array.isArray(current) ? [...current] : [current])
    if (update_values.length > index){
        update_values[index] = e.target.value
        editValues[name] = update_values
      this.setState({ editValues: editValues })
    }
  }

  onInputKeyIndex(name, control_type, index, e) {
    if (e.key !== 'Enter') { return }

    const IS_STRING_TYPE = this.STRING_TYPES.indexOf(control_type)
    const IS_BOOL_TYPE =this.BOOL_TYPES.indexOf(control_type)
    const IS_INT_TYPE = this.INT_TYPES.indexOf(control_type)
    const IS_FLOAT_TYPE = this.FLOAT_TYPES.indexOf(control_type)
    const IS_TRIGGER_TYPE = this.TRIGGER_TYPES.indexOf(control_type)

    const namespace = this.props.namespace !== undefined ? this.props.namespace : null
    const topic = (this.props.topic !== undefined) ? this.props.topic : 'update_control'
    const { sendUpdateControlValue } = this.props.ros
    const el = document.getElementById('csbx_' + name)
    if (el) { clearElementStyleModified(el) }
    const raw = e.target.value
    // Value the control reports right now; statusListener() uses this baseline
    // to detect when the backend has acted on our change.
    const baseline = this.getControlValue()
    var sent = false
    // Same two fixes as onInputKey: the type is spelled ColorRGB, and indexOf
    // returns an index rather than true, so no per-component edit ever sent.
    if (control_type === "ColorRGB") {
      const val = parseInt(raw, 10)
      if (!Number.isNaN(val)) {
        if (val >= 0 && val <= 255){
          sendUpdateControlValue(namespace  + "/" + topic, name, raw, index); sent = true
        }
      }
    }
    else if (IS_STRING_TYPE !== -1) {
      sendUpdateControlValue(namespace  + "/" + topic, name, raw, index)
    }
    else if (IS_INT_TYPE !== -1) {
      const val = parseInt(raw, 10)
      if (!Number.isNaN(val)) { sendUpdateControlValue(namespace  + "/" + topic, name, raw, index); sent = true }
    }
    else if (IS_FLOAT_TYPE !== -1) {
      const val = parseFloat(raw)
      if (!Number.isNaN(val)) { sendUpdateControlValue(namespace  + "/" + topic, name, raw, index); sent = true }
    }
    const editValues = { ...this.state.editValues }
    delete editValues[name]
    
    this.setState({ editValues: editValues})
  }



  renderBounds(min,max){

        // -999 is the Control.msg "no limit" sentinel, tested the same way the
        // slider branches below test it. Each end is judged on its own, so a
        // control bounded below and open above keeps just its Min box.
        const show_min = (min !== -999)
        const show_max = (max !== -999)

        // Columns filters falsy children and recounts, so the surviving box gets
        // first && last and goes full width.
        if (show_min === false && show_max === false) { return null }

        return (

          <React.Fragment>

                <Columns>
                {(show_min === true) ?
                  <Column>

                    <label > {"Min"} </label>
                    <Input disabled={true} style={{ width: "100%" }} value={min} />

                  </Column>
                : null
                }
                {(show_max === true) ?
                  <Column>

                    <label > {"Max"} </label>
                    <Input disabled={true} style={{ width: "100%" }} value={max} />

                  </Column>
                : null
                }
              </Columns>

          </React.Fragment>

        )
      }




  renderControl(control_value, control_index, control_msg) {

    if (control_value == null || control_msg == null) {
      return (
        <React.Fragment>
          
        </React.Fragment>
      )
    }
    else {
      const topic = (this.props.topic !== undefined) ? this.props.topic : 'update_control'
      // Bound here as in every other handler in this file: the widgets below
      // publish, and neither name was in scope.
      const namespace = this.props.namespace !== undefined ? this.props.namespace : null
      const { sendUpdateControlValue } = this.props.ros
      const name = control_msg.name
      const control_type =  control_msg.type
      const display_label = control_msg.display_labels[control_index]
      // Control.msg spells it display_disabled.
      const control_disabled = this.props.disabled !== undefined ? this.props.disabled : control_msg.display_disabled
      const min_bound = control_msg.min_bound
      const max_bound = control_msg.max_bound
      const show_bounds = (control_disabled === false) && (this.props.show_bounds !== undefined ? this.props.show_bounds : true)
      // Named value_round, NOT round: `round` is the formatting helper imported
      // from ./Utilities at the top of this file, and a const of that name
      // shadows it for the whole function body -- which made every Float branch
      // below throw "round is not a function" and take the page down with it.
      const value_round =  (control_msg.round >= 0) ? control_msg.round : 6
      const display_round =  (control_msg.display_round >= 0) ? control_msg.display_round : 6



      const IS_STRING_TYPE = this.STRING_TYPES.indexOf(control_type)
      const IS_BOOL_TYPE =this.BOOL_TYPES.indexOf(control_type)
      const IS_INT_TYPE = this.INT_TYPES.indexOf(control_type)
      const IS_FLOAT_TYPE = this.FLOAT_TYPES.indexOf(control_type)
      const IS_TRIGGER_TYPE = this.TRIGGER_TYPES.indexOf(control_type)


      const show_value = control_value


    if (IS_BOOL_TYPE !== -1){

        const checked = (show_value === 'True' || show_value === 'true' || show_value === true)
        return (
          <React.Fragment>

              <Label title={display_label} key={name}>
                <AsyncToggle
                  disabled={control_disabled}
                  checked={checked}
                  onClick={() => sendUpdateControlValue(namespace  + "/" + topic, name, !checked)}
                />
              </Label> 

          </React.Fragment>  
        )


    }
    else if (IS_INT_TYPE !== -1){
        return (

            <React.Fragment>

          <Label title={display_label} key={name}></Label>
                
                <Input
                  disabled={control_disabled}
                  id={'csbx_' + name}
                  style={{ width: "100%" }}
                  value={show_value}
                  onChange={(e) => this.onInputChangeIndex(name, control_index,  e)}
                  onKeyDown={(e) => this.onInputKeyIndex(name, control_type, control_index, e)}
                />

            </React.Fragment> 
        )
    }

    else if (IS_FLOAT_TYPE !== -1){
        return (

        <React.Fragment>

            <Label title={display_label} key={name}></Label>

            <Input
              disabled={control_disabled}
              id={'csbx_' + name}
              style={{ width: "100%" }}
              value={show_value}
              onChange={(e) => this.onInputChangeIndex(name, control_index,  e)}
              onKeyDown={(e) => this.onInputKeyIndex(name, control_type, control_index, e)}
            />
        
        </React.Fragment> 
        )
    }

    else if (IS_TRIGGER_TYPE !== -1){
        return (
          <React.Fragment>
            <ButtonMenu>
              <Button
                disabled={control_disabled}
                onClick={() => sendUpdateControlValue(namespace  + "/" + topic, name, 'TRIGGER', control_index)}>{display_label}</Button>
            </ButtonMenu>
        </React.Fragment>
        )
    }

      else{
        return (null)
      }
    }
  }



  renderIntSliderControl(name,value,min,max, index, control_disabled, title){
        const namespace = this.props.namespace !== undefined ? this.props.namespace : null
        const topic = (this.props.topic !== undefined) ? this.props.topic : 'update_control'
        // comp_name is what sendUpdate() publishes the control as, so it stays
        // the control name; title is display only and may differ per component.
        const slider_title = (title !== undefined) ? title : name

        return (
          <SliderAdjustment
            disabled={control_disabled}
            title={slider_title}
            comp_name={name}
            comp_index={index}
            is_control={true}
            topic={namespace + "/" + topic}
            msgType={"std_msgs/Float32"}
            adjustment={value}
            min={min}
            max={max}
            step={1}
            displayDecimals={0}
            scaled={1}
            tooltip={name}
            unit={""}
          />
        )
      }



  renderFloatSliderControl(name,value,min,max,round, display_round, index, control_disabled){
        const namespace = this.props.namespace !== undefined ? this.props.namespace : null
        const topic = (this.props.topic !== undefined) ? this.props.topic : 'update_control'
        // Step size and display precision come off the control message the same
        // defensive way the bounds above do. Both MUST be passed: SliderAdjustment
        // defaults step to 1, and its render rounds the value to displayDecimals
        // before handing it to BOTH the slider handle and the (disabled) text box.
        // Left unset, a [0.0, 1.0] control is a two-position switch, and passing
        // only one of the two still is -- a display coarser than the step
        // re-quantizes the handle even when the step is right.
        //
        // round is how many decimals the node rounds a SET value to
        // (nepi_control default -1, meaning no rounding); display_round is how
        // many the RUI should show (default 2). Neither is trusted on its own:
        // both are int32, so a control message that never carried them arrives
        // with 0 rather than undefined, and round 0 is step 1 -- the defect
        // again. The range check below is what actually rules that out.
        const range = max - min
        const fallback_step = (range > 0) ? (range / 100) : 1
        var step = (round >= 0 && round <= 6) ? Math.pow(10, -round) : fallback_step
        // Fewer than three stops between the ends is not a slider, whatever the
        // message asked for. Also catches range <= 0 and any non-finite bound.
        if (!(step > 0) || !((range / step) >= 2)) { step = fallback_step }
        if (!Number.isFinite(step) || step <= 0) { step = 1 }
        // Never display coarser than the step -- see the note above -- and never
        // finer than the node asked for.
        const step_decimals = Math.min(6, Math.max(0, Math.ceil(-Math.log10(step))))
        const displayDecimals = Math.max(step_decimals, display_round)

        return (
          <SliderAdjustment
            disabled={control_disabled}
            title={name}
            comp_name={name}
            comp_index={index}
            is_control={true}
            topic={namespace + "/" + topic}
            msgType={"std_msgs/Float32"}
            adjustment={value}
            min={min}
            max={max}
            step={step}
            displayDecimals={displayDecimals}
            scaled={1}
            tooltip={name}
            unit={""}
          />
        )
      }



  // Render a single control given its control_type and Control message.
  // Each block below maps one nepi_control control control_type to its RUI widget and
  // the nepi_control "value_*_control_value" topic it publishes to on change.
  render() {
    const { sendUpdateControlValue } = this.props.ros
    const namespace = this.props.namespace !== undefined ? this.props.namespace : null
    const topic = (this.props.topic !== undefined) ? this.props.topic : 'update_control'
    const control_msg = this.props.control_msg !== undefined ? this.props.control_msg : null

  
    if (namespace == null || control_msg == null) {
      return (
        <React.Fragment>
          
        </React.Fragment>
      )
    }
    else {

      const name = control_msg.name
      const control_type =  control_msg.type
      const display_name = (control_msg.display_name && control_msg.display_name !== '') ? control_msg.display_name : name
      // True when there IS a name to show; the consumer below hides on false.
      const show_header_label = display_name !== '' && display_name !== 'None'
      // Control.msg spells these display_hidden / display_disabled. Read under
      // the old names both were undefined, so nothing ever hid or disabled --
      // and show_bounds, which gates on control_disabled === false, never
      // rendered the min/max boxes.
      const control_hidden = this.props.hidden !== undefined ? this.props.hidden : control_msg.display_hidden
      const control_disabled = this.props.disabled !== undefined ? this.props.disabled : control_msg.display_disabled
      // Control.display_row: true lays a multi-value control's widgets side by
      // side in one row, false stacks them. Defaulted rather than read bare so
      // a publisher built against the older message -- where this field was a
      // string, and arrives here undefined -- keeps the stacked layout it has
      // always had.
      const display_row = (control_msg.display_row === true)
      const options = control_msg.options
      const display_labels = control_msg.display_labels
      const min_bound = control_msg.min_bound
      const max_bound = control_msg.max_bound
      const show_bounds = (control_disabled === false) && (this.props.show_bounds !== undefined ? this.props.show_bounds : true)
      const values = this.getControlValue()
      const value_round =  (control_msg.round >= 0) ? control_msg.round : 6
      const display_round =  (control_msg.display_round >= 0) ? control_msg.display_round : 6
     
      const editing = (name in this.state.editValues)



      if (control_hidden === true || values == null){
        return (
          <React.Fragment>
            
          </React.Fragment>
        )
      }

      // MENU -- drop-down of string options; the control's values[0] is the *index*
      // of the selected option. Sends the new index as an Int.
      else if (control_type === "Menu") {
        const value = values[0]
        return (
          <Label title={display_name} key={name}>
            <Select
              disabled={control_disabled}
              id={'csbx_' + name}
              value={value}
              onChange={(e) => sendUpdateControlValue(namespace  + "/" + topic,  name, String(parseInt(e.target.value, 10)))}
            >
              {options.map((opt, i) => <Option key={name + '_' + i} value={i}>{opt}</Option>)}
            </Select>
          </Label>
        )
      }

      // STRING  -- free-form typed values. These follow the PTX
      // editable-input pattern: the box shows an in-progress edit string while
      // the user types, and the value is sent (parsed to the right control_type) only on
      // Enter. See onInputChange / onInputKey above.
      else if (control_type === "String" ) {
        const value = values[0]
        const show_value = (editing === true) ? this.state.editValues[name] : value
        return (
          <Label title={display_name} key={name}>
            <Input
              disabled={control_disabled}
              id={'csbx_' + name}
              style={{ width: "100%" }}
              value={show_value}
              onChange={(e) => this.onInputChange(name, e)}
              onKeyDown={(e) => this.onInputKey(name, control_type, e)}
            />
          </Label>
        )
      }


      // SELECTION -- drop-down of string options; the control's value is the
      // selected option *text* (not its index). Sends the new text as a String.
      // "Discrete" is an alias of "Selection", not a separate control_type: it is the
      // spelling driver params yaml files use for the same named option list,
      // so it renders through this same branch. 
      else if (control_type === "Selection") {
        const value = values[0]
        return (
          <Label title={display_name} key={name}>
            <Select
              disabled={control_disabled}
              id={'csbx_' + name}
              value={value}
              onChange={(e) => sendUpdateControlValue(namespace  + "/" + topic, name, e.target.value)}
            >
              {options.map((opt, i) => <Option key={name + '_' + i} value={opt}>{opt}</Option>)}
            </Select>
          </Label>
        )
      }

    
      else if (control_type === "Selections") {
        // "None" and "All" are actions, not selectable options: they are never
        // highlighted and are never sent as values -- they resolve to [] and to
        // the full option list respectively. Mixed case, and the collapsed
        // affordance below is a bare narrow <Select>, because this widget is
        // deliberately the same dropdown as the AI detector's class selector
        // (NepiMgrAiDetector.js renderDetectorSettings) rather than a lookalike.
        // Note the existing "Toggles" toggle branch above spells these NONE
        // and ALL; the difference is intentional, it follows its own source.
        const rows = ['None', 'All', ...options]
        return (
          <Label title={display_name} key={name}>
            <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
            <div
              id={'csbx_' + name}
              onClick={this.toggleDropDown}
              style={{backgroundColor: Styles.vars.colors.grey0}}
            >
              <Select style={{width: "10px"}}/>
            </div>
            <div hidden={this.state.ddOpen === false}>
              {rows.map((opt, i) => (
                <div
                  disabled={control_disabled}
                  key={name + '_dd_' + i}
                  onClick={() => {
                    const next = (opt === 'All') ? options :
                                   (opt === 'None') ? [] :
                                     values.indexOf(opt) !== -1
                                       ? values.filter((s) => s !== opt)
                                       : [...values, opt]
                    sendUpdateControlValue(namespace + "/" + topic, name, next)
                  }}
                  style={{
                    textAlign: "center",
                    padding: `${Styles.vars.spacing.xs}`,
                    color: Styles.vars.colors.black,
                    backgroundColor: (values.indexOf(opt) !== -1)
                                       ? Styles.vars.colors.blue
                                       : Styles.vars.colors.grey0,
                    cursor: "pointer",
                  }}
                >
                  {opt}
                </div>
              ))}
            </div>
          </Label>
        )
      }



      // INTSLIDER -- a single decimal value dragged between a min and max.
      // bounds carries [min, max]; -999 in either slot means "no limit",
      // in which case we fall back to a sensible default (0 / 100).
      else if (control_type === "IntSlider") {
        const value = values[0]
        const min = (min_bound !== -999) ? min_bound : 0
        const max = (max_bound !== -999) ? max_bound : 255
      
        return this.renderIntSliderControl(name,value,min,max,'', control_disabled)
      }


      // // INTSLIDERS -- a multi-select: each option gets its own int slider. 
      // // names come from the display_labels list. On every toggle
      // // we send the complete desired selection (declarative), not a single delta.
      // else if (control_type === "IntSliders") {
      //   const value = values[0]
      //   const min = (min_bound !== -999) ? min_bound : 0
      //   const max = (max_bound !== -999) ? max_bound : 255
      //   return (
      //   <React.Fragment>
      //     <div hidden={show_header_label === false }>
      //     <Label title={display_name} key={name}></Label>
      //     </div>
      //             {(display_row === true) ?
      //               <Columns>
      //                 {display_labels.map((slider_name, index) => (
      //                   <Column key={name + '_row_' + index}>
      //                     {this.renderIntSliderControl(slider_name, values[index], min, max, index, control_disabled)}
      //                   </Column>
      //                 ))}
      //               </Columns>
      //             :
      //               <div>
      //                 {/* Map over the device names array */}
      //                 {display_labels.map((slider_name, index) => (
      //                   this.renderIntSliderControl(slider_name, values[index], min, max, index, control_disabled)
      //                 ))}
      //               </div>
      //             }
      //     </React.Fragment>
      //   )
      // }



      // FLOATSLIDER -- a single decimal value dragged between a min and max.
      // bounds carries [min, max]; -999 in either slot means "no limit",
      // in which case we fall back to a sensible default (0 / 100).
      else if (control_type === "FloatSlider") {
        const value = values[0]
        const min = (min_bound !== -999) ? min_bound : 0
        const max = (max_bound !== -999) ? max_bound : 1

        // Step size and display precision come off the control message the same
        // defensive way the bounds above do. Both MUST be passed: SliderAdjustment
        // defaults step to 1, and its render rounds the value to displayDecimals
        // before handing it to BOTH the slider handle and the (disabled) text box.
        // Left unset, a [0.0, 1.0] control is a two-position switch, and passing
        // only one of the two still is -- a display coarser than the step
        // re-quantizes the handle even when the step is right.
        //
        // round is how many decimals the node rounds a SET value to
        // (nepi_control default -1, meaning no rounding); display_round is how
        // many the RUI should show (default 2). Neither is trusted on its own:
        // both are int32, so a control message that never carried them arrives
        // with 0 rather than undefined, and round 0 is step 1 -- the defect
        // again. The range check below is what actually rules that out.
        return this.renderFloatSliderControl(name,value,min,max,value_round,display_round,'', control_disabled)
      }

      // RANGESLIDER -- a min/max *range* dragged between two limits. values
      // holds the current [min, max] handles; bounds holds the outer
      // [min_limit, max_limit] the handles may move within.
      else if (control_type === "RangeSlider") {
        // control_msg.values is not a field on Control.msg -- the handles come
        // from the value list, which getControlValue already parsed to floats.
        
        const handles = (values.length > 1) ? [values[0],values[1]] : [0, 1]
        const min_limit = (min_bound !== -999) ? min_bound : 0
        const max_limit = (max_bound !== -999) ? max_bound : 100
        return (
          <RangeAdjustment
            disabled={control_disabled}
            key={name}
            title={display_name}
            comp_name={name}
            is_control={true}
            topic={namespace + "/" + topic}
            min={handles[0]}
            max={handles[1]}
            min_limit_m={min_limit}
            max_limit_m={max_limit}
            tooltip={control_msg.description}
            unit={""}
          />
        )
      }


      // ColorRGB -- one 0-255 component per channel, labelled from
      // display_labels, over a swatch of the combined color. Boxes go through
      // renderControl and sliders through renderIntSliderControl, the same two
      // helpers every other multi-value control uses.
      else if (control_type === "ColorRGB") {
        const edit_values = (editing === true) ? this.state.editValues[name] : null
        const show_values = (edit_values == null) ? values
                          : (Array.isArray(edit_values) ? edit_values : [edit_values])
        const indicator_color = rgbToIindicatorColor(show_values[0],show_values[1],show_values[2])
        return (

          <React.Fragment>

            <Columns>
              <Column>
                <Label title={display_name} key={name}> </Label>
              </Column>
              <Column>
                <ColoredIndicator indicator_color={indicator_color} />
              </Column>
            </Columns>

            <Columns>
              {show_values.map((comp_value, index) => (
                <Column key={name + '_rgb_' + index}>
                  {this.renderControl(comp_value, index, control_msg)}
                </Column>
              ))}
            </Columns>

            <div>
              {display_labels.map((slider_name, index) => (
                <React.Fragment key={name + '_slider_' + index}>
                  {this.renderIntSliderControl(name, show_values[index], 0, 255, index, control_disabled, slider_name)}
                </React.Fragment>
              ))}
            </div>

          </React.Fragment>
        )
      }

      // Fallthrough for every remaining type -- one renderControl per value
      // entry -- reached because each branch above returns. It was written as an
      // empty `else {}` followed by this return, which is the same thing; the
      // brace that closed that else is the one this return needs to stay inside
      // the enclosing block. show_values must be the LIST: round() of the whole
      // value returned a number, which has no .map(). An in-progress edit
      // already holds the full updated array (onInputChangeIndex writes it so).
      // Same list guard as `values`: onInputChangeIndex stores the whole updated
      // array, but onInputChange stores a bare string for a single-value control.
      const edit_values = (editing === true) ? this.state.editValues[name] : null
      const show_values = (edit_values == null) ? values
                        : (Array.isArray(edit_values) ? edit_values : [edit_values])

      return (

        <React.Fragment>
          <div hidden={show_header_label === false }>
          <Label title={display_name} key={name}></Label>
          </div>


        <div hidden={show_bounds === false}>
          {this.renderBounds(min_bound,max_bound)}
        </div>

          {(display_row === true) ?
            <Columns>
              {/* Same renderControl calls as the stacked layout below, one per
                  value entry -- only the wrapper differs, so what each widget
                  publishes is unchanged. */}
              {show_values.map((comp_value, index) => (
                <Column key={name + '_row_' + index}>
                  {this.renderControl(comp_value, index, control_msg)}
                </Column>
              ))}
            </Columns>
          :
            <div>
              {/* Map over the device names array */}
              {show_values.map((comp_value, index) => (
                this.renderControl(comp_value, index, control_msg)
              ))}
            </div>
          }

          </React.Fragment>
        )

      }

  }

}

export default Nepi_IF_Control
