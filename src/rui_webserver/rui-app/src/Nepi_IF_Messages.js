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
import Toggle from "react-toggle"
import Label from "./Label"
import { Column, Columns } from "./Columns"
import BooleanIndicator from "./BooleanIndicator"
import {Queue, onChangeSwitchStateValue} from "./Utilities"



@inject("ros")
@observer

class NepiIFMessages extends Component {
  constructor(props) {
    super(props)

    const show_control = this.props.hide_control ? !this.props.hide_control : true
    const show_messages = (show_control === false)


    // these states track the values through   messages
    this.state = {

      messagesNamespace: null,

      msg_queue_size: 50,
      status_msg: null,

      show_control: show_control,
      show_messages: show_messages,

      needs_update: true,

      paused: false,

      connected: false,

      messagesListener: null,

    }

    this.msg_queue = new Queue()

    this.convertStrListToJoinedStr = this.convertStrListToJoinedStr.bind(this)
    this.onClickPause = this.onClickPause.bind(this)

    this.renderShowControl = this.renderShowControl.bind(this)
    this.renderMessages = this.renderMessages.bind(this)
    this.messagesListener = this.messagesListener.bind(this)
    this.updateMessagesListener = this.updateMessagesListener.bind(this)
  }


    // Callback for handling ROS  messages
    messagesListener(message) {
      const msg_str = message.message
      const paused = this.state.paused
      const queue_size = this.state.queue_size
      var queue_length = this.msg_queue.getLength()
      while ( queue_length > queue_size ){
        this.msg_queue.pullItem()
        queue_length = this.msg_queue.getLength()
      }
      if (paused === false){
        this.msg_queue.pushItem(msg_str)
      }

      this.setState({
        connected: true
      })
    }

  // Function for configuring and subscribing to 
  updateMessagesListener() {
    const namespace = this.state.messagesNamespace
    if (namespace != null){
      if (this.state.messagesListener != null) {
        this.state.messagesListener.unsubscribe()
        this.setState({messagesListener: null})
      }
      if (namespace !== 'None' && namespace != null) {
        var messagesListener = this.props.ros.setupMessagesListener(
          namespace,
          this.messagesListener
        )
        this.setState({ messagesListener: messagesListener,
          needs_update: false})
      }
    }
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const {topicNames} = this.props.ros
    const namespace = (this.props.messagesNamespace !== undefined) ? this.props.messagesNamespace : null
    if (namespace != null){
      const namespace_updated = (this.state.messagesNamespace !== namespace)
      const message_publishing = (topicNames.indexOf(namespace) !== -1)
      if (((namespace_updated === true) || (this.state.needs_update === true)) && (message_publishing === true)) {
        if (namespace.indexOf('null') === -1){
          this.setState({ messagesNamespace: namespace})
          this.updateMessagesListener()
        }
      }
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to  message
  componentWillUnmount() {
    if (this.state.messagesListener) {
      this.state.messagesListener.unsubscribe()
    }
  }

  convertStrListToJoinedStr(str_list) {
    var mod_str_list = []
    for (var i = 0; i < str_list.length; ++i) {
      mod_str_list.push(str_list[i]+"\n")
    }
    const joined_str = mod_str_list.join("")
    return joined_str

  }

  onClickPause(){
    const currentVal = this.state.paused
    this.setState({paused: !currentVal})
  }

  renderShowControl() {
  const show_control = this.state.show_control
  //Unused const show_messages = this.state.show_messages

  const sys_debug = this.props.ros.systemDebugEnabled
  const debug_mode = sys_debug ? sys_debug : false
    if (show_control === false){
      return(
        <Columns>
        <Column>

      </Column>
      </Columns>

      )

    }
    else {
      return(
        <Columns>
        <Column>


            <Label title="Show Messages">
                  <Toggle
                    checked={this.state.show_messages===true}
                    onClick={() => onChangeSwitchStateValue.bind(this)("show_messages",this.state.show_messages)}>
                  </Toggle>
                </Label>

        </Column>
        <Column>

        </Column>
        <Column>

        <Label title={"Debug Mode Enabled"}>
        <BooleanIndicator value={debug_mode} />
      </Label>

      </Column>
      </Columns>
      )
    }
  }



  renderMessages() {
    const connected = this.state.connected
    const msg_str_list = (connected === true && this.msg_queue.getLength() > 0) ? this.msg_queue.getItems() : ["Waiting for message to publish"]
    const msg_str = this.convertStrListToJoinedStr(msg_str_list.reverse())
    const paused = this.state.paused
    const show_messages = this.state.show_messages


    if (show_messages === false){
      return(
        <Columns>
        <Column>
  
      </Column>
      </Columns>

      )

    }   
    else{   
      return (

        <Columns>
        <Column>

              <Columns>
              <Column>

              <Label title="Pause"> </Label>

              <Toggle
                        checked={paused===true}
                        onClick={this.onClickPause}>
              </Toggle>
                
              </Column>
              <Column>


              </Column>
              <Column>

              </Column>
              </Columns>


              <Columns>
              <Column>
            <div align={"left"} textAlign={"left"}> 
          <label style={{fontWeight: 'bold'}}>
            {"Messages"}
          </label>
          
            <pre style={{ height: "1000px", overflowY: "auto" }}>
              {msg_str ? msg_str : ""}
            </pre>
            </div>

            </Column>
            </Columns>

      </Column>
      </Columns>



      )
    }
  }

  render() {
    //Unused const show_debug = this.props.ros.systemDebugEnabled
    const connected = this.state.connected
    const msg_str_list = (connected === true && this.msg_queue.getLength() > 0) ? this.msg_queue.getItems() : ["Waiting for message to publish"]
    //Unused const msg_str = this.convertStrListToJoinedStr(msg_str_list.reverse())
    //Unused const paused = this.state.paused

    return (


      <Section title={"System Messages"}>

            <Columns>
            <Column>

            {this.renderShowControl()}
            {this.renderMessages()}

            </Column>
            </Columns>



      </Section>


    )
  }


}
export default NepiIFMessages
