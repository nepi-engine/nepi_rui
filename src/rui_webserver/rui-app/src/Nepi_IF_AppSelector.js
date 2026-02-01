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
import Button, { ButtonMenu } from "./Button"


import AppRender from "./Nepi_IF_Apps"


// DEVICE Classes
import DriversMgr from "./NepiSystemDrivers"
import IDX from "./NepiDeviceIDX"
import PTX from "./NepiDevicePTX"
import LSX from "./NepiDeviceLSX"
import RBX from "./NepiDeviceRBX"
import NPX from "./NepiDeviceNPX"

//import TargetsMgr from "./NepiMgrTargets"

// DATE Classes
import NavPoseMgr from "./NepiMgrNavPose"
import NepiDashboardData from "./NepiDashboardData"

// PROCESS Classes
import AutomationMgr from "./NepiMgrAutomation"

// AUTO CLASSES
import AifsMgr from "./NepiSystemAIFs"

import AiDetectorMgr from "./NepiMgrAiDetector"
//import AiSegmentorMgr from "./NepiMgrAiSegmentor"
//import AiPoserMgr from "./NepiMgrAiPoser"
//import AiOrientatorMgr from "./NepiMgrAiOrientator"
//import TargetsMgr from "./NepiMgrTargets"

// Other SYSTEM Classes
import DeviceMgr from "./NepiSystemDevice"
import SoftwareMgr from "./NepiSystemSoftware"
import AppsMgr from "./NepiSystemApps"





@inject("ros")
@observer

class NepiIFAppSelector extends Component {
  constructor(props) {
    super(props)

    this.state = {

      connectedToNepi: false,
      connectedToAppsMgr: false,
      connectedToDriversMgr: false,
      connectedToAiModelsMgr: false,
      app_id: 'NONE',
      selected_app: 'NONE',
      full_screen: false,

      needs_update: false
    }


    this.checkConnection = this.checkConnection.bind(this)
    this.onToggleAppSelection = this.onToggleAppSelection.bind(this)  

    
  }



  async checkConnection() {
    const { connectedToNepi , connectedToAppsMgr, connectedToDriversMgr, connectedToAiModelsMgr} = this.props.ros
    if (this.state.connectedToNepi !== connectedToNepi){
      this.setState({connectedToNepi: connectedToNepi,
                    app_id: 'NONE',
                    selected_app: 'NONE', needs_update: true})
    }
    if (this.state.connectedToAppsMgr !== connectedToAppsMgr  || 
         this.state.connectedToDriversMgr !== connectedToDriversMgr || 
         this.state.connectedToAiModelsMgr !== connectedToAiModelsMgr)
    {
      this.setState({needs_update: true})
    }

    setTimeout(async () => {
      await this.checkConnection()
    }, 100)
  }




  componentDidMount(){
    this.checkConnection()
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const needs_update = this.state.needs_update
    if (needs_update) {
      this.setState({ needs_update: false})
    }
  }





  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
      this.setState({selected_app: 'NONE'})
  }





  renderApplication() {
    const sel_app = this.state.selected_app
    const {appsNameList, appsStatusList} = this.props.ros

    if (sel_app === "NONE"){
      return (
        <React.Fragment>
      <Columns>
        <Column>

      </Column>
      </Columns>   
        </React.Fragment>
      )
    }
    else if (sel_app === "Drivers Manager"){
      return (
        <React.Fragment>
          <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
          </label>
      <Columns>
        <Column>
        <DriversMgr
         title={"Drivers Manager"}
         />
      </Column>
      </Columns> 
        </React.Fragment>
      )
    }
    else if (sel_app === "Imaging"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {this.state.selected_app}
            </label>
      <Columns>
        <Column>
        <IDX
         title={"IdxDevice"}
         />
      </Column>
      </Columns>    
        </React.Fragment>
      )
    }
    else if (sel_app === "PanTilts"){
      return (
        <React.Fragment>
          <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {this.state.selected_app}
          </label>
      <Columns>
        <Column>
        <PTX
         title={"PtxDevice"}
         />
      </Column>
      </Columns>   
        </React.Fragment>
      )
    }
    else if (sel_app === "Lights"){
      return (
        <React.Fragment>
          <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {this.state.selected_app}
          </label>
        <Columns>
        <Column>
        <LSX
         title={"LsxDevice"}
         />
      </Column>
      </Columns>   
        </React.Fragment>
      )
    }
    else if (sel_app === "Robots"){
      return (
        <React.Fragment>
          <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {this.state.selected_app}
          </label>
      <Columns>
        <Column>
        <RBX
         title={"RbxDevice"}
         />
         </Column>
         </Columns>   
        </React.Fragment>
      )
    }
    else if (sel_app === "NavPose"){
      return (
        <React.Fragment>
          <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {this.state.selected_app}
          </label>
      <Columns>
        <Column>
        <NPX
         title={"NpxDevice"}
         />
      </Column>
      </Columns>   
        </React.Fragment>
      )
    }




    else if (sel_app === "NavPose Manager"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <NavPoseMgr
              title={"NavPose Manager"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }

    else if (sel_app === "Data Manager"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <NepiDashboardData
              title={"Data Manager"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }


    // if (sel_app === "Targeting"){
    //   return (
    //     <React.Fragment>
    //         <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
    //         {sel_app}
    //         </label>
    //         <Columns>
    //         <Column>

    //           <TargetsMgr
    //           title={"Targeting"}
    //           />

    //       </Column>
    //       </Columns>  
    //     </React.Fragment>
    //   )
    // }
    if (sel_app === "AI Detector"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <AiDetectorMgr
              title={"AI Detector"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }

    {/*
    if (sel_app === "AI Segmentor"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <AiSegmentorMgr
              title={"AI Segmentor"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }
    if (sel_app === "AI Poser"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <AiPoserMgr
              title={"AI Poser"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }
    if (sel_app === "AI Orientator"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <AiOrientatorMgr
              title={"AI Orientator"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }
  */}
    if (sel_app === "AI Model Manager"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <AifsMgr
              title={"AI Model Manager"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }


    else if (sel_app === "Device Manager"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <DeviceMgr
              title={"Device Manager"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }
    else if (sel_app === "Automation Mgr"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <AutomationMgr
              title={"Automation Manager"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }

    else if (sel_app === "Software Manager"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <SoftwareMgr
              title={"Software Manager"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }
    if (sel_app === "Apps Manager"){
      return (
        <React.Fragment>
            <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
            </label>
            <Columns>
            <Column>

              <AppsMgr
              title={"Apps Manager"}
              />

          </Column>
          </Columns>  
        </React.Fragment>
      )
    }



    else if (appsNameList.indexOf(sel_app) !== -1){
      return (
         <AppRender
         sel_app={sel_app}
         />
       );
     }


    else {
      return (
        <React.Fragment>
            {/* <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
            {sel_app}
          </label> */}

          <Columns>
          <Column>

          </Column>
          </Columns> 
        </React.Fragment>
      )
    }


  }




  onToggleAppSelection(event){
    const app_name = event.target.value
    if (app_name === 'Connecting' || app_name === 'NONE'){
      this.setState({full_screen: false })
    }
    else {
      this.setState({selected_app: app_name, full_screen: true })
    }
  }


  // Function for creating image topic options.
  getAppOptions() {
    const {idxDevices,lsxDevices,ptxDevices,rbxDevices,npxDevices} = this.props.ros
    
    const app_id = (this.props.app_id !== undefined) ? this.props.app_id : 'NONE'

    const connected = this.state.connectedToNepi

    const appsList = this.props.ros.apps_list
    const ruiList = this.props.ros.apps_rui_list 
    const groupList = this.props.ros.apps_group_list
    const activeAppList = this.props.ros.apps_active_list

    var items = []
    if (connected !== true){
      items.push(<Option value={'Connecting'}>{'Connecting'}</Option>)
    }
    else {
      const userRestrictionsActive = this.props.userRestrictionsActive
      if (app_id === 'DEVICE') {

        if (Object.keys(idxDevices).length > 0){
          items.push(<Option value={"Imaging"}>{"Imaging"}</Option>)
        }
        if (Object.keys(ptxDevices).length > 0){
          items.push(<Option value={"PanTilts"}>{"PanTilts"}</Option>)
        }
        if (Object.keys(lsxDevices).length > 0){
          items.push(<Option value={"Lights"}>{"Lights"}</Option>)
        }
        if (Object.keys(rbxDevices).length > 0){
          items.push(<Option value={"Robots"}>{"Robots"}</Option>)
        }
        if (Object.keys(npxDevices).length > 0){
          items.push(<Option value={"NavPose"}>{"NavPose"}</Option>)
        }
  

        if (appsList.length > 0){
          for (var i = 0; i < ruiList.length; i++) {
            if (groupList[i] === "DEVICE" && ruiList[i] !== "None" && activeAppList.indexOf(appsList[i]) !== -1 ){
              items.push(<Option value={appsList[i]}>{ruiList[i]}</Option>)
            }
          }
        }
      }
      else if (app_id === 'DATA') {
        if (appsList.length > 0){
          for (var i = 0; i < ruiList.length; i++) {
            if (groupList[i] === "DATA" && ruiList[i] !== "None" && activeAppList.indexOf(appsList[i]) !== -1 ){
              items.push(<Option value={appsList[i]}>{ruiList[i]}</Option>)
            }
          }
        }
      }

      else if (app_id === 'PROCESS') {
        
        if (appsList.length > 0){
          for (var i = 0; i < ruiList.length; i++) {
            if (groupList[i] === "PROCESS" && ruiList[i] !== "None" && activeAppList.indexOf(appsList[i]) !== -1 ){
              items.push(<Option value={appsList[i]}>{ruiList[i]}</Option>)
            }
          }
        }

        if (true) { //((userRestrictionsActive.indexOf('ai_management')) {
            const activeModelTypes = this.props.ros.active_models_types

            if (activeModelTypes.indexOf('detection') !== -1){
              items.push(<Option value={'AI Detector'}>{'AI Detector'}</Option>)
            }
            if (activeModelTypes.indexOf('segmentation') !== -1){
              items.push(<Option value={'AI Segmetation'}>{'AI Segmetation'}</Option>)
            }
            if (activeModelTypes.indexOf('pose') !== -1){
              items.push(<Option value={'AI Pose'}>{'AI Pose'}</Option>)
            }
            if (activeModelTypes.indexOf('orientation') !== -1){
              items.push(<Option value={'AI Orienation'}>{'AI Orienation'}</Option>)
            }
        }
      }

      else if (app_id === 'AUTOMATION') {
        if (appsList.length > 0){
          for (var i = 0; i < ruiList.length; i++) {
            if (groupList[i] === "AUTOMATION" && ruiList[i] !== "None" && activeAppList.indexOf(appsList[i]) !== -1 ){
              items.push(<Option value={appsList[i]}>{ruiList[i]}</Option>)
            }
          }
        }
      }


      else if (app_id === 'SYSTEM') {

        if (true) { //((userRestrictionsActive.indexOf('device_manager')) {
            items.push(<Option value={'Device Manager'}>{'Device Manager'}</Option>)
        }   
        

        if (true) { //((userRestrictionsActive.indexOf('data_manager')) {
          items.push(<Option value={"Data Manager"}>{"Data Manager"}</Option>)
        }

        if (true) { //((appsList.indexOf('software_mgr') !== -1 ) && (this.props.ros.connectedToSoftwareMgr === true) && (userRestrictionsActive.indexOf('software_manager')) {
            items.push(<Option value={'Software Manager'}>{'Software Manager'}</Option>)
        }        
        

        if (true) { //((appsList.indexOf('navpose_mgr') !== -1 ) && (this.props.ros.connectedToNavPosesMgr === true) && (userRestrictionsActive.indexOf('navpose_manager')) {
            items.push(<Option value={"NavPose Manage"}>{"NavPose Manage"}</Option>)
        }


        if (true) { //((appsList.indexOf('drivers_mgr') !== -1 ) && (this.props.ros.connectedToDriversMgr === true) && (userRestrictionsActive.indexOf('drivers_manager')) {
            items.push(<Option value={'Drivers Manager'}>{'Drivers Manager'}</Option>)
        }   
        

        if (true) { //((appsList.indexOf('ai_model_mgr') !== -1 ) && (this.props.ros.connectedToAiModelMgr === true) && (userRestrictionsActive.indexOf('ai_model_manager')) {
           items.push(<Option value={'AI Model Manager'}>{'AI Model Manager'}</Option>)
        }   
        

        if (true) { //((appsList.indexOf('apps_mgr') !== -1 ) && (this.props.ros.connectedToAppsMgr === true) && (userRestrictionsActive.indexOf('apps_manager')) {
           items.push(<Option value={'Apps Manager'}>{'Apps Manager'}</Option>)
        }   

        if (true) { //((appsList.indexOf('automation_mgr') !== -1 ) && (this.props.ros.connectedToAutomationMgr === true) && (userRestrictionsActive.indexOf('automation_manager')) {
           items.push(<Option value={'Automation Mgr'}>{'Automation Mgr'}</Option>)
        }   
        
 
        if (appsList.length > 0){
          for (var i = 0; i < ruiList.length; i++) {
            if (groupList[i] === "SYSTEM" && ruiList[i] !== "None" && activeAppList.indexOf(appsList[i]) !== -1){
              items.push(<Option value={appsList[i]}>{ruiList[i]}</Option>)
            }
          }
        }
      }
    }

    if (items.length === 0){
      items.push(<Option value={'NONE'}>{'Waiting for Apps'}</Option>)
    }


    return items
  }


    renderSelection() {
    const app_options = this.getAppOptions()

    return (
      <React.Fragment>

      <Columns>
        <Column>

        <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
          {"Select App"}
         </label>


        <div style={{backgroundColor: Styles.vars.colors.grey0}}>
            <Select style={{width: "10px"}}/>
            {app_options.map((app) =>
            <div onClick={this.onToggleAppSelection}
              style={{
                textAlign: "center",
                padding: `${Styles.vars.spacing.xs}`,
                color: Styles.vars.colors.black,
                backgroundColor: (app.props.value === this.state.selected_app) ? Styles.vars.colors.blue : Styles.vars.colors.grey0,
                cursor: "pointer",
                }}>
                <body app-topic ={app} style={{color: (app === 'Connecting') ? Styles.vars.colors.blue : Styles.vars.colors.black}}>{app}</body>
            </div>
            )}
         
        </div>
      </Column>
      </Columns>

      </React.Fragment>
    )
  }



  render() {
    const app_id = (this.props.app_id !== undefined) ? this.props.app_id : 'NONE'
    if (this.state.app_id !== app_id){
      this.setState({app_id: app_id,
                    selected_app: 'NONE', needs_update: true})

    }
    const app_selected = (this.state.selected_app !== 'NONE')
    const full_screen = (this.state.full_screen === true) && (app_selected === true)
    const sel_col_width = (full_screen === false) ? '12%' : '3%'
    const app_col_width = (full_screen === false) ? '85%' : '94%'

        
      return (
        <React.Fragment>

        <div style={{ display: 'flex' }}>
          <div style={{ width: sel_col_width }}>


              { (full_screen === true) ?

                        <ButtonMenu>
                          <Button onClick={() => this.setState({full_screen: false})}>{'\u25BC'}</Button>
                        </ButtonMenu>

                    
                :
                  this.renderSelection()
              }

          </div>

          <div style={{ width: '3%' }}>
              {}
          </div>

          <div style={{ width: app_col_width }}>

              
              { (app_selected === true) ?
                this.renderApplication()
                : null }

          </div>
        </div>
        
        </React.Fragment>

      )
  }

}

export default NepiIFAppSelector
