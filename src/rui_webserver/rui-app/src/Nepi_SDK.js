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






////////////////////////
// Config System

const save_all_config_ids = ['idx','ptx','lsx','npx','rbx']
  

  export function supports_all_config(namespace){
    var supports = false
    for (var i = 0; i < save_all_config_ids.length; i++) {
      if (namespace.indexOf('/' + save_all_config_ids[i]) !== -1) {
        supports = true
        break
      }
    }
    return supports

  }


 export function  renderConfig(namespace = 'None',ruiRestricted = []) {
    const restricted = (ruiRestricted.indexOf('Cfg-Controls') !== -1)
    if (namespace === 'None' || restricted === true ){
      return (
  
        <Columns>
          <Column>
  
  
          </Column>
        </Columns>
      )
    }

    else {
    const show_save_all = supports_all_config(namespace)
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

                    { (show_save_all === true && restricted === false) ?


                        <ButtonMenu>
                            <Button onClick={() => this.props.ros.sendTriggerMsg(namespace + "/save_config_all")}>{all_config_label}</Button>
                      </ButtonMenu>
                   

                    : null }


          </React.Fragment>
        )
      }
  }
