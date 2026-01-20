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
import { Columns, Column } from "./Columns"
import Select, { Option } from "./Select"

import NepiIFSaveData from "./Nepi_IF_SaveData"


import { createShortUniqueValues} from "./Utilities"

@inject("ros")
@observer

class SaveDataSelector extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selected_topic: "None",

      connected: false,
      

    }

    this.onChangeSaveSelection = this.onChangeSaveSelection.bind(this)
    this.renderSelector = this.renderSelector.bind(this)
    this.renderSaveData = this.renderSaveData.bind(this)
    this.renderSaveDataSelector = this.renderSaveDataSelector.bind(this)

    
  }

  getAllNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var allNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      allNamespace = "/" + namespacePrefix + "/" + deviceId  + '/save_data'
    }
    return allNamespace
  }

  createSaveOptions() {
    const { namespacePrefix, deviceId} = this.props.ros
    const allNamespace = this.getAllNamespace()
    var items = []
    items.push(<Option value={allNamespace}>{"All"}</Option>)
    //items.push(<Option value={"None"}>{"None"}</Option>)
    const saveData_topics = this.props.ros.saveDataNamespaces
    var shortname = ''
    var topic = ""
    for (var i = 0; i < saveData_topics.length; i++) {
      topic = saveData_topics[i]
      if (topic !== allNamespace && topic.indexOf("None") === -1) {
        shortname = topic.replace("/" + namespacePrefix + "/" + deviceId + '/','' ).replace('/save_data','')
        items.push(<Option value={topic}>{shortname}</Option>)
      }
    }
    return items    
  }


  onChangeSaveSelection(event){
    const selected_topic = event.target.value
    this.setState({selected_topic: selected_topic})
  }

  renderSelection() {
    const saveTopics = this.createSaveOptions()

    return (
      <React.Fragment>

      <Columns>
        <Column>

        <label style={{fontWeight: 'bold'}}>
            {"Configure System Saving"}
          </label>


            <Select onChange={this.onChangeSaveSelection}
            id="MsgSelector"
            value={this.state.selected_topic}>
              {saveTopics}
            </Select>

      </Column>
      </Columns>

      </React.Fragment>
    )
  }


  renderSaveData() {
    const all_namespace = this.getAllNamespace()
    if ((this.state.selected_topic === 'None') && all_namespace != null){
      this.setState({selected_topic: all_namespace})
    } 
    const selected_topic = this.state.selected_topic

    return (
      <React.Fragment>

      <Columns>
        <Column>

        <NepiIFSaveData
        saveNamespace={selected_topic}
        showSettings = {true}
        title={"NepiIFSaveData.js"}
        />

      </Column>
      </Columns>

      </React.Fragment>
    )
  }



  renderSaveDataSelector() {
    const node_namespace = this.state.selected_topic.replace("/save_data_status", "")
    const hide_app = this.state.selected_topic === "None"
    return (


      <div style={{ display: 'flex' }}>
        <div style={{ width: '15%' }}>
          {this.renderSelection()}
        </div>

        <div style={{ width: '10%' }}>
          {}
        </div>

        <div hidden={hide_app}  style={{ width: '75%' }}>

          <label style={{fontWeight: 'bold'}}>
            {node_namespace}
          </label>
          {this.renderSaveData()}
        </div>
      </div>

    )
  }

  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    if (make_section === false){
      return (
        <Columns>
        <Column>
        {this.renderSaveDataSelector()}
        </Column>
        </Columns>
      )
    }
    else {
      return (

      <Section>

        {this.renderSaveDataSelector()}

      </Section>
      )

    }
  }


}

export default SaveDataSelector
