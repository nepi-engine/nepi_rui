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
import Button, { ButtonMenu } from "./Button"
import RangeAdjustment from "./RangeAdjustment"
import {SliderAdjustment} from "./AdjustmentWidgets"
import Toggle from "react-toggle"
import Label from "./Label"
import Styles from "./Styles"
import Input from "./Input"
import { Column, Columns } from "./Columns"
import { onUpdateSetStateValue, onEnterSendIntValue, onEnterSendFloatValue, onChangeSwitchStateValue} from "./Utilities"

import NepiIFConfig from "./Nepi_IF_Config"
import NepiIFSettings from "./Nepi_IF_Settings"
import NepiIFAdmin from "./Nepi_IF_Admin"

@inject("ros")
@observer

// Command component for an IDX device. Subscribes to the device's
// DeviceIDXStatus on the namespace prop and renders command widgets only. The
// companion Nepi_IF_IDX-Data component owns the read-only telemetry rows for
// the same device.
//
// The Device Settings (Nepi_IF_Settings) and Advanced Settings (Nepi_IF_Admin)
// panels for the connected device are rendered here as well, so any page that
// drops in this component gets them without wiring up the device namespace and
// node name itself. Suppress either one with show_settings/show_admin={false}.
class NepiIFIDXControls extends Component {
  constructor(props) {
    super(props)

    // these states track the values through IDX Status messages
    this.state = {

      namespace: 'None',
      status_msg: null,
      show_controls: (this.props.show_controls !== undefined) ? this.props.show_controls : false,

      width_deg: null,
      height_deg: null,
      autoAdjust: null,
      auto_adjust_controls: [],
      resolutionAdjustment: null,
      max_framerate: null,
      contrastAdjustment: null,
      brightnessAdjustment: null,
      thresholdAdjustment: null,
      rangeMax: null,
      rangeMin: null,
      rangeLimitMinM: null,
      rangeLimitMaxM: null,

      statusListener: null,

    }

    this.renderControlPanel = this.renderControlPanel.bind(this)
    this.renderSettingsAndAdmin = this.renderSettingsAndAdmin.bind(this)

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)


  }

  // Callback for handling ROS StatusIDX messages
  statusListener(message) {
    const last_msg = this.state.status_msg
    this.setState({
      status_msg: message,
      autoAdjust: message.auto_adjust_enabled,
      auto_adjust_controls: message.auto_adjust_controls,
      resolutionAdjustment: message.resolution_ratio,
      contrastAdjustment: message.contrast_ratio,
      brightnessAdjustment: message.brightness_ratio,
      thresholdAdjustment: message.threshold_ratio,
      rangeMax: message.range_window_ratios.stop_range,
      rangeMin: message.range_window_ratios.start_range,
      rangeLimitMinM: message.min_range_m,
      rangeLimitMaxM: message.max_range_m,
    })

    if (last_msg != null) {
      if (message.max_framerate !== last_msg.max_framerate){
        this.setState({max_framerate: message.max_framerate})
      }

      if (message.width_deg !== last_msg.width_deg){
        this.setState({width_deg: message.width_deg})
      }

      if (message.height_deg !== last_msg.height_deg){
        this.setState({height_deg: message.height_deg})
      }
    }
    else {
      this.setState({max_framerate: message.max_framerate,
        width_deg: message.width_deg,
        height_deg: message.height_deg
      })

    }


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


  renderControlPanel() {
    const { sendBoolMsg } = this.props.ros
    const namespace = this.props.namespace ? this.props.namespace : 'None'


    const devices = this.props.ros.idxDevices
    var has_resolution =   false
    var has_framerate =   false
    var has_auto_adjust =   false
    var has_contrast =   false
    var has_brightness =   false
    var has_threshold =   false
    var has_range =   false
    const devicesList = Object.keys(devices)
    if (devicesList.indexOf(namespace) !== -1){
      const capabilities = devices[namespace]
      has_resolution = (capabilities.has_resolution)
      has_framerate = (capabilities.has_framerate)
      has_auto_adjust = (capabilities.has_auto_adjustment)
      has_contrast = (capabilities.has_contrast)
      has_brightness = (capabilities.has_brightness)
      has_threshold = (capabilities.has_threshold)
      has_range = (capabilities.has_range)
    }

    const auto_controls = this.state.autoAdjust ? this.state.auto_adjust_controls : []
    const hide_framerate = (!has_framerate || auto_controls.indexOf('framerate') !== -1)
    const hide_resolution = (!has_resolution || auto_controls.indexOf('resolution') !== -1)
    const hide_brightness = (!has_brightness || auto_controls.indexOf('brightness') !== -1)
    const hide_contrast = (!has_contrast || auto_controls.indexOf('contrast') !== -1)
    const hide_threshold = (!has_threshold || auto_controls.indexOf('threshold') !== -1)
    const hide_range = (!has_range || auto_controls.indexOf('range') !== -1)


    const { userRestricted} = this.props.ros
    const device_controls_restricted = userRestricted.indexOf('DEVICE-IDX-CONTROL') !== -1

    const show_controls_option = (this.props.show_controls_option !== undefined) ? this.props.show_controls_option : device_controls_restricted === false
    const show_controls = (this.state.show_controls && (device_controls_restricted === false)) || (show_controls_option === false)



    if ( device_controls_restricted === true){
      return (
              <Columns>
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

                    {(show_controls_option === true) ?
                    <Label title="Show Image Controls">
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


            <div hidden={show_controls === false}>

                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                      <Label title={"Controls"}></Label>

                      <Columns>
                        <Column>


                        <div hidden={(hide_framerate)}>
                            <Label title={"Max Framerate"}>
                          <Input
                            value={this.state.max_framerate}
                            id="max_framerate"
                            onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"max_framerate")}
                            onKeyDown= {(event) => onEnterSendFloatValue.bind(this)(event,namespace + '/set_max_framerate')}
                            style={{ width: "100%" }}
                          />
                        </Label>

                      </div>


                            </Column>
                            <Column>



                            </Column>
                          </Columns>

                    <div align={"left"} textAlign={"left"} hidden={!has_auto_adjust}>


                        <Columns>
                          <Column>

                                <Label title={"Auto Adjust"}>
                                    <Toggle
                                      checked={this.state.autoAdjust}
                                      onClick={() => sendBoolMsg(namespace + '/set_auto_adjust_enable' ,!this.state.autoAdjust)}
                                    />
                                  </Label>


                              </Column>
                              <Column>

                              </Column>
                            </Columns>

                    </div>




                      <div hidden={(hide_resolution)}>

                        <SliderAdjustment
                                        title={"Publish Size"}
                                        msgType={"std_msgs/Float32"}
                                        adjustment={this.state.resolutionAdjustment}
                                        topic={namespace + '/set_resolution_ratio'}
                                        scaled={0.01}
                                        min={0}
                                        max={100}
                                        tooltip={"Adjustable Resolution"}
                                        noTextBox={true}
                                    />


                        </div>






                          <div hidden={hide_brightness}>
                            <SliderAdjustment
                                title={"Brightness"}
                                msgType={"std_msgs/Float32"}
                                adjustment={this.state.brightnessAdjustment}
                                topic={namespace + "/set_brightness_ratio"}
                                scaled={0.01}
                                min={0}
                                max={100}
                                tooltip={"Adjustable brightness"}
                                noTextBox={true}
                            />

                          </div>


                          <div hidden={hide_contrast}>
                            <SliderAdjustment
                              title={"Contrast"}
                              msgType={"std_msgs/Float32"}
                              adjustment={this.state.contrastAdjustment}
                              topic={namespace + "/set_contrast_ratio"}
                              scaled={0.01}
                              min={0}
                              max={100}
                              tooltip={"Adjustable contrast"}
                              noTextBox={true}
                            />

                          </div>

                          <div hidden={hide_threshold}>
                            <SliderAdjustment
                                title={"Thresholding"}
                                msgType={"std_msgs/Float32"}
                                adjustment={this.state.thresholdAdjustment}
                                topic={namespace + "/set_threshold_ratio"}
                                scaled={0.01}
                                min={0}
                                max={100}
                                tooltip={"Adjustable threshold"}
                                noTextBox={true}
                            />
                          </div>






                        <div hidden={(hide_range)}>
                          <RangeAdjustment
                            title="Range Clip"
                            min={this.state.rangeMin}
                            max={this.state.rangeMax}
                            min_limit_m={this.state.rangeLimitMinM}
                            max_limit_m={this.state.rangeLimitMaxM}
                            topic={namespace + "/set_range_window"}
                            tooltip={"Adjustable range"}
                            noTextBox={true}
                          />
                        </div>

                        <Columns>
                        <Column>

                        <Label title={"Width (Deg)"}>
                          <Input
                            value={this.state.width_deg}
                            id="image_width"
                            onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"width_deg")}
                            onKeyDown= {(event) => onEnterSendIntValue.bind(this)(event,namespace + '/set_width_deg')}
                            style={{ width: "80%" }}
                          />
                        </Label>


                            </Column>
                            <Column>

                            <Label title={"Height (Deg)"}>
                          <Input
                            value={this.state.height_deg}
                            id="image_height"
                            onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"height_deg")}
                            onKeyDown= {(event) => onEnterSendIntValue.bind(this)(event,namespace + '/set_height_deg')}
                            style={{ width: "80%" }}
                          />
                        </Label>

                            </Column>
                          </Columns>

                        <ButtonMenu>
                          <Button  onClick={() => this.props.ros.sendTriggerMsg(namespace + '/reset_controls')}>{"Reset"}</Button>
                        </ButtonMenu>

                    <NepiIFConfig
                        namespace={namespace}
                        title={"Nepi_IF_Conig"}
                  />

            </div>

            </React.Fragment>
          )
      }

  }


  // Device Settings and Advanced Settings panels for the connected device.
  // Both build their own Section, so these are rendered as siblings of this
  // component's Section rather than nested inside it.
  renderSettingsAndAdmin() {
    const namespace = this.state.namespace
    const has_device = (namespace != null && namespace !== 'None')
    if (has_device === false){
      return null
    }

    const show_settings = (this.props.show_settings !== undefined) ? this.props.show_settings : true
    const show_admin = (this.props.show_admin !== undefined) ? this.props.show_admin : true
    if (show_settings === false && show_admin === false){
      return null
    }

    const capabilities = this.props.ros.idxDevices[namespace]
    const node_name = capabilities ? capabilities.device_node_name : 'None'

    return (
      <React.Fragment>

        {(show_settings === true) ?
          <NepiIFSettings
            settingsNamespace={namespace + '/settings'}
            title={"Device Settings"}
          />
        : null}

        {(show_admin === true) ?
          <NepiIFAdmin
            title={"Advanced Settings"}
            show_advanced_option={true}
            show_admin_device_names={true}
            node_name={node_name}
            make_section={true}
          />
        : null}

      </React.Fragment>
    )
  }


  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const namespace = this.state.namespace
    const status_msg = this.state.status_msg
    var device_disabled = false
    if (status_msg == null){
      return (
        <Columns>
        <Column>

        </Column>
        </Columns>
      )


    }
    else if (make_section === false){
      device_disabled = status_msg.device_disabled
      return (

          <React.Fragment>


                      <Columns>
                      <Column >


                      <Label title="Disabled">
                            <Toggle
                              checked={device_disabled === true}
                              onClick={() => this.props.ros.sendBoolMsg(namespace + "/disable",!device_disabled)}>
                            </Toggle>
                      </Label>

                      </Column>
                    <Column>

                      </Column>
                    </Columns>

                    { device_disabled === false ? this.renderControlPanel() : null}

                    { this.renderSettingsAndAdmin() }

          </React.Fragment>
      )
    }
    else {
      device_disabled = status_msg.device_disabled
      return (

        <React.Fragment>

          <Section title={(this.props.title !== undefined) ? this.props.title : null}>

                <Columns>
                <Column >


                <Label title="Disabled">
                      <Toggle
                        checked={device_disabled === true}
                        onClick={() => this.props.ros.sendBoolMsg(namespace + "/disable",!device_disabled)}>
                      </Toggle>
                </Label>

                </Column>
              <Column>

                </Column>
              </Columns>

              { device_disabled === false ? this.renderControlPanel() : null}


          </Section>

          { this.renderSettingsAndAdmin() }

        </React.Fragment>
     )
    }
  }

}
export default NepiIFIDXControls
