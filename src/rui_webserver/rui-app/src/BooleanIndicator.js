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
import Button from "./Button"

const styles = Styles.Create({
  base: {
    cursor: "default",
    width: Styles.vars.lineHeights.small,
    height: Styles.vars.lineHeights.small
  },
  true: {
    backgroundColor: Styles.vars.colors.green
  },
  false: {
    backgroundColor: Styles.vars.colors.grey1
  }
})

const BooleanIndicator = props => {
  const { value, style } = props

  const actualStyle = {
    ...styles.base,
    ...(value ? styles.true : styles.false),
    ...style
  }

  return (
    <Button {...props} style={actualStyle} disabled>
      {" "}
    </Button>
  )
}

export default BooleanIndicator
