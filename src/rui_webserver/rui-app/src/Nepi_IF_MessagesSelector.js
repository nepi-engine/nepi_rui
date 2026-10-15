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

import { Columns, Column } from "./Columns"
import Select, { Option } from "./Select"
import Styles from "./Styles"

import AsyncToggle from "./AsyncToggle"
import Label from "./Label"

// import Label from "./Label"
// import Toggle from "react-toggle"

// import {onChangeSwitchStateValue} from "./Utilities"

import NepiIFMessages from "./Nepi_IF_Messages"

import { createMenuBaseNames} from "./Utilities"

@inject("ros")
@observer

class NepiIFMessagesSelector extends Component {
  constructor(props) {
    super(props)

    this.state = {
      
      selected_topic: "Connecting",
    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
    this.onChangeMessageSelection = this.onChangeMessageSelection.bind(this)
    this.onChangeDebugEnable = this.onChangeDebugEnable.bind(this)
    this.messageSelectionUpdated = this.messageSelectionUpdated.bind(this)

    
  }



  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId
    }
    return baseNamespace
  }


  getAllNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var allNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      allNamespace = "/" + namespacePrefix + "/" + deviceId + "/messages"
    }
    return allNamespace
  }

  createMessageOptions() {
    const allNamespace = this.getAllNamespace()
    const sel_topic = this.state.selected_topic
    var items = []
    const msgTopics = this.props.ros.messageTopics
    const msgTopicsSorted = msgTopics.sort()
    //items.push(<Option value={"ALL"}>{"ALL"}</Option>)
    if (msgTopics.length > 0 && msgTopics.indexOf(allNamespace) !== -1 ){
      items.push(<Option value={allNamespace}>{"ALL"}</Option>)
      if (sel_topic === "Connecting"){
        this.setState({selected_topic: allNamespace})
        this.messageSelectionUpdated('NONE')
      }
      const shortnames = createMenuBaseNames(msgTopics)
      var topic = ""
      for (var i = 0; i < msgTopicsSorted.length; i++) {
        topic = msgTopicsSorted[i]
        if (topic !== allNamespace && topic.indexOf("None") === -1) {
          items.push(<Option value={topic}>{shortnames[i].replace("/messages","")}</Option>)
        }
      }
    }
    else{
      items.push(<Option value={"Connecting"}>{"Connecting"}</Option>)
    }
    return items    
  }

  messageSelectionUpdated(selected_topic){
    const base_namespace = this.getBaseNamespace()
    const debug_namespace = selected_topic.replace('/messages','')
    const update_namespace = (debug_namespace === base_namespace) ? 'ALL' : debug_namespace
    if (update_namespace === 'NONE'){
      this.props.ros.sendBoolMsg(base_namespace + "/set_debug_enable", false)
      this.props.ros.sendStringMsg(base_namespace + "/set_debug_namespace", 'ALL')
    }
    else {
      this.props.ros.sendStringMsg(base_namespace + "/set_debug_namespace", update_namespace)
    }

  }

  onChangeDebugEnable(enable){
    const base_namespace = this.getBaseNamespace()
    const allNamespace = this.getAllNamespace()
    const selected_topic = (this.state.selected_topic === allNamespace) ? 'ALL' : this.state.selected_topic.replace('/messages','')

    this.props.ros.sendBoolMsg(base_namespace + "/set_debug_enable", enable)
    this.props.ros.sendStringMsg(base_namespace + "/set_debug_namespace", selected_topic)
    
  }

  onChangeMessageSelection(event){
    const selected_topic = event.target.value

    this.setState({selected_topic: selected_topic})
    this.messageSelectionUpdated(selected_topic)
    
  }



  renderSelection() {
    const messageTopics = this.createMessageOptions()
    const allNamespace = this.getAllNamespace()
    const selected_topic = (this.state.selected_topic !== 'ALL') ? this.state.selected_topic : allNamespace

    return (
      <React.Fragment>

      <Columns>
        <Column>

        <label style={{fontWeight: 'bold'}}>
            {"Select System Messages"}
          </label>

          <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>


            <Select onChange={this.onChangeMessageSelection}
            id="MsgSelector"
            value={selected_topic}>
            {messageTopics}
            </Select>
         



      </Column>
      </Columns>

      </React.Fragment>
    )
  }


  renderApplication() {
    const messagesNamespace = this.state.selected_topic

    return (
      <React.Fragment>

      <Columns>
        <Column>

        <NepiIFMessages
        messagesNamespace={messagesNamespace}
        hide_control={true}
        title={"NepiIFMessages"}
        />

      </Column>
      </Columns>

      </React.Fragment>
    )
  }



  render() {
    const base_namespace = this.getBaseNamespace()
    const allNamespace = this.getAllNamespace()
    const selected_topic = (this.state.selected_topic !== 'ALL') ? this.state.selected_topic : allNamespace

    const debug_mode = this.props.ros.systemDebugEnabled
    const hide_app = this.state.selected_topic === "Connecting"
    return (


      <div style={{ display: 'flex' }}>
        <div style={{ width: '20%' }}>
                    {this.renderSelection()}


                      <div style={{ display: 'flex' }}>
                              <div style={{ width: '20%' }} >
                              </div>



                              <div style={{ width: '60%' }} >
                                    <Label title="Debug">
                                          <AsyncToggle
                                          checked={debug_mode === true}
                                          onClick={() => this.onChangeDebugEnable(!debug_mode)}>
                                        </AsyncToggle>
                                    </Label>
                              </div>

                              <div style={{ width: '20%' }} >
                              </div>
                    </div>



        </div>

        <div style={{ width: '5%' }}>
          {}
        </div>

        <div hidden={hide_app} style={{ width: '75%' }}>
          <label style={{fontWeight: 'bold'}}>
            {selected_topic}
          </label>
          {this.renderApplication()}
        </div>
      </div>

    )
  }

}

export default NepiIFMessagesSelector
