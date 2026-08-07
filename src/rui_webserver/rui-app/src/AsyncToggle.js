/*
#
# Copyright (c) 2024 Numurus <https://www.numurus.com>.
#
# This file is part of nepi rui (nepi_rui) repo
# (see https://github.com/nepi-engine/nepi_rui)
#
# License: NEPI RUI repo source-code and NEPI Images that use this source-code
# are licensed under the "Numurus Software License",
# which can be found at: <https://numurus.com/wp-content/uploads/Numurus-Software-License-Terms.pdf>
#
# Redistributions in source code must retain this top-level comment block.
# Plagiarizing this software to sidestep the license obligations is illegal.
#
# Contact Information:
# ====================
# - mailto:nepi@numurus.com
#
 */
import React, { Component } from "react"

import Toggle from "react-toggle"

import "./AsyncToggle.css"

// Drop-in replacement for react-toggle at any call site whose "checked" value
// comes back from the device rather than from local view state.
//
// A plain react-toggle drives both the thumb position and the track color off
// the same "checked" prop. When that prop only updates on the next status
// message, a click produces no visible response for the whole round trip and
// operators press the control again. This component splits the two:
//
//   POSITION is optimistic -- it shows what the operator asked for, right away.
//   COLOR is authoritative -- it only ever shows what the backend confirmed.
//
// So an unconfirmed request reads as "thumb has moved, color has not yet
// followed", and the color change *is* the success signal. If no confirming
// status arrives within confirmTimeoutMs the thumb animates back on its own.
//
// Pressing again while a request is outstanding RESENDS it -- same value, fresh
// timeout. A message dropped by a flaky link is the common reason color never
// follows, and pressing the control again is what an operator does about it, so
// the repeat press is treated as a retry rather than swallowed. The resend is
// necessarily the same value because the caller's onClick computes it from the
// same unconfirmed "checked" prop this component is still waiting on.
//
// This component knows nothing about ROS. It calls the onClick prop exactly as
// react-toggle would; all namespaces, topics and message types stay in the
// caller.
//
// Props:
//   checked           the authoritative value from the status message
//   onClick           called on click, unchanged, so the caller still publishes
//   disabled          same as react-toggle
//   confirmTimeoutMs  revert-if-unconfirmed window, default 3000 ms
//   any other prop    passed straight through to react-toggle
const DEFAULT_CONFIRM_TIMEOUT_MS = 3000

class AsyncToggle extends Component {
  constructor(props) {
    super(props)

    // The only rendered state is the value the operator has asked for and the
    // backend has not confirmed yet: true, false, or null for "nothing
    // outstanding". Everything else renders from props.
    this.state = {
      pending: null,
      // Bumped on every press purely to force a render -- see onToggleClick.
      presses: 0
    }

    this.confirmTimer = null

    this.onToggleClick = this.onToggleClick.bind(this)
    this.clearPending = this.clearPending.bind(this)
  }

  // A new checked value that matches what was asked for is the confirmation.
  // Drop the pending override and let color and position both render from
  // props again.
  componentDidUpdate(prevProps, prevState, snapshot) {
    const pending = this.state.pending
    if (pending === null) { return }
    if ((this.props.checked === true) === pending) {
      this.clearPending()
    }
  }

  // Killing the timer here is what guarantees no setState after unmount.
  componentWillUnmount() {
    if (this.confirmTimer !== null) {
      clearTimeout(this.confirmTimer)
      this.confirmTimer = null
    }
  }

  clearPending() {
    if (this.confirmTimer !== null) {
      clearTimeout(this.confirmTimer)
      this.confirmTimer = null
    }
    this.setState({ pending: null })
  }

  onToggleClick(event) {
    if (this.props.disabled === true) { return }

    // With a request outstanding, hold the pending value already on screen and
    // let the click fall through to onClick again: same value, sent again. The
    // caller derives what it publishes from the same "checked" prop that has
    // not moved, so there is nothing here to keep in sync -- the resend cannot
    // disagree with the request in flight.
    const outstanding = (this.state.pending !== null)
    const desired = outstanding ? this.state.pending : (this.props.checked !== true)
    const timeout_ms = (this.props.confirmTimeoutMs !== undefined) ? this.props.confirmTimeoutMs : DEFAULT_CONFIRM_TIMEOUT_MS

    // setState runs on every press, including the ones that leave "pending"
    // exactly as it was, and the re-render is load-bearing: react-toggle tracks
    // its own checked state, flips it on each click, and only resyncs to the
    // checked prop when it receives props. Without a render here a resend would
    // knock the thumb to the wrong side until the caller's next status message
    // happened to re-render us. The counter is never read -- it exists so this
    // stays true if the component is ever made pure.
    this.setState({ pending: desired, presses: this.state.presses + 1 })

    if (this.confirmTimer !== null) { clearTimeout(this.confirmTimer) }
    this.confirmTimer = setTimeout(() => {
      // Nothing confirmed in time. Dropping the override is the whole revert:
      // position falls back to the value props still report.
      this.confirmTimer = null
      this.setState({ pending: null })
    }, timeout_ms)

    if (typeof this.props.onClick === 'function') {
      this.props.onClick(event)
    }
  }

  render() {
    const { checked, onClick, confirmTimeoutMs, ...rest } = this.props
    const confirmed = (checked === true)
    const pending = this.state.pending
    const position = (pending !== null) ? pending : confirmed

    // The pending class goes on a wrapper rather than on the Toggle itself so
    // the override does not depend on react-toggle forwarding className.
    var wrapper_class = 'nepi-async-toggle'
    if (pending === true) {
      wrapper_class = wrapper_class + ' nepi-async-toggle--pending-on'
    }
    else if (pending === false) {
      wrapper_class = wrapper_class + ' nepi-async-toggle--pending-off'
    }

    return (
      <span className={wrapper_class}>
        <Toggle {...rest} checked={position} onClick={this.onToggleClick} />
      </span>
    )
  }
}

export default AsyncToggle
