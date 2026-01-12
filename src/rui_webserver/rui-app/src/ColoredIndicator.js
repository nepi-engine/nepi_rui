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
import Input from "./Input"
import Button from "./Button"

const styles = Styles.Create({
  base: {
      cursor: "default",
      width: Styles.vars.lineHeights.small,
      height: Styles.vars.lineHeights.small
    }
})

const indicator_colors = Styles.Create({
  red: {
    backgroundColor: Styles.vars.colors.red,
    color: Styles.vars.colors.black
  },
  green: {
    backgroundColor: Styles.vars.colors.green,
    color: Styles.vars.colors.black
  },
  grey: {
    backgroundColor: Styles.vars.colors.grey1,
    color: Styles.vars.colors.black
  },
  orange: {
    backgroundColor: Styles.vars.colors.orange,
    color: Styles.vars.colors.black
  },
  white_on_black: {
    backgroundColor: Styles.vars.colors.black,
    color: Styles.vars.colors.white
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