/*
#
# Copyright (c) 2024 Numurus <https://www.numurus.com>.
#
# License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
#
 */


import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import Section from "./Section"
import { Columns, Column } from "./Columns"
//import Select, { Option } from "./Select"
import Button, { ButtonMenu } from "./Button"
import Styles from "./Styles"
import Label from "./Label"
import Toggle from "react-toggle"

import {onChangeSwitchStateValue} from "./Utilities"

import NepiIFImageViewerSelector from "./Nepi_IF_ImageViewerSelector"
import NepiIFSaveData from "./Nepi_IF_SaveData"



@inject("ros")
@observer

// MultiImageViewer 
class NepiIFImageViewersSelector extends Component {

  constructor(props) {
    super(props)

    this.state = {

      image_topics: ['None','None','None','None'],
      num_windows: 0,

      needs_update: false,

      show_image_controls: false,
      show_selectors: false
    }

    this.getAllSaveNamespace = this.getAllSaveNamespace.bind(this)

    this.renderControlBar = this.renderControlBar.bind(this)
    this.renderImageWindows = this.renderImageWindows.bind(this)
    this.renderSaveData = this.renderSaveData.bind(this)
    this.setNumWindows = this.setNumWindows.bind(this)
    this.resetWindows = this.resetWindows.bind(this)

    this.renderImageViewersSelection = this.renderImageViewersSelection.bind(this)
    
  }


  getAllSaveNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var allNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      allNamespace = "/" + namespacePrefix + "/" + deviceId + '/save_data'
    }
    return allNamespace
  }

  

  componentDidMount(){
      this.setState({needs_update: true})
    }

  // // Lifecycle method called when compnent updates.
  // // Used to track changes in the topic
  // componentDidUpdate(prevProps, prevState, snapshot) {

  // }


  // // Lifecycle method called just before the component umounts.
  // // Used to unsubscribe to Status message
  // componentWillUnmount() {

  // }


  setNumWindows(num_windows){
      var cur_num_windows = this.state.num_windows

      if (num_windows === 0 || num_windows > 4){
          num_windows = 1
      }

      if (num_windows !== cur_num_windows){
        const {sendIntMsg} = this.props.ros
        const num_windows_updated_topic = (this.props.num_windows_updated_topic !== undefined) ? this.props.num_windows_updated_topic : null
        this.setState({num_windows: num_windows})

        if (num_windows_updated_topic != null){
            sendIntMsg( num_windows_updated_topic,num_windows)
        }
        
      }

  }

  resetWindows(){
      const {sendTriggerMsg} = this.props.ros     
      const image_topics = (this.props.image_topics !== undefined) ? this.props.image_topics : [null,null,null,null]
      
      var image_topic = ''

      for (var i = 0; i < image_topics.length; i++) {
        image_topic = image_topics[i]
        if (image_topic != null && image_topic !== 'None' && image_topic !== ''){
          sendTriggerMsg( image_topic + "/reset_renders")
        }
      }
  }


  renderControlBar() {
    if (this.state.needs_update === true){
      this.setState({needs_update: false})
    }
    const {imageTopics, sendStringMsg} = this.props.ros
    const images_available = imageTopics.length > 0
    const show_controls_bar = (this.props.show_controls_bar !== undefined) ? this.props.show_controls_bar : true
    const num_windows = (this.props.num_windows !== undefined) ? this.props.num_windows : this.state.num_windows
    const show_image_controls_option = ((this.props.show_image_controls_option !== undefined) ? this.props.show_image_controls_option : (num_windows === 1) && images_available === true)
    const show_image_controls = (this.props.show_image_controls !== undefined) ? this.props.show_image_controls : (this.state.show_image_controls && show_image_controls_option)
    
    const show_selectors_option =  images_available === true
    const custom_selection_options = (this.props.custom_selection_options !== undefined) ? this.props.custom_selection_options : []
    const custom_selection_callback = (this.props.custom_selection_callback !== undefined) ? this.props.custom_selection_callback : null
    const show_selectors = this.state.show_selectors
    return (
      <React.Fragment>

          {show_controls_bar === true ?

                <Columns>
                  <Column>
                  
   
                <div style={{ display: 'flex' }}>

 

                      <div style={{ width: '30%' }} centered={"true"} >
                        <ButtonMenu>
                          <Button onClick={() => this.setNumWindows(1)}>{"1 Image"}</Button>
                          <Button onClick={() => this.setNumWindows(2)}>{"2 Images"}</Button>
                          <Button onClick={() => this.setNumWindows(4)}>{"4 Images"}</Button>
                        </ButtonMenu>
                      </div>


                      <div style={{ width: '5%' }} centered={"true"} >
                        {null}
                      </div>


                      <div style={{ width: '30%' }}>
                        { (custom_selection_callback != null) ?
                        <ButtonMenu>
                              {/* Map over the restriction options array */}
                              {custom_selection_options.map((name) => (
                                <Button onClick={() => sendStringMsg(custom_selection_callback, name)}>{name.toUpperCase()}</Button>
                              ))}
                        </ButtonMenu>
                        : null }
                      </div>



                      <div style={{ width: '5%' }} centered={"true"} >
                        {null}
                      </div>



                      <div style={{ width: '10%' }} centered={"true"} hidden={show_image_controls_option === false}>

                        <Label title="Show Controls">
                          <Toggle
                            checked={show_image_controls===true}
                            onClick={() => onChangeSwitchStateValue.bind(this)("show_image_controls",show_image_controls)}>
                          </Toggle>
                      </Label>

                    </div>


                      <div style={{ width: '5%' }}>
                        {}
                      </div>

                      <div style={{ width: '10%' }} centered={"true"} hidden={show_selectors_option === false}>



                        <Label title="Show Selectors">
                          <Toggle
                            checked={show_selectors===true}
                            onClick={() => onChangeSwitchStateValue.bind(this)("show_selectors",show_selectors)}>
                          </Toggle>
                      </Label>

                    </div>


                </div>


                </Column>
                </Columns>
              :
                null
        }

      </React.Fragment>
    )

  }



  renderImageWindows() {
    if (this.state.needs_update === true){
      this.setState({needs_update: false})
    }
    
    const num_windows = (this.props.num_windows !== undefined) ? this.props.num_windows : this.state.num_windows
    const reset_windows = (this.props.reset_windows !== undefined) ? this.props.reset_windows : true
    if (num_windows !== this.state.num_windows){
      if (num_windows > 1 && reset_windows === true){
        this.resetWindows()
      }
      this.setState({num_windows: num_windows})
    }

    const {imageTopics} = this.props.ros
    const images_available = imageTopics.length > 0

    var show_selector_buttons = false
    if (this.state.num_windows === 1){
      show_selector_buttons = true
    }



    var image_topics = (this.props.image_topics !== undefined) ? this.props.image_topics : ['None','None','None','None']
    if (images_available === false) {
      image_topics =  ['None Available','None Available','None Available','None Available']
    }
    const titles = (this.props.titles !== undefined) ? this.props.titles : [null,null,null,null]
    const exclude_filters = (this.props.exclude_filters !== undefined) ? this.props.exclude_filters : []
    const include_filters = (this.props.include_filters !== undefined) ? this.props.include_filters : []

    const select_updated_topic = (this.props.select_updated_topic !== undefined) ? this.props.select_updated_topic : null
    const select_updated_topics = (this.props.select_updated_topics !== undefined) ? this.props.select_updated_topics : [select_updated_topic,select_updated_topic,select_updated_topic,select_updated_topic]
   
    const mouse_event_topic = (this.props.mouse_event_topic !== undefined) ? this.props.mouse_event_topic : null
    const mouse_event_topics = (this.props.mouse_event_topics !== undefined) ? this.props.mouse_event_topics : [mouse_event_topic,mouse_event_topic,mouse_event_topic,mouse_event_topic]

    const mouse_click_topic = (this.props.mouse_click_topic !== undefined) ? this.props.mouse_click_topic : null
    const mouse_click_topics = (this.props.mouse_click_topics !== undefined) ? this.props.mouse_click_topics : [mouse_click_topic,mouse_click_topic,mouse_click_topic,mouse_click_topic]

    const mouse_drag_topic = (this.props.mouse_drag_topic !== undefined) ? this.props.mouse_drag_topic : null
    const mouse_drag_topics = (this.props.mouse_drag_topics !== undefined) ? this.props.mouse_drag_topics : [mouse_drag_topic,mouse_drag_topic,mouse_drag_topic,mouse_drag_topic]

    const mouse_window_topic = (this.props.mouse_window_topic !== undefined) ? this.props.mouse_window_topic : null
    const mouse_window_topics = (this.props.mouse_window_topics !== undefined) ? this.props.mouse_window_topics : [mouse_window_topic,mouse_window_topic,mouse_window_topic,mouse_window_topic]
  
    const show_selectors = ((images_available && image_topics[0] === 'None') || 
                                      (images_available && num_windows === 2 && image_topics[1] === 'None') || 
                                      (images_available && num_windows === 4 && image_topics.indexOf('None') !== -1)) ? true :
                                            this.props.show_selectors !== undefined ? this.props.show_selectors : this.state.show_selectors

    if (show_selectors !== this.state.show_selectors){
      this.setState({show_selectors: show_selectors})
    }


    const auto_select_image = (this.props.auto_select_image !== undefined) ? this.props.auto_select_image : true
    const show_image_controls_option = (this.props.show_image_controls_option !== undefined) ? this.props.show_image_controls_option : (num_windows === 1)
    const show_image_controls = (this.props.show_image_controls !== undefined) ? this.props.show_image_controls : (this.state.show_image_controls && show_image_controls_option)
    const show_reset_button = (num_windows === 1)
    const allow_pan_zoom = (num_windows === 1)

    const streamingImageQuality = (num_windows > 1) ? 50 : 95
    const has_col_2 = (num_windows > 1) ? true : false
    const colFlexSize_1 = (has_col_2 === false)? "100%" : "49%"
    const colFlexSize_gap = (has_col_2 === false)? "0%" : "2%"
    const colFlexSize_2 = (has_col_2 === false)? "0%" : "49%"
    const make_section = true //(num_windows !== 1)

    
  
      return (
     
  <React.Fragment>
              <div style={{ display: 'flex' }}>
            
                  <div style={{ width: colFlexSize_1 }}>


                      <div id="Image1Viewer">
                        <NepiIFImageViewerSelector
                          id="0"
                          image_index={0}
                          image_topic={image_topics[0]}
                          title={titles[0]}
                          streamingImageQuality={streamingImageQuality}
                          exclude_filters={exclude_filters}
                          include_filters={include_filters}
                          show_image_controls={show_image_controls}
                          show_selector={show_selectors}
                          show_selector_buttons={show_selector_buttons}
                          show_reset_button={show_reset_button}
                          allow_pan_zoom={allow_pan_zoom}
                          mouse_event_topic={mouse_event_topics[0]}
                          mouse_click_topic={mouse_click_topics[0]}
                          mouse_drag_topic={mouse_drag_topics[0]}
                          mouse_window_topic={mouse_window_topics[0]}
                          select_updated_topic={select_updated_topics[0]}
                          auto_select_image={auto_select_image}
                          make_section={make_section}
                          show_save_controls={false}
                        />
                      </div>

 
                  </div>


                  <div style={{ width: colFlexSize_gap }}>
                        {}
                  </div>

                  <div style={{ width: colFlexSize_2 }}>

                        {(num_windows > 1)?
                          <div id="Image2Viewer">
                            <NepiIFImageViewerSelector
                              id="1"
                              image_index={1}
                              image_topic={image_topics[1]}
                              title={titles[1]}
                              streamingImageQuality={streamingImageQuality}
                              exclude_filters={exclude_filters}
                              include_filters={include_filters}
                              show_image_controls={show_image_controls}
                              show_selector={show_selectors}
                              show_selector_buttons={show_selector_buttons}
                              show_reset_button={show_reset_button}
                              allow_pan_zoom={allow_pan_zoom}
                              mouse_event_topic={mouse_event_topics[1]}
                              mouse_click_topic={mouse_click_topics[1]}
                              mouse_drag_topic={mouse_drag_topics[1]}
                              mouse_window_topic={mouse_window_topics[1]}
                              select_updated_topic={select_updated_topics[1]}
                              auto_select_image={auto_select_image}
                             make_section={make_section}
                             show_save_controls={false}
                            />
                          </div>          
                        : null
                        }

                  </div>
   
          </div> 


              <div style={{ display: 'flex' }}>
            
                  <div style={{ width: colFlexSize_1 }}>

                  

                        {(num_windows > 2)?
                          <div id="Image3Viewer">
                            <NepiIFImageViewerSelector
                              id="2"
                              image_index={2}
                              image_topic={image_topics[2]}
                              title={titles[2]}
                              streamingImageQuality={streamingImageQuality}
                              exclude_filters={exclude_filters}
                              include_filters={include_filters}
                              show_image_controls={show_image_controls}
                              show_selector={show_selectors}
                              show_selector_buttons={show_selector_buttons}
                              show_reset_button={show_reset_button}
                              allow_pan_zoom={allow_pan_zoom}
                              mouse_event_topic={mouse_event_topics[2]}
                              mouse_click_topic={mouse_click_topics[2]}
                              mouse_drag_topic={mouse_drag_topics[2]}
                              mouse_window_topic={mouse_window_topics[2]}
                              select_updated_topic={select_updated_topics[2]}
                              auto_select_image={auto_select_image}
                              make_section={make_section}
                              show_save_controls={false}
                            />
                          </div>        
                        : null
                        }
                  </div>


                  <div style={{ width: colFlexSize_gap }}>
                        {}
                  </div>

                  <div style={{ width: colFlexSize_2 }}>

                         {(num_windows === 4)?
                          <div id="Image4Viewer">
                            <NepiIFImageViewerSelector
                              id="3"
                              image_index={3}
                              image_topic={image_topics[3]}
                              title={titles[3]}
                              streamingImageQuality={streamingImageQuality}
                              exclude_filters={exclude_filters}
                              include_filters={include_filters}
                              show_image_controls={show_image_controls}
                              show_selector={show_selectors}
                              show_selector_buttons={show_selector_buttons}
                              show_reset_button={show_reset_button}
                              allow_pan_zoom={allow_pan_zoom}
                              mouse_event_topic={mouse_event_topics[3]}
                              mouse_click_topic={mouse_click_topics[3]}
                              mouse_drag_topic={mouse_drag_topics[3]}
                              mouse_window_topic={mouse_window_topics[3]}
                              select_updated_topic={select_updated_topics[3]}
                              auto_select_image={auto_select_image}
                             make_section={make_section}
                             show_save_controls={false}
                            />
                          </div>          
                        : null
                        }
                  </div>
   
          </div> 
    </React.Fragment>

      )
    
  }


    renderSaveData(){
      const allSaveNamespace = this.getAllSaveNamespace()
      const saveNamespace = (this.props.saveNamespace !== undefined) ? this.props.saveNamespace : allSaveNamespace

    
          return (
        
              <React.Fragment>
                          
                          <NepiIFSaveData
                            saveNamespace={saveNamespace}
                            make_section={false}
                            show_all_options={true}
                            show_topic_selector={true}
                          />
        
              </React.Fragment>

          )
        
  }


  renderImageViewersSelection() {
    const show_save_controls = (this.props.show_save_controls !== undefined) ? this.props.show_save_controls : true
    const show_save_bottom = (this.props.show_save_bottom !== undefined) ? this.props.show_save_bottom : false
    const show_controls_bar = (this.props.show_controls_bar !== undefined) ? this.props.show_controls_bar : true
    const show_constrols_bar_bottom = (this.props.show_constrols_bar_bottom !== undefined) ? this.props.show_constrols_bar_bottom : false
    
     return (
        
        <React.Fragment>

            {(show_controls_bar === true && show_constrols_bar_bottom === false) ?
               this.renderControlBar()
            : null }      

            {(show_controls_bar === true && show_constrols_bar_bottom === false) ?
              <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
            : null }              
         
              
                {(show_save_controls === true && show_save_bottom === false) ?
                 this.renderSaveData()
              : null }

              {(show_save_controls === true && show_save_bottom === false) ?
                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
              : null }

              {this.renderImageWindows()}



              {(show_save_controls === true && show_save_bottom === true) ?
                this.renderSaveData()
            : null }


            {(show_save_controls === true && show_save_bottom === true && show_controls_bar === true && show_constrols_bar_bottom === true) ?
              <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
            : null }              


            {(show_controls_bar === true && show_constrols_bar_bottom === true) ?
               this.renderControlBar()
            : null }        

          </React.Fragment>

      )

  }





  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    
    if (make_section === false){
      return (
          <React.Fragment>
 
            {this.renderImageViewersSelection()}    
               

          </React.Fragment>
      )
    }
    else {
      return (

      <Section>

            {this.renderImageViewersSelection()} 

      </Section>
      )

    }
  }

}

export default NepiIFImageViewersSelector
