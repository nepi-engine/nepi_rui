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

//import moment from "moment"
import { observer, inject } from "mobx-react"

//import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import Section from "./Section"
//import EnableAdjustment from "./EnableAdjustment"
import Button, { ButtonMenu } from "./Button"
import Toggle from "react-toggle"
import Label from "./Label"
import RangeAdjustment from "./RangeAdjustment"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
import Select, { Option } from "./Select"

import ImageViewer from "./Nepi_IF_ImageViewer"
import {  onChangeSwitchStateValue } from "./Utilities"

import {createShortValuesFromNamespaces} from "./Utilities"

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}


@inject("ros")
@observer
class ImageViewerSelector extends Component {
  constructor(props) {
    super(props)

    this.state = {


      hide_list: true,

      image_topics: [],
      image_topics_names: [],
      filter_list: [],
      id: '0',
      selected_image: (this.props.image_topic != undefined) ? this.props.image_topic : 'None',
      selected_image_index: -1,
      selected_image_text: (this.props.title != undefined) ? this.props.title : 'None',

      connected: true
    }
    this.renderImageViewerSelector = this.renderImageViewerSelector.bind(this)
    this.renderButtonControls = this.renderButtonControls.bind(this)
  
    this.getListMenu = this.getListMenu.bind(this)
    this.toggleViewableList = this.toggleViewableList.bind(this)
    this.onToggleListSelection = this.onToggleListSelection.bind(this)

  }



  toggleViewableList() {
    const show_list = ((this.state.hide_list === true) && (this.state.connected === true))
    if (show_list === false){
      this.setState({hide_list: !show_list,
        selected_image: 'None',
      })
    }
    else {
      this.setState({hide_list: !show_list
      })

    }
  }


  // Function for creating list menu options.
  getListMenu() {
    // Update Class List
    const image_topics = (this.props.image_topics != undefined) ? this.props.image_topics : this.props.ros.imageTopics
    const image_exclude_filters = (this.props.image_exclude_filters != undefined) ? this.props.image_exclude_filters : []
    const image_include_filters = (this.props.image_include_filters != undefined) ? this.props.image_include_filters : []
    var images = image_topics  
    var items = []
    var push_item = true
    var image = ''
    if (images.length > 0){
      for (var i = 0; i < images.length; i++) {
        image = images[i]
        push_item = true
        for (var i2 = 0; i2 < image_exclude_filters.length; i2++) {
          if (image.indexOf(image_exclude_filters[i2]) !== -1 ){
            push_item = false
          }
        }
        for (var i2 = 0; i2 < image_exclude_filters.length; i2++) {
          if (image.indexOf(image_include_filters[i2]) === -1 ){
            push_item = false
          }
        }

        if (push_item === true){
          items.push(image)
        }
      }
    }

    const item_names = createShortValuesFromNamespaces(items)
    var sorted_names = item_names.slice()
    sorted_names.sort()
    var sorted_items = []
    var sorted_index = 0
    if (sorted_names.length > 0){
      for (var i = 0; i < sorted_names.length; i++) {
      
        sorted_index = item_names.indexOf(sorted_names[i])
        sorted_items.push(items[sorted_index])
        
      }
    }

    // Update Class Variables
    const id = this.props.id
    //var selected_image = this.props.image_topic != undefined ? this.props.image_topic : this.state.selected_image
    var selected_image = this.state.selected_image

    const class_id = this.state.id
    if ((id === class_id) || (selected_image === 'None')){
      if ((selected_image === 'None') && (this.props.image_topic != undefined)) {
        selected_image = this.props.image_topic
      } 
      var selected_ind = this.state.selected_image_index
      var selected_text = this.state.selected_image_text
      const names = createShortValuesFromNamespaces(sorted_items)
      var index = 0
      var index_changed = false
      var index_name = ''
      var index_name_changed = false
      var updated_image = null
      const image_topics = this.state.image_topics
      if (JSON.stringify(image_topics) !== JSON.stringify(sorted_items)) {
        index = sorted_items.indexOf(selected_image)
        if (selected_ind !== index || selected_text !== names[index]) {
          this.setState({
            id: id,
            selected_image_index: index,
            selected_image_text: names[index]})
          }      
        this.setState({image_topics: sorted_items, image_topics_names: names})
      
      }

      if (sorted_items.indexOf(selected_image) === -1 ) {
        if (sorted_items.length > 0) {
          this.setState({id: id,
                        selected_image: sorted_items[0],
                        selected_image_index: 0,
                        selected_image_text: names[0]})
          updated_image = selected_image
        }
        else {
          this.setState({
            id: id,
            selected_image: 'None',
            selected_image_index: -1,
            selected_image_text: 'None'})
          updated_image = selected_image
        }
        
      }
      else {
        index = sorted_items.indexOf(selected_image)
        index_changed = (selected_ind !== index) 
        index_name = names[index]
        index_name_changed = (selected_text !== index_name)
        if ( index_changed || index_name_changed ) {
          this.setState({
            id: id,
            selected_image_index: index,
            selected_image_text: index_name})
          updated_image = selected_image
          }
          
      }

      const {sendStringMsg} = this.props.ros
      const select_updated_namespace = this.props.select_updated_namespace ? this.props.select_updated_namespace : null
      if ((select_updated_namespace != null) && (updated_image != null)){
        sendStringMsg(select_updated_namespace,updated_image)
      }
    }




    // Create Menu List
    var menu_items = []
    if (sorted_items.length > 0){
      for (var i = 0; i < sorted_items.length; i++) {
        if (image_exclude_filters.indexOf(sorted_items[i]) === -1 ){
          menu_items.push(<Option value={sorted_items[i]}>{sorted_names[i]}</Option>)
        }
      }
    }
    if (menu_items.length == 0){
      menu_items.push(<Option value={'None'}>{'None'}</Option>)
    }




    return menu_items

  }



  onToggleListSelection(event){
    const id = this.props.id
    const image = event.target.value
    const text = event.target.text
    const image_topics = this.state.image_topics
    const index = image_topics.indexOf(image)
    const {sendStringMsg} = this.props.ros
    const select_updated_namespace = (this.props.select_updated_namespace != undefined) ? this.props.select_updated_namespace : null
    if (select_updated_namespace != null){
      sendStringMsg(select_updated_namespace,image)
    }
    this.setState({id: id,
                    selected_image: image,
                    selected_image_index: index,
                  selected_image_text: text})
    this.setState({hide_list: true})

  }

  renderImageViewerSelector() {
    const hide_list = ((this.state.hide_list === true) || (this.state.connected === false))
    const menu_options = this.getListMenu()
    const selected_item = this.state.selected_image
    const selected_name = this.state.selected_name
    const active_list = []


    const show_selector = this.props.show_selector != undefined ? this.props.show_selector : true
    const show_buttons = this.props.show_buttons != undefined ? this.props.show_buttons : true
    const show_controls = (menu_options.length > 0) && (show_selector === true )
    return (
      <React.Fragment>

          {show_controls === true ?

                <Columns>
                  <Column>
                  
                  <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                    <div onClick={this.toggleViewableList} style={{backgroundColor: Styles.vars.colors.grey0}}>
                      <Select style={{width: "10px"}}/>
                    </div>

                    <div hidden={hide_list}>
                        {menu_options.map((list) =>
                        <div onClick={this.onToggleListSelection}
                          style={{
                            textAlign: "center",
                            padding: `${Styles.vars.spacing.xs}`,
                            color: Styles.vars.colors.black,
                            backgroundColor: (list.props.value === selected_item) ?
                              Styles.vars.colors.green :
                              (active_list.includes(list.props.value)) ? Styles.vars.colors.blue : Styles.vars.colors.grey0,
                            cursor: "pointer",
                            }}>
                            <body list-topic ={list} style={{color: Styles.vars.colors.black}}>{list}</body>
                        </div>
                        )}
                    </div>

                </Column>
                </Columns>
              :
                null
        }

      </React.Fragment>

    )
  }



  stepItem(step){
    const image_topics = this.state.image_topics
    const image_topics_names = this.state.image_topics_names
    var index = this.state.selected_image_index
    index = index + step
    if (index < 0){
      index = image_topics.length - 1
    }
    else if ( index >= image_topics.length ){
      index = 0
    }

    this.setState({selected_image_index: index,
                 selected_image: image_topics[index],
                 selected_image_text: image_topics_names[index]})
    this.setState({hide_list: true})

  }

  renderButtonControls() {
    const { sendTriggerMsg } = this.props.ros
    const image_topics = this.state.image_topics
    


    const show_selector = this.props.show_selector != undefined ? this.props.show_selector : true
    const show_buttons = this.props.show_buttons != undefined ? this.props.show_buttons : true
    const show_controls = (image_topics.length > 0) && (show_buttons === true )
    return (
      <React.Fragment>

          {show_controls === true ?
                <ButtonMenu>

                      <Button 
                        buttonUpAction={() => this.stepItem(-1)}>
                        {'\u25C0'}
                        </Button>
                      <Button 
                        buttonUpAction={() => this.stepItem(1)}>
                        {'\u25B6'}
                      </Button>
                  
                </ButtonMenu>
                :
                null

          }
      
      </React.Fragment>
    )
  }
  

  renderImageViewer() {

    const image_topic = this.state.selected_image
    const title = this.state.selected_image_text
    
    const image_index = (this.props.image_index != undefined) ? this.props.image_index : 0
    const selection_callback = (this.props.selection_callback != undefined) ? this.props.selection_callback : [null,null,null,null]
    const mouse_event_callback = (this.props.mouse_event_callback != undefined) ? this.props.mouse_event_callback : null

    const streamingImageQuality = (this.props.streamingImageQuality != undefined) ? 
                (this.props.streamingImageQuality != null) ? this.props.streamingImageQuality : null
                : null
    const show_image_controls = (this.props.show_image_controls !== undefined)? this.props.show_image_controls : true
    const show_save_controls = (this.props.show_save_controls != undefined) ? this.props.show_save_controls : true
    const save_data_topic = this.props.save_data_topic
    
    return (

      <ImageViewer
      id="imageViewer"
      image_topic={image_topic}
      title={title}
      image_index={image_index}
      mouse_event_callback={mouse_event_callback}
      selection_callback={selection_callback}
      show_image_controls={show_image_controls}
      show_save_controls={show_save_controls}
      save_data_topic={save_data_topic}
      make_section={false}
      streamingImageQuality={streamingImageQuality}

    />


    )
  }



  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const hide_image = this.state.hide_list === false


    if (make_section === false){
      return (
        <Columns>
        <Column>

        <div style={{ display: 'flex' }}>
              <div style={{ width: '30%' }}>
                {this.renderImageViewerSelector()}
              </div>

                <div style={{ width: '50%' }}>
                  {}
                </div>
                
                <div style={{ width: '20%' }} hidden={hide_image}>
                  {this.renderButtonControls()}
                </div>
        </div>


        <div  hidden={hide_image}>
          {this.renderImageViewer()}
        </div>
        </Column>
        </Columns>
      )
    }
    else {
      return (

      <Section>

          <div style={{ display: 'flex' }}>
              <div style={{ width: '30%' }}>
                {this.renderImageViewerSelector()}
              </div>

                <div style={{ width: '50%' }}>
                  {}
                </div>

                <div style={{ width: '20%' }}>
                  {this.renderButtonControls()}
                </div>
        </div>
        {this.renderImageViewer()}

      </Section>
      )

    }
  }

}

export default ImageViewerSelector
