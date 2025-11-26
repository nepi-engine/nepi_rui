/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */

import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import { Columns, Column } from "./Columns"



@inject("ros")
@observer

// Pointcloud Application page
class EmptyClass extends Component {
  constructor(props) {
    super(props)

    this.state = {
      dummy: null
    }

  }

  render() {

      return (

          <Columns>
          <Column>

          </Column>
          </Columns> 
      )

    }

}

export default EmptyClass
