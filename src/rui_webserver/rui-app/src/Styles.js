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
import { prefix } from "inline-style-prefixer"

export const Create = function(rules) {
  const styles = {}
  for (var k in rules) {
    styles[k] = prefix(rules[k])
  }
  return styles
}

export const colors = {
  default_dark: "#00070d",
  default_light: "#ffffff",
  default_highlight: "#b1d0ee",
  black: "#1c1d20",
  white: "#ffffff",
  orange: "#ffd000",
  grey0: "#e1e6e9",
  grey1: "#a5abb4",
  grey2: "#3e4043",
  blue: "#00a5ed",
  green: "#228b22",
  red: "#a52a2a"
}

const unitString = function(unit) {
  return function(value) {
    const str = new String(`${value}${unit}`) // eslint-disable-line
    str["raw"] = value
    return str
  }
}

export const em = unitString("em")
export const px = unitString("px")

//export const pageWidth = px(1080)
export const pageWidth = px(1920)

export const spacing = {
  xs: px(4),
  small: px(8),
  regular: px(16),
  medium: px(24),
  large: px(38),
  xl: px(56)
}

export const fontSize = {
  small: px(12),
  regular: px(15),
  medium: px(18),
  large: px(22),
  xl: px(28),
  xxl: px(36)
}

export const lineHeights = {
  regular: em(1.5),
  small: em(1.25),
  xl: em(3)
}

export default {
  Create,
  vars: {
    colors,
    pageWidth,
    spacing,
    fontSize,
    lineHeights
  }
}
