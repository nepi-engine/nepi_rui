import React, { Component } from "react"

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
      unmodifiableText: "test",
      modifiableText: "test",
    }

    this.onInputChange = this.onInputChange.bind(this)
  }

  onInputChange(e) {
    this.setState({ modifiableText: e.target.value })
  }

  render() {
    const {
      unmodifiableText,
      modifiableText,
    } = this.state
    return (
      <Page>
        <Nav />
        <HorizontalDivider />

        <Columns>
          <Column>
            <Section title={"Section name"}>
              <Label title={"Unmodifiable text"}>
                <input disabled value={unmodifiableText} />
              </Label>
              <Label title={"Modifiable text"}>
                <input value={modifiableText} onChange={this.onInputChange} />
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
