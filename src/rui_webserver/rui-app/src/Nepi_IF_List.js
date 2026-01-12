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

import Styles from "./Styles"
import { Columns, Column } from "./Columns"
import Select, { Option } from "./Select"
import Button, { ButtonMenu } from "./Button"

@inject("ros")
@observer
  

  class NepiListIF extends Component {
    constructor(props) {
      super(props)
  
      this.state = {
      listNamespace: null,

      viewableList: false,

      list_name: '',
      list_items: [],
      list_names: [],
      list_active: [],
      selected_item: 'None',
      selected_item_index: 0,

      connected: false,

      listListener: null,
           
      needs_update: false
    }
    this.checkConnection = this.checkConnection.bind(this)

    this.listStatusListener = this.listStatusListener.bind(this)
    this.updateListStatusListener = this.updateListStatusListener.bind(this)

    this.getListOptions = this.getListOptions.bind(this)
    this.toggleViewableList = this.toggleViewableList.bind(this)
    this.onToggleListSelection = this.onToggleListSelection.bind(this)

    this.sendListUpdateOrder = this.sendListUpdateOrder.bind(this)
   
    this.stepItem = this.stepItem.bind(this)
    this.renderOrderControlsVert = this.renderOrderControlsVert.bind(this)
    this.renderEnableControlsVert = this.renderEnableControlsVert.bind(this)
    this.renderRefreshControl = this.renderRefreshControl.bind(this)
    this.renderResetControl = this.renderResetControl.bind(this)
    this.renderButtonControls = this.renderButtonControls.bind(this)
    this.renderList = this.renderList.bind(this)
  
  }

  // Callback for handling ROS Status messages
  listStatusListener(message) {
    this.setState({
      list_name: message.list_name,
      list_items: message.ordered_items_list,
      list_names: message.ordered_name_list,
      list_active: message.active_items_list,
      selected_item: message.selected_item,
      selected_item_index: message.selected_item_index,
      connected: true
    })    

  }

  // Function for configuring and subscribing to Status
  updateMgrListStatusListener() {
    const statusNamespace = this.state.listNamespace + '/status'
    if (this.state.listListener) {
      this.state.listListener.unsubscribe()
    }
    var listListener = this.props.ros.setupStatusListener(
          statusNamespace,
          "nepi_interfaces/ListIFStatus",
          this.listStatusListener
        )
    this.setState({ listListener: listListener})
  }


    async checkConnection() {
      const { namespacePrefix, deviceId} = this.props.ros
      if (namespacePrefix != null && deviceId != null) {
        this.setState({needs_update: true})
      }
      else {
        setTimeout(async () => {
          await this.checkConnection()
        }, 1000)
      }
    }
  
    componentDidMount(){
      this.checkConnection()
    }

    
  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace = this.state.listNamespace
    const namespace_updated = (prevState.listNamespace !== namespace && namespace !== null)
    if (namespace_updated) {
      if (namespace.indexOf('null') === -1){
        this.setState({
          listNamespace: namespace
        })
        this.updateListStatusListener()
      } 
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.listListener) {
      this.state.listListener.unsubscribe()
    }
  }



  renderOrderControlsVert() {
    const { sendUpdateOrderMsg } = this.props.ros

    return (
      <React.Fragment>


        <ButtonMenu>
        <Button onClick={() => sendUpdateOrderMsg(this.state.listNamespace + "/update_order", this.state.item, "top")}>{"Top"}</Button>
        </ButtonMenu>

        <ButtonMenu>
        <Button onClick={() => sendUpdateOrderMsg(this.state.listNamespace + "/update_order", this.state.item, "up")}>{"Up"}</Button>
        </ButtonMenu>

        <ButtonMenu>
          <Button onClick={() => sendUpdateOrderMsg(this.state.listNamespace + "/update_order", this.state.item, "down")}>{"Down"}</Button>
        </ButtonMenu>

        <ButtonMenu>
          <Button onClick={() => sendUpdateOrderMsg(this.state.listNamespace + "/update_order", this.state.item, "bottom")}>{"Bottom"}</Button>
        </ButtonMenu>


      
      </React.Fragment>
    )
  }



  renderEnableControlsVert() {
    const { sendTriggerMsg, sendUpdateStateMsg } = this.props.ros

    return (
      <React.Fragment>

  
      <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(this.state.listNamespace + "/enable_all_list")}>{"Enable All"}</Button>
      </ButtonMenu>

      <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(this.state.listNamespace + "/disable_all_list")}>{"Disable All"}</Button>
      </ButtonMenu>

      <Label title="Enable/Disable">
          <Toggle
            checked={this.state.driver_active_state===true}
            onClick={() => sendUpdateStateMsg(this.state.listNamespace + "/update_state", this.state.driver_pkg, !this.state.driver_active_state)}>
          </Toggle>
        </Label>

      
      </React.Fragment>
    )
  }


  renderRefreshControl() {
    const { sendTriggerMsg } = this.props.ros

    return (
      <React.Fragment>


      <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(this.state.listNamespace + "/refresh_list")}>{"Refresh"}</Button>
      </ButtonMenu>
      
      </React.Fragment>
    )
  }


  renderRemoveItemControl() {
    const { sendTriggerMsg } = this.props.ros

    return (
      <React.Fragment>

      <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(this.state.listNamespace + "/remove_item")}>{"Remove"}</Button>
      </ButtonMenu>

      
      </React.Fragment>
    )
  }

  renderAddItemControl() {
    const { sendTriggerMsg } = this.props.ros

    return (
      <React.Fragment>

<Label title={'Add'}>
                <Input id="input_overlay" 
                  value={this.state.custom_overlay_input} 
                  onChange={this.onUpdateInputOverlayValue} 
                  onKeyDown= {this.onKeySaveInputOverlayValue} />
              </Label>

      
      </React.Fragment>
    )
  }


  renderResetControl() {
    const { sendTriggerMsg } = this.props.ros

    return (
      <React.Fragment>


      <ButtonMenu>
        <Button onClick={() => this.props.ros.sendTriggerMsg(this.state.listNamespace + "/reset_list")}>{"Reset"}</Button>
      </ButtonMenu>

      
      </React.Fragment>
    )
  }

  stepItem(step){
    const {sendStringMsg} = this.props.ros
    const list = this.state.active_items_list
    var index = this.state.selected_item_index
    index = index + step
    if (index < 0){
      index = list.length - 1
    }
    else if ( index >= list.length ){
      index = 0
    }
    const item = self.active_items_list[index]
    var item_ind = this.ordered_items_list.index(item)
    if (item_ind != -1){
      this.setState({selected_item: item, selected_item_ind: item_ind})
      const selectNamespace = this.state.listNamespace + "/select_item"
      sendStringMsg(selectNamespace,item)
    }

  }

  renderButtonControls() {
    const { sendTriggerMsg } = this.props.ros

    return (
      <React.Fragment>

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
      
      </React.Fragment>
    )
  }
  
  


  toggleViewableList() {
    const set = !this.state.viewableList
    this.setState({viewableList: set})
  }

  // Function for creating image topic options.
  getListOptions() {
    const items = this.state.ordered_items_list  
    const names = this.state.ordered_names_list
    var menus = []
    if (items.length > 0){
      for (var i = 0; i < items.length; i++) {
        menus.push(<Option value={items[i]}>{names[i]}</Option>)
     }
    }
    else{
      menus.push(<Option value={'None'}>{'None'}</Option>)
      //items.push(<Option value={'TEST1'}>{'TEST1'}</Option>)
      //items.push(<Option value={'TEST2'}>{'TEST2'}</Option>)
    }
    return menus
  }



  onToggleListSelection(event){
    const {sendStringMsg} = this.props.ros
    const item = event.target.value
    var item_ind = this.ordered_items_list.index(item)
    if (item_ind != -1){
      this.setState({selected_item: item, selected_item_ind: item_ind})
      const selectNamespace = this.state.listNamespace + "/select_item"
      sendStringMsg(selectNamespace,item)
    }
  }


  sendListUpdateOrder(){
    const {sendUpdateOrderMsg} = this.props.ros
    var namespace = this.state.listNamespace
    var item = this.state.selected_item
    var move_cmd = this.state.move_cmd
    sendUpdateOrderMsg(namespace,item,move_cmd)
  }


  renderList() {
    if (this.state.needs_update === true){
      this.setState({needs_update: false})
    }
    const selected_item = this.state.selected_item
    const list_options = this.getListOptions()
    const active_list = this.state.active_list
    const hide_list_list = !this.state.viewableList && !this.state.connected
    return (


       <Columns>
        <Column>
        <div style={{ marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

          <div onClick={this.toggleViewableList} style={{backgroundColor: Styles.vars.colors.grey0}}>
            <Select style={{width: "10px"}}/>
          </div>
          <div hidden={hide_list_list}>
          {list_options.map((list) =>
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

    )
  }

}

export default NepiListIF
