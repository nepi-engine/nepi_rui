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
import Toggle from "react-toggle"
import Label from "./Label"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
import Select from "./Select"
import Input from "./Input"


import { createMenuListFromStrList, onChangeSwitchStateValue} from "./Utilities"

@inject("ros")
@observer

// Component that contains the Tracking controls
class Nepi_IF_Tracking extends Component {
  constructor(props) {
    super(props)

    // these states track the values through  Status messages
    this.state = {

      namespace: 'None',
      status_msg: null,
     
      show_controls: true,

      
      statusListener: null,
      needs_update: false,
    }

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

    this.renderTracking = this.renderTracking.bind(this)
    this.renderTrackingControls = this.renderTrackingControls.bind(this)
  }

  // Callback for handling ROS Tracking Status messages
  statusListener(message) {
     this.setState({
                    status_msg: message,
      })
  }

  // Function for configuring and subscribing to Tracking Status
  updateStatusListener(namespace) {
    if (this.state.statusListener != null ) {
      this.state.statusListener.unsubscribe()
           this.setState({statusListener: null,
                          status_msg: null
           })
         
    }
    if (namespace !== '' &&  namespace !== 'None'){
      var statusListener = this.props.ros.setupTrackingStatusListener(
            namespace + '/status',
            this.statusListener
          )
      this.setState({ namespace: namespace})
      this.setState({ statusListener: statusListener})
    }
  }


    componentDidMount() {
      this.setState({needs_update: true})
    }

  // Lifecycle method cAlled when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace =  (this.props.namespace !== undefined) ? (this.props.namespace !== '' && this.props.namespace !== 'None' && this.props.namespace !== null) ?
                               this.props.namespace : 'None' : 'None'
    const needs_update = ((this.state.namespace !== namespace))
  
    if (needs_update) {
      this.setState({namespace: namespace})
      this.updateStatusListener(namespace)
    }
  }

  // Lifecycle method cAlled just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
    this.setState({statusListener: null, 
                  status_msg: null})
  }




  renderTracking() {
   
      return (
        <React.Fragment>


        </React.Fragment>
      )

    
  }



   renderTrackingControls() {
   
      return (
        <React.Fragment>


        </React.Fragment>
      )

    
  }
  



  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true

    const status_msg = this.state.status_msg


    if (status_msg == null){
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

               {this.renderTracking()}
               {this.renderTrackingControls()}


          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={(this.props.title !== undefined) ? this.props.title : "Tracking"}>

              {this.renderTracking()}
              {this.renderTrackingControls()}

        </Section>
     )
   }

  }

}
export default Nepi_IF_Tracking
