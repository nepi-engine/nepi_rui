/*
 * NEPI Dual-Use License
 * Project: nepi_rui
 *
 * This license applies to any user of NEPI Engine software
 *
 * Copyright (C) 2023 Numurus, LLC <https://www.numurus.com>
 * see https://github.com/numurus-nepi/nepi_rui
 *
 * This software is dual-licensed under the terms of either a NEPI software developer license
 * or a NEPI software commercial license.
 *
 * The terms of both the NEPI software developer and commercial licenses
 * can be found at: www.numurus.com/licensing-nepi-engine
 *
 * Redistributions in source code must retain this top-level comment block.
 * Plagiarizing this software to sidestep the license obligations is illegal.
 *
 * Contact Information:
 * ====================
 * - https://www.numurus.com/licensing-nepi-engine
 * - mailto:nepi@numurus.com
 *
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