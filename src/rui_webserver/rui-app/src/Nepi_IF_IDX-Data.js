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
import Label from "./Label"
import Input from "./Input"
import BooleanIndicator from "./BooleanIndicator"
import { Column, Columns } from "./Columns"
import { round } from "./Utilities"

@inject("ros")
@observer

// Read-only IDX device data component. Subscribes to the device's
// DeviceIDXStatus on the namespace prop and renders telemetry only. No command
// publishers, no editable inputs. The companion Nepi_IF_IDX-Controls component
// owns every command widget for the same device.
class NepiIFIDXData extends Component {
  constructor(props) {
    super(props)

    // these states track the values through IDX Status messages
    this.state = {

      namespace: 'None',
      status_msg: null,

      deviceName: null,
      deviceDisabled: null,
      standby: null,

      width_deg: null,
      height_deg: null,
      resolutionString: null,
      max_framerate: null,
      dataProducts: [],
      frameratesCurrent: [],
      rangeLimitMinMAdj: null,
      rangeLimitMaxMAdj: null,

      statusListener: null,

    }

    this.renderControlData = this.renderControlData.bind(this)

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

  }

  // Callback for handling ROS StatusIDX messages. Nothing in this component is
  // editable, so every field tracks the incoming status directly.
  statusListener(message) {
    this.setState({
      status_msg: message,
      deviceName: message.device_name,
      deviceDisabled: message.device_disabled,
      standby: message.standby,
      width_deg: message.width_deg,
      height_deg: message.height_deg,
      resolutionString: message.resolution_current,
      max_framerate: message.max_framerate,
      dataProducts: message.data_products,
      frameratesCurrent: message.framerates,
      rangeLimitMinMAdj: message.min_range_m_adj,
      rangeLimitMaxMAdj: message.max_range_m_adj,
    })
  }

  // Function for configuring and subscribing to StatusIDX
  updateStatusListener() {
    const { namespace } = this.props
    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
      this.setState({ status_msg: null, statusListener: null})
    }
    if (namespace !== 'None'){
      var statusListener = this.props.ros.setupIDXStatusListener(
        namespace,
        this.statusListener
      )
      this.setState({ statusListener: statusListener})
    }
    this.setState({ namespace: namespace})

  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { namespace } = this.props
    if (namespace !== this.state.namespace){
      if (namespace !== null) {
        this.updateStatusListener()
      }
    }
  }

  componentDidMount() {
    this.updateStatusListener()
    }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to StatusIDX message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
  }


  renderControlData() {
    const namespace = this.props.namespace ? this.props.namespace : 'None'


    // Publish framerate for the requested data product. With no data product
    // supplied the device max framerate is the only meaningful figure, and the
    // published rate can never exceed it either way.
    const framerates = this.state.frameratesCurrent
    const data_product = this.props.dataProduct ? this.props.dataProduct : 'None'
    const dp_index = framerates ? this.state.dataProducts.indexOf(data_product) : -1
    var pub_framerate = this.state.max_framerate
    if (dp_index !== -1) {
      pub_framerate = round(framerates[dp_index],1)
    }
    if (pub_framerate > this.state.max_framerate){
      pub_framerate = this.state.max_framerate
    }

    const devices = this.props.ros.idxDevices
    var has_range =   false
    const devicesList = Object.keys(devices)
    if (devicesList.indexOf(namespace) !== -1){
      const capabilities = devices[namespace]
      has_range = (capabilities.has_range)
    }

    const hide_range = (!has_range)

    const min_range_m_adj = round(this.state.rangeLimitMinMAdj,1)
    const max_range_m_adj = round(this.state.rangeLimitMaxMAdj,1)
      return (
        <React.Fragment>

            <Label title={"Device Name"}>
              <Input
                value={this.state.deviceName}
                id="device_name"
                disabled={true}
                style={{ width: "80%" }}
              />
            </Label>

            <Columns>
              <Column>

                  <Label title={"Disabled"}>
                    <BooleanIndicator value={this.state.deviceDisabled} />
                  </Label>

            </Column>
            <Column>

                  <Label title={"Standby"}>
                    <BooleanIndicator value={this.state.standby} />
                  </Label>

              </Column>
            </Columns>


            <Columns>
              <Column>


                  <Label title={"Framerate"}>
                <Input
                  value={pub_framerate}
                  disabled={true}
                  style={{ width: "100%" }}
                />
              </Label>




            </Column>
            <Column>



              </Column>
            </Columns>


             <Label title={"Image Size"}>
                <Input
                  value={this.state.resolutionString}
                  id="size"
                  style={{ width: "80%" }}
                  disabled={true}
                />
                </Label>


          <Columns>
          <Column>

              <div hidden={hide_range}>
                <Label title={"Min Range (m)"}>
                <Input
                  value={min_range_m_adj}
                  disabled={true}
                  style={{ width: "80%" }}
                />
                </Label>

            </div>

          <Label title={"Width (Deg)"}>
            <Input
              value={this.state.width_deg}
              disabled={true}
              style={{ width: "80%" }}
            />
          </Label>


              </Column>
              <Column>

              <div hidden={hide_range}>
                <Label title={"Max Range (m)"}>
                <Input
                  value={max_range_m_adj}
                 disabled={true}
                  style={{ width: "80%" }}
                />
                </Label>

            </div>


              <Label title={"Height (Deg)"}>
            <Input
              value={this.state.height_deg}
              disabled={true}
              style={{ width: "80%" }}
            />
          </Label>

              </Column>
            </Columns>

            </React.Fragment>
          )

  }


  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const status_msg = this.state.status_msg
    if (status_msg == null){
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

                    {this.renderControlData()}

          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={(this.props.title !== undefined) ? this.props.title : null}>

              {this.renderControlData()}

        </Section>
     )
    }
  }

}
export default NepiIFIDXData
