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
//import Button, { ButtonMenu } from "./Button"
import Label from "./Label"
import { Column, Columns } from "./Columns"
//import Input from "./Input"
import Select, { Option } from "./Select"
import Styles from "./Styles"
import Toggle from "react-toggle"
import BooleanIndicator from "./BooleanIndicator"
import {SliderAdjustment} from "./AdjustmentWidgets"


import Nepi_IF_AiDetectors from "./Nepi_IF_AIDetectors"

import NepiIFImageViewer from "./Nepi_IF_ImageViewer"
//import NepiIFSaveData from "./Nepi_IF_SaveData"
import NepiIFConfig from "./Nepi_IF_Config"

import {filterStrList, createMenuFirstLastNames} from "./Utilities"

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer


class AiDetectorMgr extends Component {
  detector_info = []
  constructor(props) {
    super(props)

    this.state = {

      connectedToNepi: false,
      connectedToAiModelsMgr: false,


      status_msg: null,


      selected_detector: "None",
      last_selected_detector: "None",

      img_filter_str_list: ['detection_image','targeting_image','alert_image','tracking_image'],


      selected_display_topic: "None",
      selected_display_text: "None",

   
      statusListener: null,
      connected: false,

      needs_update: false


    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
    this.checkConnection = this.checkConnection.bind(this)

    this.updateStatusListeners = this.updateStatusListeners.bind(this)
    this.statusListener = this.statusListener.bind(this)

    this.getDisplayImgOptions = this.getDisplayImgOptions.bind(this)
    this.onDisplayImgSelected = this.onDisplayImgSelected.bind(this)
    this.getSaveNamespace = this.getSaveNamespace.bind(this)

  }
  
  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId 
    }
    return baseNamespace
  }

  async checkConnection() {
    const { connectedToNepi , connectedToAiModelsMgr} = this.props.ros
    if (this.state.connectedToNepi !== connectedToNepi){
      this.setState({connectedToNepi: connectedToNepi,
                    status_msg: null,
                    selected_model: 'None'})
    }
    if (this.state.connectedToAiModelsMgr !== connectedToAiModelsMgr )
    {
      this.setState({connectedToAiModelsMgr: connectedToAiModelsMgr, connected: true})
      this.setState({needs_update: true})
    }

    setTimeout(async () => {
      await this.checkConnection()
    }, 1000)
  }



  componentDidMount(){
    this.checkConnection()
  }

  // Callback for handling ROS Status messages
  statusListener(message) {
    const sel_detector = this.state.selected_detector
    const got_detector = message.namespace

    if (sel_detector === got_detector){
      this.setState({
      status_msg: message,
      connected: true
      })
    }

  }

  // Function for configuring and subscribing to Status
  updateStatusListeners() {

    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
      this.setState({
        status_msg: null,
        connected: false,
        statusListener: null,
        selected_display_topic: "None",
        selected_display_text: "None"
    })
    }
    const ai_models_namespaces = this.props.ros.ai_models_running_namespace_list
    const selected_detector = this.state.selected_detector
    const detector_ind = ai_models_namespaces.indexOf(selected_detector)
    if (detector_ind !== -1){

      var statusListener = this.props.ros.setupStatusListener(
        selected_detector + '/status',
        "nepi_interfaces/AiDetectorStatus",
        this.statusListener
      )
      this.setState({ 
        statusListener: statusListener,
      })
    }

  }


  
  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.state.needs_update === true){
      const selected_detector = this.state.selected_detector
      const last_detector = this.state.last_selected_detector

      if (last_detector !== selected_detector) {
          this.setState({      
            last_selected_detector: selected_detector
          })  
          this.updateStatusListeners()

      }
      this.setState({needs_update: false})
    }
     
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status3DX message
  componentWillUnmount() {
      this.state.statusListener.unsubscribe()
      this.setState({
        status_msg: null,
        connected: false,
        statusListener: null,
        selected_display_topic: "None",
        selected_display_text: "None"
    })
  }






    // Function for creating image topic for a selected detector.
    getDisplayImgOptions() {
      const { imageTopics } = this.props.ros
      var items = []
      const status_msg = this.state.status_msg
      const sel_img = this.state.selected_display_topic
    

      var img_topic = "None"
      var shortname = ''
      if (status_msg != null){
              const image_pub_topics = status_msg.image_pub_topics
              const image_names = createMenuFirstLastNames(image_pub_topics)
              if (image_pub_topics.length > 0){
                for (var i = 0; i < image_pub_topics.length; i++) {
                    if (imageTopics.indexOf(image_pub_topics[i]) !== -1) {
                      img_topic = image_pub_topics[i] 
                      shortname =  image_names[i]  
                      items.push(<Option value={img_topic}>{shortname}</Option>)
                   

                      if ((sel_img === "None" || sel_img === '') && i === 0 ){
                        
                        this.setState({selected_display_topic: img_topic, selected_display_text: shortname })
                      }
                    }
                }
              }
              else  {
                items.push(<Option value={"None"}>{"None"}</Option>)
                if (sel_img !== 'None'){
                  this.setState({selected_display_topic: "None", selected_display_text: "None" })
                }
              }
      }
      else  {
        items.push(<Option value={"None"}>{"None"}</Option>)
      }
      return items
    }


  onDisplayImgSelected(event){
    const img_topic = event.target.value
    const status_msg = this.state.status_msg
    var detector_name = 'None'
    var img_name = 'None'
    if (status_msg != null){
      detector_name = status_msg.ai_detector_name 
      img_name = detector_name + img_topic.split(detector_name)[1]
    }
    this.setState({selected_display_topic: img_topic,
                   selected_display_text: img_name
    })
  }   




    // Function for creating image topic options.
    getSaveNamespace() {
      const detector_namespace = this.state.selected_namespace
      var saveNamespace = "None"
      if (detector_namespace){
        saveNamespace = detector_namespace
      }
      return saveNamespace
    }





  render() {
    const { imageTopics } = this.props.ros
    const img_options = this.getDisplayImgOptions()
    const sel_img_topic = this.state.selected_display_topic
    const img_publishning = imageTopics.indexOf(sel_img_topic) !== -1
    const sel_img = (img_publishning === true && this.state.connected === true) ? sel_img_topic : "None"
    const sel_img_text = (sel_img_topic === 'None') ? 'No Image Selected' : img_publishning?  this.state.selected_display_text : 'Waiting for image to publish'

    const save_data_topic = this.state.selected_detector + '/save_data'


    return (



      <Columns>
      <Column equalWidth={false}>


          <Columns>
          <Column>


              

                  <Label title="Select Image">
                      <Select id="ImgSelect" onChange={this.onDisplayImgSelected} 
                      value={sel_img}
                      disabled={false}>
                        {img_options}
                    </Select>
                    </Label>
          </Column>
          <Column>

          </Column>
          </Columns>


      <NepiIFImageViewer
        image_topic={sel_img}
        title={sel_img_text}
        show_res_orient={false}
        save_data_topic={save_data_topic}
      />

{/*
      { (saveNamespace !== 'None' && connected === true) ?
        <NepiIFSaveData
              saveNamespace={saveNamespace + '/save_data'}
              title={"Nepi_IF_SaveData"}
          />
      : null }
*/}
      </Column>
      <Column>


      <Nepi_IF_AiDetectors
        make_section={true}
        />
      


      </Column>
      </Columns>



      )
    }

  

}

export default AiDetectorMgr
