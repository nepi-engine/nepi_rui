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
    textAlign: "left",
    marginTop: Styles.vars.spacing.regular,
    padding: Styles.vars.spacing.regular,
    border: `1px solid ${Styles.vars.colors.grey1}`
  },
  sectionTitle: {
    fontSize: Styles.vars.fontSize.regular,
    textTransform: "uppercase",
    fontWeight: "bold",
    marginBottom: Styles.vars.spacing.regular
  }
})

const Section = ({ title, children }) => {
  return (
    <div style={styles.root}>
      <div style={styles.sectionTitle}>{title}</div>
      <div>{children}</div>
    </div>
  )
}

export default Section
