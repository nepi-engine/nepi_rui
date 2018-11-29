import React, { Component } from "react"

import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Select, { Option } from "./Select"

import CameraViewer from "./CameraViewer"
class Applications extends Component {
  render() {
    return (
      <Columns>
        <Column>
          <CameraViewer />
        </Column>
        <Column>
          <Section title={"Device"}>
            <Label title={"Image Topic"}>
              <Select>
                <Option value="single-cam-1-image">Single Cam 1 Image</Option>
                <Option value="single-cam-2-image">Single Cam 2 Image</Option>
                <Option value="sonar-image-1">Sonar Image 1</Option>
              </Select>
            </Label>
            <Label title={"Image Classifier"}>
              <Select>
                <Option value="number">Number</Option>
                <Option value="face">Face</Option>
                <Option value="cat">Cat</Option>
                <Option value="hamster">Hamster</Option>
              </Select>
            </Label>
          </Section>
        </Column>
      </Columns>
    )
  }
}

export default Applications
