import React, { Component } from "react"
import { Link } from "react-router-dom"

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

const NavItem = ({ active, label, path }) => {
  const style = {
    ...styles.navItem,
    ...(active ? styles.activeNavItem : {})
  }

  return (
    <Link style={style} to={path}>
      {label}
    </Link>
  )
}

NavItem.defaultProps = {
  active: false
}

class Nav extends Component {
  render() {
    const { pages, pageLocked } = this.props
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
              {pages.map(({ path, label }) => {
                return (
                  <NavItem
                    path={path}
                    active={path === window.location.pathname}
                    label={label}
                    key={label}
                  />
                )
              })}
            </Column>
          )}
        </Columns>
      </div>
    )
  }
}

export default Nav
