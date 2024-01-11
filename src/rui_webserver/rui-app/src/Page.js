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
import React from "react"
import { TypographyStyle, GoogleFont } from "react-typography"
import Typography from "typography"
import theme from "./nepi-rui-typography-theme"

import Styles from "./Styles"

const typography = new Typography({
  ...theme,
  baseFontSize: Styles.vars.fontSize.regular,
  baseLineHeight: Styles.vars.lineHeights.regular,
  blockMarginBottom: 0.5,
  scaleRatio: 1.5,
  overrideStyles: ({ adjustFontSizeTo, rhythm }, options, styles) => ({
    "*": {
      color: Styles.vars.colors.white
    }
  })
})

const styles = Styles.Create({
  container: {
    backgroundColor: Styles.vars.colors.nepi_blue,
    maxWidth: Styles.vars.pageWidth,
    margin: "0 auto",
    padding: Styles.vars.spacing.large
  }
})

const Page = ({ children }) => {
  return (
    <React.Fragment>
      <TypographyStyle typography={typography} />
      <GoogleFont typography={typography} />
      <div style={styles.container}>{children}</div>
    </React.Fragment>
  )
}

export default Page
