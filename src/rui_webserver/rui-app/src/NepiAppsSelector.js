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
import Styles from "./Styles"

import PointcloudApp from "./NepiAppPointcloud"
import AiTargetingApp from "./NepiAppAiTargeting"
import ImageViewerApp from "./NepiAppImageViewer"
import ImageSequencer from "./NepiAppImageSequencer"
import OnvifApp from "./NepiAppOnvif"




import { createMenuListFromStrList} from "./Utilities"

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

      viewableApps: false,

      selected_app_install_pkg: null
    }


    this.getMgrNamespace = this.getMgrNamespace.bind(this)

    this.updateAppsStatusListener = this.updateAppsStatusListener.bind(this)
    this.appsStatusListener = this.appsStatusListener.bind(this)

    this.toggleViewableApps = this.toggleViewableApps.bind(this)  
    this.onToggleAppSelection = this.onToggleAppSelection.bind(this)  

    
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


  toggleViewableApps() {
    this.setState({viewableApps: true})
  }

  onToggleAppSelection(event){
    const app_name = event.target.value
    this.setState({selected_app: app_name})
    this.toggleViewableApps()
  }


  // Function for creating image topic options.
  getAppOptions() {
    const appsList = this.state.apps_rui_list 
    var items = []
    items.push(<Option>{"NONE"}</Option>) 
    if (appsList.length > 0){
      for (var i = 0; i < appsList.length; i++) {
          items.push(<Option value={appsList[i]}>{appsList[i]}</Option>)
     }
    }
    return items
  }

  renderSelection() {
    const viewableApps = this.state.viewableApps
    const app_options = this.getAppOptions()

    return (
      <React.Fragment>
      <Section title={"Application Selection"}>

      <Columns>
        <Column>

{/*
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
*/}

                  <Label title="Select Application">
                    <div onClick={this.toggleViewableApps} style={{backgroundColor: Styles.vars.colors.grey0}}>
                      <Select style={{width: "10px"}}/>
                    </div>
                    <div hidden={!viewableApps}>
                    {app_options.map((app) =>
                    <div onClick={this.onToggleAppSelection}
                      style={{
                        textAlign: "center",
                        padding: `${Styles.vars.spacing.xs}`,
                        color: Styles.vars.colors.black,
                        backgroundColor: (app.props.value === this.state.selected_app) ?
                          Styles.vars.colors.green :
                          (app.props.value === this.state.selected_app) ? Styles.vars.colors.blue : Styles.vars.colors.grey0,
                        cursor: "pointer",
                        }}>
                        <body app-topic ={app} style={{color: Styles.vars.colors.black}}>{app}</body>
                    </div>
                    )}
                    </div>
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

                  <div hidden={this.state.selected_app !== "AI_Targeting"}>
                  {this.renderAiTargetingApp()}    
                  </div>

                  <div hidden={this.state.selected_app !== "Image_Sequencer"}>
                  {this.renderImageSequencerApp()}    
                  </div>

                  <div hidden={this.state.selected_app !== "Image_Viewer"}>
                  {this.renderImageViewerApp()}    
                  </div>


                  <div hidden={this.state.selected_app !== "ONVIF"}>
                  {this.renderOnvifApp()}    
                  </div>

                  <div hidden={this.state.selected_app !== "Pointcloud"}>
                  {this.renderPointcloudApp()}    
                  </div>

      </Column>
      </Columns>


    )
  }

}

export default AppsSelector
