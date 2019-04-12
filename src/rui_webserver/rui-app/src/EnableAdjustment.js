import React, { Component } from "react"
import Toggle from "react-toggle"
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
const Handle = Slider.Handle

const styles = Styles.Create({
  root: {
    marginTop: Styles.vars.spacing.regular
  },
  label: {
    flex: 1,
    textAlign: "left"
  },
  toggle: {
    marginRight: Styles.vars.spacing.small,
    marginLeft: Styles.vars.spacing.small,
    flex: 0.2,
    textAlign: "right",
  },
  input: {
    flex: 0.25,
    textAlign: "right",
    width: "2em",
    marginRight: Styles.vars.spacing.small,
    marginLeft: Styles.vars.spacing.small
  },
  slider: {
    marginTop: Styles.vars.spacing.xs,
    marginRight: Styles.vars.spacing.small,
    marginLeft: Styles.vars.spacing.small,
    flex: 3.3,
    textAlign: "right"
  }
})

@inject("ros")
class EnableAdjustment extends Component {
  constructor(props) {
    super(props)

    this.name = this.props.title.toLowerCase()

    this.state = {
      checked: this.props.enabled,
      value: Math.round(this.props.adjustment * 100.0),
      scaled: this.props.adjustment
    }

    this.onToggle = this.onToggle.bind(this)
    this.onValueChange = this.onValueChange.bind(this)
    this.onValueInputChange = this.onValueInputChange.bind(this)
    this.onValueAfterChange = this.onValueAfterChange.bind(this)
  }

  // we need this because the props is used to track
  // changes provided by mobx
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { enabled, adjustment } = this.props
    if (prevProps.enabled !== enabled || prevProps.adjustment !== adjustment) {
      this.setState({
        checked: enabled,
        value: Math.round(adjustment * 100.0),
        scaled: adjustment
      })
    }
  }

  onToggle(event) {
    this.setState({
      checked: event.target.checked
    })
    this.props.ros.publishNDAutoManualSelection(
      this.name,
      event.target.checked,
      this.state.scaled
    )
  }

  onValueChange(value) {
    this.setState({
      value: Math.round(value),
      scaled: value / 100.0
    })
  }

  onValueInputChange(event) {
    this.onValueChange(event.target.value)
    this.onValueAfterChange(event.target.value)
  }

  onValueAfterChange(value) {
    this.props.ros.publishNDAutoManualSelection(
      this.name,
      this.state.checked,
      value / 100.0
    )
  }

  render() {
    return (
      <div style={{ display: "flex", ...styles.root }}>
        <Tooltip placement="bottomRight" overlay={this.props.tooltip}>
          <label style={styles.label}>{this.props.title}</label>
        </Tooltip>
        <Toggle
          style={styles.toggle}
          onClick={this.onToggle}
          checked={this.state.checked}
        />
        <Input
          style={styles.input}
          disabled={!this.state.checked}
          value={this.state.value}
          onChange={this.onValueInputChange}
        />
        <Slider
          style={styles.slider}
          disabled={!this.state.checked}
          value={this.state.value}
          onChange={this.onValueChange}
          onAfterChange={this.onValueAfterChange}
          min={0}
          max={100}
          step={1}
          handle={handle}
        />
      </div>
    )
  }
}

export default EnableAdjustment
