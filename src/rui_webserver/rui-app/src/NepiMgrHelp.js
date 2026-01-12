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

const NepiHelp = () => {
    return (
      <div>
        <div>
            <Link to={{ pathname: "https://nepi.com/documentation/" }} target="_blank" style={styles.link_style}>
                NEPI Online Docs (will open in new tab)
            </Link>
        </div>
        <div>
            <Link to={{ pathname: "https://nepi.com/tutorials/" }} target="_blank" style={styles.link_style}>
                NEPI Online Tutorials (will open in new tab)
              </Link>
        </div>
        <div>
            <Link to={{ pathname: "https://nepi.com/videos/" }} target="_blank" style={styles.link_style}>
              NEPI Online Videos (will open in new tab)
            </Link>
        </div>
      </div>
    )
  }
  
  export default NepiHelp