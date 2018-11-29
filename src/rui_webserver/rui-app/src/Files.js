import React, { Component } from "react"

import Section from "./Section"

import FileBrowser from "./FileBrowser"

class Files extends Component {
  render() {
    return (
      <Section title={"Files"}>
        <FileBrowser {...this.props} />
      </Section>
    )
  }
}

export default Files
