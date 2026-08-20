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
import { observer, inject } from "mobx-react"

import Section from "./Section"
import Toggle from "react-toggle"
import Label from "./Label"
import Styles from "./Styles"
import Input from "./Input"
import { Column, Columns } from "./Columns"
import { onUpdateSetStateValue, onEnterSendIntValue, onEnterSendFloatValue, onChangeSwitchStateValue} from "./Utilities"

@inject("ros")
@observer

// Command component for a pointcloud data product. Renders the three
// PointcloudIF process controls (voxel downsample, uniform downsample, outlier
// removal) and nothing else.
//
// TWO NAMESPACES, AND THEY ARE NOT INTERCHANGEABLE:
//
//   nodeNamespace       - the device node namespace, e.g. /nepi/device1/zed2_31
//                         ALL THREE CONTROLS PUBLISH HERE. PointcloudIF
//                         registers every one of its subscribers on the node
//                         namespace, not on the data product namespace.
//
//   statusNamespace     - the data product namespace, e.g.
//                         /nepi/device1/zed2_31/pointcloud
//                         THE STATUS SUBSCRIPTION READS HERE. PointcloudIF
//                         publishes PointcloudStatus on <statusNamespace>/status.
//
// Publishing a control to the data product namespace produces no error and no
// effect - nothing is subscribed there, so the message is simply dropped. The
// failure is silent. Never build a control topic from statusNamespace.
//
// The parent passes both props. Do not derive one from the other in here.
class NepiIFPointcloudControls extends Component {
  constructor(props) {
    super(props)

    // these states track the values through Pointcloud Status messages
    this.state = {

      statusNamespace: 'None',
      status_msg: null,
      show_controls: (this.props.show_controls !== undefined) ? this.props.show_controls : false,

      voxel_downsample_size_m: null,
      uniform_downsample_points: null,
      outlier_k_points: null,

      statusListener: null,

    }

    this.renderControlPanel = this.renderControlPanel.bind(this)

    this.updateStatusListener = this.updateStatusListener.bind(this)
    this.statusListener = this.statusListener.bind(this)

  }

  // Callback for handling ROS PointcloudStatus messages
  statusListener(message) {
    // PointcloudStatus is flat. The three process control values are top level
    // fields on the status message itself - they used to arrive nested inside a
    // process_status submessage, which the pointcloud/image message
    // consolidation removed. Guard on the status message, not on a submessage.
    if (message == null) {
      return
    }
    const last_msg = this.state.status_msg
    this.setState({ status_msg: message })

    // These three back editable Input boxes, so only overwrite state when the
    // device actually reports a different value - otherwise every status tick
    // would stomp whatever the operator is part way through typing.
    if (last_msg == null) {
      this.setState({
        voxel_downsample_size_m: message.voxel_downsample_size_m,
        uniform_downsample_points: message.uniform_downsample_points,
        outlier_k_points: message.outlier_k_points
      })
    }
    else {
      if (message.voxel_downsample_size_m !== last_msg.voxel_downsample_size_m){
        this.setState({voxel_downsample_size_m: message.voxel_downsample_size_m})
      }

      if (message.uniform_downsample_points !== last_msg.uniform_downsample_points){
        this.setState({uniform_downsample_points: message.uniform_downsample_points})
      }

      if (message.outlier_k_points !== last_msg.outlier_k_points){
        this.setState({outlier_k_points: message.outlier_k_points})
      }
    }

  }

  // Function for configuring and subscribing to PointcloudStatus.
  // Subscribes on the DATA PRODUCT namespace. Controls do not publish here.
  updateStatusListener() {
    const { statusNamespace } = this.props
    if (this.state.statusListener != null) {
      this.state.statusListener.unsubscribe()
      this.setState({ status_msg: null, statusListener: null})
    }
    if (statusNamespace !== 'None'){
      var statusListener = this.props.ros.setupStatusListener(
        statusNamespace + '/status',
        "nepi_interfaces/PointcloudStatus",
        this.statusListener
      )
      this.setState({ statusListener: statusListener})
    }
    this.setState({ statusNamespace: statusNamespace})

  }

  // Lifecycle method called when compnent updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { statusNamespace } = this.props
    if (statusNamespace !== this.state.statusNamespace){
      if (statusNamespace !== null) {
        this.updateStatusListener()
      }
    }
  }

  componentDidMount() {
    this.updateStatusListener()
    }

  // Lifecycle method called just before the component umounts.
  // Used to unsubscribe to PointcloudStatus message
  componentWillUnmount() {
    if (this.state.statusListener) {
      this.state.statusListener.unsubscribe()
    }
  }


  renderControlPanel() {
    // Controls publish to the NODE namespace. Not statusNamespace - see the
    // class comment. A control published to the data product namespace is
    // dropped silently.
    const nodeNamespace = this.props.nodeNamespace ? this.props.nodeNamespace : 'None'

    const show_controls_option = (this.props.show_controls_option !== undefined) ? this.props.show_controls_option : true
    const show_controls = this.state.show_controls || (show_controls_option === false)

    return (
      <React.Fragment>

            <Columns>
              <Column>

                {(show_controls_option === true) ?
                <Label title="Show">
                    {/* react-toggle (not AsyncToggle): checked is local view state, already immediate -- no backend round trip to confirm. */}
                    <Toggle
                      checked={show_controls===true}
                      onClick={() => onChangeSwitchStateValue.bind(this)("show_controls",show_controls)}>
                    </Toggle>
                </Label>
                : null }

              </Column>
              <Column>

              </Column>
            </Columns>


        <div hidden={show_controls === false}>

            <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                  <Label title={"Process Controls"}></Label>

                  {/* No Columns wrapper here on purpose. Label splits its row
                      flex 1 / flex 1 between title and input, so nesting these in
                      a half-width Column left each title on ~25% of the panel and
                      wrapped every one of them. Full panel width plus labelStyle
                      flex 3 gives the title 3/4 of the row and parks the input
                      box flush against the right edge. */}
                  <Label title={"Voxel Downsample Size (m) - 0 disables"} labelStyle={{ flex: 3 }}>
                    <Input
                      value={this.state.voxel_downsample_size_m}
                      id="pointcloud_voxel_downsample_size_m"
                      onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"voxel_downsample_size_m")}
                      onKeyDown= {(event) => onEnterSendFloatValue.bind(this)(event,nodeNamespace + '/set_voxel_downsample_size')}
                      style={{ width: "100%" }}
                    />
                  </Label>

                  <Label title={"Uniform Downsample - keep every Nth point - 0 disables"} labelStyle={{ flex: 3 }}>
                    <Input
                      value={this.state.uniform_downsample_points}
                      id="pointcloud_uniform_downsample_points"
                      onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"uniform_downsample_points")}
                      onKeyDown= {(event) => onEnterSendIntValue.bind(this)(event,nodeNamespace + '/uniform_downsample_k_points')}
                      style={{ width: "100%" }}
                    />
                  </Label>

                  <Label title={"Outlier Removal - neighbor count - 0 disables"} labelStyle={{ flex: 3 }}>
                    <Input
                      value={this.state.outlier_k_points}
                      id="pointcloud_outlier_k_points"
                      onChange= {(event) => onUpdateSetStateValue.bind(this)(event,"outlier_k_points")}
                      onKeyDown= {(event) => onEnterSendIntValue.bind(this)(event,nodeNamespace + '/outlier_removal_num_neighbors')}
                      style={{ width: "100%" }}
                    />
                  </Label>

                <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                <pre style={{ whiteSpace: "pre-wrap" }}>
                  {"All three reduce the number of points published.\n" +
                   "Voxel size is in METERS, so 0.05 is 5 cm. A value typed as if it were centimeters will throw away nearly every point.\n" +
                   "Voxel and uniform downsampling trade detail for throughput. Outlier removal trades throughput for a cleaner cloud and is the most expensive of the three.\n" +
                   "They run in order: voxel, then uniform, then outlier removal.\n" +
                   "Set any of them to 0 to turn that stage off. All zero is the factory state."}
                </pre>

        </div>

      </React.Fragment>
    )
  }


  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true
    const status_msg = this.state.status_msg
    if (status_msg == null){
      return (
        <Columns>
        <Column>

        </Column>
        </Columns>
      )
    }
    else if (make_section === false){
      return (
        <React.Fragment>

          { this.renderControlPanel() }

        </React.Fragment>
      )
    }
    else {
      return (

        <Section title={(this.props.title !== undefined) ? this.props.title : null}>

          { this.renderControlPanel() }

        </Section>
     )
    }
  }

}
export default NepiIFPointcloudControls
