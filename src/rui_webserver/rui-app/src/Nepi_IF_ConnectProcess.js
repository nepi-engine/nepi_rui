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
import AsyncToggle from "./AsyncToggle"
import Label from "./Label"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
import Select from "./Select"
import Input from "./Input"
import { SliderAdjustment } from "./AdjustmentWidgets"

import Nepi_IF_Controls from "./Nepi_IF_Controls"
import Nepi_IF_Data from "./Nepi_IF_Data"
import NepiIFConfig from "./Nepi_IF_Config"
import { createMenuListFromStrList, onChangeSwitchStateValue} from "./Utilities"

@inject("ros")
@observer

// Component that contains the Process controls
class Nepi_IF_Process extends Component {
  constructor(props) {
    super(props)

    // these states track the values through  Status messages
    this.state = {

      processNamespace: 'None',
      status_msg: null,

      show_data: (this.props.show_data !== undefined) ? this.props.show_data : true,
      show_controls: (this.props.show_controls !== undefined) ? this.props.show_controls : true,

      processListener: null,
      needs_update: false,
    }

    this.updateProcessListener = this.updateProcessListener.bind(this)
    this.processListener = this.processListener.bind(this)

    this.renderProcess = this.renderProcess.bind(this)
    this.renderControls = this.renderControls.bind(this)
    this.renderData = this.renderData.bind(this)
  }

  // Callback for handling ROS Process Status messages
  processListener(message) {
    if (message.namespace === this.state.processNamespace){
      const lastCaps = this.state.capabilities
      const process = message.process_list
      const capabilities = message.setting_caps_list
      var namesList = []
      var typesList = []
      var valuesList = []
      for (let ind = 0; ind < process.length; ind++){
        namesList.push(process[ind].name_str)
        typesList.push(process[ind].type_str)
        valuesList.push(process[ind].value_str)
      }
      const count = namesList.length

      

      this.setState({
                    status_msg: message,
                    capabilities: capabilities,
                    processNamesList:namesList,
                    processTypesList:typesList,
                    processValuesList:valuesList,
                    processCount: count
      })

      if (lastCaps !== capabilities){
        this.updateCapabilities(capabilities) 
      }
    }

  }

  // Function for configuring and subscribing to Process Status
  updateProcessListener(processNamespace) {
    if (this.state.processListener != null ) {
      this.state.processListener.unsubscribe()
           this.setState({processListener: null})
            this.setState({ status_msg: null })
    }
    if (processNamespace !== '' &&  processNamespace !== 'None'){
      var processListener = this.props.ros.setupProcessListener(
            processNamespace + '/status',
            this.processListener
          )
      this.setState({ processNamespace: processNamespace, updateNamespace: null})
      this.setState({ processListener: processListener})
    }
  }


    componentDidMount() {
      this.setState({needs_update: true})
    }

  // Lifecycle method cAlled when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const processNamespace =  (this.props.processNamespace !== undefined) ? (this.props.processNamespace !== '' && this.props.processNamespace !== 'None' && this.props.processNamespace !== null) ?
                               this.props.processNamespace : 'None' : 'None'
    const needs_update = ((this.state.processNamespace !== processNamespace))
  
    if (needs_update) {
      this.setState({processNamespace: processNamespace})
      this.updateProcessListener(processNamespace)
    }
  }

  // Lifecycle method cAlled just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.processListener) {
      this.state.processListener.unsubscribe()
    }
    this.setState({processListener: null, 
                  status_msg: null})
  }





  renderProcess() {
   
    const status_msg = this.state.status_msg
    const has_config = status_msg.has_config

    const { userRestricted} = this.props.ros
    const ignore_restrictions = (this.props.ignore_restrictions !== undefined) ? this.props.ignore_restrictions : false
    
    const has_process_data = status_msg.has_process_data
    const process_data_restricted = userRestricted.indexOf('SYSTEM-PROCESS-DATA') !== -1 && (ignore_restrictions === false)
    var allways_show_data = (this.props.allways_show_data !== undefined) ? (this.props.allways_show_data && has_process_data) : false
    var show_data = (allways_show_data === true) ? true : this.state.show_data
    if (status_msg.show_data === false || process_data_restricted === true || has_process_data === false) {
      allways_show_data = false
      show_data = false
    }
    else {
      show_data = (show_data === true || allways_show_data === true)
    }


    const has_process_controls = status_msg.has_process_controls
    const process_controls_restricted = userRestricted.indexOf('SYSTEM-PROCESS-CONTROL') !== -1 && (ignore_restrictions === false)
    var allways_show_controls = (this.props.allways_show_controls !== undefined) ? (this.props.allways_show_controls  && has_process_controls): false
    var show_controls = (allways_show_controls === true) ? true : this.state.show_controls
    if (status_msg.show_controls === false || process_controls_restricted === true || has_process_controls === false) {
      allways_show_controls = false
      show_controls = false
    }
    else {
      show_controls = (show_controls === true || allways_show_controls === true)
    }

 

      return (
        <React.Fragment>


              <Columns>
                <Column>

                    {(allways_show_data === false && has_process_data === true) ?
                    <Label title="Show Process">
                        {/* react-toggle (not AsyncToggle): checked is local view state, already immediate -- no backend round trip to confirm. */}
                        <Toggle
                          checked={show_data===true}
                          onClick={() => onChangeSwitchStateValue.bind(this)("show_data",show_data)}>
                        </Toggle>
                    </Label>
                    : null }

                  </Column>
                  <Column>


                    {(allways_show_controls === false && has_process_controls === true) ?
                    <Label title="Show Process">
                        {/* react-toggle (not AsyncToggle): checked is local view state, already immediate -- no backend round trip to confirm. */}
                        <Toggle
                          checked={show_controls===true}
                          onClick={() => onChangeSwitchStateValue.bind(this)("show_controls",show_controls)}>
                        </Toggle>
                    </Label>
                    : null }

                  </Column>
                </Columns>


      { ( show_data === true ) ?
      <Nepi_IF_Data
        make_section={false}
        title={null}
        namespace={ status_msg.namespace}
        status_msg={status_msg.process_data}
        />
        : null}


      { ( show_controls === true ) ?
      <Nepi_IF_Controls
        make_section={false}
        title={null}
        namespace={ status_msg.namespace}
        status_msg={status_msg.process_controls}
        />
        : null}

      { ( has_config === true ) ?
        <NepiIFConfig
          namespace={this.getAppNamespace()}
          title={"Nepi_IF_Config"}
        />
        : null}
            
        </React.Fragment>
      )

  }




  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true

    const status_msg = this.state.status_msg
    const { userRestricted} = this.props.ros
    const ignore_restrictions = (this.props.ignore_restrictions !== undefined) ? this.props.ignore_restrictions : false
    const process_view_restricted = userRestricted.indexOf('SYSTEM-PROCESS-VIEW') !== -1 && (ignore_restrictions === false)
    if (status_msg == null || process_view_restricted === true){
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

               {this.renderProcess()}


          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={(this.props.title !== undefined) ? this.props.title : "Process"}>

              {this.renderProcess()}


        </Section>
     )
   }

  }

}
export default Nepi_IF_Process
