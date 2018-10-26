import React, { Component } from "react"

import Page from "./Page"
import Nav from "./Nav"
import Section from "./Section"
import HorizontalDivider from "./HorizontalDivider"

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {}
  }

  render() {
    return (
      <Page>
        <Nav />
        <HorizontalDivider />
        <Section title={"Section name"}>
          <div>{"hi there"}</div>
        </Section>
      </Page>
    )
  }
}

export default App
