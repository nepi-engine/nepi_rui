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
//import Styles from "./Styles"
import Label from "./Label"
import Toggle from "react-toggle"

import {onChangeSwitchStateValue} from "./Utilities"

import ImageViewerSelector from "./NepiSelectorImageViewer"
import NepiIFSaveData from "./Nepi_IF_SaveData"



@inject("ros")
@observer

// MultiImageViewer 
class ImageViewersSelector extends Component {

  constructor(props) {
    super(props)

    this.state = {

      image_topics: ['None','None','None','None'],
      num_windows: 1,

      needs_update: false,

      show_image_controls: false,
      show_selectors: true
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

      this.setState({num_windows: num_windows})

      const {sendIntMsg} = this.props.ros
      const num_windows_namespace = (this.props.num_windows_namespace !== undefined) ? this.props.num_windows_namespace : null
      if (num_windows_namespace != null){
          sendIntMsg( num_windows_namespace,num_windows)
      }

  }


  renderImageControls() {
    if (this.state.needs_update === true){
      this.setState({needs_update: false})
    }

    const show_controls_bar = (this.props.show_controls_bar !== undefined) ? this.props.show_controls_bar : true
    const show_image_controls_option = (this.props.show_image_controls === undefined)
    const show_image_controls = (this.props.show_image_controls !== undefined) ? this.props.show_image_controls : this.state.show_image_controls
    const show_selectors_option = (this.props.show_selectors === undefined)
    const show_selectors = (this.props.show_selectors !== undefined) ? this.props.show_selectors: this.state.show_selectors
    return (
      <React.Fragment>

          {show_controls_bar === true ?

                <Columns>
                  <Column>
                  
              
    
                <div style={{ display: 'flex' }}>

                      <div style={{ width: '5%' }}>
                        {}
                      </div>

                      <div style={{ width: '10%' }} centered={"true"} >
                        <ButtonMenu>
                          <Button onClick={() => this.setNumWindows(1)}>{"1 Window"}</Button>
                        </ButtonMenu>
                      </div>

                      <div style={{ width: '5%' }}>
                        {}
                      </div>

                      <div style={{ width: '10%' }} centered={"true"} >
                        <ButtonMenu>
                          <Button onClick={() => this.setNumWindows(2)}>{"2 Windows"}</Button>
                        </ButtonMenu>
                      </div>

                      <div style={{ width: '5' }}>
                        {}
                      </div>

                      <div style={{ width: '10%' }} centered={"true"} >
                        <ButtonMenu>
                          <Button onClick={() => this.setNumWindows(3)}>{"3 Windows"}</Button>
                        </ButtonMenu>
                      </div>

                      <div style={{ width: '5%' }}>
                        {}
                      </div>
      
                      <div style={{ width: '10%' }} centered={"true"} >
                        <ButtonMenu>
                          <Button onClick={() => this.setNumWindows(4)}>{"4 Windows"}</Button>
                        </ButtonMenu>
                      </div>

                      <div style={{ width: '5%' }}>
                        {}
                      </div>

                      <div style={{ width: '10%' }} centered={"true"} hidden={show_image_controls_option === false}>

                        <Label title="Show Controls">
                          <Toggle
                            checked={this.show_image_controls===true}
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
                            checked={this.show_selectors===true}
                            onClick={() => onChangeSwitchStateValue.bind(this)("show_selectors",show_selectors)}>
                          </Toggle>
                      </Label>

                    </div>


                      <div style={{ width: '10%' }}>
                        {}                      </div>
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
    const image_topics = (this.props.image_topics !== undefined) ? this.props.image_topics : [null,null,null,null]
    const titles = (this.props.titles !== undefined) ? this.props.titles : [null,null,null,null]
    const exclude_filters = (this.props.exclude_filters !== undefined) ? this.props.exclude_filters : []
    const include_filters = (this.props.include_filters !== undefined) ? this.props.include_filters : []
    const selection_callback = (this.props.selection_callback !== undefined) ? this.props.selection_callback : [null,null,null,null]
    const mouse_event_topic = (this.props.mouse_event_topic !== undefined) ? this.props.mouse_event_topic : null


    const show_image_controls = (this.props.show_image_controls !== undefined) ? this.props.show_image_controls : this.state.show_image_controls
    const show_selectors = (this.props.show_selectors !== undefined) ? this.props.show_selectors: this.state.show_selectors

    const streamingImageQuality = (num_windows > 1) ? 50 : 95
    const has_col_2 = (num_windows > 1) ? true : false
    const colFlexSize_1 = (has_col_2 === false)? "100%" : "49%"
    const colFlexSize_gap = (has_col_2 === false)? "0%" : "2%"
    const colFlexSize_2 = (has_col_2 === false)? "0%" : "49%"
    
    
  
      return (
     

              <div style={{ display: 'flex' }}>
            
                  <div style={{ width: colFlexSize_1 }}>
                        <div id="Image1Viewer">
                          <ImageViewerSelector
                            id="Image1Viewer"
                            image_topic={image_topics[0]}
                            title={titles[0]}
                            streamingImageQuality={streamingImageQuality}
                            exclude_filters={exclude_filters}
                            include_filters={include_filters}
                            show_image_controls={show_image_controls}
                            show_selector={show_selectors}
                            show_buttons={show_selectors}
                            mouse_event_topic={mouse_event_topic}
                            selection_callback={selection_callback[0]}
                            make_section={false}
                            show_save_controls={false}
                          />
                        </div>

                        {(num_windows > 2)?
                          <div id="Image3Viewer">
                            <ImageViewerSelector
                              id="Image3Viewer"
                              image_topic={image_topics[2]}
                              title={titles[2]}
                              streamingImageQuality={streamingImageQuality}
                              exclude_filters={exclude_filters}
                              include_filters={include_filters}
                              show_image_controls={show_image_controls}
                              show_selector={show_selectors}
                              show_buttons={show_selectors}
                              mouse_event_topic={mouse_event_topic}
                              selection_callback={selection_callback[0]}
                              make_section={false}
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

                        {(num_windows > 1)?
                          <div id="Image2Viewer">
                            <ImageViewerSelector
                              id="Image2Viewer"
                              image_topic={image_topics[1]}
                              title={titles[1]}
                              streamingImageQuality={streamingImageQuality}
                              exclude_filters={exclude_filters}
                              include_filters={include_filters}
                              show_image_controls={show_image_controls}
                              show_selector={show_selectors}
                              show_buttons={show_selectors}
                              mouse_event_topic={mouse_event_topic}
                              selection_callback={selection_callback[0]}
                             make_section={false}
                             show_save_controls={false}
                            />
                          </div>          
                        : null
                        }

                        {(num_windows === 4)?
                          <div id="Image4Viewer">
                            <ImageViewerSelector
                              id="Image4Viewer"
                              image_topic={image_topics[3]}
                              streamingImageQuality={streamingImageQuality}
                              exclude_filters={exclude_filters}
                              include_filters={include_filters}
                              show_image_controls={show_image_controls}
                              show_selector={show_selectors}
                              show_buttons={show_selectors}
                              mouse_event_topic={mouse_event_topic}
                              selection_callback={selection_callback[0]}
                             make_section={false}
                             show_save_controls={false}
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
    const saveNamespace = (this.props.saveNamespace !== undefined) ? this.props.saveNamespace : null
    const show_save_controls = (this.props.show_save_controls !== undefined) ? this.props.show_save_controls : true

    if (make_section === false){
      return (
        <Columns>
        <Column>
              {this.renderImageControls()}

            {this.renderImageWindows()}

            <div align={"left"} textAlign={"left"} 
            >
                        {(show_save_controls === true) ?
                          <NepiIFSaveData
                          make_section={false}
                          saveNamespace={saveNamespace}
                        />
                      : null }

            </div>

        </Column>
        </Columns>
      )
    }
    else {
      return (

      <Section>

              {this.renderImageControls()}

            {this.renderImageWindows()}

            <div align={"left"} textAlign={"left"} 
            >
                        {(show_save_controls === true) ?
                          <NepiIFSaveData
                          make_section={false}
                        />
                      : null }

            </div>

      </Section>
      )

    }
  }

}

export default ImageViewersSelector
