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
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Select, { Option } from "./Select"
import BooleanIndicator from "./BooleanIndicator"

import PointcloudApp from "./NepiAppPointcloud"
import AiTargetingApp from "./NepiAppAiTargeting"
import ImageViewerApp from "./NepiAppImageViewer"
import ImageSequencer from "./NepiAppImageSequencer"
import OnvifApp from "./NepiAppOnvif"




import { createMenuListFromStrList,onUpdateSetStateValue} from "./Utilities"

@inject("ros")
@observer

// Pointcloud Application page
class AppsSelector extends Component {
  constructor(props) {
    super(props)

    this.state = {
      show_delete_app: false,
      mgrName: "apps_mgr",
      mgrNamespace: null,

      viewableApps: false,

      apps_list: [],
      last_apps_list: [],
      apps_active_list: [],
      apps_install_path: null,
      apps_install_list: [],
      selected_app: null,

      apps_rui_list: [],

      app_name: 'NONE',
      app_description: null,
      apps_path: null,
      app_options_menu: null,
      active_state: null,

      backup_removed_apps: true,

      connected: false,

      appsListener: null,
      appListener: null,

      app_selected: null,



      selected_app_install_pkg: null
    }


    this.getMgrNamespace = this.getMgrNamespace.bind(this)

    this.updateAppsStatusListener = this.updateAppsStatusListener.bind(this)
    this.appsStatusListener = this.appsStatusListener.bind(this)

    this.updateAppStatusListener = this.updateAppStatusListener.bind(this)
    this.statusAppListener = this.statusAppListener.bind(this)  

  
  }

  getMgrNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var mgrNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      mgrNamespace = "/" + namespacePrefix + "/" + deviceId + "/" + this.state.mgrName
    }
    return mgrNamespace
  }

  // Callback for handling ROS Status messages
  appsStatusListener(message) {
    this.setState({
      apps_path: message.apps_path,
      apps_list: message.apps_ordered_list,
      apps_active_list: message.apps_active_list,
      apps_install_path: message.apps_install_path,
      apps_install_list: message.apps_install_list,
      backup_removed_apps: message.backup_removed_apps,
      apps_rui_list: message.apps_rui_list,
      selected_app: message.selected_app
    })    

  }

  // Function for configuring and subscribing to Status
  updateAppsStatusListener() {
    const statusNamespace = this.getMgrNamespace() + '/status'
    if (this.state.appsListener) {
      this.state.appsListener.unsubscribe()
    }
    var appsListener = this.props.ros.setupStatusListener(
          statusNamespace,
          "nepi_ros_interfaces/AppsStatus",
          this.appsStatusListener
        )
    this.setState({ appsListener: appsListener})
  }


  statusAppListener(message) {
    this.setState({
  
      app_name: message.name,
      app_description: message.description,
      active_state: message.active_state,
      order: message.order,
      msg_str: message.msg_str

    })
  }

    // Function for configuring and subscribing to Status
    updateAppStatusListener() {
      const namespace = this.getMgrNamespace()
      const statusNamespace = namespace + '/status_app'
      if (this.state.appListener) {
        this.state.appListener.unsubscribe()
      }
      var appListener = this.props.ros.setupStatusListener(
            statusNamespace,
            "nepi_ros_interfaces/AppStatus",
            this.statusAppListener
          )
      this.setState({ appListener: appListener})
    }


  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const namespace = this.getMgrNamespace()
    if (prevState.mgrNamespace !== namespace && namespace !== null) {
      if (namespace.indexOf('null') === -1) {
        this.setState({
          mgrNamespace: namespace,
          connected: true
        })
        this.updateAppsStatusListener()
        this.updateAppStatusListener()
      } 
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    if (this.state.appsListener) {
      this.state.appsListener.unsubscribe()
      this.state.appListener.unsubscribe()
    }
  }



  renderAiTargetingApp() {
    return (
      <Columns>
        <Column>

        <AiTargetingApp
         title={"AiTargetingApp"}
         />

      </Column>
      </Columns>
    )
  }

  renderImageSequencerApp() {
    return (
      <Columns>
        <Column>

        <ImageSequencer
         title={"ImageSequencer"}
         />

      </Column>
      </Columns>
    )
  }

  renderImageViewerApp() {
    return (
      <Columns>
        <Column>

        <ImageViewerApp
         title={"ImageViewerApp"}
         />

      </Column>
      </Columns>
    )
  }

  renderOnvifApp() {
    return (
      <Columns>
        <Column>

        <OnvifApp
         title={"OnvifApp"}
         />

      </Column>
      </Columns>
    )
  }

  renderPointcloudApp() {
    return (
      <Columns>
        <Column>

        <PointcloudApp
         title={"PointcloudApp"}
         />

      </Column>
      </Columns>
    )
  }

  renderSelection() {
    const NoneOption = <Option>None</Option>

    return (
      <React.Fragment>
      <Section title={"Application Selection"}>

      <Columns>
        <Column>

        <Label title={"Select Application"}>
                    <Select
                      id="app_selection"
                      onChange={(event) => onUpdateSetStateValue.bind(this)(event,"app_selected")}
                      value={this.state.app_selected}
                    >
                      {this.state.apps_rui_list
                        ? createMenuListFromStrList(this.state.apps_rui_list, false, [],[],[])
                        : NoneOption}
                    </Select>
                  </Label>

      </Column>
      <Column>

      </Column>
      <Column>

      </Column>
      </Columns>

      </Section>

      </React.Fragment>
    )
  }

  render() {
    return (


      <Columns>
      <Column>
                  {this.renderSelection()}

                  <div hidden={this.state.app_selected !== "AI_Targeting"}>
                  {this.renderAiTargetingApp()}    
                  </div>

                  <div hidden={this.state.app_selected !== "Image_Sequencer"}>
                  {this.renderImageSequencerApp()}    
                  </div>

                  <div hidden={this.state.app_selected !== "Image_Viewer"}>
                  {this.renderImageViewerApp()}    
                  </div>


                  <div hidden={this.state.app_selected !== "ONVIF"}>
                  {this.renderOnvifApp()}    
                  </div>

                  <div hidden={this.state.app_selected !== "Pointcloud"}>
                  {this.renderPointcloudApp()}    
                  </div>

      </Column>
      </Columns>


    )
  }

}

export default AppsSelector
