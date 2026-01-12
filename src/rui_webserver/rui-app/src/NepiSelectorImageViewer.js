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

      images_list: [],
      images_list_names: [],
      filter_list: [],
      selected_image: 'None',
      selected_image_index: -1,
      selected_image_text: 'None',

      connected: true
    }
    this.renderImageViewerSelector = this.renderImageViewerSelector.bind(this)
    this.renderButtonControls = this.renderButtonControls.bind(this)
  
    this.getListMenu = this.getListMenu.bind(this)
    this.toggleViewableList = this.toggleViewableList.bind(this)
    this.onToggleListSelection = this.onToggleListSelection.bind(this)

  }


  toggleViewableList() {
    const show_list = (this.state.hide_list === true && this.state.connected === true)
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
    const imageTopics = this.props.images_list ? this.props.images_list : this.props.ros.imageTopics
    const image_filters = this.props.image_filters ? this.props.image_filters : []
    const image_options = this.props.image
    var images = imageTopics  
    var items = []
    
    if (images.length > 0){
      for (var i = 0; i < images.length; i++) {
        if (image_filters.indexOf(images[i]) === -1 ){
          items.push(images[i])

        }
     }
    }

    // Update Class Variables
    var selected_image = this.state.selected_image
    var selected_ind = this.state.selected_image_index
    var selected_text = this.state.selected_image_text
    const names = createShortValuesFromNamespaces(items)

    const images_list = this.state.images_list
    if (JSON.stringify(images_list) !== JSON.stringify(items)) {
      const ind = items.indexOf(selected_image)
      if (selected_ind !== ind || selected_text !== names[ind]) {
        this.setState({
          selected_image_index: ind,
          selected_image_text: names[ind]})
        }      
      this.setState({images_list: items, images_list_names: names})
    }

    if (items.indexOf(selected_image) === -1 ) {
      if (items.length > 0) {
        this.setState({selected_image: items[0],
                       selected_image_index: 0,
                      selected_image_text: names[0]})
      }
      else {
        this.setState({selected_image: 'None',
          selected_image_index: -1,
          selected_image_text: 'None'})
      }
    }
    else {
      const ind = items.indexOf(selected_image)
      if (selected_ind !== ind || selected_text !== names[ind]) {
        this.setState({
          selected_image_index: ind,
          selected_image_text: names[ind]})
        }
    }


    // Create Menu List
    var menu_items = []
    const item_names = createShortValuesFromNamespaces(items)
         
    if (items.length > 0){
      for (var i = 0; i < items.length; i++) {
        if (image_filters.indexOf(items[i]) === -1 ){
          menu_items.push(<Option value={items[i]}>{item_names[i]}</Option>)
        }
      }
    }
    if (menu_items.length == 0){
      menu_items.push(<Option value={'None'}>{'None'}</Option>)
    }

    return menu_items

  }



  onToggleListSelection(event){
    const image = event.target.value
    const text = event.target.text
    const images_list = this.state.images_list
    const index = images_list.indexOf(image)
    this.setState({selected_image: image,
                    selected_image_index: index,
                  selected_image_text: text})
    this.setState({hide_list: true})

  }

  renderImageViewerSelector() {
    const hide_list = (this.state.hide_list === true || this.state.connected === false)
    const menu_options = this.getListMenu()
    const selected_item = this.state.selected_image
    const selected_name = this.state.selected_name
    const active_list = []

    const show_controls = menu_options.length > 0
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
    const images_list = this.state.images_list
    const images_list_names = this.state.images_list_names
    var index = this.state.selected_image_index
    index = index + step
    if (index < 0){
      index = images_list.length - 1
    }
    else if ( index >= images_list.length ){
      index = 0
    }

    this.setState({selected_image_index: index,
                 selected_image: images_list[index],
                 selected_image_text: images_list_names[index]})
    this.setState({hide_list: true})

  }

  renderButtonControls() {
    const { sendTriggerMsg } = this.props.ros
    const images_list = this.state.images_list
    const show_controls = images_list.length > 0
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

    const imageTopic = this.state.selected_image
    const title = this.state.selected_image_text
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
