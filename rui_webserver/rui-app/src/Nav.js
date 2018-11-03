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

const NavItem = ({ active, label, onClick }) => {
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

NavItem.defaultProps = {
  active: false
}

const Nav = ({ pageLocked }) => {
  return (
    <div style={styles.root}>
      <Columns>
        <Column>
          <div style={styles.appTitle}>
            <span style={styles.appTitleUnderline}>{"n"}</span>
            {"umurus"}
          </div>
        </Column>
        {!pageLocked && (
          <Column style={{ flex: 3 }}>
            <NavItem active label={"Dashboard"} />
            <NavItem label={"Applications"} />
            <NavItem label={"Files"} />
            <NavItem label={"Settings"} />
          </Column>
        )}
      </Columns>
    </div>
  )
}

export default Nav
