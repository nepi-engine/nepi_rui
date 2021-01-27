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
  container: {
    flex: 1,
    textAlign: "right"
  }
})

const Label = ({ marginLeft, title, children }) => {
  return (
    <div style={{ display: "flex", ...styles.root, marginLeft: marginLeft }}>
      <label style={styles.labelTitle}>{title}</label>
      <div style={styles.container}>{children}</div>
    </div>
  )
}

export default Label
