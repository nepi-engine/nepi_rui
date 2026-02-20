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
import Button, { ButtonMenu } from "./Button"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Styles from "./Styles"

import {getCleanName,  onChangeSwitchStateValue } from "./Utilities"


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

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer
class NepiIFConfig extends Component {
  constructor(props) {
    super(props)
    this.state = {
      save_all_config_ids: ['idx','ptx','lsx','npx','rbx']
    }
   
  }


  supports_all_config(namespace){
    var supports = false
    const save_all_config_ids = this.state.save_all_config_ids
    for (var i = 0; i < save_all_config_ids.length; i++) {
      if (namespace.indexOf('/' + save_all_config_ids[i]) !== -1) {
        supports = true
        break
      }
    }
    return supports

  }


  render() {
    const namespace = (this.props.namespace !== undefined) ? this.props.namespace : 'None'

    if (namespace === 'None'){
      return (
  
        <Columns>
          <Column>
  
  
          </Column>
        </Columns>
      )
    }

    else {
    const show_save_all = (this.props.show_save_all !== undefined) ? this.props.show_save_all : this.supports_all_config(namespace)
    const all_config_restricted = (this.props.ros.userRestricted.indexOf('Sav-All') !== -1)
    const namespace_parts = namespace.split('/')
    var all_name = ''
    if (namespace_parts.lenght > 3) {
      all_name = namespace_parts[3].split('_')[0]
    }
    const all_config_label = 'Save for All ' + all_name + ' Devices'


        return (

          <React.Fragment>
                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                  <Columns>
                    <Column>


                      <ButtonMenu>
                          <Button onClick={() => this.props.ros.sendTriggerMsg(namespace + "/save_config")}>{"Save"}</Button>
                    </ButtonMenu>


                      </Column>
                    <Column>


                    <ButtonMenu>
                        <Button onClick={() => this.props.ros.sendTriggerMsg( namespace + "/reset_config")}>{"Reset"}</Button>
                      </ButtonMenu>

                    </Column>
                    <Column>

                    <ButtonMenu>
                          <Button onClick={() => this.props.ros.sendTriggerMsg( namespace + "/system_reset_config")}>{"Restore"}</Button>
                    </ButtonMenu>


                    </Column>
                  </Columns>

                    { (show_save_all === true && all_config_restricted === false) ?


                        <ButtonMenu>
                            <Button onClick={() => this.props.ros.sendTriggerMsg(namespace + "/save_config_all")}>{all_config_label}</Button>
                      </ButtonMenu>
                   

                    : null }


          </React.Fragment>
        )
      }
  }

}
export default NepiIFConfig
