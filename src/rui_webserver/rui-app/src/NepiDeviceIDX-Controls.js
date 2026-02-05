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
import Button, { ButtonMenu } from "./Button"
import RangeAdjustment from "./RangeAdjustment"
import {SliderAdjustment} from "./AdjustmentWidgets"
import Toggle from "react-toggle"
import Label from "./Label"
import Styles from "./Styles"
//Unused import Select from "./Select"
import Input from "./Input"
//import BooleanIndicator from "./BooleanIndicator"
import { Column, Columns } from "./Columns"
import { round, onUpdateSetStateValue, onEnterSendIntValue, onChangeSwitchStateValue} from "./Utilities"

import NepiIFReset from "./Nepi_IF_Reset"
import NepiIFConfig from "./Nepi_IF_Config" 

@inject("ros")
@observer

// Component that contains the IDX Device controls
class NepiDeviceIDXControls extends Component {
  constructor(props) {
    super(props)

    // these states track the values through IDX Status messages
    this.state = {

      namespace: 'None',
      status_msg: null,
      show_controls: (this.props.show_controls != undefined) ? this.props.show_controls : false,

      rtsp_url: "",
      rtsp_username: "",
      rtsp_password: "",
      width_deg: null,
      height_deg: null,
      autoAdjust: null,
      auto_adjust_controls: [],
      resolutionAdjustment: null,
      resolutionString: null,
      max_framerate: null,
      dataProducts: [],
      frameratesCurrent: [],
      contrastAdjustment: null,
      brightnessAdjustment: null,
      thresholdAdjustment: null,
      rangeMax: null,
      rangeMin: null,
      rangeLimitMinM: null,
      rangeLimitMaxM: null,
      zoomAdjustment: null,
      rotateAdjustment: null,
      tiltAdjustment: null,
      frame3D: null,

      age_filter_s: null,


      statusListener: null,

    }

    this.renderControlData = this.renderControlData.bind(this)
    this.renderControlPanel = this.renderControlPanel.bind(this)

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

    
  }

  // Callback for handling ROS StatusIDX messages
  statusListener(message) {
    const last_msg = this.state.status_msg
    this.setState({
      status_msg: message,
      rtsp_url: message.rtsp_url,
      rtsp_username: message.rtsp_username,
      rtsp_password: message.rtsp_password,
      autoAdjust: message.auto_adjust_enabled,
      auto_adjust_controls: message.auto_adjust_controls,
      resolutionAdjustment: message.resolution_ratio,
      resolutionString : message.resolution_current,
      dataProducts: message.data_products,
      frameratesCurrent: message.framerates,
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




 renderLive() {
    const rtsp_url = this.state.rtsp_url
    const rtsp_username = this.state.rtsp_username
    const rtsp_password = this.state.rtsp_password
    
    return (

      <Section title={"Open RSTP Camera Stream"}>

      <Columns>
      <Column>


      <ButtonMenu>
        <Button onClick={() => window.open(rtsp_url, '_blank').focus()}>{"Open Live Stream"}</Button>
      </ButtonMenu>

      </Column>
      <Column>

      <pre style={{ height: "50px", overflowY: "auto" }} align={"center"} textAlign={"center"}>
        {"URL: " + rtsp_url + "\nUsername: " + rtsp_username + "\nPassword: " + rtsp_password}
        </pre>


      </Column>
      </Columns>

      </Section>
    )
  }

  renderControlData() {
    const namespace = this.props.namespace ? this.props.namespace : 'None'


    const framerates = this.state.frameratesCurrent
    const data_product = this.props.dataProduct ? this.props.dataProduct : 'None'
    const dp_index = framerates ? this.state.dataProducts.indexOf(data_product) : -1
    var pub_framerate = 0.0
    if (dp_index !== -1) {
      pub_framerate = round(framerates[dp_index],1)
    }
    if (pub_framerate > this.state.max_framerate){
      pub_framerate = this.state.max_framerate
    }

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
    
    const auto_controls = this.state.auto_adjust_enabled ? this.state.auto_adjust_controls : []
    const hide_framerate = (!has_framerate || auto_controls.indexOf('framerate') !== -1)
    const hide_resolution = (!has_resolution || auto_controls.indexOf('resolution') !== -1)
    const hide_brightness = (!has_brightness || auto_controls.indexOf('brightness') !== -1)
    const hide_contrast = (!has_contrast || auto_controls.indexOf('contrast') !== -1)
    const hide_threshold = (!has_threshold || auto_controls.indexOf('threshold') !== -1)
    const hide_range = (!has_range || auto_controls.indexOf('range') !== -1)



      return (
        <React.Fragment>

            <Columns>
              <Column>


              <div hidden={(hide_framerate)}>
                  <Label title={"Max Framerate"}>
                <Input
                  value={this.state.max_framerate}
                  disabled
                  style={{ width: "100%" }}
                />
              </Label>

              </div>
              <div hidden={(hide_framerate)}>
                  <Label title={"Pub Framerate"}>
                <Input
                  value={pub_framerate}
                  disabled
                  style={{ width: "100%" }}
                />
              </Label>

            </div>


            </Column>
            <Column>

            <Label title={"Image Size"}>
            <Input
              value={this.state.resolutionString}
              id="size"
              style={{ width: "80%" }}
              disabled={true}
            />
          </Label>

              </Column>
            </Columns>  


          <Columns>
          <Column>

          <Label title={"Width (Deg)"}>
            <Input
              value={this.state.width_deg}
              disabled
              style={{ width: "80%" }}
            />
          </Label>


              </Column>
              <Column>

              <Label title={"Height (Deg)"}>
            <Input
              value={this.state.height_deg}
              disabled
              style={{ width: "80%" }}
            />
          </Label>

              </Column>
            </Columns>  

                  {/*
                  <div hidden={this.state.rtsp_url === ""}>

                  {this.renderLive()}

                  </div>
                  */}



            </React.Fragment>
          )

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
    
    const auto_controls = this.state.auto_adjust_enabled ? this.state.auto_adjust_controls : []
    const hide_framerate = (!has_framerate || auto_controls.indexOf('framerate') !== -1)
    const hide_resolution = (!has_resolution || auto_controls.indexOf('resolution') !== -1)
    const hide_brightness = (!has_brightness || auto_controls.indexOf('brightness') !== -1)
    const hide_contrast = (!has_contrast || auto_controls.indexOf('contrast') !== -1)
    const hide_threshold = (!has_threshold || auto_controls.indexOf('threshold') !== -1)
    const hide_range = (!has_range || auto_controls.indexOf('range') !== -1)




    const never_show_controls = (this.props.never_show_controls != undefined) ? this.props.never_show_controls : false
    const allways_show_controls = (this.props.allways_show_controls != undefined) ? this.props.allways_show_controls : false
    const show_controls = (allways_show_controls === true) ? true : (this.props.show_controls != undefined) ? this.props.show_controls : this.state.show_controls


    if (never_show_controls === true){
              <Columns>
                <Column>

                </Column>
              </Columns>

    }

    else if (show_controls === false){
      return(
              <Columns>
                <Column>

                    <Label title="Show Controls">
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
                    <Label title="Show Controls">
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

                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>



                      <Columns>
                        <Column>


                        <div hidden={(hide_framerate)}>
                            <Label title={"Max Framerate"}>
                          <Input
                            value={this.state.max_framerate}
                            id="max_framerate"
                            onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"max_framerate")}
                            onKeyDown= {(event) => onEnterSendIntValue.bind(this)(event,namespace + '/set_max_framerate')}
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
                                        unit={"%"}
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
                                unit={"%"}
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
                              unit={"%"}
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
                                unit={"%"}
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
                            unit={"m"}
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



                    <NepiIFConfig
                        namespace={namespace}
                        title={"Nepi_IF_Conig"}
                  />



            </React.Fragment>
          )
      }
    
  }


  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true

    const status_msg = this.state.status_msg
    const data_product = this.props.dataProduct ? this.props.dataProduct : 'None'

    if (status_msg == null && data_product !== 'None'){
      return (
        <Columns>
        <Column>
       
        </Column>
        </Columns>
      )


    }
    else if (make_section === false){

      return (

          <Columns>
            <Column >
              { this.renderControlData()}
              { this.renderControlPanel()}


            </Column>
          </Columns>
      )
    }
    else {
      return (

          <Section title={(this.props.title != undefined) ? this.props.title : ""}>

              { this.renderControlData()}
              { this.renderControlPanel()}


        </Section>
     )
    }
  }

}
export default NepiDeviceIDXControls
