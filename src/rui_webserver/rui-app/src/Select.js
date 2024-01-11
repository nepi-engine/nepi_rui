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

const styles = Styles.Create({
  select: {
    border: "none",
    textAlign: "center",
    backgroundColor: Styles.vars.colors.grey0,
    cursor: "pointer",
    padding: `${Styles.vars.spacing.xs} ${Styles.vars.spacing.small}`,
    color: Styles.vars.colors.black
  },
  menuContainer: {
    marginTop: Styles.vars.spacing.small,
    textAlign: "right"
  }
})

const Select = props => {
  const { style, children } = props

  const actualStyle = {
    ...styles.select,
    ...style
  }

  return (
    <select {...props} style={actualStyle}>
      {children}
    </select>
  )
}

export default Select

const Option = props => {
  const { style, children } = props

  const actualStyle = {
    ...styles.select,
    ...style
  }

  return (
    <option {...props} style={actualStyle}>
      {children}
    </option>
  )
}

export { Option }
