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
