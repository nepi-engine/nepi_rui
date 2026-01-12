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
    marginTop: Styles.vars.spacing.medium,
    marginBottom: Styles.vars.spacing.medium
  },
  horizontalDivider: {
    backgroundColor: Styles.vars.colors.grey1,
    width: "100%",
    height: "1px"
  }
})

const HorizontalDivider = ({ name, children }) => {
  return (
    <div style={styles.root}>
      <div style={styles.horizontalDivider} />
    </div>
  )
}

export default HorizontalDivider
