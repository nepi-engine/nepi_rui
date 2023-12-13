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
    marginTop: Styles.vars.spacing.regular
  },
  labelTitle: {
    flex: 1,
    textAlign: "left"
  },
  rightLabelTitle: {
    flex: 1,
    textAlign: "right"
  },

  container: {
    flex: 1,
    textAlign: "right"
  }
})

const Label = ({ marginLeft, title, children, alignRight, labelStyle}) => {
    const alignmentStyle = alignRight? styles.rightLabelTitle : styles.labelTitle
    const actualStyle = {
      ...alignmentStyle,
      ...labelStyle
    }
  return (
    <div style={{ display: "flex", ...styles.root, marginLeft: marginLeft}}>
      <label style={actualStyle}>{title}</label>
      <div style={styles.container}>{children}</div>
    </div>
  )
}

export default Label
