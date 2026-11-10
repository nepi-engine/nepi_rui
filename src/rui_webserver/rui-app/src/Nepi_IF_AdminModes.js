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
import AsyncToggle from "./AsyncToggle"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Styles from "./Styles"


import NepiIFAdminDebug from "./Nepi_IF_AdminDebug"

@inject("ros")
@observer
class NepiIFAdminModes extends Component {
  constructor(props) {
    super(props)
    this.state = {

      mode_selection: null

    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
    this.sendModeSelection = this.sendModeSelection.bind(this)
    this.renderDebugModes = this.renderDebugModes.bind(this)
    this.renderRunModes = this.renderRunModes.bind(this)
  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId
    }
    return baseNamespace
  }


  sendModeSelection(mode){
    const base_namespace = this.getBaseNamespace()
    this.props.ros.sendStringMsg(base_namespace + "/set_run_mode", mode)
    this.setState({mode_selection: mode})
  }




  renderDebugModes() {
  const base_namespace = this.getBaseNamespace()


  const debug_mode = this.props.ros.systemDebugEnabled

 return (


      <React.Fragment>


                <div style={{ display: 'flex' }}>
                        <div style={{ width: '40%' }} >
 
                             <Label title="Debug Mode">
                                    <AsyncToggle
                                    checked={debug_mode === true}
                                    onClick={() => this.props.ros.sendBoolMsg(base_namespace + "/set_debug_enable", !debug_mode)}>
                                  </AsyncToggle>
                              </Label>

                        </div>


                        <div style={{ width: '20%' }}>
                        </div>

            
                        <div style={{ width: '40%' }}>

                            

                        </div>

                  </div>



                    {                        
                      <NepiIFAdminDebug
                        make_section={false}
                        />    
                    }



      </React.Fragment>



    )

   
  }


  renderRunModes() {
    const base_namespace = this.getBaseNamespace()
    const run_mode = this.props.ros.systemRunMode
    const develop_mode = run_mode === 'develop'
    const deploy_mode = run_mode === 'deploy'


    return (


      <React.Fragment>


                <div style={{ display: 'flex' }}>
                        <div style={{ width: '40%' }} >
 
                                <Label title="Develop Mode">
                                      <AsyncToggle
                                      checked={develop_mode === true}
                                      disbled={develop_mode === true}
                                      onClick={() => this.sendModeSelection('develop')}>
                                    </AsyncToggle>
                                </Label>

                        </div>


                        <div style={{ width: '20%' }}>
                        </div>

            
                        <div style={{ width: '40%' }}>

                              <Label title="Deploy Mode">
                                    <AsyncToggle
                                    checked={deploy_mode === true}
                                    disbled={deploy_mode === true}
                                    onClick={() => this.sendModeSelection('deploy')}>
                                  </AsyncToggle>
                              </Label>

                        </div>


                  </div>



      </React.Fragment>



    )
  }



  render() {
    const base_namespace = this.getBaseNamespace()
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const title = (this.props.title !== undefined) ? this.props.title : "DEBUG MODES"
    const admin_mode_set = this.props.ros.systemAdminModeSet
    if (base_namespace == null){
      return (
  
        <Columns>
          <Column>
  
  
          </Column>
        </Columns>
      )
    }
    else if (make_section === false){

      return (

          <React.Fragment>


                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
                <Label title={title} />
                  {this.renderDebugModes()}
                  {(admin_mode_set === true) ? this.renderRunModes : null}

          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={title}>

                  {this.renderDebugModes()}
                  {(admin_mode_set === true) ? this.renderRunModes : null}

        </Section>
     )
   }

  }

}
export default NepiIFAdminModes
