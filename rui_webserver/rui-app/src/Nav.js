import React from "react"

import { Columns, Column } from "./Columns"
import Styles from "./Styles"

const styles = Styles.Create({
  appTitle: {
    fontSize: Styles.vars.fontSize.xxl
  },
  appTitleUnderline: {
    textDecoration: "underline",
    textDecorationColor: Styles.vars.colors.blue
  },
  navItem: {
    display: "inline-block",
    marginLeft: Styles.vars.spacing.small,
    marginRight: Styles.vars.spacing.small,
    textTransform: "uppercase",
    cursor: "pointer"
  },
  activeNavItem: {
    color: Styles.vars.colors.blue,
    fontWeight: "bold",
    textDecoration: "underline"
  }
})

const NavItem = ({ active = false, label, onClick }) => {
  const style = {
    ...styles.navItem,
    ...(active ? styles.activeNavItem : {})
  }

  return (
    <div style={style} onClick={onClick}>
      {label}
    </div>
  )
}

const Nav = () => {
  return (
    <div style={styles.root}>
      <Columns>
        <Column equalWidth={false}>
          <div style={styles.appTitle}>
            <span style={styles.appTitleUnderline}>{"n"}</span>
            {"umurus"}
          </div>
        </Column>
        <Column>
          <NavItem active label={"Dashboard"} />
          <NavItem label={"Applications"} />
          <NavItem label={"Files"} />
          <NavItem label={"Settings"} />
        </Column>
      </Columns>
    </div>
  )
}

export default Nav
