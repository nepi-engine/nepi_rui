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

export const indicator_colors = Styles.Create({
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

export const ColoredIndicator = props => {
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

export const ColoredTextIndicator = props => {
  const { indicator_color, style, text } = props

  const actualStyle = {
    ...styles.base,
    ...indicator_color,
    ...style
  }

  return (
    <Input {...props} style={actualStyle} disabled={true} backgroundOverride={indicator_color.backgroundColor} value={text}/>
  )

}
