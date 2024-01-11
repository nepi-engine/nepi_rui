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
import React, { Component } from "react"

import Styles from "./Styles"

const styles = Styles.Create({
  button: {
    border: "none",
    textAlign: "center",
    backgroundColor: Styles.vars.colors.grey0,
    cursor: "pointer",
    padding: `${Styles.vars.spacing.xs} ${Styles.vars.spacing.small}`,
    color: Styles.vars.colors.black
  },
  buttonDown: {
    border: "none",
    textAlign: "center",
    backgroundColor: Styles.vars.colors.blue,
    cursor: "pointer",
    padding: `${Styles.vars.spacing.xs} ${Styles.vars.spacing.small}`,
    color: Styles.vars.colors.black    
  },
  menuContainer: {
    marginTop: Styles.vars.spacing.small,
    textAlign: "right"
  }
})

class Button extends Component {
  constructor(props) {
    super(props)
  
    this.state = {
      actualStyle: {
        ...styles.button,
        ...this.props.style
      }
    }

    this.onButtonDown = this.onButtonDown.bind(this)
    this.onButtonUp = this.onButtonUp.bind(this)
  }

  onButtonDown() {
    const { style } = this.props
    this.setState({
      actualStyle: {
        ...styles.buttonDown,
        ...style
      }
    })
  }

  onButtonUp() {
    const { style } = this.props
    this.setState({
      actualStyle: {
        ...styles.button,
        ...style
      }
    })
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.style.backgroundColor !== this.props.style.backgroundColor) {
      this.setState({
        actualStyle: this.props.style
      })
    }
  }

  render (){
    const { children } = this.props
    return (
      <button {...this.props} style={this.state.actualStyle} onMouseDown={this.onButtonDown} onMouseUp={this.onButtonUp}>
        {children}
      </button>
    )
  }
}

export default Button

const ButtonMenu = props => {
  const { style, children } = props
  const buttons = React.Children.toArray(children).filter(child => child)

  const actualStyle = {
    ...styles.menuContainer,
    ...style
  }

  return (
    <div {...props} style={actualStyle}>
      {buttons.map((button, index) =>
        React.cloneElement(button, {
          style: { marginLeft: Styles.vars.spacing.regular }
        })
      )}
    </div>
  )
}

export { ButtonMenu }
