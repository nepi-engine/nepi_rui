import React, { Component } from "react"
import { inject } from "mobx-react"
import Slider from "rc-slider"
import Tooltip from "rc-tooltip"

import Styles from "./Styles"
import Input from "./Input"

// This "handle" is for adding a tooltip to the slider
// Range is a double ended slider
import "rc-slider/assets/index.css"
import "rc-tooltip/assets/bootstrap.css"
const handle = props => {
  const { value, dragging, index, ...restProps } = props
  return (
    <Tooltip
      prefixCls="rc-slider-tooltip"
      overlay={value}
      visible={dragging}
      placement="top"
      key={index}
    >
      <Handle value={value} {...restProps} />
    </Tooltip>
  )
}
const createSliderWithTooltip = Slider.createSliderWithTooltip
const Range = createSliderWithTooltip(Slider.Range)
const Handle = Slider.Handle

const styles = Styles.Create({
  root: {
    marginTop: Styles.vars.spacing.regular
  },
  label: {
    flex: 1,
    textAlign: "left"
  },
  input: {
    flex: 0.25,
    textAlign: "right",
    width: "2em",
    marginRight: Styles.vars.spacing.small
  },
  range: {
    marginTop: Styles.vars.spacing.xs,
    marginLeft: Styles.vars.spacing.small,
    marginRight: Styles.vars.spacing.small,
    flex: 4.5,
    textAlign: "right"
  }
})

@inject("ros")
class RangeAdjustment extends Component {
  constructor(props) {
    super(props)

    var { min, max } = this.props
    if (min > max) {
      // initalized invalid
      max = 1
      min = 0
    }

    this.state = {
      // min and max values used by slider
      min: min * 100.0,
      max: max * 100.0,
      // scaled min and max for use in ROS messages
      scaled_min: min,
      scaled_max: max,
      // input min and max for input UI element
      input_min: Math.round(min * 100),
      input_max: Math.round(max * 100)
    }

    this.onSliderChange = this.onSliderChange.bind(this)
    this.onSliderAfterChange = this.onSliderAfterChange.bind(this)
    this.onMinInputChange = this.onMinInputChange.bind(this)
    this.onMaxInputChange = this.onMaxInputChange.bind(this)
    this.update = this.update.bind(this)
    this.sendUpdate = this.sendUpdate.bind(this)
  }

  // Function for updating state when values change
  update(min, max) {
    if (min >= 0 && min <= 100 && max >= 0 && max <= 100) {
      this.setState({
        min: min,
        max: max,
        scaled_min: min / 100.0,
        scaled_max: max / 100.0,
        input_min: Math.round(min),
        input_max: Math.round(max)
      })
    }
  }

  // Lifecycle function called right after component updates.
  // The params of this component can be changed so we need to
  // react when that happens.
  componentDidUpdate(prevProps, prevState, snapshot) {
    // create local constants out of new(current) props values
    const { min, max, disabled } = this.props

    // this tests to see of a NDStatus message updated our values
    if (
      prevProps.min !== min ||
      prevProps.max !== max ||
      (!disabled && prevProps.disabled)
    ) {
      this.setState({
        min: min * 100.0,
        max: max * 100.0,
        scaled_min: min,
        scaled_max: max,
        input_min: Math.round(min * 100.0),
        input_max: Math.round(max * 100.0)
      })
    }

    // this zeros out values if we go from enabled to disabled
    // this prop is used when we are not tracking a ND Sensor
    // disabled grays out all the inputs and makes them uneditable
    if (disabled && prevProps.disabled !== disabled) {
      this.setState({
        min: 0,
        max: 0,
        scaled_min: 0,
        scaled_max: 0,
        input_min: 0,
        input_max: 0
      })
    }
  }

  // Handler for slider changing the values
  onSliderChange(values) {
    this.update(values[0], values[1])
    this.sendUpdate(values[0] / 100.0, values[1] / 100.0, true)
  }

  // Handlers for value changes through input text boxes
  onMinInputChange(event) {
    this.update(event.target.value, this.state.max)
    this.sendUpdate(event.target.value / 100.0, this.state.max / 100.0)
  }
  onMaxInputChange(event) {
    this.update(this.state.min, event.target.value)
    this.sendUpdate(this.state.min / 100.0, event.target.value / 100.0)
  }

  // Handler for when slider is released (mouse up)
  onSliderAfterChange(values) {
    this.sendUpdate(values[0] / 100.0, values[1] / 100.0)
  }

  // Function for publishing values through rosbridge
  sendUpdate(min, max, throttle = false) {
    this.props.ros.publishNDRange(this.props.topic, min, max, throttle)
  }

  render() {
    return (
      <div style={{ display: "flex", ...styles.root }}>
        <Tooltip placement="bottomRight" overlay={this.props.tooltip}>
          <label style={styles.label}>{`Range`}</label>
        </Tooltip>
        <Tooltip placement="top" overlay="min">
          <Input
            style={styles.input}
            value={this.state.input_min}
            onChange={this.onMinInputChange}
            disabled={this.props.disabled}
          />
        </Tooltip>
        <Tooltip placement="top" overlay="max">
          <Input
            style={styles.input}
            value={this.state.input_max}
            onChange={this.onMaxInputChange}
            disabled={this.props.disabled}
          />
        </Tooltip>
        <Range
          style={styles.range}
          value={[this.state.min, this.state.max]}
          onChange={this.onSliderChange}
          onAfterChange={this.onSliderAfterChange}
          disabled={this.props.disabled}
          count={1}
          min={0}
          max={100}
          step={1}
          pushable={0.1}
          handle={handle}
        />
      </div>
    )
  }
}

export default RangeAdjustment
