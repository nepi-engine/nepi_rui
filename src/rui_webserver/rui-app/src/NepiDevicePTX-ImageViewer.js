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
import Button, { ButtonMenu } from "./Button"

import { Column, Columns } from "./Columns"
import Styles from "./Styles"


import { SliderAdjustment } from "./AdjustmentWidgets"

import ImageViewer from "./Nepi_IF_ImageViewer"
import NepiIFImageViewerSelector from "./Nepi_IF_ImageViewerSelector"
import NepiIFImageViewersSelector from "./Nepi_IF_ImageViewerSelector"


function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}


@inject("ros")
@observer
class NepiDevicePTXImageViewer extends Component {
  constructor(props) {
    super(props)

    this.state = {

      namespace: null,

      status_msg: null,  
      statusListener: null
    }


    //this.renderImageViewer = this.renderImageViewer.bind(this)

    this.getNamespace = this.getNamespace.bind(this)
    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)
  }


  getNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var namespace = 'None'
    if (namespacePrefix !== null && deviceId !== null){
      if (this.props.namespace != undefined){
        namespace = this.props.namespace
      }
      else{
        namespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.appName
      }
    }
    return namespace
  }

  // Callback for handling ROS Status3DX messages
  statusListener(message) {
    this.setState({
      status_msg: message
    })
  }
  
  // Function for configuring and subscribing to Status
  updateStatusListener() {
    const { namespace } = this.props
    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
       this.setState({ status_msg: null, statusListener: null})
    }
    if (namespace != null && namespace !== 'None'){
        var statusListener = this.props.ros.setupPTXStatusListener(
              namespace,
              this.statusListener
            )
      this.setState({ statusListener: statusListener})
    }
    this.setState({ namespace: namespace})

}
  
// Lifecycle method called when compnent updates.
// Used to track changes in the topic
componentDidUpdate(prevProps, prevState, snapshot) {
  const { namespace } = this.props
   if (namespace !== this.state.namespace){
      this.updateStatusListener()
  }
}

  componentDidMount() {
    this.updateStatusListener()
    }



  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status3DX message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
      this.setState({statusListener : null})
    }
  }




  render() {
    const { ptxDevices, onPTXJogPan, onPTXJogTilt, onPTXStop } = this.props.ros
    const namespace = (this.props.namespace !== null) ? this.props.namespace : 'None'
    const status_msg = this.state.status_msg

    const use_images_selector = (this.props.use_images_selector != undefined) ? this.props.use_images_selector : false 
    const show_save_controls = (this.props.show_save_controls != undefined) ? this.props.show_save_controls : false
    const show_image_controls = (this.props.show_image_controls != undefined) ? this.props.show_image_controls : false
    const mouse_event_topic = (this.props.mouse_event_topic !== undefined) ? this.props.mouse_event_topic : null



    var panGoalRatio = 0.5
    var tiltGoalRatio = 0.5
    if (status_msg != null){
      panGoalRatio = status_msg.pan_goal_ratio
      tiltGoalRatio = status_msg.tilt_goal_ratio
    }
   

    const ptxDevicesList = Object.keys(ptxDevices)
    var has_abs_pos = false
    var has_timed_pos = false
    if (ptxDevicesList.indexOf(namespace) !== -1){
      const ptx_caps = ptxDevices[namespace]
      has_abs_pos = ptx_caps && (ptx_caps.has_absolute_positioning === true)
      has_timed_pos = ptx_caps && (ptx_caps.has_timed_positioning === true)
    }

    const ptxImageViewerElement = document.getElementById("ptxImageViewer")
    const tiltSliderHeight = (ptxImageViewerElement)? Math.floor(ptxImageViewerElement.offsetHeight * 0.8) : 1
    const show_pt_controls = (tiltSliderHeight === 1) ? false : (has_abs_pos === true)


    return (

        <React.Fragment >

        <Columns>
          <Column equalWidth = {false} >        

          <div id={'ptxImageViewer'}>

            {(use_images_selector === true) ?
              <NepiIFImageViewersSelector
                
                hideQualitySelector={true}
                show_save_controls={show_save_controls}
                show_image_controls={show_image_controls}
                mouse_event_topic={mouse_event_topic}
              />
              : 
                  <NepiIFImageViewerSelector
                    id={'ptxImageViewer'}
                    hideQualitySelector={true}
                    show_save_controls={show_save_controls}
                    show_image_controls={show_image_controls}
                    mouse_event_topic={mouse_event_topic}

                  />
            }

        </div>

          </Column>
          <Column style={{flex: 0.05}}>

           <div hidden={show_pt_controls === false}>

            <SliderAdjustment
              title={"Tilt"}
              msgType={"std_msgs/Float32"}
              adjustment={tiltGoalRatio}
              topic={namespace + "/goto_tilt_ratio"}
              scaled={0.01}
              min={0}
              max={100}
              tooltip={"Tilt as a percentage (0%=min, 100%=max)"}
              unit={"%"}
              vertical={true}
              verticalHeight={tiltSliderHeight}
              noTextBox={true}
              noLabel={true}
            />

          </div>

        </Column>
        </Columns>



              <div hidden={show_pt_controls === false}>

                  <SliderAdjustment
                    title={"Pan"}
                    msgType={"std_msgs/Float32"}
                    adjustment={panGoalRatio}
                    topic={namespace + "/goto_pan_ratio"}
                    scaled={0.01}
                    min={0}
                    max={100}
                    tooltip={"Pan as a percentage (0%=min, 100%=max)"}
                    unit={"%"}
                    noTextBox={true}
                    noLabel={true}
                  />
        

              <ButtonMenu>

                  <Button 
                    buttonDownAction={() => onPTXJogPan(namespace,  1)}
                    buttonUpAction={() => onPTXStop(namespace)}>
                    {'\u25C0'}
                    </Button>
                  <Button 
                    buttonDownAction={() => onPTXJogPan(namespace, - 1)}
                    buttonUpAction={() => onPTXStop(namespace)}>
                    {'\u25B6'}
                  </Button>
                  <Button 
                    buttonDownAction={() => onPTXJogTilt(namespace, 1)}
                    buttonUpAction={() => onPTXStop(namespace)}>
                    {'\u25B2'}
                  </Button>
                  <Button 
                    buttonDownAction={() => onPTXJogTilt(namespace, -1)}
                    buttonUpAction={() => onPTXStop(namespace)}>
                    {'\u25BC'}
                  </Button>

                </ButtonMenu>


             

                <ButtonMenu>

                  <Button onClick={() => onPTXStop(namespace)}>{"STOP"}</Button>
                  
                </ButtonMenu>



             </div>

  </React.Fragment>




    )
  }


}

export default NepiDevicePTXImageViewer
