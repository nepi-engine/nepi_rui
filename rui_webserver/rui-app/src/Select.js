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
