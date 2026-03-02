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
import Toggle from "react-toggle"
import Input from "./Input"
//import Button, { ButtonMenu } from "./Button"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Styles from "./Styles"

import {  onChangeSwitchStateValue } from "./Utilities"

import NepiIFAdminEnable from "./Nepi_IF_AdminEnable"
import NepiIFAdminConfig from "./Nepi_IF_AdminConfig"
import NepiIFAdminModes from "./Nepi_IF_AdminModes"
//import NepiIFAdminNodeNames from "./Nepi_IF_AdminNodeNames"
//import NepiIFAdminManagers from "./Nepi_IF_AdminManagers"
import NepiIFAdminRui from "./Nepi_IF_AdminRui"

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

function styleTextEdited(text_box_element) {
  text_box_element.style.color = Styles.vars.colors.red
  text_box_element.style.fontWeight = "bold"
}

function styleTextUnedited(text_box_element) {
  text_box_element.style.color = Styles.vars.colors.black
  text_box_element.style.fontWeight = "normal"
}

const styles = Styles.Create({
  link_style: {
    color: Styles.vars.colors.blue,
    fontSize: Styles.vars.fontSize.medium,
    //lineHeight: Styles.vars.lineHeights.xl 
  }
})

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
  
    this.renderSystemAdmin = this.renderSystemAdmin.bind(this)



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
    const { connectedToNepi , connectedToDriversMgr} = this.props.ros
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



  renderSystemAdmin(){
      const namespace = 'ALL'

      return (


        <Columns>
          <Column>

          <Section title={("NEPI Admin")}>
        
              {<NepiIFAdminEnable
                make_section={false}
                title={null}
                show_link_button={false}
                show_line={false}
                />}

               {<NepiIFAdminModes
                make_section={false}
                />} 

            { <NepiIFAdminConfig
                make_section={false}
                />}
              
        </Section>


              {/* {<NepiIFAdminManagers
                make_section={false}
                />} */}

          </Column>
          <Column>  


              {/* {<NepiIFAdminNodeNames
                namespace={namespace}
                make_section={true}
                />} */}
              

          </Column>
          <Column>  

              {<NepiIFAdminRui
                make_section={true}
                />}

          </Column>
        </Columns>
      )

  }


  




  render() {
    const base_namespace = this.getBaseNamespace()
  

      return (

          <React.Fragment>
                
                
                { (base_namespace == null) ?
                  null
                :
                  this.renderSystemAdmin()
                }

          </React.Fragment>

     )
   }


}
export default NepiMgr
