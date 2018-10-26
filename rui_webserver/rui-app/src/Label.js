import React from "react"

import { FaExternalLinkAlt } from "react-icons/fa"

import { Columns, Column } from "./Columns"
import ExternalLink from "./ExternalLink"
import Styles from "./Styles"

const styles = Styles.Create({
  root: {
    marginTop: Styles.vars.spacing.regular
  },
  labelTitle: {
    flex: 1,
    textAlign: "left",
    color: Styles.vars.colors.grey2
  },
  container: {
    flex: 1,
    textAlign: "right"
  }
})

const Label = ({ title, children }) => {
  return (
    <div style={{ display: "flex", ...styles.root }}>
      <label style={styles.labelTitle}>{`${title}:`}</label>
      <div style={styles.container}>{children}</div>
    </div>
  )
}

export default Label
