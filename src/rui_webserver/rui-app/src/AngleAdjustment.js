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
    marginRight: Styles.vars.spacing.small,
    marginLeft: Styles.vars.spacing.small
  },
  slider: {
    marginTop: Styles.vars.spacing.xs,
    marginRight: Styles.vars.spacing.small,
    marginLeft: Styles.vars.spacing.small,
    flex: 2.25,
    textAlign: "right"
  }
})

@inject("ros")
class AngleAdjustment extends Component {
  constructor(props) {
    super(props)

    const { offset, total } = this.props
    this.state = {
      offset: offset * 100.0,
      total: total * 100.0,
      scaled_offset: offset,
      scaled_total: total,
      input_offset: Math.round(offset * 100),
      input_total: Math.round(total * 100)
    }

    this.onOffsetChange = this.onOffsetChange.bind(this)
    this.onTotalChange = this.onTotalChange.bind(this)
    this.onOffsetInputChange = this.onOffsetInputChange.bind(this)
    this.onTotalInputChange = this.onTotalInputChange.bind(this)
    this.onAfterOffsetChange = this.onAfterOffsetChange.bind(this)
    this.onAfterTotalChange = this.onAfterTotalChange.bind(this)
  }

  // we need this because the props is used to track
  // changes provided by mobx
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { offset, total } = this.props
    if (prevProps.offset !== offset || prevProps.total !== total) {
      this.setState({
        offset: offset * 100.0,
        total: total * 100.0,
        scaled_offset: offset,
        scaled_total: total,
        input_offset: Math.round(offset * 100),
        input_total: Math.round(total * 100)
      })
    }
  }

  onOffsetChange(value) {
    this.setState({
      offset: value,
      scaled_offset: value / 100.0,
      input_offset: Math.round(value)
    })
  }

  onTotalChange(value) {
    this.setState({
      total: value,
      scaled_total: value / 100.0,
      input_total: Math.round(value)
    })
  }

  onOffsetInputChange(event) {
    this.onOffsetChange(event.target.value)
    this.onAfterOffsetChange(event.target.value)
  }

  onTotalInputChange(event) {
    this.onTotalChange(event.target.value)
    this.onAfterTotalChange(event.target.value)
  }

  onAfterOffsetChange(value) {
    this.props.ros.publishNDAngle(value / 100.0, this.state.scaled_total)
  }

  onAfterTotalChange(value) {
    this.props.ros.publishNDAngle(this.state.scaled_offset, value / 100.0)
  }

  render() {
    return (
      <div style={{ display: "flex", ...styles.root }}>
        <Tooltip placement="bottomRight" overlay={this.props.tooltip}>
          <label style={styles.label}>{`Angle`}</label>
        </Tooltip>
        <Tooltip placement="top" overlay="Offset">
          <Input
            style={styles.input}
            value={this.state.input_offset}
            onChange={this.onOffsetInputChange}
          />
        </Tooltip>
        <Slider
          style={styles.slider}
          value={this.state.offset}
          onChange={this.onOffsetChange}
          onAfterChange={this.onAfterOffsetChange}
          min={0}
          max={100}
          step={1}
          handle={handle}
        />
        <Tooltip placement="top" overlay="Total">
          <Input
            style={styles.input}
            value={this.state.input_total}
            onChange={this.onTotalInputChange}
          />
        </Tooltip>
        <Slider
          style={styles.slider}
          value={this.state.total}
          onChange={this.onTotalChange}
          onAfterChange={this.onAfterTotalChange}
          min={0}
          max={100}
          step={1}
          handle={handle}
        />
      </div>
    )
  }
}

export default AngleAdjustment
