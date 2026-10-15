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



export const MSG_COLORS = {
  WHITE:  "#FFFFFF",
  
  RED: "#ff0000",
  ORANGE: "#ff8700",
  YELLOW: "#ffff00",
  GREEN: "#008700",
  BLUE: "#0000ff",
  INDIGO: "#8700ff",
  VIOLET: "#d700ff",
  CYAN: "#00ffff",
  MAGENTA: "#ff5fff",
  PINK: "#ff005f",

  DARK_RED: "#870000",
  DARK_ORANGE: "#af5f00",
  DARK_YELLOW: "#afaf00",
  DARK_GREEN: "#005f00",
  DARK_BLUE: "#000087",
  DARK_INDIGO: "#5f0087",
  DARK_VIOLET: "#870087",
  DARK_CYAN: "#008787",
  DARK_MAGENTA: "#87005f",
  DARK_PINK: "#af005f",

  INFO: "#FFFFFF",
  WARN: "#e3b10c",
  ERROR: "#ff0000",
  FATAL: "#870000",
  DEBUG: "#ff8700",

  // --- Utility ---
  RESET: "#FFFFFF"
};




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

    this.onClickPause = this.onClickPause.bind(this)

    this.renderShowControl = this.renderShowControl.bind(this)
    this.renderMessages = this.renderMessages.bind(this)
    this.messagesListener = this.messagesListener.bind(this)
    this.updateMessagesListener = this.updateMessagesListener.bind(this)

  }


    // Callback for handling ROS  messages
    messagesListener(message) {

      const paused = this.state.paused
      const queue_size = this.state.queue_size
      var queue_length = this.msg_queue.getLength()
      while ( queue_length > queue_size ){
        this.msg_queue.pullItem()
        queue_length = this.msg_queue.getLength()
      }
      if (paused === false){
        this.msg_queue.pushItem(message)
      }

      this.setState({
        connected: true
      })
    }

  // Function for configuring and subscribing to 
  updateMessagesListener(namespace) {
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
          this.updateMessagesListener(namespace)
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
    const msg_list = (connected === true && this.msg_queue.getLength() > 0) ? this.msg_queue.getItems().reverse() : null
    const paused = this.state.paused
    const show_messages = this.state.show_messages


    if (msg_list == null || show_messages === false){
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
                <div style={{ padding: '10px', fontFamily: 'sans-serif' }}>
                  <ul>
                    {msg_list.map((item) => (
                      <li 
                        key={item.id} 
                        style={{ color: MSG_COLORS[item.color], fontSize: '17px', margin: '8px 0' }}
                      >
                        {item.message}
                      </li>
                    ))}
                  </ul>
                </div>
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
    const { userRestricted} = this.props.ros
    const message_view_restricted = userRestricted.indexOf('SYSTEM-MESSAGES-VIEW') !== -1

    if (message_view_restricted === true){
      return (


              <Columns>
              <Column>


              </Column>
              </Columns>


      )



    }
    else {
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


}
export default NepiIFMessages
