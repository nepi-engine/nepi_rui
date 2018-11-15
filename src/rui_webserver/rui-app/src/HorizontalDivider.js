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
