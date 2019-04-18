import React, { Component } from "react"
import { inject } from "mobx-react"
import Slider from "rc-slider"
import Tooltip from "rc-tooltip"

import Styles from "./Styles"
import Input from "./Input"

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
      // uninitalized
      max = 1
      min = 0
    }
    this.state = {
      min: min * 100.0,
      max: max * 100.0,
      scaled_min: min,
      scaled_max: max,
      input_min: Math.round(min * 100),
      input_max: Math.round(max * 100)
    }

    this.onValuesChange = this.onValuesChange.bind(this)
    this.onSliderValuesChange = this.onSliderValuesChange.bind(this)
    this.onValuesAfterChange = this.onValuesAfterChange.bind(this)
    this.onMinChange = this.onMinChange.bind(this)
    this.onMaxChange = this.onMaxChange.bind(this)
    this.update = this.update.bind(this)
  }

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

  // we need this because the props is used to track
  // changes provided by mobx
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { min, max } = this.props
    if (prevProps.min !== min || prevProps.max !== max) {
      this.setState({
        min: min * 100.0,
        max: max * 100.0,
        scaled_min: min,
        scaled_max: max,
        input_min: Math.round(min * 100.0),
        input_max: Math.round(max * 100.0)
      })
    }
  }

  onValuesChange(values) {
    this.update(values[0], values[1])
  }

  onSliderValuesChange(values) {
    this.onValuesChange(values)
    this.onValuesAfterChange(values, true)
  }

  onMinChange(event) {
    this.update(event.target.value, this.state.max)
    this.onValuesAfterChange([event.target.value, this.state.max])
  }

  onMaxChange(event) {
    this.update(this.state.min, event.target.value)
    this.onValuesAfterChange([this.state.min, event.target.value])
  }

  onValuesAfterChange(values, throttle = false) {
    this.props.ros.publishNDRange(
      values[0] / 100.0,
      values[1] / 100.0,
      throttle
    )
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
            onChange={this.onMinChange}
          />
        </Tooltip>
        <Tooltip placement="top" overlay="max">
          <Input
            style={styles.input}
            value={this.state.input_max}
            onChange={this.onMaxChange}
          />
        </Tooltip>
        <Range
          style={styles.range}
          value={[this.state.min, this.state.max]}
          onChange={this.onSliderValuesChange}
          onAfterChange={this.onValuesAfterChange}
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
