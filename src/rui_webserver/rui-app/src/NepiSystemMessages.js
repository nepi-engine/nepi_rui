/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */
import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import Section from "./Section"
//import EnableAdjustment from "./EnableAdjustment"
import Toggle from "react-toggle"
import Label from "./Label"
import { Column, Columns } from "./Columns"
import Input from "./Input"
import Styles from "./Styles"




import { onChangeSwitchStateValue, convertStrToStrList} from "./Utilities"
import {Queue} from "./Utilities"



@inject("ros")
@observer

// Component that contains RBX Controls
class NepiSystemMessages extends Component {
  constructor(props) {
    super(props)

    // these states track the values through  Status messages
    this.state = {
      show_messages: false,

      msg_queue_size: 50,
      status_msg: null,

    }

    this.msg_queue = new Queue()

    this.convertStrListToJoinedStr = this.convertStrListToJoinedStr.bind(this)
    
    this.onEnterMessagesQueueVar = this.onEnterMessagesQueueVar.bind(this)
    this.onUpdateMessagesInputBoxValue = this.onUpdateMessagesInputBoxValue.bind(this)

  }



  onUpdateMessagesInputBoxValue(event,stateVarStr) {
    var key = stateVarStr
    var value = event.target.value
    var obj  = {}
    obj[key] = value
    this.setState(obj)
    document.getElementById(event.target.id).style.color = Styles.vars.colors.red
    this.render()
  }

  onEnterMessagesQueueVar(event) {
    if(event.key === 'Enter'){
      var value = parseInt(event.target.value, 10)
      if (!isNaN(value)){
        if (value <10){
          value=10
        }
        else if (value > 100){
          value=100
        }
        this.setState({msg_queue_size: value})
      }
      document.getElementById(event.target.id).style.color = Styles.vars.colors.black
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

  
  render() {
    return (
      <Section title={"System Messages"}>

            <Columns>
            <Column>
            
            <Label title="Show System Messages">
                    <Toggle
                      checked={this.state.show_messages===true}
                      onClick={() => onChangeSwitchStateValue.bind(this)("show_messages",this.state.show_messages)}>
                    </Toggle>
              </Label>

            </Column>
            <Column>
            </Column>
            </Columns>


          <div hidden={!this.state.show_messages}>

            <Label title={"Last Command"} >
          </Label>
          <pre style={{ height: "25px", overflowY: "auto" }}>
            {this.state.last_cmd_str}
          </pre>

          <Label title={"Last Error"} >
          </Label>
          <pre style={{ height: "25px", overflowY: "auto" }}>
            {this.state.last_error_message}
          </pre>

            <Columns>
            <Column>

            <Label title={"Message Queue Size"}>
                <Input id="msg_queue_size" 
                  value={this.state.msg_queue_size} 
                  onChange={(event) => this.onUpdateMessagesInputBoxValue(event,"msg_queue_size")} 
                  onKeyDown= {(event) => this.onEnterMessagesQueueVar(event)} />
              </Label>
              
            </Column>
            <Column>

            </Column>
            </Columns>


            <Columns>
            <Column>


            <div align={"left"} textAlign={"left"}> 
        <label style={{fontWeight: 'bold'}}>
          {"RBX Status"}
        </label>
          <pre style={{ height: "600px", overflowY: "auto" }}>
            {this.state.status_str_list ? this.convertStrListToJoinedStr(this.state.status_str_list) : ""}
          </pre>
          </div>

          </Column>
          </Columns>

              </div>
      </Section>
    )
  }

}
export default NepiSystemMessages
