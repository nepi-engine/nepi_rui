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
  const { style, children, disabled, backgroundOverride } = props

  const actualStyle = {
    ...styles.root,
    ...style,
    ...(disabled ? styles.disabled : {}),
    ...(backgroundOverride? {backgroundColor: backgroundOverride} : {})
  }

  return (
    <input {...props} style={actualStyle}>
      {children}
    </input>
  )
}

Input.defaultProps = {
  disabled: false,
  backgroundOverride: null
}

export default Input
