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


import NepiIFConfig from "./Nepi_IF_Config"

import {createMenuBaseNames, createMenuFirstLastNames, createMenuListFromStrLists} from "./Utilities"

@inject("ros")
@observer


class NepiIFTracking extends Component {
  constructor(props) {
    super(props)

    this.state = {

      status_msg: null,

      statusListener: null,
      connected: false,

      needs_update: false


    }

   
    this.getNamespace = this.getNamespace.bind(this)

    this.updateStatusListeners = this.updateStatusListeners.bind(this)
    this.statusListener = this.statusListener.bind(this)

    this.onMenuSelection = this.onMenuSelection.bind(this)
    this.renderTrackingIF = this.renderTrackingIF.bind(this)

  }
  


  getNamespace(){
    const namespace = (this.props.namespace !== undefined) ? this.props.namespace  + '/tracking' : null
    return namespace
  }




  // Callback for handling ROS Status messages
  statusListener(message) {
      this.setState({
      status_msg: message,
      connected: true
      })

  }

  // Function for configuring and subscribing to Status
  updateStatusListeners() {
    const namespace = this.getNamespace()
    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
      this.setState({
        status_msg: null,
        connected: false,
        statusListener: null,
    })
    }
    if (namespace != null){

      var statusListener = this.props.ros.setupStatusListener(
        namespace + '/status',
        "nepi_interfaces/TrackingStatus",
        this.statusListener
      )
      this.setState({ 
        statusListener: statusListener,
      })
    }

  }

  componentDidMount() {
    this.setState({needs_update: true})
  }
  
  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace = this.getNamespace()
    const status_msg = (this.props.status_msg !== undefined)? this.props.status_msg : this.state.status_msg 
    const needs_update = ((this.state.namespace !== namespace) || this.state.needs_update === true)
    // if (needs_update === true){
    //   this.updateStatusListeners()
    //   this.setState({needs_update: false})
    // }
     
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status3DX message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
      this.setState({
        status_msg: null,
        connected: false,
        statusListener: null,
    })
  }
  





  onMenuSelection(event){
    const {sendStringMsg} = this.props.ros

    const value = event.target.value
    const topic = event.target.id
    const namespace = this.getNamespace() + '/' +  topic
    sendStringMsg(namespace,value)
  }



renderTrackingIF() {
  const namespace = this.getNamespace()
  const status_msg = (this.props.status_msg !== undefined)? this.props.status_msg : this.state.status_msg    
   
    if (namespace == null && status_msg == null){
      return (
        <Columns>
        <Column>
       
        </Column>
        </Columns>
      )


    }
    else {
      const {sendBoolMsg, sendStringMsg} = this.props.ros
      
      const running = status_msg.running
      const state = status_msg.state

      const available_targets = status_msg.available_targets_topics
      const targets_names = createMenuBaseNames(available_targets)
      const targets_menu = createMenuListFromStrLists(available_targets,targets_names, ['None'], [],'None Available')
      const selected_targets = status_msg.selected_targets
      const targets_connected = status_msg.targets_connected

      
      const available_sources = status_msg.available_source_topics
      const sources_names = createMenuFirstLastNames(available_sources)
      const sources_menu = createMenuListFromStrLists(available_sources,sources_names, ['None'], [],'None Available')
      const selected_source = status_msg.selected_source
      const source_connected = status_msg.source_connected

      const available_classes = status_msg.available_classes
      const classes_menu = createMenuListFromStrLists(available_classes,available_classes, ['None'], [],'None Available')
      const selected_class = status_msg.selected_class

      const threshold_filter = status_msg.threshold_filter

      const available_best = status_msg.available_best_filters
      const best_menu = createMenuListFromStrLists(available_best,available_best, [], [], '')
      const best_filter = status_msg.selected_best_filter

      const manages_targeting = status_msg.manages_targeting

      return (

          <React.Fragment>



        <div style={{ display: 'flex' }}>
          <div style={{ width: '80%' }}>

            <Label title={'Select Detector'}>
              <Select
                id="set_targets_topic"
                onChange={this.onMenuSelection}
                value={selected_targets}
              >
                {targets_menu}
              </Select>
            </Label>

            </div>

              <div style={{ width: '10%' }}>
                {}
              </div>

              <div style={{ width: '10%' }}>
                
                {}

              </div>
      </div>

      <div hidden={selected_targets === 'None'}>

        <div style={{ display: 'flex' }}>
                      <div style={{ width: '40%' }}>

                      <Label title={"Connected"}>
                    <BooleanIndicator value={running} />
                    </Label>


                      </div>

                      <div style={{ width: '20%' }}>
                        {}
                      </div>

                      <div style={{ width: '40%' }}>
                          <Label title={"Tracking"}>
                            <BooleanIndicator value={state} />
                          </Label>
                      </div>
          </div>

        </div>

        <div style={{ borderTop: "1px solid #000000", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>


        <div hidden={selected_targets === 'None' || targets_connected === false}>

                <div style={{ display: 'flex' }}>
                  <div style={{ width: '80%' }}>

                    <Label title={'Select Image'}>
                      <Select
                        id="set_source_topic"
                        onChange={this.onMenuSelection}
                        value={selected_source}
                      >
                        {sources_menu}
                      </Select>
                    </Label>

                    </div>

                      <div style={{ width: '10%' }}>
                        {}
                      </div>

                      <div style={{ width: '10%' }}>
                        
                            <BooleanIndicator value={targets_connected} />
                      </div>
              </div>



                <div style={{ display: 'flex' }}>
                  <div style={{ width: '80%' }}>

                    <Label title={'Select Class'}>
                      <Select
                        id="set_class_filter"
                        onChange={this.onMenuSelection}
                        value={selected_class}
                      >
                        {classes_menu}
                      </Select>
                    </Label>

                    </div>
                      <div style={{ width: '10%' }}>
                        {}
                      </div>

                      <div style={{ width: '10%' }}>
                        
                            <BooleanIndicator value={targets_connected} />
                      </div>
              </div>

                  <SliderAdjustment
                            title={"Threshold"}
                            msgType={"std_msgs/Float32"}
                            adjustment={threshold_filter}
                            topic={namespace + "/set_threshold_filter"}
                            scaled={0.01}
                            min={0}
                            max={100}
                            disabled={false}
                            tooltip={"Sets target confidence threshold filter"}
                            unit={"%"}
                    />



                    <Label title={'Select Filter'}>
                      <Select
                        id="set_best_filter"
                        onChange={this.onMenuSelection}
                        value={best_filter}
                      >
                        {best_menu}
                      </Select>
                    </Label>


          <Columns>
          <Column>

          <Label title="Manage Targeting">
                <Toggle
                checked={manages_targeting===true}
                onClick={() => sendBoolMsg(namespace + "/set_manages_targeting",!manages_targeting)}>
                </Toggle>
          </Label>

          </Column>
          <Column>

          </Column>
          </Columns>


      </div>







          </React.Fragment>
      )
    }
  }
  


  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const namespace = this.getNamespace()
    const status_msg = (this.props.status_msg !== undefined)? this.props.status_msg : this.state.status_msg


    if (namespace == null && status_msg == null){
      return (
        <Columns>
        <Column>
       
        </Column>
        </Columns>
      )


    }
    else if (make_section === false){

      return (

          <React.Fragment>

               {this.renderTrackingIF()}

          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={(this.props.title !== undefined) ? this.props.title : "Tracking"}>

              {this.renderTrackingIF()}

        </Section>
     )
   }

  }

}
export default NepiIFTracking
