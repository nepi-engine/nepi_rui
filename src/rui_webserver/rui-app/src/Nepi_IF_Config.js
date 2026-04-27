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


import Button, { ButtonMenu } from "./Button"
import { Columns, Column } from "./Columns"
import Styles from "./Styles"



@inject("ros")
@observer
class NepiIFConfig extends Component {
  constructor(props) {
    super(props)
    this.state = {
      save_all_config_ids: ['idx','ptx','lsx','npx','rbx']
    }

    this.sendConfigMsg = this.sendConfigMsg.bind(this)
   
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



  sendConfigMsg(topic_name) {
    const namespace = (this.props.namespace !== undefined) ? this.props.namespace : 'None'
    const add_namspaces = (this.props.add_namspaces !== undefined) ? this.props.add_namspaces : []
    this.props.ros.sendTriggerMsg(namespace + '/' + topic_name)
    for (var i = 0; i < add_namspaces.length; i++) {
      this.props.ros.sendTriggerMsg(add_namspaces[i] + '/' + topic_name)
    }

  }

  render() {
    const namespace = (this.props.namespace !== undefined) ? this.props.namespace : 'None'
    const { userRestricted} = this.props.ros
    const config_controls_restricted = (this.props.restricted !== undefined) ? this.props.restricted : 
          (userRestricted.indexOf('SYSTEM-CONFIG-VIEW') !== -1 ||
          userRestricted.indexOf('SYSTEM-CONFIG-CONTROL') !== -1)

    if (namespace === 'None' || config_controls_restricted === true){
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
        return (

          <React.Fragment>
                  <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                  <Columns>
                    <Column>


                      <ButtonMenu>
                          <Button onClick={() => this.sendConfigMsg("save_config")}>{"Save"}</Button>
                    </ButtonMenu>


                    { (show_save_all === true && all_config_restricted === false) ?


                        <ButtonMenu>
                            <Button onClick={() => this.sendConfigMsg("save_config_all")}>{'Save All'}</Button>
                      </ButtonMenu>
                   

                    : null }


                      </Column>
                    <Column>


                    <ButtonMenu>
                        <Button onClick={() => this.sendConfigMsg("reset_config")}>{"Reset"}</Button>
                      </ButtonMenu>


                    { (show_save_all === true && all_config_restricted === false) ?


                        <ButtonMenu>
                            <Button onClick={() => this.sendConfigMsg("delete_configs")}>{'Delete All'}</Button>
                      </ButtonMenu>
                   

                    : null }


                    </Column>
                    <Column>

                    <ButtonMenu>
                          <Button onClick={() => this.sendConfigMsg("factory_reset_config")}>{"Factory"}</Button>
                    </ButtonMenu>


                    </Column>
                  </Columns>






          </React.Fragment>
        )
      }
  }

}
export default NepiIFConfig
