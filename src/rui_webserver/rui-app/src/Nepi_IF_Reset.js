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
import Label from "./Label"
import Styles from "./Styles"


function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer
class NepiIFReset extends Component {
  constructor(props) {
    super(props)

  }


  render() {
    const namespace = this.props.namespace ? this.props.namespace : 'None'

    if (namespace === 'None'){
      return (
  
        <Columns>
          <Column>
  
  
          </Column>
        </Columns>
      )
    }

    else {

        return (

          <Columns>
          <Column>

                  <Columns>
                    <Column>



                      </Column>
                    <Column>


                    </Column>
                    <Column>

                    <ButtonMenu>
                          <Button onClick={() => this.props.ros.sendTriggerMsg( namespace + "/reset")}>{"Reset"}</Button>
                    </ButtonMenu>


                    </Column>
                  </Columns>
          </Column>
          </Columns>
        )
      }
  }

}
export default NepiIFReset
