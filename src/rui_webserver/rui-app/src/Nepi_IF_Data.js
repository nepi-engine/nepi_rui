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


import Nepi_IF_Datum from "./Nepi_IF_Datum"

@inject("ros")
@observer

// Component that contains the DataIF data. Renders one widget per
// datum from a nepi_interfaces/DataStatus message.
class Nepi_IF_Data extends Component {
  constructor(props) {
    super(props)

    this.state = {
      dataNamespace: null,
      status_msg: null,

      show_data: (this.props.show_data !== undefined) ? this.props.show_data : true,

      statusListener: null,
      needs_update: false
    }

    this.getNamespace = this.getNamespace.bind(this)
    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)
    this.renderDatum = this.renderDatum.bind(this)

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
        "nepi_interfaces/DataStatus",
        this.statusListener
      )
      this.setState({ statusListener: statusListener })
    }
    
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace = this.getNamespace()
    const props_status_msg = (this.props.status_msg !== undefined) ? this.props.status_msg : null
    const namespace_changed = (namespace !== this.state.dataNamespace)
    if ((namespace != null && namespace_changed === true && props_status_msg == null) || this.state.needs_update === true) {
      this.updateStatusListener(namespace)
    }
    // Guarded: an unconditional setState here re-enters componentDidUpdate on
    // every render (mobx-react's observer SCU re-renders on any state identity
    // change), which is an infinite update loop, and it also cleared the
    // operator's in-progress edits on every frame.
    if (namespace_changed === true || this.state.needs_update === true) {
      this.setState({ dataNamespace: namespace, needs_update: false})
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


  // Render a single datum given its type and Datum message.
  // Each block below maps one nepi_data datum type to its RUI widget and
  // the nepi_data "set_*_datum_value" topic it publishes to on change.
  renderDatum(datum_msg) {
    const namespace = this.getNamespace()
      return (


         <Nepi_IF_Datum
              namespace={namespace}
              datum_msg={datum_msg}
            />

      )

  }

  render() {
    const namespace = this.getNamespace()
    const make_section = (this.props.make_section !== undefined) ? this.props.make_section : true
    const status_msg = (this.props.status_msg !== undefined) ? this.props.status_msg : this.state.status_msg

    // Show Data toggle (Nepi_IF_Settings pattern). allways_show_data
    // forces the data open and hides the toggle.
    const allways_show_data = (this.props.allways_show_data !== undefined) ? this.props.allways_show_data : false
    const show_data = (allways_show_data === true) ? true : this.state.show_data

    const show_data_toggle = (allways_show_data === false) ? (
      <Columns>
        <Column>
          <Label title="Show Data">
            {/* react-toggle (not AsyncToggle): checked is local view state, already immediate -- no backend round trip to confirm. */}
            <Toggle
              checked={show_data === true}
              onClick={() => onChangeSwitchStateValue.bind(this)("show_data", show_data)}>
            </Toggle>
          </Label>
        </Column>
        <Column>
        </Column>
      </Columns>
    ) : null


    var data_body = null
    if (show_data === true && status_msg != null) {
      const names = status_msg.data_name_list || []
      const types = status_msg.data_type_list || []
      const msgs = status_msg.data_msg_list || []
      data_body = (
        <Columns>
          <Column>
            {msgs.map((msg) => { return (
            <Nepi_IF_Datum
                  namespace={namespace}
                  datum_msg={msg}
                />
            )})}
          </Column>
        </Columns>
      )
    }

    const body = (
      <React.Fragment>
        {show_data_toggle}
        {data_body}
      </React.Fragment>
    )

    if (make_section === false) {
      return body
    }
    return (
      <Section title={(this.props.title !== undefined) ? this.props.title : "DATA"}>
        {body}
      </Section>
    )
  }
}

export default Nepi_IF_Data
