import React, { Component } from "react"

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
    <div
      style={style}
      onClick={() => {
        onClick(label)
      }}
    >
      {label}
    </div>
  )
}

NavItem.defaultProps = {
  active: false
}

class Nav extends Component {
  constructor(props) {
    super(props)

    this.state = {
      activePage: this.props.pages[0]
    }

    this.onNavItemClick = this.onNavItemClick.bind(this)
  }

  onNavItemClick(pageName) {
    const { activePage } = this.state
    if (pageName !== activePage) {
      this.setState({
        activePage: pageName
      })
      this.props.onNavChange(pageName)
    }
  }

  render() {
    const { pages, pageLocked } = this.props
    const { activePage } = this.state
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
              {pages.map(pageName => {
                return (
                  <NavItem
                    active={pageName === activePage}
                    label={pageName}
                    key={pageName}
                    onClick={this.onNavItemClick}
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
