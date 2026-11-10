/*
#
# Copyright (c) 2024 Numurus <https://www.numurus.com>.
#
# This file is part of nepi rui (nepi_rui) repo
# (see https://github.com/nepi-engine/nepi_rui)
#
# License: NEPI RUI repo source-code and NEPI Images that use this source-code
# are licensed under the "Numurus Software License", 
# which can be found at: <https://numurus.com/wp-content/uploads/Numurus-Software-License-Terms.pdf>
#
# Redistributions in source code must retain this top-level comment block.
# Plagiarizing this software to sidestep the license obligations is illegal.
#
# Contact Information:
# ====================
# - mailto:nepi@numurus.com
#
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
