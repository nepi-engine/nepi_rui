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
import Section from "./Section"
import Button, { ButtonMenu } from "./Button"
import { Columns, Column } from "./Columns"

import NepiIFAdminEnable from "./Nepi_IF_AdminEnable"
import NepiIFSettings from "./Nepi_IF_Settings"

@inject("ros")
@observer
class NepiMgr extends Component {
  constructor(props) {
    super(props)
    this.state = {
      
      connected: false,
      needs_update: false

    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
  
    this.renderSystemSetup = this.renderSystemSetup.bind(this)
    this.renderSystemNetlist = this.renderSystemNetlist.bind(this)


  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId
    }
    return baseNamespace
  }



  async checkConnection() {
    const { connectedToNepi } = this.props.ros
    if (this.state.connectedToNepi !== connectedToNepi){
      this.setState({connected: connectedToNepi})
    }
    this.setState({needs_update: !this.state.needs_update})
    setTimeout(async () => {
      await this.checkConnection()
    }, 500)
  }

  
  componentDidMount(){
    this.checkConnection()
  }
    
  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status message
  componentWillUnmount() {
    this.setState({connected: false})
  }



  renderSystemSetup(){
      const base_namespace = this.getBaseNamespace()
      const systemMgrStatus = this.props.ros.systemMgrStatus
      const nepi_updating_config = systemMgrStatus.nepi_updating_config

      var show_update_button = false
      var update_disabled = true
      var update_message = ''

      show_update_button
      if (nepi_updating_config === true ){
        update_disabled = true
        update_message = 'NEPI CONFIG UPDATING.  DO NOT POWER OFF SYSTEM'
      }
    
      return (


      <React.Fragment>


            <div style={{ display: 'flex' }}>
                    <div style={{ width: '25%' }}>


                    <div hidden={nepi_service_running === false}>
                        <ButtonMenu>
                          <Button disabled={update_disabled}
                            onClick={() => this.props.ros.sendTriggerMsg(base_namespace + "/update_system_config")}>{"Apply Updates"}
                          </Button>
                      </ButtonMenu>

                    </div>

                    </div>

                    <div style={{ width: '5%' }} >
                    </div>

                    <div style={{ width: '70%' }} >

                    <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                      {update_message}
                    </label> 

                    </div>
            </div>


        </React.Fragment>

      )

  }


    renderSystemNetlist(){
      const base_namespace = this.getBaseNamespace()
      const systemMgrStatus = this.props.ros.systemMgrStatus
      const netlist = systemMgrStatus.netlist_str
      return (


        <React.Fragment>


                          <Section title={("SYSTEM NETLIST")}>
                            
                              <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                                {netlist}
                              </label> 
                                  
                            </Section>



        </React.Fragment>

      )

  }




  render() {
    const base_namespace = this.getBaseNamespace()
    const systemMgrStatus = this.props.ros.systemMgrStatus
    const nepi_service_running = systemMgrStatus.nepi_service_running
    const admin_mode_set = this.props.ros.systemAdminModeSet

    const { userRestricted} = this.props.ros
    const admin_view_restricted = userRestricted.indexOf('SYSTEM-ADMIN-VIEW') !== -1  

    const show_admin = (admin_mode_set === true || admin_view_restricted === false)
    
    if (systemMgrStatus == null || base_namespace == null || show_admin === false){
      return (
  
        <Columns>
          <Column>
  
  
          </Column>
        </Columns>
      )
    }

    else if (nepi_service_running === false) {
      return (
                <React.Fragment>

                    <label style={{fontWeight: 'bold'}} align={"left"} textAlign={"left"}>
                      {'NEPI SERVICE NOT RUNNING'}
                    </label> 

              </React.Fragment>
            )
    }

    else {

      return (

          <React.Fragment>
                               


            <div style={{ display: 'flex' }}>
                    <div style={{ width: '30%' }} >


                          <Section title={("NEPI Setup")}>
                            
                                  {<NepiIFAdminEnable
                                    make_section={false}
                                    title={null}
                                    show_link_button={false}
                                    show_line={false}
                                    />}


                                  { admin_mode_set ? 
                                      this.renderSystemSetup()
                                      : null}

                                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                                  { admin_mode_set ? <NepiIFSettings
                                    settingsNamespace={base_namespace + '/settings'}
                                    make_section={false}
                                    title={"System Config"}
                                    />
                                      : null}
                                  
                            </Section>


                    </div>


                    <div style={{ width: '5%' }} >
                    </div>

                    <div style={{ width: '65%' }} >


                        { admin_mode_set ? 
                            this.renderSystemNetlist()
                            : null}


                    </div>
            </div>

                  

          </React.Fragment>

     )
   }
  }


}
export default NepiMgr
