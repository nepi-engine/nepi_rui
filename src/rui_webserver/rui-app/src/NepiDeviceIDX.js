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


import ImageViewer from "./Nepi_IF_ImageViewer"
import NepiIFSettings from "./Nepi_IF_Settings"

import NepiDeviceIDXControls from "./NepiDeviceIDX-Controls"

@inject("ros")
@observer

// IDX Application page
class NepiDeviceIDX extends Component {
  constructor(props) {
    super(props)

    this.state = {
      namespace: 'None',
      data_topic: 'None',
      data_product: 'None',
      data_image_topic: 'None'
    }


    this.renderDataProductSelector = this.renderDataProductSelector.bind(this)

    this.renderImageViewer = this.renderImageViewer.bind(this)

    this.setDeviceSelection = this.setDeviceSelection.bind(this)
    this.clearDeviceSelection = this.clearDeviceSelection.bind(this)
    this.createDeviceOptions = this.createDeviceOptions.bind(this)
    this.onDeviceSelected = this.onDeviceSelected.bind(this)

    this.createDataProductOptions = this.createDataProductOptions.bind(this)
    this.onDataProductSelected = this.onDataProductSelected.bind(this)

  }


  setDeviceSelection(namespace) {
      this.setState({
        namespace: namespace,
      })
  }

  clearDeviceSelection() {
    this.setState({
      namespace: 'None',
      data_topic: "None",
      data_product: "None",      
      data_image_topic: 'None'
    })
  }

  // Function for creating topic options for Select input
  createDeviceOptions() {
    const { idxDevices} = this.props.ros
    const topics = Object.keys(idxDevices)
    const namespace = this.state.namespace
    var items = []
    items.push(<Option value={'None'}>{'None'}</Option>)
    var device_name = ""
    for (var i = 0; i < topics.length; i++) {
      device_name = topics[i].split('/idx')[0].split('/').pop()
      items.push(<Option value={topics[i]}>{device_name}</Option>)
    }
    // Check that our current selection hasn't disappeard as an available option
    if ((namespace != null) && (namespace != 'None') && (topics.includes(namespace) === false)) {
      this.clearDeviceSelection()
    }
    if (namespace !== 'None' && (topics.indexOf(namespace) === -1)){
      this.setState({namespace: 'None'})
    }
    return items
  }

  // Handler for IDX Sensor topic selection
  onDeviceSelected(event) {
    const value = event.target.value
      this.setDeviceSelection(value)
  }





  createDataProductOptions() {
    const namespace = this.state.namespace ? this.state.namespace : "None"
    const capabilities = this.props.ros.idxDevices[namespace]
    const data_products = capabilities ? capabilities.data_products : []
    const data_product_image_topics = capabilities ? capabilities.data_product_image_topics : []

    var items = []
    var data_product
    var data_topic
    var image_topic

    for (var i = 0; i < data_products.length; i++) {
      data_product = data_products[i]
      data_topic = namespace + '/' + data_product
      items.push(<Option value={data_topic}>{data_product}</Option>)
    }

    const sel_data_topic = this.state.data_topic
    if (items.length === 0) {
      items.push(<Option value={"None"}>{"None"}</Option>)
      if (sel_data_topic !== 'None'){
          this.setState({
            data_topic: "None",
            data_product: "None", 
            data_image_topic: 'None'   
          })       
      }
    }
    else if (sel_data_topic === 'None' || sel_data_topic == null){
          this.setState({
            data_topic: namespace + '/' + data_products[0],
            data_product: data_products[0],   
            data_image_topic: data_product_image_topics[0]  
          })    
    }



    return items    
  }


  // Handler for Image topic selection
  onDataProductSelected(event) {
    const namespace = this.state.namespace ? this.state.namespace : "None"
    const capabilities = this.props.ros.idxDevices[namespace]
    const data_products = capabilities ? capabilities.data_products : []
    const data_product_image_topics = capabilities ? capabilities.data_product_image_topics : []

    const index = event.nativeEvent.target.selectedIndex
    const text = event.nativeEvent.target[index].text
    const value = event.target.value

    const data_index = data_products.indexOf(value)
    const image_topic = (data_index !== -1) ? data_product_image_topics[data_index] : "None"

    this.setState({
      data_topic: value,
      data_product: text,
      data_image_topic: image_topic
    })
  }



  renderDataProductSelector() {
    const data_topic = this.state.data_topic

        return (

                <React.Fragment>

                    <div align={"left"} textAlign={"left"}>
                      <Label title={"Data Product"}>
                        <Select
                          id="topicSelect"
                          onChange={this.onDataProductSelected}
                          value={data_topic}
                        >
                          {this.createDataProductOptions()}
                        </Select>
                      </Label>
                    </div>

              </React.Fragment>
        )
    }
  



  renderDeviceSelector() {
    const device_selected = (this.state.namespace != null && this.state.namespace != 'None' )
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

                    {(device_selected == true) ?
                    this.renderDataProductSelector()
                    : null }

                  </Column>
                  <Column>
    
                  </Column>
                </Columns>
                  
                </Section>

        )

  }

  renderImageViewer() {
    const image_topic = this.state.data_image_topic

    const image_text = image_topic.split('/idx')[0].split('/').pop() + '-' + this.state.data_product
    return (
      <React.Fragment>
        <Columns>
          <Column equalWidth={false}>


            <ImageViewer
              image_topic={image_topic}
              title={image_text}
              hideQualitySelector={false}
              show_topic_selector={false}
              show_all_options={false}
            />

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

              <div style={{ width: "75%" }}>


              {(device_selected == true) ?
              this.renderImageViewer()
              : null}

              </div>


              <div style={{ width: '2%' }}>
                    {}
              </div>



              <div style={{ width: "23%"}}>

                    
                      {this.renderDeviceSelector()}
    


                          {(device_selected == true) ?
                          <NepiDeviceIDXControls
                              namespace={namespace}
                              dataProduct={data_product}
                              title={ "Publish Controls"}
                        />
                        : null}

                        
                          {(device_selected == true) ?
                          <NepiIFSettings
                            namespace={namespace}
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

export default NepiDeviceIDX
