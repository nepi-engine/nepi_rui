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
//import Button, { ButtonMenu } from "./Button"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Styles from "./Styles"

function getBasename(namespace) {
  return namespace.split('/').pop().split('\\').pop();
}

@inject("ros")
@observer
class NepiIFAdminDebug extends Component {
  constructor(props) {
    super(props)
    this.state = {


    }

    this.getBaseNamespace = this.getBaseNamespace.bind(this)
   
    this.sendDebugOption = this.sendDebugOption.bind(this)
    this.renderAdminDebugOption = this.renderAdminDebugOption.bind(this)
    this.renderAdminDebug = this.renderAdminDebug.bind(this)



  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId
    }
    return baseNamespace
  }


  sendDebugOption(name,value){
    const base_namespace = this.getBaseNamespace()
    if (value === true){
      this.props.ros.sendStringMsg(base_namespace + "/set_debug_namespace", name)
    }
    else {
      this.props.ros.sendStringMsg(base_namespace + "/set_debug_namespace", 'NONE')
    }
  }


    
    renderAdminDebugOption(namespace) {
    
    const name = getBasename(namespace)
    const enabled = (namespace === this.props.ros.systemDebugNamespace)
    return (

      <React.Fragment>


                        <Label title={name}>

                            <AsyncToggle
                            checked={enabled}
                            onClick={() => this.sendDebugOption(namespace,!enabled)}>
                          </AsyncToggle>

                        </Label>




      </React.Fragment>
    )
  }

  renderAdminDebug() {
    const base_namespace = this.getBaseNamespace()
    const msgTopics = this.props.ros.messageTopics
    const msgTopicsSorted = msgTopics.sort()
    const msgDebugOptions = ['ALL', 'NONE', ...msgTopicsSorted]
    return (



      <React.Fragment>


                  <div>
                  

                    {/* Map over the restriction options array */}
                    {msgDebugOptions.map((topic) => (
                      this.renderAdminDebugOption(topic.replace('/messages',''))
                    ))}
                  </div>


      </React.Fragment>
    )
  }






  render() {
    const base_namespace = this.getBaseNamespace()
    const debug_mode = this.props.ros.systemDebugEnabled
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const title = (this.props.title !== undefined) ? this.props.title : "DEBUG OPTIONS"

    if (base_namespace == null || debug_mode === false){
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
                {this.renderAdminDebug()}


          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={title}>

                  {this.renderAdminDebug()}


        </Section>
     )
   }

  }

}
export default NepiIFAdminDebug
