/*
 * NEPI Dual-Use License
 * Project: nepi_rui
 *
 * This license applies to any user of NEPI Engine software
 *
 * Copyright (C) 2023 Numurus, LLC <https://www.numurus.com>
 * see https://github.com/numurus-nepi/nepi_rui
 *
 * This software is dual-licensed under the terms of either a NEPI software developer license
 * or a NEPI software commercial license.
 *
 * The terms of both the NEPI software developer and commercial licenses
 * can be found at: www.numurus.com/licensing-nepi-engine
 *
 * Redistributions in source code must retain this top-level comment block.
 * Plagiarizing this software to sidestep the license obligations is illegal.
 *
 * Contact Information:
 * ====================
 * - https://www.numurus.com/licensing-nepi-engine
 * - mailto:nepi@numurus.com
 *
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
  nepi_blue: "#002C45",
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
