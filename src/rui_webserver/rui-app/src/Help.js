/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */
import React from "react"
import {Link} from "react-router-dom"

import Styles from "./Styles"

const styles = Styles.Create({
    link_style: {
      color: Styles.vars.colors.blue,
      fontSize: Styles.vars.fontSize.large,
      lineHeight: Styles.vars.lineHeights.xl 
    }
})

const Help = () => {
    return (
      <div>
        <div>
          <Link to={{ pathname: "http://numurus.com" }} target="_blank" style={styles.link_style}>
              Online FAQ (will open in new tab)
          </Link>
        </div>
        <div>
          <Link to={{ pathname: "http://youtube.com/@Numurus" }} target="_blank" style={styles.link_style}>
              Numurus YouTube Channel (will open in new tab)
            </Link>
        </div>
        <div>
          <Link to={{ pathname: "http://numurus.com" }} target="_blank" style={styles.link_style}>
            Online Manuals (will open in new tab)
          </Link>
        </div>
        <div>
          <Link to={{ pathname: "Numurus - Software License Terms.html" }} target="_blank" style={styles.link_style}>
            NEPI license (will open in a new tab)
          </Link>
        </div>
        <div>
          <Link to={{ pathname: "commercial_license_request_instructions.html" }} target="_blank" style={styles.link_style}>
            Commercial license request instructions (will open in a new tab)
          </Link>
        </div>
      </div>
    )
  }
  
  export default Help