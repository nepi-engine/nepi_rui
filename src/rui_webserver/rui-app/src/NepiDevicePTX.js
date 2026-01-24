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

//import Section from "./Section"
import { Columns, Column } from "./Columns"
import Select, { Option } from "./Select"
//import { SliderAdjustment } from "./AdjustmentWidgets"
import Label from "./Label"
//import Input from "./Input"
//import Styles from "./Styles"
//import Button, { ButtonMenu } from "./Button"
//import {setElementStyleModified, clearElementStyleModified, onUpdateSetStateValue} from "./Utilities"



import NepiDevicePTXImageViewer from "./NepiDevicePTX-ImageViewer"
import NepiDevicePTXControls from "./NepiDevicePTX-Controls"


import NepiIFSettings from "./Nepi_IF_Settings"
//Unused import NepiIFSaveData from "./Nepi_IF_SaveData"


//import {onChangeSwitchStateValue } from "./Utilities"


function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer

// Component that contains the PTX controls
class NepiDevicePTX extends Component {
  constructor(props) {
    super(props)

    this.state = {
      namespace: null,


    }

    
    this.createPTXOptions = this.createPTXOptions.bind(this)
    this.onptxDeviceselected = this.onptxDeviceselected.bind(this)
  
  }
  
  // Callback for handling ROS Status3DX messages
  ptxStatusListener(message) {
    this.setState({
      status_msg: message
    })
    
  }

  // Function for configuring and subscribing to ptx/status
  onptxDeviceselected(event) {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
      this.setState({status_msg: null})
    }

    var ind = event.nativeEvent.target.selectedIndex
    var value = event.target.value

    if (value != 'None'){
      this.setState({ namespace: value })

      var statusListener = this.props.ros.setupPTXStatusListener(
          value,
          this.ptxStatusListener
        )
    }
    this.setState({ namespace: value, statusListener: statusListener })
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status3DX message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
      this.setState({statusListener : null})
    }
  }

  // Function for creating topic options for Select input
  createPTXOptions(caps_dictionaries, filter) {
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
    //var unique_names = createShortUniqueValues(filteredTopics)
    var device_name = ""
    for (i = 0; i < filteredTopics.length; i++) {
      device_name = filteredTopics[i].split('/ptx')[0].split('/').pop()
      items.push(<Option value={filteredTopics[i]}>{device_name}</Option>)
    }

    return items
  }



  render() {
    const { ptxDevices } = this.props.ros
    const namespace = (this.state.namespace !== null) ? this.state.namespace : 'None'
    const connected = (this.state.status_msg != null)

    return (
      <React.Fragment>
        <Columns>
          <Column equalWidth = {false} >


                

                <div id="ptxImageViewer">
                  <NepiDevicePTXImageViewer
                    id="ptxImageViewer"
                    show_image_controls={false}
                    namespace={namespace}
                  />
                </div>


          </Column>
          <Column>
            <Label title={"Select PanTilt"}>
              <Select
                onChange={this.onptxDeviceselected}
                value={namespace}
              >
                {this.createPTXOptions(ptxDevices)}
              </Select>
            </Label>
   




{/*
            { (connected === true) ?
            <NepiDevicePTXControls
                namespace={namespace}
                make_section = {true}
                title={"Pan Tilt Controls"}
            />
            : null}
*/}

           { (connected === true) ?
              <NepiIFSettings
                namespace={namespace}
                title={"Nepi_IF_Settings"}
              />
            : null}


          </Column>
        </Columns>
      </React.Fragment>
    )
  }
}

export default NepiDevicePTX
