/*
#
# Copyright (c) 2024 Numurus <https://www.numurus.com>.
#
# This file is part of nepi rui (nepi_rui) repo
# (see https://github.com/nepi-engine/nepi_rui)
#
# License: NEPI RUI repo source_ref_description-code and NEPI Images that use this source_ref_description-code
# are licensed under the "Numurus Software License", 
# which can be found at: <https://numurus.com/wp-content/uploads/Numurus-Software-License-Terms.pdf>
#
# Redistributions in source_ref_description code must retain this top-level comment block.
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
import Label from "./Label"
import Select, { Option } from "./Select"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"
import Input from "./Input"
import Toggle from "react-toggle"

import { round, convertStrToStrList, createShortValuesFromNamespaces, createMenuListFromStrList,
  onDropdownSelectedSendStr, onDropdownSelectedSetState, 
  onUpdateSetStateValue, onEnterSendFloatValue, onEnterSetStateFloatValue,
  doNothing} from "./Utilities"

import NepiIFConfig from "./Nepi_IF_Config"
//import Nepi_IF_SaveData from "./Nepi_IF_SaveData"

@inject("ros")
@observer

// Navpose Transform
class NepiIFTransform extends Component {
  constructor(props) {
    super(props)

    this.state = {

      transformNamespace: 'None',
      status_msg: null,
      data_msg: null,

      transform_data: null,
      transform_data_copy: null,

      listener: null,

      needs_update: false,
      connected: false

    }

    this.sendTransformUpdateMessage = this.sendTransformUpdateMessage.bind(this)
    this.sendTransformClearMessage = this.sendTransformClearMessage.bind(this)

    this.onUpdateInputTransformValue = this.onUpdateInputTransformValue.bind(this)
    this.onKeySaveInputTransformValue = this.onKeySaveInputTransformValue.bind(this)


    this.renderTransform = this.renderTransform.bind(this)

    this.updateListener = this.updateListener.bind(this)
    this.statusListener = this.statusListener.bind(this)
  }

  // Callback for handling ROS StatusIDX messages
  statusListener(message) {
    const last_transform_data = this.state.transform_data
    this.setState({
      data_msg: message,
      source_ref_description: message.source_ref_description,
      end_ref_description: message.end_ref_description
    })

    const transform_data = {
      source_ref_description: message.source_ref_description,
      end_ref_description: message.end_ref_description,
      transformTX: message.translate_vector.x,
      transformTY: message.translate_vector.y,
      transformTZ: message.translate_vector.z,
      transformRX: message.rotate_vector.x,
      transformRY: message.rotate_vector.y,
      transformRZ: message.rotate_vector.z,
      transformHO: message.heading_offset,
    }


    if (JSON.stringify(transform_data) !== JSON.stringify(last_transform_data)) {
      this.setState({
        transform_data: transform_data,
        transform_data_copy: transform_data
      })
    }

  }

  // Function for configuring and subscribing to StatusIDX
  updateListener(transformNamespace) {
    if (this.state.listener != null) {
      this.state.listener.unsubscribe()
      this.setState({listener: null, 
                    data_msg: null, 
                    transform_data: null,
                    transform_data_copy: null,
                    connected: false})
    }
    if (transformNamespace !== 'None' && transformNamespace != null){
      this.setState({ transformNamespace: transformNamespace  })
      var listener = this.props.ros.setupTransformListener(
        transformNamespace,
        this.statusListener
      )
      this.setState({ listener: listener, disabled: false })
    }

  }



  componentDidMount(){
    this.setState({needs_update: true})
  }


  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const transformNamespace = this.props.transformNamespace
    if (transformNamespace !== this.state.transformNamespace) {
      this.updateListener(transformNamespace)
    }
  }



  componentDidMount(){
    this.setState({needs_update: true})
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to StatusIDX message
  componentWillUnmount() {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
  }







  sendTransformUpdateMessage(transform_data){
    const {sendUpdateTransformMsg} = this.props.ros
    const transformNamespace = this.state.transformNamespace
    const updateNamespace = (this.props.update_namespace !== undefined)? this.props.update_namespace : transformNamespace + "/update_transform"
    const frame_name = (this.props.frame_name !== undefined)? this.props.frame_name : ""
    const comp_name = (this.props.comp_name !== undefined)? this.props.comp_name : ""
    const type_name = (this.props.type_name !== undefined)? this.props.type_name : ""
    if (transform_data != null) {
      sendUpdateTransformMsg(updateNamespace,transform_data,frame_name,comp_name,type_name)
    }
  }


  sendTransformClearMessage(){
    const transform_data = this.props.ros.blankTransform
    this.sendTransformUpdateMessage(transform_data)
  }


  onUpdateInputTransformValue(event, name) {
    const value = event.target.value
    var transform_data = this.state.transform_data
    transform_data[name] = value
    this.setState({ transform_data: transform_data })
    document.getElementById(name).style.color = Styles.vars.colors.red
    //this.render()
  }

  onKeySaveInputTransformValue(event, name) {
    var transform_data = this.state.transform_data
    const transform_data_copy = this.state.transform_data_copy
    if(event.key === 'Enter'){
      const value = parseFloat(event.target.value)
      if (value === NaN) {
        transform_data[name] = transform_data_copy[name]
      }
      else{
        transform_data[name] = value
      }
      this.setState({ transform_data: transform_data })
      this.sendTransformUpdateMessage(transform_data)
      
      document.getElementById(name).style.color = Styles.vars.colors.black
    }
  }



  renderTransform() {
    const transformNamespace = this.state.transformNamespace ? this.state.transformNamespace : "None"

    const transform_data = this.props.transform_data !== undefined ? this.props.transform_data : ((this.state.transform_data != null) ? this.state.transform_data : null)


    if (transform_data == null) {

      return(
        <Columns>
          <Column>

          </Column>
        </Columns>
      )

    }
    else {
      const allow_updates = (this.props.allow_updates !== undefined)? this.props.allow_updates : true

      const { userRestricted} = this.props.ros
      const transform_control_restricted = userRestricted.indexOf('SYSTEM-TRANSFORM_CONTROL') !== -1

      const disabled = transform_control_restricted === true && allow_updates === true

      const msg = ("\n\nSource Desc: " + transform_data.source_ref_description + 
      "\n\nEnd Desc: " + transform_data.end_ref_description
      )

      return (
        <React.Fragment>



            <label align={"left"} textAlign={"left"}>
            {msg}
            </label>

            <Columns>
            <Column>

            <Label title={"X (m)"}>
              <Input
                value={transform_data.transformTX}
                id="transformTX"
                disabled={disabled === true}
                onChange= {(event) => this.onUpdateInputTransformValue(event,"transformTX")}
                onKeyDown= {(event) => this.onKeySaveInputTransformValue(event,"transformTX")}
                style={{ width: "80%" }}
              />
            </Label>

            <Label title={"Y (m)"}>
              <Input
                value={transform_data.transformTY}
                id="transformTY"
                disabled={disabled === true}
                onChange= {(event) => this.onUpdateInputTransformValue(event,"transformTY")}
                onKeyDown= {(event) => this.onKeySaveInputTransformValue(event,"transformTY")}
                style={{ width: "80%" }}
              />
            </Label>

            <Label title={"Z (m)"}>
              <Input
                value={transform_data.transformTZ}
                id="transformTZ"
                disabled={disabled === true}
                onChange= {(event) => this.onUpdateInputTransformValue(event,"transformTZ")}
                onKeyDown= {(event) => this.onKeySaveInputTransformValue(event,"transformTZ")}
                style={{ width: "80%" }}
              />
            </Label>

            {/* <div hidden={updates === false}>
            <ButtonMenu>
              <Button onClick={() => this.sendTransformUpdateMessage()}>{"Update Transform"}</Button>
            </ButtonMenu>
            </div> */}




          </Column>
          <Column>

            <Label title={"Roll (deg)"}>
              <Input
                value={transform_data.transformRX}
                id="transformRX"
                disabled={disabled === true}
                onChange= {(event) => this.onUpdateInputTransformValue(event,"transformRX")}
                onKeyDown= {(event) => this.onKeySaveInputTransformValue(event,"transformRX")}
                style={{ width: "80%" }}
              />
            </Label>

            <Label title={"Pitch (deg)"}>
              <Input
                value={transform_data.transformRY}
                id="transformRY"
                disabled={disabled === true}
                onChange= {(event) => this.onUpdateInputTransformValue(event,"transformRY")}
                onKeyDown= {(event) => this.onKeySaveInputTransformValue(event,"transformRY")}
                style={{ width: "80%" }}
              />
            </Label>

                <Label title={"Yaw (deg)"}>
                  <Input
                    value={transform_data.transformRZ}
                    id="transformRZ"
                    disabled={disabled === true}
                    onChange= {(event) => this.onUpdateInputTransformValue(event,"transformRZ")}
                    onKeyDown= {(event) => this.onKeySaveInputTransformValue(event,"transformRZ")}
                    style={{ width: "80%" }}
                  />
                </Label>

                <div hidden={disabled === true}>
                    <ButtonMenu>
                        <Button onClick={() => this.sendTransformClearMessage()}>{"Clear Transform"}</Button>
                    </ButtonMenu>
                </div>


              </Column>
            </Columns>

        </React.Fragment>
      )
    }
  }

  renderConfigs(){
    const { sendTriggerMsg } = this.props.ros
    const configNamespace = this.state.configNamespace ? this.state.configNamespace : this.state.transformNamespace
    return(
      <Columns>
      <Column>


          <NepiIFConfig
                        namespace={configNamespace}
                        title={"Nepi_IF_Config"}
          />

        </Column>
        </Columns>


    )

  }

  render() {
    const make_section = this.props.make_section ? this.props.make_section : true
    const transformNamespace = this.state.transformNamespace ? this.state.transformNamespace : 'None'
    const title = this.props.title  ? this.props.title : "NavPose Transform";
    const show_line = (this.props.show_line !== undefined)? this.props.show_line : true
    const show_config = (this.props.show_config !== undefined)? this.props.show_config : false
    const { userRestricted} = this.props.ros
    const transform_view_restricted = userRestricted.indexOf('SYSTEM-TRANSFORM-VIEW') !== -1


    if (transformNamespace == null || transform_view_restricted === true) {

      return(
        <Columns>
          <Column>

          </Column>
        </Columns>
      )

    }
    else if (make_section === false) {
      return (
          <React.Fragment>
                { (show_line === true) ?
                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
                : null }
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {title}
            </label>
            {this.renderTransform()}
            { (show_config === true) ?
                this.renderConfigs()
            : null }

          </React.Fragment>
      )
    }
    else {
      return (
        <Section title={title}>
          {this.renderTransform()}
            { (show_config === true) ?
                this.renderConfigs()
            : null }
        </Section>

      )
    }
    
  }
  }


export default NepiIFTransform