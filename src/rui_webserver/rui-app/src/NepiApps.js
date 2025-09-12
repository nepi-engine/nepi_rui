/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */

import React, { Component } from "react"


// ADD APP IMPORT HERE
import LaserLinesApp from "./NepiAppLaserLines"



class NepiAppsMap extends Component {
  this.appsClassMap = new Map()
  // ADD APP TO CLASSMAP HERE
  appsClassMap.set("LaserLinesApp", LaserLinesApp)

  constructor(props) {
    super(props);
    this.appsClassMap = appsClassMap
  }
}

export default NepiAppsMap