import React, { Component } from "react"
import Toggle from "react-toggle"

import Page from "./Page"
import Nav from "./Nav"
import Section from "./Section"
import HorizontalDivider from "./HorizontalDivider"
import { Columns, Column } from "./Columns"
import Label from "./Label"

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      text: "test1",
      disabledText: "test2",
      toggle: true,
      disabledToggle: false
    }

    this.onInputChange = this.onInputChange.bind(this)
    this.onToggleChange = this.onToggleChange.bind(this)
  }

  onInputChange(e) {
    this.setState({ text: e.target.value })
  }

  onToggleChange(e) {
    this.setState({ toggle: e.target.checked })
  }

  render() {
    const { text, disabledText, toggle, disabledToggle } = this.state
    return (
      <Page>
        <Nav />
        <HorizontalDivider />
        <Columns>
          <Column>
            <Section title={"Section name"}>
              <Label title={"Modifiable text"}>
                <input value={text} onChange={this.onInputChange} />
              </Label>
              <Label title={"Unmodifiable text"}>
                <input disabled value={disabledText} />
              </Label>
              <Label title={"Modifiable toggle"}>
                <Toggle checked={toggle} onChange={this.onToggleChange} />
              </Label>
              <Label title={"Unmodifiable toggle"}>
                <Toggle disabled checked={disabledToggle} />
              </Label>
            </Section>
          </Column>
          <Column>
            <Section title={"Debug info"}>
              <pre>{JSON.stringify(this.state, null, 2)}</pre>
            </Section>
          </Column>
        </Columns>
      </Page>
    )
  }
}

export default App
