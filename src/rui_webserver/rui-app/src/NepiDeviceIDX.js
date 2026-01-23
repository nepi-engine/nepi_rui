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
import Label from "./Label"
import Select, { Option } from "./Select"
import NepiDeviceIDXControls from "./NepiDeviceIDX-Controls"

import NepiDeviceInfo from "./Nepi_IF_DeviceInfo"
import ImageViewer from "./Nepi_IF_ImageViewer"
import NepiIFSettings from "./Nepi_IF_Settings"
import NepiIFSaveData from "./Nepi_IF_SaveData"
import NepiSystemMessages from "./Nepi_IF_Messages"
import NepiIFNavPoseViewer from "./Nepi_IF_NavPoseViewer"




@inject("ros")
@observer

// IDX Application page
class NepiDeviceIDX extends Component {
  constructor(props) {
    super(props)


    
    this.state = {

      show_controls: true,
      show_settings: true,
      show_save_data: true,

      data_topic: null,
      data_product: 'None',
      image_topic: 'None',
      image_text: 'None',      
      
      // IDX Sensor topic to subscribe to and update
      namespace: null,
      namespaceText: "No sensor selected"
    }

    this.onDeviceSelected = this.onDeviceSelected.bind(this)
    this.setDeviceSelection = this.setDeviceSelection.bind(this)
    this.setDeviceSelection = this.setDeviceSelection.bind(this)
    this.createDeviceOptions = this.createDeviceOptions.bind(this)

    this.createDataProductOptions = this.createDataProductOptions.bind(this)
    this.onDataProductSelected = this.onDataProductSelected.bind(this)

    //const namespaces = Object.keys(props.ros.idxDevices)

  }


  // Function for creating topic options for Select input
  createDeviceOptions(topics) {

    var items = []
    items.push(<Option value={'None'}>{'None'}</Option>)
    //var unique_names = createShortUniqueValues(topics)
    var device_name = ""
    for (var i = 0; i < topics.length; i++) {
      device_name = topics[i].split('/idx')[0].split('/').pop()
      items.push(<Option value={topics[i]}>{device_name}</Option>)
    }
    // Check that our current selection hasn't disappeard as an available option
    const { namespace } = this.state
    if ((namespace != null) && (topics.includes(namespace) === false)) {
      this.clearDeviceSelection()
    }

    return items
  }

  setDeviceSelection(namespace, namespace_text) {
      const capabilities = this.props.ros.idxDevices[namespace]

      var autoSelectedImgTopic = 'None'
      var autoSelectedImgTopicText = 'None'
      if (capabilities.has_color_image) {
        autoSelectedImgTopic = namespace + '/color_image'
        autoSelectedImgTopicText = 'color_image'
      }

      this.setState({
        namespace: namespace,
        namespaceText: namespace_text,
        data_topic: autoSelectedImgTopic,
        data_product: autoSelectedImgTopicText,
        image_topic: autoSelectedImgTopic,
        image_text: autoSelectedImgTopicText
      })
  }


  clearDeviceSelection() {
    this.setState({
      namespace: null,
      namespaceText: "No sensor selected",
      data_topic: "None",
      data_product: "None",
      image_topic: "None",
      image_text: "None"        
    })
  }

  // Handler for IDX Sensor topic selection
  onDeviceSelected(event) {
    const index = event.nativeEvent.target.selectedIndex
    const text = event.nativeEvent.target[index].text
    const value = event.target.value

    // Handle the "None" option -- always index 0

    if (index > 0) {
      this.setDeviceSelection(value, text)
    }
    else {
      this.clearDeviceSelection()
    }
  }


  createDataProductOptions(namespace) {
    const capabilities = this.props.ros.idxDevices[namespace]
    const data_products = capabilities ? capabilities.data_products : []

    var items = []
    items.push(<Option value={"None"}>{"None"}</Option>)
    var data_product
    var data_topic

    for (var i = 0; i < data_products.length; i++) {
      data_product = data_products[i]
      data_topic = namespace + '/' + data_product
      items.push(<Option value={data_topic}>{data_product}</Option>)
    }
    return items    
  }


  // Handler for Image topic selection
  onDataProductSelected(event) {
    var index = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[index].text
    var value = event.target.value

    var image_topic = null
    var image_text = 'None'
    if (text !== 'None') {
      image_topic = value
      image_text = text
    }

    if (image_topic != null && text.indexOf('image') === -1){
      image_topic = image_topic + '/' + text + '_image'
      image_text = text + '_image'
    }

    this.setState({
      data_topic: value,
      data_product: text,
      image_topic: image_topic,
      image_text: image_text
    })
  }

  renderDeviceSelection() {
    const { idxDevices} = this.props.ros
    const NoneOption = <Option>None</Option>
    const device_selected = (this.state.namespace != null && this.state.namespace != 'None' )
    const data_topic = this.state.data_topic
    const namespace = this.state.namespace ? this.state.namespace : "None"

    if (device_selected === false){


      return(
                <Section title={"Selection"}>

                  <Columns>
                  <Column>
                  
                    <Label title={"Device"}>
                      <Select
                        onChange={this.onDeviceSelected}
                        value={namespace}
                      >
                        {this.createDeviceOptions(Object.keys(idxDevices))}
                      </Select>
                    </Label>

                  </Column>
                  <Column>
    
                  </Column>
                </Columns>
                  
                </Section>

        )

    }
    else {

        return (
               <Section title={"Selection"}>

                  <Columns>
                  <Column>
                  
                    <Label title={"Device"}>
                      <Select
                        onChange={this.onDeviceSelected}
                        value={namespace}
                      >
                        {this.createDeviceOptions(Object.keys(idxDevices))}
                      </Select>
                    </Label>
                  
                    <div align={"left"} textAlign={"left"}>
                      <Label title={"Data Product"}>
                        <Select
                          id="topicSelect"
                          onChange={this.onDataProductSelected}
                          value={data_topic}
                        >
                          {namespace
                            ? this.createDataProductOptions(namespace)
                            : NoneOption}
                        </Select>
                      </Label>
                    </div>

                  </Column>
                  <Column>
    
                  </Column>
                </Columns>


                </Section>

        )
    }
  }

  renderImageViewer() {
    const image_topic = this.state.image_topic
    const image_text = this.state.image_text
    return (
      <React.Fragment>
        <Columns>
          <Column equalWidth={false}>

          {image_topic && image_topic !== 'None' &&

            <ImageViewer
              image_topic={image_topic}
              title={image_text}
              hideQualitySelector={false}
              show_save_controls={false}
            />
          }

          </Column>
        </Columns>
      </React.Fragment>
    )
  }


  render() {
    const device_selected = (this.state.namespace != null && this.state.namespace != 'None')
    const namespace = (this.state.namespace !== null) ? this.state.namespace : 'None'
    const data_product = this.state.data_product

    
        return (

          <Columns>
          <Column>


        
          <div style={{ display: 'flex' }}>

              <div style={{ width: "68%" }}>



                            {this.renderImageViewer()}


                          {(namespace != 'None') ?
                          <NepiIFSaveData
                              saveNamespace={namespace + '/save_data'}
                              title={"Nepi_IF_SaveData"}
                              show_topic_selector={true}
                          />
                          : null}
{/*
                          <NepiIFNavPoseViewer
                            namespace={namespace  + "/navpose"}
                            title={"NavPose Data"}
                          />

                          <NepiDeviceInfo
                                deviceNamespace={namespace}
                                status_topic={"/status"}
                                status_msg_type={"nepi_interfaces/DeviceIDXStatus"}
                                name_update_topic={"/update_device_name"}
                                name_reset_topic={"/reset_device_name"}
                                title={"NepiDeviceIDXInfo"}
                            />


                        {(namespace != 'None') ?
                        <NepiSystemMessages
                        messagesNamespace={namespace.replace('/idx','') + '/messages'}
                        title={"NepiSystemMessages"}
                        />
                        : null}

*/}


              </div>


              <div style={{ width: '2%' }}>
                    {}
              </div>



              <div style={{ width: "30%"}}>

                    {this.renderDeviceSelection()}


                          {(namespace != 'None') ?
                          <NepiDeviceIDXControls
                              namespace={namespace}
                              dataProduct={data_product}
                              title={"NepiDeviceIDXControls"}
                        />
                        : null}

                        
                          {(namespace != 'None') ?
                          <NepiIFSettings
                            settingsNamespace={namespace + '/settings'}
                            title={"Nepi_IF_Settings"}
                        />
                        : null}



              </div>

        </div>


          </Column>
        </Columns>

        )
  }


}

export default NepiDeviceIDX
