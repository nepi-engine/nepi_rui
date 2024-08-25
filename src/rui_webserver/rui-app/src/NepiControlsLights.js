/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */
import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Select, { Option } from "./Select"
import CameraViewer from "./CameraViewer"
import { SliderAdjustment } from "./AdjustmentWidgets"
import Label from "./Label"
import Input from "./Input"
import {createShortUniqueValues, convertStrToStrList} from "./Utilities"

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer

// Component that contains the LSX controls
class NepiControlsLights extends Component {
  constructor(props) {
    super(props)

    this.state = {
		
	  lsxNamespace: null,
      imageTopic: null,
      imageText: null,

      lsxSerialNum: null,
      lsxHwVersion: null,
      lsxSwVersion: null,

      lsxDeviceName: null,
      
      lsxStandbyState: null,
      lsxOnOffState: null,
      lsxIntensityRatio: null,
      lsxBlinkState: null,
      lsxBlinkInterval: null,
      lsxColorStr: "None",
      lsxKelvinVal: null,
      lsxStrobeState: null,
      lsxTempC: null,
      lsxPowerW: null,


      listener: null,
      disabled: true
    }

    this.createImageTopicsOptions = this.createImageTopicsOptions.bind(this)
    this.onImageTopicSelected = this.onImageTopicSelected.bind(this)
    this.onLSXUnitSelected = this.onLSXUnitSelected.bind(this)
    this.lsxStatusListener = this.lsxStatusListener.bind(this)
    this.renderControlPanel = this.renderControlPanel.bind(this)
    this.createLSXOptions = this.createLSXOptions.bind(this)
  }

  // Function for creating image topic Options.
  createImageTopicsOptions() {
    var items = []
    items.push(<Option>{""}</Option>) // Blank at the top serves as the "Cancel" operation
    const { imageTopics, imageFilterLSX } = this.props.ros
    var imageTopicShortnames = createShortUniqueValues(imageTopics)
    for (var i = 0; i < imageTopics.length; i++) {
      // Run the filter
      if (imageFilterLSX && !(imageFilterLSX.test(imageTopics[i]))) {
        continue
      }

      items.push(<Option value={imageTopics[i]}>{imageTopicShortnames[i]}</Option>)
    }
    return items
  }

  // Handler for Image topic selection
  onImageTopicSelected(event) {
    var idx = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[idx].text
    var value = event.target.value

    this.setState({
      imageTopic: value,
      imageText: text === "None" ? null : text,
    })
  }

  
  // Callback for handling ROS Status3DX messages
  lsxStatusListener(message) {


    this.setState({
      lsxSerialNum: message.serial_num,
      lsxHwVersion: message.hw_version,
      lsxSwVersion: message.sw_version,

      lsxDeviceName: message.user_name ,
      
      lsxStandbyState: message.standby_state ,
      lsxOnOffState: message.on_off_state ,
      lsxIntensityRatio: message.intensity_ratio ,
      lsxBlinkState: message.blink_state ,
      lsxBlinkInterval: message.blink_interval ,
      lsxKelvinVal: message.kelvin_setting ,
      lsxStrobeState: message.strobe_state ,
      lsxColorStr: message.color_setting,
      lsxTempC: message.temp_c ,
      lsxPowerW: message.power_w ,
    })
  }

  // Function for configuring and subscribing to lsx/status
  onLSXUnitSelected(event) {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }

    var idx = event.nativeEvent.target.selectedIndex
    //var text = event.nativeEvent.target[idx].text
    var value = event.target.value

    // Handle the "None" Option -- always index 0
    if (idx === 0) {
      this.setState({ disabled: true })
      return
    }

    this.setState({ lsxNamespace: value })

    var listener = this.props.ros.setupLSXStatusListener(
        value,
        this.lsxStatusListener
      )
      
    this.setState({ lsxNamespace: value, listener: listener, disabled: false })
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status3DX message
  componentWillUnmount() {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
  }

  // Function for creating topic Options for Select input
  createLSXOptions(caps_dictionaries, filter) {
    const topics = Object.keys(caps_dictionaries)
    var filteredTopics = topics
    var i
    if (filter) {
      filteredTopics = []
      for (i = 0; i < topics.length; i++) {
        // includes does a substring search
        if (topics[i].includes(filter)) {
          filteredTopics.push(topics[i])
        }
      }
    }

    var items = []
    items.push(<Option>{""}</Option>)
    var unique_names = createShortUniqueValues(filteredTopics)
    for (i = 0; i < filteredTopics.length; i++) {
      items.push(<Option value={filteredTopics[i]}>{unique_names[i]}</Option>)
    }
    // Check that our current selection hasn't disappeard as an available Option
    const { currentIDXNamespace } = this.state
    if ((currentIDXNamespace != null) && (! filteredTopics.includes(currentIDXNamespace))) {
      this.clearTopicLXSSelection()
    }

    return items
  }

  
  renderControlPanel() {
    const { lsxNamespace, lsxSerialNum, lsxHwVersion, lsxSwVersion,
            lsxIntensityRatio, lsxTempC } = this.state
    const { lsxUnits } = this.props.ros
    const lsx_id = lsxNamespace? lsxNamespace.split('/').slice(-1) : "No Light Selected"

    const lsx_caps = lsxUnits[lsxNamespace]
    const has_standby_mode = lsx_caps && (lsx_caps['has_standby_mode'] === true)
    const has_on_off_control = lsx_caps && (lsx_caps['has_on_off_control'] === true)
    const has_intensity_control = lsx_caps && (lsx_caps['has_intensity_control'] === true)
    const has_color_control = lsx_caps && (lsx_caps['has_color_control'] === true)
    const color_options_list = lsx_caps ?  convertStrToStrList(lsx_caps['color_options_list']) : ["None"]
    const has_kelvin_control = lsx_caps && (lsx_caps['has_kelvin_control'] === true)
    const kelvin_min = lsx_caps ? lsx_caps['kelvin_min'] : 1000
    const kelvin_max = lsx_caps ? lsx_caps['kelvin_max'] : 10000
    const has_blink_control = lsx_caps && (lsx_caps['has_blink_control'] === true)
    const has_hw_strobe = lsx_caps && (lsx_caps['has_hw_strobe'] === true)
    const reports_temperature = lsx_caps && (lsx_caps['reports_temperature'] === true)
    const reports_power = lsx_caps && (lsx_caps['reports_power'] === true)

    
    return (
      <Section title={lsx_id} >
        <Label title={"Serial Number"}>
          <Input disabled={true} value={lsxSerialNum}/>
        </Label>
		
        <Label title={"H/W Rev."}>
          <Input disabled={true} value={lsxHwVersion}/>
        </Label>
		
        <Label title={"S/W Rev."}>
          <Input disabled={true} value={lsxSwVersion}/>
        </Label>
		
        <Label title={"Temperature C"}>
          <Input
            disabled
            style={{ width: "45%", float: "left" }}
            value={round(lsxTempC, 1)}  />
        </Label>
        
	<SliderAdjustment
          disabled={!has_intensity_control}
          title={"Intensity"}
          msgType={"std_msgs/Float32"}
          adjustment={lsxIntensityRatio}
          topic={lsxNamespace + "/lsx/set_intensity"}
          scaled={0.01}
          min={0}
          max={100}
          tooltip={"Speed as a percentage (0%=min, 100%=max)"}
          unit={"%"}
        />
	
      </Section>
    )
  }

  render() {
    const { lsxUnits } = this.props.ros
    const { lsxNamespace } = this.state

    //const lsxImageViewerElement = document.getElementById("lsxImageViewer")

    //const lsx_caps = lsxUnits[lsxNamespace]
    return (
      <React.Fragment>
        <Columns>
          <Column equalWidth = {false} >
                <div id="lsxImageViewer">
                  <CameraViewer
                    id="lsxImageViewer"
                    imageTopic={this.state.imageTopic}
                    title={this.state.imageText}
                    hideQualitySelector={false}
                  />
                </div>
          </Column>

          <Column>
            <Label title={"Lighting Device"}>
              <Select
                onChange={this.onLSXUnitSelected}
                value={this.state.lsxNamespace}
              >
                {this.createLSXOptions(lsxUnits)}
              </Select>
            </Label>
            <Label title={"Selected Image"}>
              <Select
                id="lsxImageTopicSelect"
                onChange={this.onImageTopicSelected}
                value={this.state.imageTopic}
              >
              {this.createImageTopicsOptions()}
              </Select>
            </Label>
            { lsxNamespace?
              this.renderControlPanel()
              : null
            }
          </Column>
        </Columns>
      </React.Fragment>
    )
  }
}

export default NepiControlsLights
