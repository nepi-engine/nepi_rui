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
import Label from "./Label"
import Select, { Option } from "./Select"
import Button, { ButtonMenu } from "./Button"
import Styles from "./Styles"
import Toggle from "react-toggle"

import ImageViewerSelector from "./NepiSelectorImageViewer"
import NepiIFConfig from "./Nepi_IF_Config"
import NepiIFSaveData from "./Nepi_IF_SaveData"

import {createShortValuesFromNamespaces, onChangeSwitchStateValue} from "./Utilities"

@inject("ros")
@observer

// MultiImageViewer 
class ImageViewersSelector extends Component {

  constructor(props) {
    super(props)

    this.state = {

      topics: ['None','None','None','None'],
      num_windows: 1,

      needs_update: false,

      show_selectors: false
    }

    this.renderImageControls = this.renderImageControls.bind(this)
    this.renderImageWindows = this.renderImageWindows.bind(this)
    this.setNumWindows = this.setNumWindows.bind(this)
    
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
      const {sendIntMsg} = this.props.ros
      const num_windows_namespace = (this.props.num_windows_namespace != undefined) ? this.props.num_windows_namespace : null
      if (num_windows_namespace != null){
        this.setState({num_windows: num_windows})
      }
      else {
        sendIntMsg( num_windows_namespace,num_windows)
      }
  }


  renderImageControls() {
    if (this.state.needs_update === true){
      this.setState({needs_update: false})
    }


    const show_controls = this.props.show_controls != undefined ? this.props.show_controls : true
    const show_selectors_control = this.props.show_selectors_control != undefined ? this.props.show_selectors_control : true
    return (
      <React.Fragment>

          {show_controls === true ?

                <Columns>
                  <Column>
                  
              
    
                <div style={{ display: 'flex' }}>

                      <div style={{ width: '5%' }}>
                        {}
                      </div>

                      <div style={{ width: '10%' }} align={"center"} >
                        <ButtonMenu>
                          <Button onClick={() => this.setNumWindows(1)}>{"1 Window"}</Button>
                        </ButtonMenu>
                      </div>

                      <div style={{ width: '5%' }}>
                        {}
                      </div>

                      <div style={{ width: '10%' }} align={"center"} >
                        <ButtonMenu>
                          <Button onClick={() => this.setNumWindows(2)}>{"2 Windows"}</Button>
                        </ButtonMenu>
                      </div>

                      <div style={{ width: '5' }}>
                        {}
                      </div>

                      <div style={{ width: '10%' }} align={"center"} >
                        <ButtonMenu>
                          <Button onClick={() => this.setNumWindows(3)}>{"3 Windows"}</Button>
                        </ButtonMenu>
                      </div>

                      <div style={{ width: '5%' }}>
                        {}
                      </div>
      
                      <div style={{ width: '10%' }} align={"center"} >
                        <ButtonMenu>
                          <Button onClick={() => this.setNumWindows(4)}>{"4 Windows"}</Button>
                        </ButtonMenu>
                      </div>

                      <div style={{ width: '5%' }}>
                        {}
                      </div>

                      <div style={{ width: '10%' }} hidden={show_selectors_control === false}>

                        <Label title="Show Selectors">
                          <Toggle
                            checked={this.state.show_selectors===true}
                            onClick={() => onChangeSwitchStateValue.bind(this)("show_selectors",this.state.show_selectors)}>
                          </Toggle>
                      </Label>

                    </div>

                      <div style={{ width: '25%' }}>
                        {}
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

    const num_windows = (this.props.num_windows != undefined) ? this.props.num_windows : this.state.num_windows
    const topics = (this.props.ImageTopics != undefined) ? this.props.ImageTopics : [null,null,null,null]
    const topics_text = (this.props.topics_text != undefined) ? this.props.topics_text : [null,null,null,null]
    const image_filters = (this.props.image_filters != undefined) ? this.props.image_filters : []
    const select_updated_namespaces = (this.props.select_updated_namespaces != undefined) ? this.props.select_updated_namespaces : [null,null,null,null]
    const show_image_controls = (this.props.show_image_controls != undefined) ? this.props.show_image_controls : false
    const show_save_controls = (this.props.show_save_controls != undefined) ? this.props.show_save_controls : true

    const mouse_event_topic = (this.props.mouse_event_topic != undefined) ? this.props.mouse_event_topic : ''
    const image_selection_topic = (this.props.image_selection_topic != undefined) ? this.props.image_selection_topic : ''

    const streamingImageQuality = (num_windows > 1) ? 50 : 95
    const has_col_2 = (num_windows > 1) ? true : false
    const colFlexSize_1 = (has_col_2 === false)? "100%" : "50%"
    const colFlexSize_2 = (has_col_2 === false)? "0%" : "50%"
    
    const show_selectors = this.state.show_selectors
    
  
      return (
     

              <div style={{ display: 'flex' }}>
            
                  <div style={{ width: colFlexSize_1 }}>
                        <div id="Image1Viewer">
                          <ImageViewerSelector
                            id="Image1Viewer"
                            imageTopic={topics[0]}
                            title={topics_text[0]}
                            show_image_options={show_image_controls}
                            select_updated_namespace={select_updated_namespaces[0]}
                            streamingImageQuality={streamingImageQuality}
                            image_filters={image_filters}
                            show_selector={show_selectors}
                            show_buttons={show_selectors}
                            mouse_event_topic={mouse_event_topic}
                            image_selection_topic={image_selection_topic}
                            make_section={false}
                            show_save_controls={show_save_controls}
                          />
                        </div>

                        {(num_windows > 2)?
                          <div id="Image3Viewer">
                            <ImageViewerSelector
                              id="Image3Viewer"
                              imageTopic={topics[2]}
                              title={topics_text[2]}
                              show_image_options={show_image_controls}
                              select_updated_namespace={select_updated_namespaces[2]}
                              streamingImageQuality={streamingImageQuality}
                              image_filters={image_filters}
                              show_selector={show_selectors}
                              show_buttons={show_selectors}
                              make_section={false}
                              show_save_controls={show_save_controls}
                            />
                          </div>        
                        : null
                        }
                  </div>


                  <div style={{ width: colFlexSize_2 }}>

                        {(num_windows > 1)?
                          <div id="Image2Viewer">
                            <ImageViewerSelector
                              id="Image2Viewer"
                              imageTopic={topics[1]}
                              title={topics_text[1]}
                              show_image_options={show_image_controls}
                              select_updated_namespace={select_updated_namespaces[1]}
                              streamingImageQuality={streamingImageQuality}
                              image_filters={image_filters}
                            show_selector={show_selectors}
                            show_buttons={show_selectors}
                             make_section={false}
                             show_save_controls={show_save_controls}
                            />
                          </div>          
                        : null
                        }

                        {(num_windows === 4)?
                          <div id="Image4Viewer">
                            <ImageViewerSelector
                              id="Image4Viewer"
                              imageTopic={topics[3]}
                              title={topics_text[3]}
                              show_image_options={show_image_controls}
                              select_updated_namespace={select_updated_namespaces[3]}
                              streamingImageQuality={streamingImageQuality}
                              image_filters={image_filters}
                            show_selector={show_selectors}
                            show_buttons={show_selectors}
                             make_section={false}
                             show_save_controls={show_save_controls}
                            />
                          </div>          
                        : null
                        }
                  </div>
   
          </div> 

      )
    
  }




  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const hide_image = this.state.hide_list === false


    if (make_section === false){
      return (
        <Columns>
        <Column>
              {this.renderImageControls()}

            {this.renderImageWindows()}

        </Column>
        </Columns>
      )
    }
    else {
      return (

      <Section>

              {this.renderImageControls()}

            {this.renderImageWindows()}

      </Section>
      )

    }
  }

}

export default ImageViewersSelector
