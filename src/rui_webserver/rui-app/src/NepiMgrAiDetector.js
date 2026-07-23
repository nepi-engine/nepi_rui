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


class DetectorMgr extends Component {
  detector_info = []
  constructor(props) {
    super(props)

    this.state = {

      connectedToNepi: false,
      connectedToAiModelsMgr: false,


      status_msg: null,
      process_status_msg: null,


      selected_process: "None",
      detector_ind: 0,
      last_selected_process: "None",

      source_list_detector_viewable: false,
      source_filter_str_list: ['detections_image','targeting_image','alert_image','tracking_image'],


      selected_display_topic: "None",
      selected_display_text: "None",

      classes_list_viewable: false,
      availableClassesList: [],
      selected_classes:[],

      showSettingsControl: this.props.showSettingsControl ? this.props.showSettingsControl : false,      
      showSettings: false,

      statusListener: null,
      connected: false,

      needs_update: false


    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
    this.checkConnection = this.checkConnection.bind(this)

    this.updateStatusListeners = this.updateStatusListeners.bind(this)
    this.statusListener = this.statusListener.bind(this)

    this.getDetectorOptions = this.getDetectorOptions.bind(this)
    this.onDetectorSelected = this.onDetectorSelected.bind(this)

    this.createImageTopicsOptions = this.createImageTopicsOptions.bind(this)

    this.toggleImagesListViewable = this.toggleImagesListViewable.bind(this)
    this.onImagesTopicSelected = this.onImagesTopicSelected.bind(this)


    this.onToggleClassSelection = this.onToggleClassSelection.bind(this)
    this.getClassOptions = this.getClassOptions.bind(this)
    this.toggleClassesListViewable = this.toggleClassesListViewable.bind(this)

    this.getDisplayImgOptions = this.getDisplayImgOptions.bind(this)
    this.onDisplayImgSelected = this.onDisplayImgSelected.bind(this)
    this.getSaveNamespace = this.getSaveNamespace.bind(this)

    this.renderDetector = this.renderDetector.bind(this)
    this.renderDetectorSettings = this.renderDetectorSettings.bind(this)

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
                    process_status_msg: null,
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
    const sel_detector = this.state.selected_process
    const got_detector = message.process_status.namespace

    if (sel_detector === got_detector){
      this.setState({
      status_msg: message,
      process_status_msg: message.process_status,
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
        process_status_msg: null,
        connected: false,
        statusListener: null,
        selected_display_topic: "None",
        selected_display_text: "None"
    })
    }
    const ai_models_namespaces = this.props.ros.ai_models_running_namespace_list
    const selected_process = this.state.selected_process
    const check_process = this.state.selected_process.replace('/detections','')
    const detector_ind = ai_models_namespaces.indexOf(check_process)
    this.setState({detector_ind: detector_ind})
    if (detector_ind !== -1){

      var statusListener = this.props.ros.setupStatusListener(
        selected_process + '/status',
        "nepi_interfaces/DetectorStatus",
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
      const selected_process = this.state.selected_process
      const last_detector = this.state.last_selected_process

      if (last_detector !== selected_process) {
          this.setState({      
            last_selected_process: selected_process
          })  
          this.updateStatusListeners()

      }
      this.setState({needs_update: false})
    }
     
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status3DX message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
      this.setState({
        status_msg: null,
        process_status_msg: null,
        connected: false,
        statusListener: null,
        selected_display_topic: "None",
        selected_display_text: "None"
    })
  }



  // Function for creating image topic options.
  getDetectorOptions() {
    const ai_models_namespaces = this.props.ros.ai_models_running_namespace_list
    const ai_models_display_names = this.props.ros.ai_models_running_name_list
    const ai_models_types = this.props.ros.ai_models_running_type_list
    const selected_process = this.state.selected_process
    var items = []
    var check_type = 'detection'
    var type = 'Unknown'

    if (ai_models_namespaces.length === 0) {
      items.push(<Option value={'None'}>{'None'}</Option>)
    }
    else {
      for (var i = 0; i < ai_models_namespaces.length; i++) {
          type = ai_models_types[i]
          if (type === check_type ){
            //items.push(<Option value={ai_models_namespaces[i]}>{ai_models_names[i]}</Option>)
            items.push(<Option value={ai_models_namespaces[i] + '/detections'}>{ai_models_display_names[i]}</Option>)
          }
      }
    }

    if ( ai_models_namespaces.indexOf(selected_process.replace('/detections','')) === -1){
      if (ai_models_namespaces.length > 0){
        this.setState({selected_process: ai_models_namespaces[0] + '/detections'})
      }
      else if (selected_process !== 'None') {
        this.setState({selected_process: 'None'})
      }
    }
    return items
  }

  onDetectorSelected(event){
    const detector = event.target.value
    this.setState({selected_process: detector})
    this.setState({needs_update: true})
  }

  renderDetector() {

    const detector_options = this.getDetectorOptions()

    const selected_process = this.state.selected_process

    const status_msg = this.state.status_msg
    const process_status_msg = this.state.process_status_msg
    const process_namespace = (status_msg == null) ? "None" : process_status_msg.namespace
    const connected = (process_namespace === selected_process)? this.state.connected : false



    const { userRestricted} = this.props.ros
    const detector_controls_restricted = userRestricted.indexOf('MANAGER-AI-DETECTORS-CONTROL') !== -1


      return (


        <Section title={"AI Detection Manager"}>

          <Columns>
          <Column>

             <Label title="Select Detector">
                  <Select id="DetectorSelect" onChange={this.onDetectorSelected} 
                      value={selected_process}
                      disabled={false}>
                    {detector_options}
                  </Select>
              </Label>
    

              <div hidden={((status_msg != null) || selected_process === 'None')}>

                  <pre style={{ height: "50px", overflowY: "auto" }} align={"left"} textAlign={"left"}>
                  {"Loading..."}
                  </pre>

              </div>

          </Column>
          </Columns>

   
              { (status_msg != null && connected === true && detector_controls_restricted === false) ? this.renderDetectorSettings() : null}



  
          </Section>

      )
  

  }



  // Function for creating image topic options.
  createImageTopicsOptions() {
    const source_filter_str_list = this.state.source_filter_str_list
    const { imageTopics } = this.props.ros
    const img_options = filterStrList(imageTopics,source_filter_str_list)
    var imageTopicShortnames = createMenuFirstLastNames(img_options)
    var items = []
    items.push(<Option value={'None'}>{'None'}</Option>)
    items.push(<Option value={'All'}>{'All'}</Option>)
    const sel_det = this.state.selected_process
    for (var i = 0; i < img_options.length; i++) {
      if (img_options[i].indexOf(sel_det) === -1){
       items.push(<Option value={img_options[i]}>{imageTopicShortnames[i]}</Option>)
      }
    }
    return items
  }

  toggleImagesListViewable() {
    const set = !this.state.img_list_viewable
    this.setState({img_list_viewable: set})
  }


  onImagesTopicSelected(event){
    const {imageTopics, sendStringMsg, sendStringArrayMsg} = this.props.ros
    const process_namespace = this.state.selected_process
    const add_img_namespace = process_namespace + "/add_source_topic"
    const add_imgs_namespace = process_namespace + "/add_source_topics"
    const remove_img_namespace = process_namespace + "/remove_source_topic"
    const remove_imgs_namespace = process_namespace + "/remove_source_topics"
    const source_filter_str_list = this.state.source_filter_str_list
    const img_options = filterStrList(imageTopics,source_filter_str_list)
    const selected_sources = this.state.process_status_msg.selected_sources
    const source_topic = event.target.value
    //this.setState({selected_display_topic: source_topic})

    if (source_topic === "None"){
        sendStringArrayMsg(remove_imgs_namespace,img_options)
    }
    else if (source_topic === "All"){
        sendStringArrayMsg(add_imgs_namespace,img_options)
    }
    else if (selected_sources.indexOf(source_topic) === -1){
      sendStringMsg(add_img_namespace,source_topic)
    }
    else {
      sendStringMsg(remove_img_namespace,source_topic)
    }
  }


  // Function for creating image topic options.
  getClassOptions() {

    var items = []
    items.push(<Option>{"None"}</Option>)
    const status_msg = this.state.status_msg
    if (status_msg != null){
      const selected_process = this.state.selected_process
      const process_status_msg = this.state.process_status_msg
      const process_namespace = process_status_msg.namespace 
      if (selected_process === process_namespace){
        items.push(<Option>{"All"}</Option>)
        if (status_msg.available_classes.length > 0 ){
          for (var i = 0; i < status_msg.available_classes.length; i++) {
              if (status_msg.available_classes[i] !== 'None'){
                items.push(<Option value={status_msg.available_classes[i]}>{status_msg.available_classes[i]}</Option>)
              }
          }
        }
      }
    }
    return items
    }
  
  
    toggleClassesListViewable() {
      const set = !this.state.classes_list_viewable
      this.setState({classes_list_viewable: set})
    }
  
  
    onToggleClassSelection(event){
      const {sendTriggerMsg, sendStringMsg} = this.props.ros

    const status_msg = this.state.status_msg
    
    if (status_msg != null){
      const selected_process = this.state.selected_process
      const process_status_msg = this.state.process_status_msg
      const process_namespace = process_status_msg.namespace 
        if (selected_process === process_namespace){
          const classSelection = event.target.value
          const selected_classes = status_msg.selected_classes
          const addAllNamespace = process_namespace + "/add_all_classes"
          const removeAllNamespace = process_namespace + "/remove_all_classes"
          const addNamespace = process_namespace + "/add_class"
          const removeNamespace = process_namespace + "/remove_class"
          if (process_namespace){
            if (classSelection === "None"){
                sendTriggerMsg(removeAllNamespace)
            }
            else if (classSelection === "All"){
              sendTriggerMsg(addAllNamespace)
          }
            else if (selected_classes.indexOf(classSelection) !== -1){
              sendStringMsg(removeNamespace,classSelection)
            }
            else {
              sendStringMsg(addNamespace,classSelection)
            }
          }
        }
      }
    }


renderDetectorSettings() {
  const { sendBoolMsg } = this.props.ros


  const selected_image_topic = 'Unselected' //this.state.selected_display_topic

  const classOptions = this.getClassOptions()

  const status_msg = this.state.status_msg
  if (status_msg != null){
    const selected_process = this.state.selected_process
    const process_status_msg = this.state.process_status_msg
    const process_namespace = process_status_msg.namespace
    if (selected_process === process_namespace){
      




      const enabled = process_status_msg.enabled
      const running = process_status_msg.running
      const processing = process_status_msg.state
      const msg_str = process_status_msg.msg_str



    


      const max_process_rate_hz = process_status_msg.max_process_rate_hz 
      const max_image_pub_rate_hz = process_status_msg.max_image_pub_rate_hz

      const imaging_enabled = process_status_msg.imaging_enabled
      const use_last_image = process_status_msg.use_last_image

      const selected_sources = process_status_msg.selected_sources

      const img_selected = process_status_msg.source_selected
      const img_connected = process_status_msg.source_connected

      const avg_source_latency = round(process_status_msg.avg_source_latency, 3)
      const avg_source_rate = round(process_status_msg.avg_source_rate, 3)

      const avg_preprocess_latency = round(process_status_msg.avg_preprocess_latency, 3)
      const avg_preprocess_rate = round(process_status_msg.avg_preprocess_rate, 3)

      const avg_process_latency = round(process_status_msg.avg_process_latency, 3)
      const avg_process_rate = round(process_status_msg.avg_process_rate, 3)

      const max_process_rate = round(process_status_msg.max_process_rate, 3)


      const img_options = this.createImageTopicsOptions()

      //////////////////////////
      // Custom Process Controls
      const selected_classes = status_msg.selected_classes
      const classes_selected = (selected_classes.length > 0)
      const threshold = status_msg.threshold

      return (
      <Columns>
      <Column>



          <Columns>
        <Column>

          <Label title={"Select Images"}/>

            </Column>
          <Column>

                <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <div onClick={this.toggleImagesListViewable} style={{backgroundColor: Styles.vars.colors.grey0}}>
          <Select style={{width: "10px"}}/>
        </div>
        <div hidden={this.state.img_list_viewable === false}>
        {img_options.map((image) =>
        <div onClick={this.onImagesTopicSelected}
          style={{
            textAlign: "center",
            padding: `${Styles.vars.spacing.xs}`,
            color: Styles.vars.colors.black,
            backgroundColor: (image.props.value === selected_image_topic) ?
              Styles.vars.colors.green :
              (selected_sources.indexOf(image.props.value) !== -1 ) ? Styles.vars.colors.blue : Styles.vars.colors.grey0,
            cursor: "pointer",
            }}>
            <body image-topic ={image} style={{color: Styles.vars.colors.black}}>{image}</body>
        </div>
        )}
        </div>

          </Column>
          </Columns>



          <Columns>
        <Column>

          <Label title={"Select Classes"}/>

            </Column>
          <Column>

                <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                <div onClick={this.toggleClassesListViewable} style={{backgroundColor: Styles.vars.colors.grey0}}>
                      <Select style={{width: "10px"}}/>
                    </div>
                    <div hidden={this.state.classes_list_viewable === false}>
                    {classOptions.map((Class) =>
                    <div onClick={this.onToggleClassSelection}
                      style={{
                        textAlign: "center",
                        padding: `${Styles.vars.spacing.xs}`,
                        color: Styles.vars.colors.black,
                        backgroundColor: (selected_classes.includes(Class.props.value))? Styles.vars.colors.blue : Styles.vars.colors.grey0,
                        cursor: "pointer",
                        }}>
                        <body class_name ={Class} style={{color: Styles.vars.colors.black}}>{Class}</body>
                    </div>
                    )}
                    </div>

          </Column>
          </Columns>





        <Columns>
        <Column>

        <Label title="Enable">
              <Toggle
              checked={enabled===true}
              onClick={() => sendBoolMsg(process_namespace + "/enable",!enabled)}>
              </Toggle>
        </Label>

        </Column>
        <Column>

        </Column>
        </Columns>

        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

      <Label title={"STATUS"}></Label>



              <Columns>
        <Column>

        <Label title={"Processing"}>
                        <BooleanIndicator value={running} />
         </Label>

        </Column>
        <Column>

        </Column>
        </Columns>


        <Label title={"IMAGE"}></Label>

        <div style={{ display: 'flex' }}>
                      <div style={{ width: '40%' }}>

                      <Label title={"Selected"}>
                    <BooleanIndicator value={img_selected} />
                    </Label>


                      </div>

                      <div style={{ width: '20%' }}>
                        {}
                      </div>

                      <div style={{ width: '40%' }}>
                       
                          <Label title={"Connected"}>
                            <BooleanIndicator value={img_connected} />
                          </Label>
                      </div>
              </div>


    

          <Label title={"CLASSES"}></Label>

          <div style={{ display: 'flex' }}>
                      <div style={{ width: '40%' }}>

                      <Label title={"Selected"}>
                        <BooleanIndicator value={classes_selected} />
                      </Label>

                      </div>

                      <div style={{ width: '20%' }}>
                        {}
                      </div>

                      <div style={{ width: '40%' }}>
                       
                      <Label title={"Detect State"}>
                        <BooleanIndicator value={processing} />
                      </Label>

                      </div>
                    </div>



        <pre style={{ height: "100px", overflowY: "auto" }} align={"left"} textAlign={"left"}>
        {"\n Avg Process Rate: " + avg_process_rate +
        "\n Avg Process Latency: " + avg_process_latency +

        "\n" +
        "\n Avg Preprocess Rate: " + avg_preprocess_rate +
        "\n Avg Preprocess Latency: " + avg_preprocess_latency +

        "\n" +
        "\n Avg Source Rate: " + avg_source_rate +
        "\n Avg Source Latency: " + avg_source_latency +
        "\n" +
        "\n Max Possible Process Rate Hz: " + max_process_rate }

      
        </pre>


             <NepiIFConfig
                              namespace={process_namespace}
                              title={"Nepi_IF_Conig"}
              />


        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

        <Columns>
        <Column>

        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {"Detector Settings"}
          </label>

          </Column>
          </Columns>

          <Columns>
        <Column>



          </Column>
          </Columns>




          

          <SliderAdjustment
                    title={"Threshold"}
                    msgType={"std_msgs/Float32"}
                    adjustment={threshold}
                    topic={process_namespace + "/set_threshold"}
                    scaled={0.01}
                    min={0}
                    max={100}
                    disabled={false}
                    tooltip={"Sets detections confidence threshold"}
                    unit={"%"}
                  />
                  
          <SliderAdjustment
                  title={"Max Detection Rate"}
                  msgType={"std_msgs/Float32"}
                  adjustment={max_process_rate_hz}
                  topic={process_namespace + "/set_max_proc_rate"}
                  scaled={1.0}
                  min={1}
                  max={20}
                  disabled={false}
                  tooltip={"Sets detections max rate in hz"}
                  unit={"Hz"}
            />

          <SliderAdjustment
                  title={"Max Image Publish Rate"}
                  msgType={"std_msgs/Float32"}
                  adjustment={max_image_pub_rate_hz}
                  topic={process_namespace + "/set_max_image_pub_rate_hz"}
                  scaled={1.0}
                  min={1}
                  max={20}
                  disabled={false}
                  tooltip={"Sets detections max rate in hz"}
                  unit={"Hz"}
            />




            <Columns>
            <Column>

                  <Label title="Publish Image">
                  <Toggle
                  checked={imaging_enabled===true}
                  onClick={() => this.props.ros.sendBoolMsg(process_namespace + "/set_image_pub", imaging_enabled===false)}>
                  </Toggle>
                  </Label>


                <div hidden={imaging_enabled === false}>
                  <Label title="Use Last Image">
                    <Toggle
                    checked={use_last_image===true}
                    onClick={() => this.props.ros.sendBoolMsg(process_namespace + "/set_use_last_image", use_last_image===false)}>
                    </Toggle>
                    </Label>

                  {/* <Label title="Overlay Labels">
                    <Toggle
                    checked={overlay_labels===true}
                    onClick={() => this.props.ros.sendBoolMsg(process_namespace + "/set_overlay_labels", overlay_labels===false)}>
                    </Toggle>
                  </Label>

                  <Label title="Overlay Range Bearing">
                    <Toggle
                    checked={overlay_range_bearing===true}
                    onClick={() => this.props.ros.sendBoolMsg(process_namespace + "/set_overlay_range_bearing", overlay_range_bearing===false)}>
                    </Toggle>
                  </Label>

                  <Label title="Overlay Image Name">
                    <Toggle
                    checked={overlay_img_name===true}
                    onClick={() => this.props.ros.sendBoolMsg(process_namespace + "/set_overlay_img_name", overlay_img_name===false)}>
                    </Toggle>
                    </Label>


                    <Label title="Overlay Classifier">
                    <Toggle
                    checked={overlay_detector_name===true}
                    onClick={() => this.props.ros.sendBoolMsg(process_namespace + "/set_overlay_clf_name", overlay_detector_name===false)}>
                    </Toggle>
                    </Label> */}
                </div>

              </Column>
              <Column>

                 

          {/*
            <div hidden={has_tiling === false}>           
                <Label title="Enable Image Tiling">
                  <Toggle
                  checked={is_tiling===true}
                  onClick={() => this.props.ros.sendBoolMsg(process_namespace + "/set_img_tiling", is_tiling===false)}>
                  </Toggle>
                  </Label>

                  </div>
          */}


            </Column>
            </Columns>



    </Column>
    </Columns>


        )
      }
    }
  }





    // Function for creating image topic for a selected detector.
    getDisplayImgOptions() {
      const { imageTopics } = this.props.ros
      var items = []
      const status_msg = this.state.status_msg
      const process_status_msg = this.state.process_status_msg

      var selected_image_topic = this.state.selected_display_topic
      const selected_image_topic_found = (imageTopics.indexOf(selected_image_topic)) !== -1

    

      var source_topic = "None"
      var shortname = ''
      if (status_msg != null){
              const image_pub_topics = process_status_msg.imaging_pub_topics
              const image_names = createMenuFirstLastNames(image_pub_topics)
              if (image_pub_topics.length > 0){
                if (selected_image_topic_found === false){
                    selected_image_topic = image_pub_topics[0]
                    if (imageTopics.indexOf(selected_image_topic) !== -1)  {
                      this.setState({selected_display_topic: selected_image_topic, selected_display_text: image_names[0]  })
                    }
                }
                for (var i = 0; i < image_pub_topics.length; i++) {
                    if (imageTopics.indexOf(image_pub_topics[i]) !== -1) {
                      source_topic = image_pub_topics[i] 
                      shortname =  image_names[i]  
                      items.push(<Option value={source_topic}>{shortname}</Option>)
                   

                      if ((selected_image_topic === "None" || selected_image_topic === '') && i === 0 ){
                        
                        this.setState({selected_display_topic: source_topic, selected_display_text: shortname })
                      }
                    }
                }
              }
              else  {
                items.push(<Option value={"None"}>{"None"}</Option>)
                if (selected_image_topic !== 'None'){
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
    const source_topic = event.target.value
    const status_msg = this.state.status_msg
    const process_status_msg = this.state.process_status_msg
    var detector_name = 'None'
    var img_name = 'None'
    if (status_msg != null){
      detector_name = process_status_msg.node_name
      img_name = detector_name + source_topic.split(detector_name)[1]
    }
    this.setState({selected_display_topic: source_topic,
                   selected_display_text: img_name
    })
  }   




    // Function for creating image topic options.
    getSaveNamespace() {
      const process_namespace = this.state.selected_namespace
      var saveNamespace = "None"
      if (process_namespace){
        saveNamespace = process_namespace
      }
      return saveNamespace
    }





  render() {
    const { imageTopics } = this.props.ros
    const img_options = this.getDisplayImgOptions()
    const selected_image_topic_topic = this.state.selected_display_topic
    const img_publishning = imageTopics.indexOf(selected_image_topic_topic) !== -1
    const selected_image_topic = (img_publishning === true && this.state.connected === true) ? selected_image_topic_topic : "None"
    const selected_image_topic_text = (selected_image_topic_topic === 'None') ? 'No Image Selected' : img_publishning?  this.state.selected_display_text : 'Waiting for image to publish'

    const save_data_topic = this.state.selected_process + '/save_data'


    return (



      <Columns>
      <Column equalWidth={false}>


          <Columns>
          <Column>


              

                  <Label title="Select Image">
                      <Select id="ImgSelect" onChange={this.onDisplayImgSelected} 
                      value={selected_image_topic}
                      disabled={false}>
                        {img_options}
                    </Select>
                    </Label>
          </Column>
          <Column>

          </Column>
          </Columns>


      <NepiIFImageViewer
        image_topic={selected_image_topic}
        title={selected_image_topic_text}
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


      {this.renderDetector()}
      


      </Column>
      </Columns>



      )
    }

  

}

export default DetectorMgr
