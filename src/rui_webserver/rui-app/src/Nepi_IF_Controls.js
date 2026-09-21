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

import { setElementStyleModified, clearElementStyleModified, onChangeSwitchStateValue } from "./Utilities"


import Nepi_IF_Control from "./Nepi_IF_Control"

@inject("ros")
@observer

// Component that contains the ControlsIF controls. Renders one widget per
// control from a nepi_interfaces/ControlsStatus message.
class Nepi_IF_Controls extends Component {
  constructor(props) {
    super(props)

    this.state = {
      controlsNamespace: null,
      status_msg: null,

      show_controls: (this.props.show_controls !== undefined) ? this.props.show_controls : false,

      statusListener: null,
      needs_update: false
    }

    this.getNamespace = this.getNamespace.bind(this)
    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)
    this.renderControls = this.renderControls.bind(this)
    this.renderControl = this.renderControl.bind(this)

  }

  getNamespace() {
    const { namespacePrefix, deviceId } = this.props.ros
    var namespace = null
    if (namespacePrefix != null && deviceId != null) {
      if (this.props.namespace !== undefined) {
        namespace = this.props.namespace
      }
    }
    return namespace
  }

  statusListener(message) {
    this.setState({ status_msg: message })
  }

  updateStatusListener(namespace) {
    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
      this.setState({ statusListener: null, status_msg: null })
    }
    if (namespace != null && namespace !== 'None' && namespace.indexOf('null') === -1) {
      const statusNamespace = namespace + '/status'
      var statusListener = this.props.ros.setupStatusListener(
        statusNamespace,
        "nepi_interfaces/ControlsStatus",
        this.statusListener
      )
      this.setState({ statusListener: statusListener })
    }
    
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace = this.getNamespace()
    const props_status_msg = (this.props.status_msg !== undefined) ? this.props.status_msg : null
    const namespace_changed = (namespace !== this.state.controlsNamespace)
    if ((namespace != null && namespace_changed === true && props_status_msg == null) || this.state.needs_update === true) {
      this.updateStatusListener(namespace)
    }
    // Guarded: an unconditional setState here re-enters componentDidUpdate on
    // every render (mobx-react's observer SCU re-renders on any state identity
    // change), which is an infinite update loop, and it also cleared the
    // operator's in-progress edits on every frame.
    if (namespace_changed === true || this.state.needs_update === true) {
      this.setState({ controlsNamespace: namespace, needs_update: false})
    }
  }

  componentDidMount() {
    this.setState({ needs_update: true })
  }

  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
      this.setState({ statusListener: null })
    }
  }


  // Render a single control given its type and Control message.
  // Each block below maps one nepi_controls control type to its RUI widget and
  // the nepi_controls "set_*_control_value" topic it publishes to on change.
  renderControls(status_msg) {
    const control_msgs = (status_msg.controls_msg_list !== undefined) ? status_msg.controls_msg_list : []

    // Show Controls toggle (Nepi_IF_Settings pattern). allways_show_controls
    // forces the controls open and hides the toggle.
    const allways_show_controls = (this.props.allways_show_controls !== undefined) ? this.props.allways_show_controls : false
    const show_controls = (allways_show_controls === true) ? true : this.state.show_controls

    const is_row = (this.props.is_row !== undefined) ? this.props.is_row : false
    return (
          <React.Fragment>


              {(allways_show_controls === false) ?
                  <Columns>
                    <Column>
                      <Label title="Show Controls">
                        {/* react-toggle (not AsyncToggle): checked is local view state, already immediate -- no backend round trip to confirm. */}
                        <Toggle
                          checked={show_controls === true}
                          onClick={() => onChangeSwitchStateValue.bind(this)("show_controls", show_controls)}>
                        </Toggle>
                      </Label>
                    </Column>
                    <Column>
                    </Column>
                  </Columns>
                : null             
            }


            {(show_controls === true && is_row === false) ?
                  this.groupControls(control_msgs).map((group, group_index) => (
                    (group.name === '')
                      ? this.renderControl(group.controls[0])
                      : this.rebderControlGroup(group, group_index)
                  ))
                : null
            }

          {(show_controls === true && is_row === true) ?
            <Columns>
              {/* Same renderControl calls as the stacked layout below, one per
                  value entry -- only the wrapper differs, so what each widget
                  publishes is unchanged. */}
              {control_msgs.map((control_msg, index) => (
                <Column key={control_msg.name + '_row_' + index}>
                  {this.renderControl(control_msg)}
                </Column>
              ))}
            </Columns>
          : null
            }


          </React.Fragment>
    )
   

  }


  // Collect controls into row groups. Controls carrying the same non-empty
  // Control.display_group render on ONE horizontal line; an empty group -- the
  // default, and what every control carried before the field existed -- gets a
  // group of its own and renders stacked exactly as before.
  //
  // Grouping is over CONSECUTIVE runs on purpose. If the same group name
  // reappears further down the list it opens a NEW row rather than pulling that
  // control back up into the earlier one, so a control can never jump out of
  // list order and surprise the operator. The node publishes controls in the
  // order it declared them, so declaration order is row order.
  groupControls(control_msgs) {
    const groups = []
    control_msgs.forEach((control_msg) => {
      const name = (control_msg.display_group !== undefined && control_msg.display_group !== null)
                   ? control_msg.display_group : ''
      const open = (groups.length > 0) ? groups[groups.length - 1] : null
      if (name !== '' && open !== null && open.name === name) {
        open.controls.push(control_msg)
      }
      else {
        groups.push({ name: name, controls: [control_msg] })
      }
    })
    return groups
  }

  // Render one row group as a single flex line. Children get in_group so they
  // drop their own header block, and group_first marks the one that supplies
  // the row label. flexWrap keeps a long row from overflowing its column on a
  // narrow window instead of clipping.
  rebderControlGroup(group, group_index) {
    const namespace = this.getNamespace()
    return (
      <div
        key={'control_group_' + group.name + '_' + group_index}
        style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap',
                 gap: 8, marginBottom: Styles.vars.spacing.xs }}>
        {group.controls.map((control_msg, index) => (
          <Nepi_IF_Control
            key={control_msg.name}
            namespace={namespace}
            control_msg={control_msg}
            in_group={true}
            group_first={index === 0}
            show_bounds={this.props.show_bounds === true}
          />
        ))}
      </div>
    )
  }

  // Render a single control given its type and Control message.
  // Each block below maps one nepi_controls control type to its RUI widget and
  // the nepi_controls "set_*_control_value" topic it publishes to on change.
  //
  // show_bounds is forwarded, not consumed here. Nepi_IF_Control has always read
  // a show_bounds prop and defaulted it to true, but nothing passed one, so the
  // read-only Min/Max block under a bounded control could not be turned off by
  // the page mounting the set. Forwarding it changes nothing by itself: an
  // absent prop arrives undefined and the child still defaults to true.
  renderControl(control_msg) {
    const namespace = this.getNamespace()
      return (

         <Nepi_IF_Control
              key={control_msg.name}
              namespace={namespace}
              control_msg={control_msg}
              show_bounds={this.props.show_bounds}
            />

      )

  }

  render() {
    const namespace = this.getNamespace()
    const make_section = (this.props.make_section !== undefined) ? this.props.make_section : true
    const status_msg = (this.props.status_msg !== undefined) ? this.props.status_msg : this.state.status_msg
    const title = (this.props.title !== undefined) ? this.props.title : "CONTROLS"


    if (namespace == null || status_msg == null) {
      return (
          <React.Fragment>

          </React.Fragment>
      )
    }
    else if (make_section === false) {
      const control_msgs = status_msg.controls_msg_list || []
      return (
          <React.Fragment>

              <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
              <Label title={title} />

              {this.renderControls(status_msg)}
          </React.Fragment>
      )
    }
    else {
      const control_msgs = status_msg.controls_msg_list || []
      return (
      <Section title={title}>
          {this.renderControls(status_msg)}
      </Section>
      )
    }
  }
}

export default Nepi_IF_Controls
