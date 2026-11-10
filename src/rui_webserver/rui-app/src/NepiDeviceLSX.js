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
import { Columns, Column } from "./Columns"
import Select, { Option } from "./Select"
import Label from "./Label"


import NepiIFImageViewer from "./Nepi_IF_ImageViewer"
import NepiIFSaveData from "./Nepi_IF_SaveData"
import NepiIFConnectNavPose from "./Nepi_IF_ConnectNavPose"
import NepiIFSettings from "./Nepi_IF_Settings"
import NepiIFMessages from "./Nepi_IF_Messages"

import NepiDeviceLSXControls from "./NepiDeviceLSX-Controls"


@inject("ros")
@observer

// Component that contains the LSX controls
class NepiControlsLights extends Component {
  constructor(props) {
    super(props)

    this.state = {
      namespace: 'None',
      node_name: 'None',
    }

    this.renderImageViewer = this.renderImageViewer.bind(this)
    
    this.setDeviceSelection = this.setDeviceSelection.bind(this)
    this.clearDeviceSelection = this.clearDeviceSelection.bind(this)
    this.createDeviceOptions = this.createDeviceOptions.bind(this)
    this.onDeviceSelected = this.onDeviceSelected.bind(this)

   }


  setDeviceSelection(namespace) {
      this.setState({
        namespace: namespace,
      })
  }

  clearDeviceSelection() {
    this.setState({
      namespace: 'None',
    })
  }

  // Function for creating topic options for Select input
  createDeviceOptions() {
    const { lsxDevices} = this.props.ros
    const topics = Object.keys(lsxDevices)
    const namespace = this.state.namespace
    var items = []
    items.push(<Option value={'None'}>{'None'}</Option>)
    var device_name = ""
    for (var i = 0; i < topics.length; i++) {
      device_name = topics[i].split('/lsx')[0].split('/').pop()
      items.push(<Option value={topics[i]}>{device_name}</Option>)
    }
    // Check that our current selection hasn't disappeard as an available option
    if ((namespace != null && namespace !== 'None')  && (topics.includes(namespace) === false)) {    
        this.clearDeviceSelection()
    }
    if ((namespace == null || namespace === 'None') && topics.length > 0) {    
        this.setDeviceSelection(topics[0])
    }
    return items
  }

  // Handler for LSX Sensor topic selection
  onDeviceSelected(event) {
    const value = event.target.value
      this.setDeviceSelection(value)
  }



  renderDeviceSelection() {
    const namespace = this.state.namespace ? this.state.namespace : "None"

      return(
                <Section title={"Selection"}>

                  <Columns>
                  <Column>
                  
                    <Label title={"Device"}>
                      <Select
                        onChange={this.onDeviceSelected}
                        value={namespace}
                      >
                        {this.createDeviceOptions()}
                      </Select>
                    </Label>

                  </Column>
                  <Column>
    
                  </Column>
                </Columns>
                  
                </Section>

      )
  }



  renderImageViewer() {
    return (
      <React.Fragment>

             
                  <NepiIFImageViewer
                    id="lsxImageViewer"
                  />
               


      </React.Fragment>
    )
  }


 render() {
    const device_selected = (this.state.namespace !== null && this.state.namespace !== 'None')
    const namespace = (this.state.namespace !== null) ? this.state.namespace : 'None'
    // const status_msg = this.props.ros.lsxDevices[namespace]
    // const node_name = status_msg ? status_msg.device_node_name : 'None'
    const status_msg = this.props.ros.lsxDevices[namespace]

    const save_data_topic = (status_msg && status_msg.save_data_topic) ? status_msg.save_data_topic : null
    const settings_topic = (status_msg && status_msg.settings_topic) ? status_msg.settings_topic : null
    const navpose_connect_topic = (status_msg && status_msg.navpose_connect_topic) ? status_msg.navpose_connect_topic : null
    const navpose_topic = (status_msg && status_msg.navpose_topic) ? status_msg.navpose_topic : null
        return (

          <Columns>
          <Column>


        
          <div style={{ display: 'flex' }}>

              <div style={{ width: "75%" }}>


              {(device_selected === true) ?
              this.renderImageViewer()
              : null}

                 
                  {(device_selected === true) ?
                      <NepiIFSaveData
                      saveNamespace={save_data_topic}
                      make_section={true}
                      show_all_save_options={false}
                      show_topic_selector={false}
                    />
                : null}

                  {(device_selected === true) ?
                    <NepiIFConnectNavPose
                    namespace={navpose_connect_topic}
                    navpose_topic={navpose_topic}
                    select_title={"NavPose Frame"}
                    show_selector={true}
                    show_transform={true}
                    show_controls={true}
                    show_data={false}
                    make_section={true}
                    />
                  : null}


                  {(device_selected === true) ?
                    <NepiIFMessages
                    messagesNamespace={namespace + '/messages'}
                    hide_control={true}
                    title={"Messages"}
                    />
                  : null}


              </div>


              <div style={{ width: '2%' }}>
                    {}
              </div>



              <div style={{ width: "23%"}}>

                    {this.renderDeviceSelection()}


                          {(device_selected === true) ?
                          <NepiDeviceLSXControls
                              namespace={namespace}
                              title={ "Pan Tilt Controls"}
                        />
                        : null}

                        
                          {(device_selected === true) ?
                          <NepiIFSettings
                            settingsNamespace={settings_topic}
                            allways_show_controls={true}
                            title={"Device Settings"}
                        />
                        : null}


              </div>

        </div>


          </Column>
        </Columns>

        )
  }

}


export default NepiControlsLights
