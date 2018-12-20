import React from "react"

import Styles from "./Styles"
import Button from "./Button"

const styles = Styles.Create({
  base: {
    cursor: "default",
    width: Styles.vars.lineHeights.small,
    height: Styles.vars.lineHeights.small
  },
  true: {
    backgroundColor: Styles.vars.colors.green
  },
  false: {
    backgroundColor: Styles.vars.colors.red
  }
})

const BooleanIndicator = props => {
  const { value, style } = props

  const actualStyle = {
    ...styles.base,
    ...(value ? styles.true : styles.false),
    ...style
  }

  return (
    <Button {...props} style={actualStyle} disabled>
      {" "}
    </Button>
  )
}

export default BooleanIndicator
