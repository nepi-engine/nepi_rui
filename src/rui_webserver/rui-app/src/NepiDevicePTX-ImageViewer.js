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

import { Column, Columns } from "./Columns"
import Styles from "./Styles"


import { SliderAdjustment } from "./AdjustmentWidgets"

import ImageViewer from "./Nepi_IF_ImageViewer"


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

      ptx_namespace: null,

      status_msg: null,  
      statusListener: null
    }


    this.getNamespace = this.getNamespace.bind(this)
    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)
  }


  getNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var ptx_namespace = null
    if (namespacePrefix !== null && deviceId !== null){
      if (this.props.ptx_namespace != undefined){
        ptx_namespace = this.props.ptx_namespace
      }
      else{
        ptx_namespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.appName
      }
    }
    return ptx_namespace
  }

  // Callback for handling ROS Status3DX messages
  statusListener(message) {
    this.setState({
      status_msg: message
    })
  }
  
  // Function for configuring and subscribing to Status
  updateStatusListener(ptx_namespace) {
    const statusNamespace = ptx_namespace + '/status'
    if (this.state.statusListner) {
      this.state.statusListner.unsubscribe()
      this.setState({status_msg: null,
    })
    }
    if (ptx_namespace != null && ptx_namespace !== 'None' && ptx_namespace.indexOf('null') === -1){
        var statusListner = this.props.ros.setupStatusListener(
              statusNamespace,
              "nepi_app_pan_tilt_auto/PanTiltAutoAppStatus",
              this.statusListner
            )
    }
    this.setState({ 
      ptx_namespace: ptx_namespace,
      statusListner: statusListner,
    })

}
  
// Lifecycle method called when compnent updates.
// Used to track changes in the topic
componentDidUpdate(prevProps, prevState, snapshot) {
  const ptx_namespace = this.getNamespace()
  const namespace_updated = (this.state.ptx_namespace !== ptx_namespace && ptx_namespace !== null)
  if (namespace_updated) {
    if (ptx_namespace != null){
      this.updateStatusListener(ptx_namespace)
    } 
  }
}

componentDidMount(){
  this.setState({needs_update: true})
}
  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status3DX message



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
    const ptx_namespace = (this.props.ptx_namespace !== null) ? this.props.ptx_namespace : 'None'
    const status_msg = this.state.status_msg
    var panGoalRatio = 0.5
    var tiltGoalRatio = 0.5
    if (status_msg != null){
      panGoalRatio = status_msg.pan_goal_ratio
      tiltGoalRatio = status_msg.tilt_goal_ratio
    }
   

    const ptxDevicesList = Object.keys(ptxDevices)
    var has_abs_pos = false
    var has_timed_pos = false
    if (ptxDevicesList.indexOf(ptx_namespace) !== -1){
      const ptx_caps = ptxDevices[ptx_namespace]
      has_abs_pos = ptx_caps && (ptx_caps.has_absolute_positioning === true)
      has_timed_pos = ptx_caps && (ptx_caps.has_timed_positioning === true)
    }

    const ptxImageViewerElement = document.getElementById("ptxImageViewer")
    const tiltSliderHeight = (ptxImageViewerElement)? ptxImageViewerElement.offsetHeight : "100px"




    return (
      <Section>
        <Columns>
          <Column equalWidth = {false} >


                
          <div id={'ptxImageViewer'}>
          {this.ImageViewer()}
          </div>



                <SliderAdjustment
                  disabled={!has_abs_pos}
                  title={"Pan"}
                  msgType={"std_msgs/Float32"}
                  adjustment={panGoalRatio}
                  topic={ptx_namespace + "/goto_pan_ratio"}
                  scaled={0.01}
                  min={0}
                  max={100}
                  tooltip={"Pan as a percentage (0%=min, 100%=max)"}
                  unit={"%"}
                  noTextBox={true}
                  noLabel={true}
                />

              <div hidden={(has_timed_pos === false)}>

              <ButtonMenu>

                  <Button 
                    buttonDownAction={() => onPTXJogPan(ptx_namespace,  1)}
                    buttonUpAction={() => onPTXStop(ptx_namespace)}>
                    {'\u25C0'}
                    </Button>
                  <Button 
                    buttonDownAction={() => onPTXJogPan(ptx_namespace, - 1)}
                    buttonUpAction={() => onPTXStop(ptx_namespace)}>
                    {'\u25B6'}
                  </Button>
                  <Button 
                    buttonDownAction={() => onPTXJogTilt(ptx_namespace, 1)}
                    buttonUpAction={() => onPTXStop(ptx_namespace)}>
                    {'\u25B2'}
                  </Button>
                  <Button 
                    buttonDownAction={() => onPTXJogTilt(ptx_namespace, -1)}
                    buttonUpAction={() => onPTXStop(ptx_namespace)}>
                    {'\u25BC'}
                  </Button>

                </ButtonMenu>


                </div>



                <ButtonMenu>

                  <Button onClick={() => onPTXStop(ptx_namespace)}>{"STOP"}</Button>
                  
                </ButtonMenu>

          </Column>
          <Column style={{flex: 0.05}}>

          <div style={{ height: '0px' }}></div>

            <SliderAdjustment
              disabled={!has_abs_pos}
              title={"Tilt"}
              msgType={"std_msgs/Float32"}
              adjustment={tiltGoalRatio}
              topic={ptx_namespace + "/goto_tilt_ratio"}
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

        </Column>
        </Columns>

      </Section>
    )
  }
}

export default NepiDevicePTXImageViewer
