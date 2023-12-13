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
import Section from "./Section"
import Label from "./Label"
import Input from "./Input"
import Button, { ButtonMenu } from "./Button"

const PASSWORD = "numurus"

class PageLock extends Component {
  constructor(props) {
    super(props)

    this.state = {
      passwordValue: ""
    }

    this.onUpdatePassword = this.onUpdatePassword.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.checkLock = this.checkLock.bind(this)
  }

  onUpdatePassword(e) {
    const passwordValue = e.target.value
    this.setState({ passwordValue })
  }

  handleKeyPress(e) {
    if (e.key === "Enter") {
      this.checkLock()
    }
  }

  checkLock() {
    if (this.state.passwordValue === PASSWORD) {
      this.props.onUnlockPage()
    }
  }

  render() {
    const { passwordValue } = this.state
    return (
      <React.Fragment>
        <Section title={"Page locked"}>
          <Label title={"Please enter the password to unlock the page"}>
            <Input
              type={"password"}
              value={passwordValue}
              onChange={this.onUpdatePassword}
              onKeyPress={this.handleKeyPress}
            />
          </Label>
          <ButtonMenu>
            <Button onClick={this.checkLock}>{"Check password"}</Button>
          </ButtonMenu>
        </Section>
      </React.Fragment>
    )
  }
}

export default PageLock
