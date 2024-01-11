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
  root: {
    color: Styles.vars.colors.black
  },
  disabled: {
    backgroundColor: Styles.vars.colors.orange
  }
})

const Input = props => {
  const { style, children, disabled, backgroundOverride, type } = props

  const actualStyle = {
    ...styles.root,
    ...style,
    ...(disabled ? styles.disabled : {}),
    ...(backgroundOverride? {backgroundColor: backgroundOverride} : {})
  }

  const actualType = type? type : "text"

  return (
    <input {...props} style={actualStyle} type={actualType}>
      {children}
    </input>
  )
}

Input.defaultProps = {
  disabled: false,
  backgroundOverride: null
}

export default Input
