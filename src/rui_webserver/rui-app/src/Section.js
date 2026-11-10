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
