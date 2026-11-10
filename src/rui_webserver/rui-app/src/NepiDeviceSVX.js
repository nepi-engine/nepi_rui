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
import Toggle from "react-toggle"


import Section from "./Section"
import { Columns, Column } from "./Columns"
import Select, { Option } from "./Select"
import Label from "./Label"
import AsyncToggle from "./AsyncToggle"
import Styles from "./Styles"


import NepiIFSaveData from "./Nepi_IF_SaveData"
import NepiIFConnectNavPose from "./Nepi_IF_ConnectNavPose"
import NepiIFSettings from "./Nepi_IF_Settings"
import NepiIFMessages from "./Nepi_IF_Messages"


import NepiDeviceSVXControls from "./NepiDeviceSVX-Controls"
import NepiDeviceSVXImageViewer from "./NepiDeviceSVX-ImageViewer"

@inject("ros")
@observer

// Component that contains the SVX controls
class NepiDeviceSVX extends Component {
  constructor(props) {
    super(props)

    this.state = {
      namespace: 'None',
      node_name: 'None',

      // Every discovered servo's servo_connected flag, by namespace. The selector
      // lists only servos marked connected unless show_all_channels is on.
      connected_dict: {},
      // Every discovered servo's has_connected_control. False for a driver that
      // declares its servos always connected (a fixed pan-tilt): no toggle shown.
      connect_control_dict: {},
      show_all_channels: false,

    }

    // One status listener per discovered servo, by namespace. Kept off state
    // because nothing renders from the listener objects themselves.
    this.connectedListeners = {}

    this.renderImageViewer = this.renderImageViewer.bind(this)

    this.setDeviceSelection = this.setDeviceSelection.bind(this)
    this.clearDeviceSelection = this.clearDeviceSelection.bind(this)
    this.createDeviceOptions = this.createDeviceOptions.bind(this)
    this.onDeviceSelected = this.onDeviceSelected.bind(this)

    this.updateConnectedListeners = this.updateConnectedListeners.bind(this)
    this.onConnectedStatus = this.onConnectedStatus.bind(this)

    this.renderDeviceSelection = this.renderDeviceSelection.bind(this)

   }


  // The SVX status_msg query does not carry servo_connected (it is runtime
  // config, not a capability), so read it from each servo's own status topic.
  updateConnectedListeners() {
    const topics = Object.keys(this.props.ros.svxDevices)
    const listeners = this.connectedListeners
    for (var i = 0; i < topics.length; i++) {
      const svx_namespace = topics[i]
      if (listeners[svx_namespace] == null) {
        listeners[svx_namespace] = this.props.ros.setupSVXStatusListener(
          svx_namespace,
          (message) => this.onConnectedStatus(svx_namespace, message)
        )
      }
    }
    const listened = Object.keys(listeners)
    for (var j = 0; j < listened.length; j++) {
      const svx_namespace = listened[j]
      if (topics.indexOf(svx_namespace) === -1) {
        if (listeners[svx_namespace]) {
          listeners[svx_namespace].unsubscribe()
        }
        delete listeners[svx_namespace]
        if (svx_namespace in this.state.connected_dict || svx_namespace in this.state.connect_control_dict) {
          this.setState((prevState) => {
            const connected_dict = Object.assign({}, prevState.connected_dict)
            delete connected_dict[svx_namespace]
            const connect_control_dict = Object.assign({}, prevState.connect_control_dict)
            delete connect_control_dict[svx_namespace]
            return { connected_dict: connected_dict, connect_control_dict: connect_control_dict }
          })
        }
      }
    }
  }

  // Status arrives at the servo's status rate, so only touch state on a change.
  onConnectedStatus(svx_namespace, message) {
    // RC1 DeviceSVXStatus reports servo connected in its 'connected' field
    const connected = (message.connected === true)
    const connect_control = (message.has_connected_control !== false)
    if (this.state.connected_dict[svx_namespace] !== connected) {
      this.setState((prevState) => ({
        connected_dict: Object.assign({}, prevState.connected_dict, { [svx_namespace]: connected })
      }))
    }
    if (this.state.connect_control_dict[svx_namespace] !== connect_control) {
      this.setState((prevState) => ({
        connect_control_dict: Object.assign({}, prevState.connect_control_dict, { [svx_namespace]: connect_control })
      }))
    }
  }

  componentDidMount() {
    this.updateConnectedListeners()
  }

  // svxDevices is observed in render, so a servo appearing or vanishing re-renders
  // this component and lands here.
  componentDidUpdate(prevProps, prevState, snapshot) {
    this.updateConnectedListeners()
  }

  componentWillUnmount() {
    const listened = Object.keys(this.connectedListeners)
    for (var i = 0; i < listened.length; i++) {
      if (this.connectedListeners[listened[i]]) {
        this.connectedListeners[listened[i]].unsubscribe()
      }
    }
    this.connectedListeners = {}
  }


  setDeviceSelection(namespace) {
      this.setState({
        namespace: namespace,
      })
  }

  clearDeviceSelection() {
    this.setState({
      namespace: 'None',
    })
  }

  // Function for creating topic options for Select input
  createDeviceOptions() {
    const { svxDevices} = this.props.ros
    const topics = Object.keys(svxDevices)
    const namespace = this.state.namespace
    const show_all = (this.state.show_all_channels === true)
    var items = []
    items.push(<Option value={'None'}>{'None'}</Option>)
    var device_name = ""
    for (var i = 0; i < topics.length; i++) {
      const connected = (this.state.connected_dict[topics[i]] === true)
      // The current selection always stays listed, so switching Servo Connected
      // off does not yank the panel away mid-edit; it drops out of the list once
      // something else is selected.
      if (connected === false && show_all === false && topics[i] !== namespace) {
        continue
      }
      device_name = topics[i].split('/svx')[0].split('/').pop()
      if (connected === false) {
        device_name = device_name + " (not connected)"
      }
      items.push(<Option value={topics[i]}>{device_name}</Option>)
    }
    // Check that our current selection hasn't disappeard as an available option
    if ((namespace !== null) && (namespace !== 'None') && (topics.includes(namespace) === false)) {
      this.clearDeviceSelection()
    }
    if (namespace !== 'None' && (topics.indexOf(namespace) === -1)){
      this.setState({namespace: 'None'})
    }
    return items
  }

  // Handler for SVX Sensor topic selection
  onDeviceSelected(event) {
    const value = event.target.value
      this.setDeviceSelection(value)
  }



  renderDeviceSelection() {
    const { sendBoolMsg } = this.props.ros
    const namespace = this.state.namespace ? this.state.namespace : "None"
    const device_selected = (namespace !== 'None')
    const servo_connected = (this.state.connected_dict[namespace] === true)
    const has_connected_control = (this.state.connect_control_dict[namespace] !== false)
    const topics = Object.keys(this.props.ros.svxDevices)
    const connected_count = topics.filter((topic) => this.state.connected_dict[topic] === true).length
    const show_hint = (topics.length > 0 && connected_count === 0 && this.state.show_all_channels === false)

      return(

        <React.Fragment>

          <Columns>
          <Column>

            <Label title={"Device"}>
              <Select
                onChange={this.onDeviceSelected}
                value={namespace}
              >
                {this.createDeviceOptions()}
              </Select>
            </Label>

            <Label title={"Show All Channels"}>
              {/* react-toggle (not AsyncToggle): checked is local view state, already immediate -- no backend round trip to confirm. */}
              <Toggle
                checked={this.state.show_all_channels === true}
                onClick={() => this.setState({ show_all_channels: !this.state.show_all_channels })}
              />
            </Label>

          </Column>
          <Column>

          </Column>
        </Columns>

          {(show_hint === true) ?
            <div style={{ marginBottom: Styles.vars.spacing.small }}>
              {"No servos are marked connected. Turn on Show All Channels, select the channel your servo is plugged into, and switch on Servo Connected."}
            </div>
          : null}

          {(device_selected === true && has_connected_control === true) ?
            <Columns>
            <Column>

              <Label title={"Servo Connected"}>
                <AsyncToggle
                  checked={servo_connected}
                  onClick={() => sendBoolMsg(namespace + "/set_servo_connected", !servo_connected)}
                />
              </Label>

            </Column>
            <Column>

            </Column>
          </Columns>
          : null}

        </React.Fragment>

      )
  }



  renderImageViewer() {
    const namespace = (this.state.namespace !== null) ? this.state.namespace : "None"
    return (
      <React.Fragment>

                <div id="svxImageViewer">
                  <NepiDeviceSVXImageViewer
                    id="svxImageViewer"
                    namespace={namespace}
                  />
                </div>


      </React.Fragment>
    )
  }


 render() {
    const device_selected = (this.state.namespace !== null && this.state.namespace !== 'None')
    const namespace = (this.state.namespace !== null) ? this.state.namespace : 'None'
    const status_msg = this.props.ros.svxDevices[namespace]

    const save_data_topic = (status_msg && status_msg.save_data_topic) ? status_msg.save_data_topic : null
    const settings_topic = (status_msg && status_msg.settings_topic) ? status_msg.settings_topic : null
    const navpose_connect_topic = (status_msg && status_msg.connect_navpose_topic) ? status_msg.connect_navpose_topic : null
    const navpose_topic = (status_msg && status_msg.navpose_topic) ? status_msg.navpose_topic : null  
        return (

          <Columns>
          <Column>


        
          <div style={{ display: 'flex' }}>

              <div style={{ width: "73%" }}>


              {(device_selected === true) ?
              this.renderImageViewer()
              : null}


                  {(device_selected === true) ?
                      <NepiIFSaveData
                      saveNamespace={save_data_topic}
                      make_section={true}
                      show_all_save_options={false}
                      show_topic_selector={false}
                    />
                : null}

                  {(device_selected === true) ?
                    <NepiIFConnectNavPose
                    namespace={navpose_connect_topic}
                    navpose_topic={navpose_topic}
                    select_title={"NavPose Frame"}
                    show_selector={true}
                    show_transform={true}
                    show_controls={true}
                    show_data={false}
                    make_section={true}
                    />
                  : null}


                  {(device_selected === true) ?
                    <NepiIFMessages
                    messagesNamespace={namespace + '/messages'}
                    hide_control={true}
                    title={"Messages"}
                    />
                  : null}

              </div>


              <div style={{ width: '2%' }}>
                    {}
              </div>



              <div style={{ width: "25%"}}>

                <Section title={"Servo Device"}>

                    {this.renderDeviceSelection()}


                          {(device_selected === true) ?
                          <NepiDeviceSVXControls
                              namespace={namespace}
                              make_section={false}
                        />
                        : null}

                        
                    </Section>

                      {(device_selected === true) ?
                          <NepiIFSettings
                            settingsNamespace={settings_topic}
                            allways_show_controls={true}
                            title={"Device Settings"}
                        />
                    : null}




              </div>

        </div>


          </Column>
        </Columns>

        )
  }

}


export default NepiDeviceSVX
