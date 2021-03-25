import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import Section from "./Section"
import EnableAdjustment from "./EnableAdjustment"
import RangeAdjustment from "./RangeAdjustment"
import AngleAdjustment from "./AngleAdjustment"
import Toggle from "react-toggle"
import Label from "./Label"
import { Column, Columns } from "./Columns"

@inject("ros")
@observer

// Component that contains the 3DX Sensor controlls
class Control3DX extends Component {
  constructor(props) {
    super(props)

    // these states track the values through Status3DX messages
    this.state = {
      rangeMax: null,
      rangeMin: null,
      angleOffset: null,
      angleTotal: null,
      resolutionEnabled: false,
      resolutionAdjustment: null,
      gainEnabled: false,
      gainAdjustment: null,
      filterEnabled: false,
      filterAdjustment: null,
      intensityEnabled: false,
      intensityAdjustment: null,
      displayName3DX: null,
      pauseEnable: false,
      listener: null,
      disabled: false
    }

    this.updateListener = this.updateListener.bind(this)
    this.status3DXListener = this.status3DXListener.bind(this)
    this.sendUpdate = this.sendUpdate.bind(this)

    this.updateListener()
  }

  // Callback for handling ROS Status3DX messages
  status3DXListener(message) {
    this.setState({
      rangeMax: message.range.max_range,
      rangeMin: message.range.min_range,
      angleOffset: message.angle.angle_offset,
      angleTotal: message.angle.total_angle,
      resolutionEnabled: message.resolution_settings.enabled,
      resolutionAdjustment: message.resolution_settings.adjustment,
      gainEnabled: message.gain_settings.enabled,
      gainAdjustment: message.gain_settings.adjustment,
      filterEnabled: message.filter_settings.enabled,
      filterAdjustment: message.filter_settings.adjustment,
      intensityEnabled: message.intensity_settings.enabled,
      intensityAdjustment: message.intensity_settings.adjustment,
      displayName3DX: message.display_name,
      pauseEnable: message.pause_enable
    })
  }

  // Function for configuring and subscribing to Status3DX
  updateListener() {
    const { topic, title } = this.props
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }

    if (title) {
      var listener = this.props.ros.setupStatus3DXListener(
        topic,
        this.status3DXListener
      )
      this.setState({ listener: listener, disabled: false })
    } else {
      this.setState({ disabled: true })
    }
  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { topic } = this.props
    if (prevProps.topic !== topic) {
      this.updateListener()
    }
  }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to Status3DX message
  componentWillUnmount() {
    if (this.state.listener) {
      this.state.listener.unsubscribe()
    }
  }

   // Function for sending updated state through rosbridge
   sendUpdate(topic, value, name, throttle = false) {
    this.props.ros.publishAutoManualSelection3DX(
      topic,
      name,
      true,
      value,
      throttle
    )
  }

  render() {
    return (
      <Section
        title={this.props.title ? this.props.title : "NO SENSOR SELECTED"}
      >
        <RangeAdjustment
          min={this.state.rangeMin}
          max={this.state.rangeMax}
          topic={this.props.topic}
          disabled={this.state.disabled}
          tooltip={
            "Min and max range.  Expressed as a percentage of the sensor's maximum range."
          }
        />

        <AngleAdjustment
          offset={this.state.angleOffset}
          total={this.state.angleTotal}
          topic={this.props.topic}
          disabled={this.state.disabled}
          tooltip={
            "Angular offset and total angle.  Expressed as a percentage of the sensor's native angular range."
          }
        />
        <div>
          <Label title={"Resolution"}>
          </Label>
          <Columns>
            <Column>
            <div align={"left"} textAlign={"left"}>
              <Label title={"Low"}>
              </Label>
              <Toggle checked={this.state.resolutionAdjustment <= .25} onClick={() => {this.sendUpdate(this.props.topic, .25, "resolution")}}/>
            </div>
            </Column>
            <Column>
            <div align={"left"} textAlign={"left"}>
              <Label title={"Medium"}>
              </Label>
              <Toggle checked={this.state.resolutionAdjustment > .25 && this.state.resolutionAdjustment <= .50} onClick={() => {this.sendUpdate(this.props.topic, .50, "resolution")}} />
            </div>
            </Column>
            <Column>
            <div align={"left"} textAlign={"left"}>
              <Label title={"High"}>
              </Label>
              <Toggle checked={this.state.resolutionAdjustment > .50 && this.state.resolutionAdjustment <= .75} onClick={() => {this.sendUpdate(this.props.topic, .75, "resolution")}} />
            </div>
            </Column>
            <div align={"left"} textAlign={"left"}>
            <Column>
              <Label title={"Ultra"}>
              </Label>
              <Toggle checked={this.state.resolutionAdjustment > .75} onClick={() => {this.sendUpdate(this.props.topic, 1, "resolution")}} />
            </Column>
            </div>
          </Columns>
        </div>

        <EnableAdjustment
          title="Gain"
          enabled={this.state.gainEnabled}
          adjustment={this.state.gainAdjustment}
          topic={this.props.topic}
          disabled={this.state.disabled}
          tooltip={"Adjustable manual gain."}
        />

        <EnableAdjustment
          title="Filter"
          enabled={this.state.filterEnabled}
          adjustment={this.state.filterAdjustment}
          topic={this.props.topic}
          disabled={this.state.disabled}
          tooltip={"Adjustable generic filter."}
        />

        <EnableAdjustment
          title="Intensity"
          enabled={this.state.intensityEnabled}
          adjustment={this.state.intensityAdjustment}
          topic={this.props.topic}
          disabled={this.state.disabled}
          tooltip={"Adjustable source intensity."}
        />
      </Section>
    )
  }
}
export default Control3DX
