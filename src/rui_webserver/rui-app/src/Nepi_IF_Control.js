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

import Toggle from "react-toggle"
import AsyncToggle from "./AsyncToggle"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Select, { Option } from "./Select"
import Label from "./Label"
import Input from "./Input"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"
import { SliderAdjustment } from "./AdjustmentWidgets"
import RangeAdjustment from "./RangeAdjustment"

import { round, setElementStyleModified, clearElementStyleModified, onChangeSwitchStateValue } from "./Utilities"

@inject("ros")
@observer

// Component that contains the ControlIF control. Renders one widget per
// control from a nepi_interfaces/ControlStatus message.
class Nepi_IF_Control extends Component {
  constructor(props) {
    super(props)

    this.state = {
      // name -> in-progress edit string for editable text/number inputs
      editValues: {},

      // name -> { baseline, typed, type } for values we have sent but not yet
      // seen confirmed in an incoming status. Keeps the optimistic override in
      // editValues alive until statusListener() reconciles it (see below).
      pending: {},

    }

    this.onInputChange = this.onInputChange.bind(this)
    this.onInputKey = this.onInputKey.bind(this)
  }

  // Read the current value a control reports in a status message, by name and
  // type. Returns null if the control isn't present or isn't an editable type.
  getControlValue(message, name, type) {
    if (message == null) { return null }
    const names = message.control_name_list || []
    const i = names.indexOf(name)
    if (i === -1) { return null }
    const msgs = message.control_msg_list || []
    const m = msgs[i]
    if (m == null) { return null }
    if (type === "String") { return m.set_string }
    if (type === "Int") { return m.set_int }
    if (type === "Float") { return m.set_float }
    return null
  }

  // Editable text/number input helpers (PTX control pattern)
  onInputChange(name, e) {
    const el = document.getElementById('csbx_' + name)
    if (el) { setElementStyleModified(el) }
    const editValues = { ...this.state.editValues }
    editValues[name] = e.target.value
    this.setState({ editValues: editValues })
  }

  onInputKey(name, type, e) {
    if (e.key !== 'Enter') { return }
    const namespace = this.props.namespace !== undefined ? this.props.namespace : null
    const topic = (this.props.topic !== undefined) ? this.props.topic : 'update_control'
    const { sendUpdateControlValue } = this.props.ros
    const el = document.getElementById('csbx_' + name)
    if (el) { clearElementStyleModified(el) }
    const raw = e.target.value
    // Value the control reports right now; statusListener() uses this baseline
    // to detect when the backend has acted on our change.
    const baseline = this.getControlValue(this.state.status_msg, name, type)
    var sent = false
    if (type === "String") {
      sendUpdateControlValue(namespace  + "/" + topic, name, raw)
      sent = true
    } else if (type === "Int") {
      const val = parseInt(raw, 10)
      if (!Number.isNaN(val)) { sendUpdateControlValue(namespace  + "/" + topic, name, raw); sent = true }
    } else if (type === "Float") {
      const val = parseFloat(raw)
      if (!Number.isNaN(val)) { sendUpdateControlValue(namespace  + "/" + topic, name, raw); sent = true }
    }
    const editValues = { ...this.state.editValues }
    const pending = { ...this.state.pending }
    if (sent) {
      // Keep showing the typed text (optimistic) until a status message
      // confirms the change; statusListener() clears these once reconciled.
      editValues[name] = raw
      pending[name] = { baseline: baseline, typed: raw, type: type }
    } else {
      // Invalid input: fall back to the last reported value (original behavior).
      delete editValues[name]
      delete pending[name]
    }
    this.setState({ editValues: editValues, pending: pending })
  }

  // Render a single control given its type and Control message.
  // Each block below maps one nepi_control control type to its RUI widget and
  // the nepi_control "set_*_control_value" topic it publishes to on change.
  render() {
    const { sendUpdateControlValue } = this.props.ros
    const namespace = this.props.namespace !== undefined ? this.props.namespace : null
    const topic = (this.props.topic !== undefined) ? this.props.topic : 'update_control'
    const control_msg = this.props.control_msg !== undefined ? this.props.control_msg : null
    const control_hidden = this.props.control_hidden !== undefined ? this.props.control_hidden : false
    const show_bounds = this.props.show_bounds !== undefined ? this.props.show_bounds : false
  
    if (namespace == null || control_msg == null || control_hidden === true) {
      return (
        <React.Fragment>
          
        </React.Fragment>
      )
    }
    else {

      const name = control_msg.name
      const type =  control_msg.type
      const display_name = (control_msg.display_name && control_msg.display_name !== '') ? control_msg.display_name : name

      // Value inputs whose value tracks either the in-progress edit or the message
      const editing = (name in this.state.editValues)

      // MENU -- drop-down of string options; the control's value is the *index*
      // of the selected option. Sends the new index as an Int.
      if (type === "Menu") {
        const options = control_msg.string_options
        const set_index = control_msg.set_index
        return (
          <Label title={display_name} key={name}>
            <Select
              id={'csbx_' + name}
              value={set_index}
              onChange={(e) => sendUpdateControlValue(namespace  + "/" + topic,  name, String(parseInt(e.target.value, 10)))}
            >
              {options.map((opt, i) => <Option key={name + '_' + i} value={i}>{opt}</Option>)}
            </Select>
          </Label>
        )
      }

      // SELECTION -- drop-down of string options; the control's value is the
      // selected option *text* (not its index). Sends the new text as a String.
      if (type === "Selection") {
        const options = control_msg.string_options
        const set_string = control_msg.set_string
        return (
          <Label title={display_name} key={name}>
            <Select
              id={'csbx_' + name}
              value={set_string}
              onChange={(e) => sendUpdateControlValue(namespace  + "/" + topic, name, e.target.value)}
            >
              {options.map((opt, i) => <Option key={name + '_' + i} value={opt}>{opt}</Option>)}
            </Select>
          </Label>
        )
      }

      // SELECTIONS -- a multi-select: each option gets its own toggle. The value
      // is the full array of currently-selected option strings. On every toggle
      // we send the complete desired selection (declarative), not a single delta.
      if (type === "Selections") {
        const na_options = ['NONE','ALL']
        const sel_options = control_msg.string_options
        const show_options =  [...na_options, ...sel_options]
        const set_strings = control_msg.set_strings || []
        return (
          <Label title={display_name} key={name}>
            <div>
              {show_options.map((opt, i) => (
                <div key={name + '_' + i} style={{ display: "inline-block", marginRight: Styles.vars.spacing.regular, textAlign: "center" }}>
                  <div style={{ fontSize: Styles.vars.fontSize.small, marginBottom: Styles.vars.spacing.xs }}>{opt}</div>
                  <AsyncToggle
                    checked={set_strings.indexOf(opt) !== -1}
                    onClick={() => {
                      // Send the complete desired selection (declarative), not a toggle.
                      const next = (opt === 'ALL') ? sel_options : 
                                      (opt === 'NONE') ? [] :
                                          set_strings.indexOf(opt) !== -1
                                            ? set_strings.filter((s) => s !== opt)
                                            : [...set_strings, opt]
                    
                      sendUpdateControlValue(namespace  + "/" + topic, name, next)
                    }}
                  />
                </div>
              ))}
            </div>
          </Label>
        )
      }

      // TRIGGER -- a momentary action. There is no persistent value; pressing the
      // button fires a one-shot trigger (an empty String payload).
      if (type === "Trigger") {
        return (
          <Label title={display_name} key={name}>
            <ButtonMenu>
              <Button onClick={() => sendUpdateControlValue(namespace  + "/" + topic, name, "trigger")}>{"Trigger"}</Button>
            </ButtonMenu>
          </Label>
        )
      }

      // BOOL -- a single on/off switch. Sends the *opposite* of the current
      // value as a Bool each time it is clicked.
      if (type === "Bool") {
        const checked = (control_msg.set_bool === true)
        return (
          <Label title={display_name} key={name}>
            <AsyncToggle
              checked={checked}
              onClick={() => sendUpdateControlValue(namespace  + "/" + topic, name, !checked)}
            />
          </Label>
        )
      }

      // STRING  -- free-form typed values. These follow the PTX
      // editable-input pattern: the box shows an in-progress edit string while
      // the user types, and the value is sent (parsed to the right type) only on
      // Enter. See onInputChange / onInputKey above.
      if (type === "String" ) {
        const msgValue = control_msg.set_string
        const value = editing ? this.state.editValues[name] : msgValue
        return (
          <Label title={display_name} key={name}>
            <Input
              id={'csbx_' + name}
              style={{ width: "100%" }}
              value={value}
              onChange={(e) => this.onInputChange(name, e)}
              onKeyDown={(e) => this.onInputKey(name, type, e)}
            />
          </Label>
        )
      }

      // INT -- free-form typed values. These follow the PTX
      // editable-input pattern: the box shows an in-progress edit string while
      // the user types, and the value is sent (parsed to the right type) only on
      // Enter. See onInputChange / onInputKey above.
      if (type === "Int") {
        const msgValue = control_msg.set_int
        const value = editing ? this.state.editValues[name] : msgValue
        const min_bounds = control_msg.int_bounds[0]
        const max_bounds = control_msg.int_bounds[1]
        return (
          <Label title={display_name} key={name}>

            <div hidden={show_bounds === false}>

                <Columns>
                <Column>

                  <Input
                    disabled={true}
                    value={min_bounds}
                  />

                </Column>
                <Column>

                  <Input
                    disabled={true}
                    value={max_bounds}
                  />
                  
                </Column>
              </Columns>


            </div>

            <Input
              id={'csbx_' + name}
              style={{ width: "100%" }}
              value={value}
              onChange={(e) => this.onInputChange(name, e)}
              onKeyDown={(e) => this.onInputKey(name, type, e)}
            />
          </Label>
        )
      }


      // FLOAT -- free-form typed values. These follow the PTX
      // editable-input pattern: the box shows an in-progress edit string while
      // the user types, and the value is sent (parsed to the right type) only on
      // Enter. See onInputChange / onInputKey above.
      if (type === "Float") {
        const msgValue = control_msg.set_float 
        const value = editing ? this.state.editValues[name] : msgValue
        const min_bounds = control_msg.int_bounds[0]
        const max_bounds = control_msg.int_bounds[1]
        const display_round = control_msg.display_round
        return (
          <Label title={display_name} key={name}>

            <div hidden={show_bounds === false}>


                <Columns>
                <Column>

                  <Input
                    disabled={true}
                    value={min_bounds}
                  />

                </Column>
                <Column>

                  <Input
                    disabled={true}
                    value={max_bounds}
                  />
                  
                </Column>
              </Columns>

            </div>
            <Input
              id={'csbx_' + name}
              style={{ width: "100%" }}
              value={value}
              onChange={(e) => this.onInputChange(name, e)}
              onKeyDown={(e) => this.onInputKey(name, type, e)}
            />
          </Label>
        )
      }


      // FLOATSLIDER -- a single decimal value dragged between a min and max.
      // float_bounds carries [min, max]; -999 in either slot means "no limit",
      // in which case we fall back to a sensible default (0 / 100).
      if (type === "FloatSlider") {
        const bounds = control_msg.float_bounds || []
        const min = (bounds.length > 0 && bounds[0] !== -999) ? bounds[0] : 0
        const max = (bounds.length > 1 && bounds[1] !== -999) ? bounds[1] : 100

        // Step size and display precision come off the control message the same
        // defensive way the bounds above do. Both MUST be passed: SliderAdjustment
        // defaults step to 1, and its render rounds the value to displayDecimals
        // before handing it to BOTH the slider handle and the (disabled) text box.
        // Left unset, a [0.0, 1.0] control is a two-position switch, and passing
        // only one of the two still is -- a display coarser than the step
        // re-quantizes the handle even when the step is right.
        //
        // round_value is how many decimals the node rounds a SET value to
        // (nepi_control default -1, meaning no rounding); round_display is how
        // many the RUI should show (default 2). Neither is trusted on its own:
        // both are int32, so a control message that never carried them arrives
        // with 0 rather than undefined, and round_value 0 is step 1 -- the defect
        // again. The range check below is what actually rules that out.
        const range = max - min
        const round_value = (typeof control_msg.round_value === 'number') ? control_msg.round_value : -1
        const round_display = (typeof control_msg.round_display === 'number') ? control_msg.round_display : -1
        // No rounding authored: one hundredth of the range, the nepi_control -1 case.
        const fallback_step = (range > 0) ? (range / 100) : 1
        var step = (round_value >= 0 && round_value <= 6) ? Math.pow(10, -round_value) : fallback_step
        // Fewer than three stops between the ends is not a slider, whatever the
        // message asked for. Also catches range <= 0 and any non-finite bound.
        if (!(step > 0) || !((range / step) >= 2)) { step = fallback_step }
        if (!Number.isFinite(step) || step <= 0) { step = 1 }
        // Never display coarser than the step -- see the note above -- and never
        // finer than the node asked for.
        const step_decimals = Math.min(6, Math.max(0, Math.ceil(-Math.log10(step))))
        const displayDecimals = Math.max(step_decimals, (round_display >= 0 && round_display <= 6) ? round_display : 0)

        return (
          <SliderAdjustment
            key={name}
            title={display_name}
            comp_name={name}
            is_control={true}
            topic={namespace + "/" + topic}
            msgType={"std_msgs/Float32"}
            adjustment={control_msg.set_float}
            min={min}
            max={max}
            step={step}
            displayDecimals={displayDecimals}
            scaled={1}
            tooltip={control_msg.description}
            unit={""}
          />
        )
      }

      // FLOATSLIDERS -- a min/max *range* dragged between two limits. set_floats
      // holds the current [min, max] handles; float_bounds holds the outer
      // [min_limit, max_limit] the handles may move within.
      if (type === "FloatSliders") {
        const set_floats = control_msg.set_floats || [0, 1]
        const bounds = control_msg.float_bounds || []
        const min_limit = (bounds.length > 0 && bounds[0] !== -999) ? bounds[0] : 0
        const max_limit = (bounds.length > 1 && bounds[1] !== -999) ? bounds[1] : 1
        return (
          <RangeAdjustment
            key={name}
            title={display_name}
            comp_name={name}
            is_control={true}
            topic={namespace + "/" + topic}
            min={set_floats[0]}
            max={set_floats[1]}
            min_limit_m={min_limit}
            max_limit_m={max_limit}
            tooltip={control_msg.description}
            unit={""}
          />
        )
      }

      return null
    }
  }

}

export default Nepi_IF_Control
