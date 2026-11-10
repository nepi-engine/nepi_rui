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
   

    this.renderLevels = this.renderLevels.bind(this)

    this.sendOption = this.sendOption.bind(this)
    this.renderOption = this.renderOption.bind(this)
    this.renderOptions = this.renderOptions.bind(this)
    
    this.sendNamespace = this.sendNamespace.bind(this)
    this.renderNamespace = this.renderNamespace.bind(this)
    this.renderNamespaces = this.renderNamespaces.bind(this)


  }

  getBaseNamespace(){
    const { namespacePrefix, deviceId} = this.props.ros
    var baseNamespace = null
    if (namespacePrefix !== null && deviceId !== null){
      baseNamespace = "/" + namespacePrefix + "/" + deviceId
    }
    return baseNamespace
  }




  renderLevels() {
    const base_namespace = this.getBaseNamespace()
    const debug_level = this.props.ros.systemDebugLevel
    const debug_level_topic = base_namespace + '/set_debug_level'
    return (



      <React.Fragment>


        <Columns>
          <Column>
  
                <Label title="LOW">
                          <AsyncToggle
                        checked={debug_level === 'LOW'}
                        onClick={() => this.props.ros.sendStringMsg(debug_level_topic,'LOW')}>
                      </AsyncToggle>
                </Label>

          </Column>
        <Column>

                <Label title="MED">
                          <AsyncToggle
                        checked={debug_level === 'MED'}
                        onClick={() => this.props.ros.sendStringMsg(debug_level_topic,'MED')}>
                      </AsyncToggle>
                </Label>

              
          </Column>
        </Columns>




        <Columns>
          <Column>
  
              <Label title="HIGH">
                        <AsyncToggle
                      checked={debug_level === 'HIGH'}
                      onClick={() => this.props.ros.sendStringMsg(debug_level_topic,'HIGH')}>
                    </AsyncToggle>
              </Label>

          </Column>
        <Column>

                <Label title="ALL">
                          <AsyncToggle
                        checked={debug_level === 'ALL'}
                        onClick={() => this.props.ros.sendStringMsg(debug_level_topic,'ALL')}>
                      </AsyncToggle>
              </Label>
  
          </Column>
        </Columns>

      </React.Fragment>
    )
  }



  sendOption(name,value){
    const base_namespace = this.getBaseNamespace()
    if (value === true){
      this.props.ros.sendStringMsg(base_namespace + "/add_debug_option", name)
    }
    else {
      this.props.ros.sendStringMsg(base_namespace + "/remove_debug_option", name)
    }
  }


    
  renderOption(name) {
    const enabled = (this.props.ros.systemDebugOptions.indexOf(name) !== -1)
    return (

      <React.Fragment>


                        <Label title={name}>

                            <AsyncToggle
                            checked={enabled}
                            onClick={() => this.sendOption(name,!enabled)}>
                          </AsyncToggle>

                        </Label>

      </React.Fragment>
    )
  }

  renderOptions() {
    const options = this.props.ros.systemDebugAvailableOptions
    return (


      <React.Fragment>


                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>


                  <div>
                    <Label title={'DEBUG DISPLAY MESSAGES'}> </Label>

                    {/* Map over the restriction options array */}
                    {options.map((name) => (
                      this.renderOption(name)
                    ))}
                  </div>


      </React.Fragment>
    )
  }


    

  

    sendNamespace(name,value){
    const base_namespace = this.getBaseNamespace()
    if (value === true){
      this.props.ros.sendStringMsg(base_namespace + "/set_debug_namespace", name)
    }
    else {
      this.props.ros.sendStringMsg(base_namespace + "/set_debug_namespace", 'NONE')
    }
  }


    
  renderNamespace(namespace) {
    
    const name = getBasename(namespace)
    const enabled = (namespace === this.props.ros.systemDebugNamespace)
    return (

      <React.Fragment>


                        <Label title={name}>

                            <AsyncToggle
                            checked={enabled}
                            onClick={() => this.sendNamespace(namespace,!enabled)}>
                          </AsyncToggle>

                        </Label>

      </React.Fragment>
    )
  }

  renderNamespaces() {
    const base_namespace = this.getBaseNamespace()
    const msgTopics = this.props.ros.messageTopics
    const msgTopicsSorted = msgTopics.sort()
    const msgDebugOptions = ['ALL', 'NONE', ...msgTopicsSorted]
    return (



      <React.Fragment>

                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>


                  <div>
                    <Label title={'DEBUG PROCESS OPTIONS'}> </Label>
                  </div>

                  <div>
                  

                    {/* Map over the restriction options array */}
                    {msgDebugOptions.map((topic) => (
                      this.renderNamespace(topic.replace('/messages',''))
                    ))}
                  </div>


      </React.Fragment>
    )
  }







  render() {
    const base_namespace = this.getBaseNamespace()
    const debug_mode = this.props.ros.systemDebugEnabled
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const title = (this.props.title !== undefined) ? this.props.title : "DEBUG MODE OPTIONS"

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
                {this.renderLevels()}
                {this.renderOptions()}
                {this.renderNamespaces()}


          </React.Fragment>
      )
    }
    else {
      return (

          <Section title={title}>

                {this.renderLevels()}
                {this.renderOptions()}
                {this.renderNamespaces()}


        </Section>
     )
   }

  }

}
export default NepiIFAdminDebug
