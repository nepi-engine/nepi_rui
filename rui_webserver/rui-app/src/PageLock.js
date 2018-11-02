import React, { Component } from "react"
import Section from "./Section"
import Label from "./Label"

const PASSWORD = "picknik2018"

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
            <input
              type={"password"}
              value={passwordValue}
              onChange={this.onUpdatePassword}
              onKeyPress={this.handleKeyPress}
            />
          </Label>
        </Section>
        <button onClick={this.checkLock}>{"Check password"}</button>
      </React.Fragment>
    )
  }
}

export default PageLock
