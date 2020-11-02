import React, { Component } from "react"
import { Link } from "react-router-dom"

import { Columns, Column } from "./Columns"
import Styles from "./Styles"

import logo from "./logo.png"

const styles = Styles.Create({
  logo: {
    // backgroundColor: Styles.vars.colors.grey0
    width: "150px",
    //height: "40px"
  },
  navItem: {
    display: "inline-block",
    marginLeft: Styles.vars.spacing.small,
    marginRight: Styles.vars.spacing.small,
    textTransform: "uppercase",
    cursor: "pointer",
    textDecoration: "underline"
  },
  activeNavItem: {
    color: Styles.vars.colors.blue,
    fontWeight: "bold"
  },
  subNavItem: {
    backgroundColor: Styles.vars.colors.grey2,
    position: "absolute",
    marginTop: Styles.vars.spacing.small,
    marginLeft: 0,
    marginRight: Styles.vars.spacing.small,
    left: 0,
    listStyleType: "none",
    width: "100px",
    textAlign: "left"
  }
})

class SubNavMenu extends Component {
  constructor(props) {
    super(props)

    this.state = {
      showMenu: false,
      top: 0,
      left: 0
    }

    this.showMenu = this.showMenu.bind(this)
    this.closeMenu = this.closeMenu.bind(this)
  }

  showMenu(event) {
    event.preventDefault()
    this.setState({ showMenu: true }, () => {
      document.addEventListener("click", this.closeMenu)
    })
  }

  closeMenu() {
    this.setState({ showMenu: false }, () => {
      document.removeEventListener("click", this.closeMenu)
    })
  }

  render() {
    const { active, subItems } = this.props
    const style = {
      ...styles.navItem,
      ...(active ? styles.activeNavItem : {}),
      position: "relative"
    }
    const subStyle = {
      ...styles.navItem,
      ...styles.subNavItem
    }

    return (
      <div style={style} onMouseEnter={this.showMenu}>
        <div>{this.props.label}</div>
        {this.state.showMenu ? (
          <ul style={subStyle}>
            {subItems.map(({ path, label }) => {
              return (
                <li>
                  <Link style={style} to={path}>
                    {" "}
                    {label}{" "}
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    )
  }
}

const NavItem = ({ active, label, path, subItems }) => {
  const style = {
    ...styles.navItem,
    ...(active ? styles.activeNavItem : {})
  }

  this.subMenu = new SubNavMenu()
  return (
    <React.Fragment>
      {subItems ? (
        <SubNavMenu style={style} label={label} subItems={subItems} />
      ) : (
        <Link style={style} to={path}>
          {label}
        </Link>
      )}
    </React.Fragment>
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
              <img src={logo} alt={"logo"} max-width={"50%"} height={"auto"}/>
            </div>
          </Column>
          {!pageLocked && (
            <Column style={{ flex: 3 }}>
              {pages.map(({ path, label, subItems }) => {
                return (
                  <NavItem
                    active={path === window.location.pathname}
                    path={path}
                    label={label}
                    key={label}
                    subItems={subItems}
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
