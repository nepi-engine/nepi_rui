/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
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
import { SliderAdjustment} from "./AdjustmentWidgets"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
import Input from "./Input"

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


      viewableList: false,

      images_list: [],
      images_list_names: [],
      filter_list: [],
      sel_image: 'None',
      sel_image_index: -1,
      sel_image_text: 'None',

      connected: false
    }
    this.renderImageViewerSelection = this.renderImageViewerSelection.bind(this)
  
    this.getImagesListOptions = this.getImagesListOptions.bind(this)
    this.toggleViewableImages = this.toggleViewableImages.bind(this)
    this.onToggleImageSelection = this.onToggleImageSelection.bind(this)

  }


  toggleViewableImages() {
    const set = !this.state.viewableList
    this.setState({viewableList: set})
  }

  // Function for creating image topic options.
  getImagesListOptions() {
    const imageTopics = this.props.images_list ? this.props.images_list : this.props.ros.imageTopics

    const image_filters = this.props.image_filters ? this.props.image_filters : []
    const image_options = this.props.image
    var images = imageTopics  
    const names = createShortValuesFromNamespaces(imageTopics)
    var items = []
    var item_names = []
    var menu_items = []
    if (images.length > 0){
      for (var i = 0; i < images.length; i++) {
        if (image_filters.index(images[i]) == -1 ){
          items.push(images[i])
          item_names.push(names[i])
          menu_items.push(<Option value={images[i]}>{names[i]}</Option>)
        }
     }
    }
    if (menu_items.length == 0){
      menu_items.push(<Option value={'None'}>{'None'}</Option>)
    }

    const sel_image = this.state.sel_image
    if (items.index(sel_image) == -1 ) {
      if (items.length > 0) {
        this.setState({sel_image: items[0],
                       sel_image_index: 0,
                      sel_image_text: item_names[0]})
      }
      else {
        this.setState({sel_image: 'None',
          sel_image_index: -1,
          sel_image_text: 'None'})
      }
    }

    
    const images_list = this.state.images_list
    if (images_list !== items) {
      
      this.setState({images_list: items, images_list_names: item_names})
    }

    return menu_items
  }



  onToggleImageSelection(event){
    const image = event.target.value
    const text = event.target.text
    const images_list = this.state.images_list
    const index = images_list.index(image)
    this.setState({sel_image: image,
                    sel_image_index: index,
                  sel_image_text: text})

  }

  renderImageViewerSelection() {
    const sel_image = this.state.sel_image
    const image_options = this.getImagesListOptions()
    const images_list = this.state.images_list
    const hide_images_list = !this.state.viewableList && !this.state.connected
    return (


       <Columns>
        <Column>
        <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

          <div onClick={this.toggleViewableImages} style={{backgroundColor: Styles.vars.colors.grey0}}>
            <Select style={{width: "10px"}}/>
          </div>
          <div hidden={hide_images_images}>
          {image_options.map((image) =>
          <div onClick={this.onToggleImageSelection}
            style={{
              textAlign: "center",
              padding: `${Styles.vars.spacing.xs}`,
              color: Styles.vars.colors.black,
              backgroundColor: (image.props.value === sel_image) ?
                Styles.vars.colors.green :
                (images_list.includes(image.props.value)) ? Styles.vars.colors.blue : Styles.vars.colors.grey0,
              cursor: "pointer",
              }}>
              <body image-topic ={image} style={{color: Styles.vars.colors.black}}>{image}</body>
          </div>
          )}
          </div>

        </Column>
      </Columns>

    )
  }




  renderImageViewerSelection() {

    const namespace = this.state.sel_image
    const image_text = this.props.title ? this.props.title : this.state.sel_image_text

    const { sendTriggerMsg } = this.props.ros
    const show_image_options = (this.props.show_image_options !== undefined)? this.props.show_image_options : true
    const show_status = this.state.show_status
    const show_controls = this.state.show_controls
    const show_renders = this.state.show_renders
    const show_navpose = this.state.show_navpose 
    const navpose_namespace = this.props.navpose_namespace ? this.props.navpose_namespace : namespace  + "/navpose"

    const show_image_select = true //this.state.show_image_select

    show_controls: false,
    show_status: false,
    show_renders: false,
    controls_namespace: null,
    has_overlay: false,
    show_overlays: false,
    has_navpose: false,
    show_navpose: false,
    hasInitialized: false,
    shouldUpdate: true,
    streamWidth: null,
    streamHeight: null,
    streamSize: 0,
    currentStreamingImageQuality: COMPRESSION_HIGH_QUALITY,
    status_listenter: null,
    status_msg: null,
    pixel: null,
    mouse_drag: false,

    custom_overlay_input: '',
    
    
    return (


      <ImageViewer
      id="ptxImageViewer"
      imageTopic={this.state.imageTopic}
      title={this.state.imageText}
      show_image_options={false}
    />

              

    )
  }



  render() {
    const show_in_section = (this.props.show_in_section !== undefined)? this.props.show_in_section : true

    if (show_in_section === false){
      return (
        <Columns>
        <Column>
        {this.renderImageViewerSelector()}
        </Column>
        </Columns>
      )
    }
    else {
      return (

      <Section title={this.props.title}>

        {this.renderImageViewerSelector()}

      </Section>
      )

    }
  }

}

export default ImageViewerSelector
