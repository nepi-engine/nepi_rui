import React, { Component } from "react"
import { Link } from "react-router-dom"

import { Columns, Column } from "./Columns"
import Styles from "./Styles"

import logo from "./logo.png"

const styles = Styles.Create({
  logo: {
    // backgroundColor: Styles.vars.colors.grey0
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
            <div style={styles.logo}>
              <img src={logo} alt={"logo"} />
            </div>
          </Column>
          {!pageLocked && (
            <Column style={{ flex: 3 }}>
              {pages.map(({ path, label }) => {
                return (
                  <NavItem
                    active={path === window.location.pathname}
                    path={path}
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
