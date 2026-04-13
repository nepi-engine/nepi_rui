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

import Styles from "./Styles"
import Button from "./Button"

const styles = Styles.Create({
  base: {
      cursor: "default",
      width: Styles.vars.lineHeights.small,
      height: Styles.vars.lineHeights.small
    }
})

const ColoredIndicator = props => {
  const { indicator_color, style } = props

  const actualStyle = {
    ...styles.base,
    ...indicator_color,
    ...style
  }

  return (
    <Button {...props} style={actualStyle} disabled>
      {" "}
    </Button>
  )
}

export default ColoredIndicator