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


      viewableList: false,

      images_list: [],
      images_list_names: [],
      filter_list: [],
      sel_image: 'None',
      sel_image_index: -1,
      sel_image_text: 'None',

      connected: false
    }
    this.renderImageViewerSelector = this.renderImageViewerSelector.bind(this)
    this.renderButtonControls = this.renderButtonControls.bind(this)
  
    this.getImagesListOptions = this.getImagesListOptions.bind(this)
    this.toggleViewableImages = this.toggleViewableImages.bind(this)
    this.onToggleImageSelection = this.onToggleImageSelection.bind(this)

  }


  toggleViewableImages() {
    const set = !this.state.viewableList
    this.setState({viewableList: set})
    if (set === true){
      this.setState({sel_image: 'None',
        sel_image_index: -1,
        sel_image_text: 'None'})
    }
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
        if (image_filters.indexOf(images[i]) === -1 ){
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
    const sel_ind = this.state.sel_image_index
    const sel_text = this.state.sel_image_text
    if (items.indexOf(sel_image) === -1 && this.state.viewableList === false) {
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
    else {
      const ind = items.indexOf(sel_image)
      if (sel_ind !== ind || sel_text !== names[ind]) {
        this.setState({
          sel_image_index: ind,
          sel_image_text: names[ind]})
        }
    }


    const images_list = this.state.images_list
    if (JSON.stringify(images_list) !== JSON.stringify(items)) {
      
      this.setState({images_list: items, images_list_names: item_names})
    }

    return menu_items
  }



  onToggleImageSelection(event){
    const image = event.target.value
    const text = event.target.text
    const images_list = this.state.images_list
    const index = images_list.indexOf(image)
    this.setState({sel_image: image,
                    sel_image_index: index,
                  sel_image_text: text})
    this.setState({viewableList: false})

  }

  renderImageViewerSelector() {
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
          <div hidden={hide_images_list}>
          {image_options.map((image) =>
          <div onClick={this.onToggleImageSelection}
            style={{
              textAlign: "center",
              padding: `${Styles.vars.spacing.xs}`,
              color: Styles.vars.colors.black,
              backgroundColor: (image.props.value !== sel_image) ?
                Styles.vars.colors.white :
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



  stepItem(step){
    const images_list = this.state.images_list
    const images_list_names = this.state.images_list_names
    var index = this.state.sel_img_index
    index = index + step
    if (index < 0){
      index = images_list.length - 1
    }
    else if ( index >= images_list.length ){
      index = 0
    }

    this.setState({sel_image_index: index,
                 sel_image: images_list[index],
                 sel_image_text: images_list_names[index]})
    this.setState({viewableList: false})

  }

  renderButtonControls() {
    const { sendTriggerMsg } = this.props.ros

    return (
      <React.Fragment>

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
      
      </React.Fragment>
    )
  }
  

  renderImageViewer() {

    const imageTopic = this.state.sel_image
    const title = this.props.title ? this.props.title : this.state.sel_image_text
    const show_image_options = (this.props.show_image_options !== undefined)? this.props.show_image_options : true
    const navpose_namespace = this.props.navpose_namespace ? this.props.navpose_namespace : imageTopic  + "/navpose"
    
    
    return (

      <ImageViewer
      id="imageViewer"
      imageTopic={imageTopic}
      title={title}
      show_image_options={show_image_options}
      navpose_namespace={navpose_namespace}
      make_section={false}
    />


    )
  }



  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true

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

                <div style={{ width: '20%' }}>
                  {this.renderButtonControls()}
                </div>
        </div>



        {this.renderImageViewer()}
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
