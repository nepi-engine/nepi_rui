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
