import React, { Component } from "react"

import Styles from "./Styles"
import Button from "./Button"
import Input from "./Input"

const styles = Styles.Create({
  base: {
      cursor: "default",
      width: Styles.vars.lineHeights.small,
      height: Styles.vars.lineHeights.small
    }
})

export const indicator_colors = Styles.Create({
  red: {
    backgroundColor: Styles.vars.colors.red,
    color: Styles.vars.colors.black
  },
  green: {
    backgroundColor: Styles.vars.colors.green,
    color: Styles.vars.colors.black
  },
  grey: {
    backgroundColor: Styles.vars.colors.grey1,
    color: Styles.vars.colors.black
  },
  orange: {
    backgroundColor: Styles.vars.colors.orange,
    color: Styles.vars.colors.black
  },
  white_on_black: {
    backgroundColor: Styles.vars.colors.black,
    color: Styles.vars.colors.white
  }
})

export const ColoredTextIndicator = props => {
  const { indicator_color, style, text } = props

  const actualStyle = {
    ...indicator_color,
    ...style
  }

  return (
    <Input {...props} style={actualStyle} disabled={true} backgroundOverride={indicator_color.backgroundColor} value={text}/>
  )

}
