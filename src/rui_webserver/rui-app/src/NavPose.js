import React, { Component } from "react"
import Toggle from "react-toggle"
import { observer, inject } from "mobx-react"

import Input from "./Input"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Styles from "./Styles"

function round(value, decimals = 0) {
  return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

@inject("ros")
@observer
class NavPose extends Component {
  constructor(props) {
    super(props)

    this.state = {
      fixedRoll: 0.0,
      fixedPitch: 0.0,
      fixedYaw: 0.0,
      fixedLatitude: 0.0,
      fixedLongitude: 0.0,
      fixedAltitude: 0.0,
      fixedHeading: 0.0,
      manualNavPoseOffsetsDisabled: true,
      xTranslation: null,
      yTranslation: null,
      zTranslation: null,
      xRotation: null,
      yRotation: null,
      zRotation: null
    }

    this.renderFixedNavPos = this.renderFixedNavPos.bind(this)
    this.renderExternalNavPos = this.renderExternalNavPos.bind(this)
    this.renderCurrentNavPos = this.renderCurrentNavPos.bind(this)
    this.renderPanTilt = this.renderPanTilt.bind(this)
    this.onUpdateText = this.onUpdateText.bind(this)
    this.onKeyText = this.onKeyText.bind(this)
    this.onToggleFixedPositionData = this.onToggleFixedPositionData.bind(this)
    this.onToggleFixedOrientationData = this.onToggleFixedOrientationData.bind(this)
    this.onToggleFixedHeadingData = this.onToggleFixedHeadingData.bind(this)
    this.onToggleNavPoseOffsets = this.onToggleNavPoseOffsets.bind(this)
  }
  onUpdateText(e) {
    var stateObject = function() {
      const returnObj = {};
      returnObj[this.target.id] = this.target.value;
      return returnObj;
    }.bind(e)();
    this.setState( stateObject );
    if ((e.target.id === "FixedRoll") || (e.target.id === "FixedPitch") || (e.target.id === "FixedYaw"))
    {
      var rollElement = document.getElementById("FixedRoll")
      rollElement.style.color = Styles.vars.colors.red
      this.setState({fixedRoll: rollElement.value})

      var pitchElement = document.getElementById("FixedPitch")
      pitchElement.style.color = Styles.vars.colors.red
      this.setState({fixedPitch: pitchElement.value})

      var yawElement = document.getElementById("FixedYaw")
      yawElement.style.color = Styles.vars.colors.red
      this.setState({fixedYaw: yawElement.value})

    }
    else if ((e.target.id === "FixedLatitude") || (e.target.id === "FixedLongitude") || (e.target.id === "FixedAltitude"))
    {
      var latitudeElement = document.getElementById("FixedLatitude")
      latitudeElement.style.color = Styles.vars.colors.red
      this.setState({fixedLatitude: latitudeElement.value})

      var longitudeElement = document.getElementById("FixedLongitude")
      longitudeElement.style.color = Styles.vars.colors.red
      this.setState({fixedLongitude: longitudeElement.value})

      var altitudeElement = document.getElementById("FixedAltitude")
      altitudeElement.style.color = Styles.vars.colors.red
      this.setState({fixedAltitude: altitudeElement.value})
    }
    else if (e.target.id === "FixedHeading")
    {
      var headingElement = document.getElementById("FixedHeading")
      headingElement.style.color = Styles.vars.colors.red
      this.setState({fixedHeading: headingElement.value})
    }
    else if ((e.target.id === "XTranslation") || (e.target.id === "YTranslation") || (e.target.id === "ZTranslation") ||
             (e.target.id === "XRotation") || (e.target.id === "YRotation") || (e.target.id === "ZRotation"))
    {
      var xTranslationElement = document.getElementById("XTranslation")
      xTranslationElement.style.color = Styles.vars.colors.red
      this.setState({xTranslation: xTranslationElement.value})

      var yTranslationElement = document.getElementById("YTranslation")
      yTranslationElement.style.color = Styles.vars.colors.red
      this.setState({yTranslation: yTranslationElement.value})

      var zTranslationElement = document.getElementById("ZTranslation")
      zTranslationElement.style.color = Styles.vars.colors.red
      this.setState({zTranslation: zTranslationElement.value})

      var xRotationElement = document.getElementById("XRotation")
      xRotationElement.style.color = Styles.vars.colors.red
      this.setState({xRotation: xRotationElement.value})

      var yRotationElement = document.getElementById("YRotation")
      yRotationElement.style.color = Styles.vars.colors.red
      this.setState({yRotation: yRotationElement.value})

      var zRotationElement = document.getElementById("ZRotation")
      zRotationElement.style.color = Styles.vars.colors.red
      this.setState({zRotation: zRotationElement.value})
    }
  }

  onKeyText(e) {
    const {onSetFixedOrientation, onSetFixedGPS, onSetFixedHeading, onSetAHRSOffsets} = this.props.ros
    if(e.key === 'Enter'){
      if ((e.target.id === "FixedRoll") || (e.target.id === "FixedPitch") || (e.target.id === "FixedYaw"))
      {
        var rollElement = document.getElementById("FixedRoll")
        rollElement.style.color = Styles.vars.colors.black

        var pitchElement = document.getElementById("FixedPitch")
        pitchElement.style.color = Styles.vars.colors.black

        var yawElement = document.getElementById("FixedYaw")
        yawElement.style.color = Styles.vars.colors.black

        // TODO: Adjustable frame id for the fixed orientation?
        onSetFixedOrientation(rollElement.value, pitchElement.value, yawElement.value, "manual_offset_frame")
      }
      else if ((e.target.id === "FixedLatitude") || (e.target.id === "FixedLongitude") || (e.target.id === "FixedAltitude"))
      {
        var latitudeElement = document.getElementById("FixedLatitude")
        latitudeElement.style.color = Styles.vars.colors.black

        var longitudeElement = document.getElementById("FixedLongitude")
        longitudeElement.style.color = Styles.vars.colors.black

        var altitudeElement = document.getElementById("FixedAltitude")
        altitudeElement.style.color = Styles.vars.colors.black

        // TODO: Adjustable frame id for the fixed receiver position?
        onSetFixedGPS(latitudeElement.value, longitudeElement.value, altitudeElement.value, "manual_offset_frame")
      }

      else if (e.target.id === "FixedHeading")
      {
        var headingElement = document.getElementById("FixedHeading")
        headingElement.style.color = Styles.vars.colors.black
        onSetFixedHeading(headingElement.value)
      }
      else if ((e.target.id === "XTranslation") || (e.target.id === "YTranslation") || (e.target.id === "ZTranslation") ||
               (e.target.id === "XRotation") || (e.target.id === "YRotation") || (e.target.id === "ZRotation"))
      {
        var xTranslationElement = document.getElementById("XTranslation")
        xTranslationElement.style.color = Styles.vars.colors.black

        var yTranslationElement = document.getElementById("YTranslation")
        yTranslationElement.style.color = Styles.vars.colors.black

        var zTranslationElement = document.getElementById("ZTranslation")
        zTranslationElement.style.color = Styles.vars.colors.black

        var xRotationElement = document.getElementById("XRotation")
        xRotationElement.style.color = Styles.vars.colors.black

        var yRotationElement = document.getElementById("YRotation")
        yRotationElement.style.color = Styles.vars.colors.black

        var zRotationElement = document.getElementById("ZRotation")
        zRotationElement.style.color = Styles.vars.colors.black

        onSetAHRSOffsets(xTranslationElement.value, yTranslationElement.value, zTranslationElement.value,
                         xRotationElement.value, yRotationElement.value, zRotationElement.value)
      }
    }
  }

  async onToggleFixedPositionData() {
    const {onEnableFixedGPS, navPosGPSIsFixed} = this.props.ros
    var enabled = !navPosGPSIsFixed
    onEnableFixedGPS(enabled)

    if (false === enabled) {
      // Update all the text
      this.setState({fixedLatitude: 0.0, fixedLongitude: 0.0, fixedAltitude: 0.0})
    }
  }

  async onToggleFixedOrientationData() {
    const {onEnableFixedOrientation, navPosOrientationIsFixed} = this.props.ros
    var enabled = !navPosOrientationIsFixed
    onEnableFixedOrientation(enabled)

    if (false === enabled) {
      this.setState({fixedRoll: 0.0, fixedPitch: 0.0, fixedYaw: 0.0})
    }
  }

  async onToggleFixedHeadingData() {
    const {onEnableFixedHeading, navPosHeadingIsFixed} = this.props.ros
    var enabled = !navPosHeadingIsFixed
    onEnableFixedHeading(enabled)

    if (false === enabled) {
      this.setState({fixedHeading: 0.0})
    }
  }

  async onToggleNavPoseOffsets() {
    var disabled = this.state.manualNavPoseOffsetsDisabled
    this.setState({manualNavPoseOffsetsDisabled: !disabled})
  }

  renderFixedNavPos() {
    return (
      <Section title={"Fixed NAV/POSE Data"}>
        <Columns>
          <Column>
            <Label title={"Fixed Location"}>
              <Toggle
                onClick={this.onToggleFixedPositionData}
                checked={this.props.ros.navPosGPSIsFixed}
              />
            </Label>
            <Label title={"Latitude"}>
              <Input
                value={this.state.fixedLatitude !== null? this.state.fixedLatitude : "0"}
                id="FixedLatitude"
                data-topic="set_gps_fix"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                disabled={!(this.props.ros.navPosGPSIsFixed)}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Longitude"}>
              <Input
                value={this.state.fixedLongitude !== null ? this.state.fixedLongitude : "0"}
                id="FixedLongitude"
                data-topic="set_gps_fix"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                disabled={!(this.props.ros.navPosGPSIsFixed)}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Altitude (m)"}>
              <Input
                value={this.state.fixedAltitude !== null ? this.state.fixedAltitude : "0"}
                id="FixedAltitude"
                data-topic="set_gps_fix"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                disabled={!(this.props.ros.navPosGPSIsFixed)}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Fixed Heading"}>
              <Toggle
                onClick={this.onToggleFixedHeadingData}
                checked={this.props.ros.navPosHeadingIsFixed}
              />
            </Label>
          </Column>
          <Column>
            <Label title={"Fixed Orientation"}>
              <Toggle
                onClick={this.onToggleFixedOrientationData}
                checked={this.props.ros.navPosOrientationIsFixed}
              />
            </Label>
            <Label title={"Roll (deg)"}>
              <Input
                value={this.state.fixedRoll !== null ? this.state.fixedRoll : "0"}
                id="FixedRoll"
                data-topic="nav_pos_mgr/set_attitude_override"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{width: "60%"}}
                disabled={!(this.props.ros.navPosOrientationIsFixed)}
              />
            </Label>
            <Label title={"Pitch (deg)"}>
              <Input
                value={this.state.fixedPitch !== null ? this.state.fixedPitch : "0"}
                id="FixedPitch"
                data-topic="nav_pos_mgr/set_attitude_override"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{width: "60%"}}
                disabled={!(this.props.ros.navPosOrientationIsFixed)}
              />
            </Label>
            <Label title={"Yaw (deg)"}>
              <Input
                value={this.state.fixedYaw !== null ? this.state.fixedYaw : "0"}
                id="FixedYaw"
                data-topic="nav_pos_mgr/set_attitude_override"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{width: "60%"}}
                disabled={!(this.props.ros.navPosOrientationIsFixed)}
              />
            </Label>
            <Label title={"Heading (deg)"}>
              <Input
                value={this.state.fixedHeading !== null ? this.state.fixedHeading : "0"}
                id="FixedHeading"
                data-topic="nav_pos_mgr/set_heading_override"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{width: "60%"}}
                disabled={!(this.props.ros.navPosHeadingIsFixed)}
              />
            </Label>
          </Column>
        </Columns>
      </Section>
    )
  }

  renderExternalNavPos() {
    const {
      navSrcFrame,
      navTargetFrame,
      navTransformXTrans,
      navTransformYTrans,
      navTransformZTrans,
      navTransformXRot,
      navTransformYRot,
      navTransformZRot } = this.props.ros
    return (
      <Section title={"External NAV/POSE Source"}>
        <Label title={"Enable Manual Nav/Pose Offsets"}>
          <Toggle
            onClick={this.onToggleNavPoseOffsets}
          />
        </Label>
        <Columns>
          <Column>
            <Label title={"Translation (m)"}/>
            <Label title={"X"}>
              <Input
                value={(this.state.xTranslation !== null) && (this.state.xTranslation !== navTransformXTrans) ? this.state.xTranslation : navTransformXTrans}
                id="XTranslation"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                disabled={this.state.manualNavPoseOffsetsDisabled}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Y"}>
              <Input
                value={(this.state.yTranslation !== null) && (this.state.yTranslation !== navTransformYTrans) ? this.state.yTranslation : navTransformYTrans}
                id="YTranslation"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                disabled={this.state.manualNavPoseOffsetsDisabled}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Z"}>
              <Input
                value={(this.state.zTranslation !== null) && (this.state.zTranslation !== navTransformZTrans) ? this.state.zTranslation : navTransformZTrans}
                id="ZTranslation"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                disabled={this.state.manualNavPoseOffsetsDisabled}
                style={{ width: "80%" }}
              />
            </Label>
          </Column>
          <Column>
            <Label title={"Rotation (deg)"}/>
            <Label title={"X"}>
              <Input
                value={(this.state.xRotation !== null) && (this.state.xRotation !== navTransformXRot) ? this.state.xRotation : navTransformXRot}
                id="XRotation"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                disabled={this.state.manualNavPoseOffsetsDisabled}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Y"}>
              <Input
                value={(this.state.yRotation !== null) && (this.state.yRotation !== navTransformYRot) ? this.state.yRotation : navTransformYRot}
                id="YRotation"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                disabled={this.state.manualNavPoseOffsetsDisabled}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Z"}>
              <Input
                value={(this.state.zRotation !== null) && (this.state.zRotation !== navTransformZRot) ? this.state.zRotation : navTransformZRot}
                id="ZRotation"
                //data-topic="nepi_edge_ros_bridge/lb/set_data_sets_per_hour"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                disabled={this.state.manualNavPoseOffsetsDisabled}
                style={{ width: "80%" }}
              />
            </Label>
          </Column>
        </Columns>
        <Label title={"Transfer Frame IDs"}/>
        <Columns>
          <Column>
            <Label title={"Src."}>
              <Input
                disabled
                value={navSrcFrame}
              />
            </Label>
          </Column>
          <Column>
            <Label title={"Targ."}>
              <Input
                disabled
                value={navTargetFrame}
              />
            </Label>
          </Column>
        </Columns>
      </Section>
    )
  }

  renderCurrentNavPos() {
    const {
      navPosDirectionHeadingDeg,
      navPosDirectionSpeedMpS,
      navPosLocationLat,
      navPosLocationLng,
      navPosLocationAlt,
      navPosOrientationYawAngle,
      navPosOrientationYawRate,
      navPosOrientationPitchAngle,
      navPosOrientationPitchRate,
      navPosOrientationRollAngle,
      navPosOrientationRollRate,
    } = this.props.ros
    return (
      <Section title={"Nav/Pose Output"}>
      <Columns>
          <Column>
            <label style={{fontWeight: 'bold'}}>
              {"Location"}
            </label>
            <Label title={"Latitude"}>
              <Input
                disabled
                value={round(navPosLocationLat, 6)}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Longitude"}>
              <Input
                disabled
                value={round(navPosLocationLng, 6)}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Altitude (m)"}>
              <Input
                disabled
                value={round(navPosLocationAlt, 2)}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Speed (m/s)"}>
              <Input
                disabled
                value={round(navPosDirectionSpeedMpS, 2)}
                style={{ width: "80%" }}
              />
            </Label>
          </Column>
          <Column>
            <div style={{ display: "flex", marginLeft: Styles.vars.spacing.regular }}>
              <label style={{fontWeight: 'bold', flex: 1, textAlign: "left"}}>
              {"Orientation"}
                </label>
            </div>
            <Label title={""}>
            <div style={{ display: "inline-block", width: "45%", float: "left" }}>
              {"deg"}
            </div>
            <div style={{ display: "inline-block", width: "45%" }}>{"deg/s"}</div>
            </Label>
            <Label title={"Roll"}>
              <Input
                disabled
                style={{ width: "45%", float: "left" }}
                value={round(navPosOrientationYawAngle, 3)}
              />
              <Input
                disabled
                style={{ width: "45%" }}
                value={round(navPosOrientationYawRate, 3)}
              />
            </Label>
            <Label title={"Pitch"}>
              <Input
                disabled
                style={{ width: "45%", float: "left" }}
                value={round(navPosOrientationPitchAngle, 3)}
              />
              <Input
                disabled
                style={{ width: "45%" }}
                value={round(navPosOrientationPitchRate, 3)}
              />
            </Label>
            <Label title={"Yaw"}>
              <Input
                disabled
                style={{ width: "45%", float: "left" }}
                value={round(navPosOrientationRollAngle, 3)}
              />
              <Input
                disabled
                style={{ width: "45%" }}
                value={round(navPosOrientationRollRate, 3)}
              />
            </Label>
            <Label title={"Heading (deg)"}>
              <Input
                disabled
                style={{ width: "80%" }}
                value={round(navPosDirectionHeadingDeg, 2)}
              />
            </Label>
          </Column>
        </Columns>
      </Section>
    )
  }

  renderPanTilt() {
    return (
      <Section title={"Pan and Tilt (In Development)"}>
        <Label title={"Enable Pan and Tilt Nav/Pose Solution"}>
          <Toggle
            disabled
          />
        </Label>
        <Label title={"Orientation (Up/Down)"}>
          <Toggle
            disabled
          />
        </Label>
        <Columns>
          <Column>
            <Label title={"Translation (m)"}/>
            <Label title={"X"}>
              <Input
                //value={this.state.dataSetsPerHour !== null ? this.state.dataSetsPerHour : "0"}
                id="PTXTranslation"
                //data-topic="nepi_edge_ros_bridge/lb/set_data_sets_per_hour"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                disabled
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Y"}>
              <Input
                //value={this.state.dataSetsPerHour !== null ? this.state.dataSetsPerHour : "0"}
                id="PTYTranslation"
                //data-topic="nepi_edge_ros_bridge/lb/set_data_sets_per_hour"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                disabled
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Z"}>
              <Input
                //value={this.state.dataSetsPerHour !== null ? this.state.dataSetsPerHour : "0"}
                id="PTZTranslation"
                //data-topic="nepi_edge_ros_bridge/lb/set_data_sets_per_hour"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                disabled
                style={{ width: "80%" }}
              />
            </Label>
          </Column>
          <Column>
            <Label title={"Rotation (deg)"}/>
            <Label title={"X"}>
              <Input
                //value={this.state.dataSetsPerHour !== null ? this.state.dataSetsPerHour : "0"}
                id="PTXRotation"
                //data-topic="nepi_edge_ros_bridge/lb/set_data_sets_per_hour"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                disabled
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Y"}>
              <Input
                //value={this.state.dataSetsPerHour !== null ? this.state.dataSetsPerHour : "0"}
                id="PTYRotation"
                //data-topic="nepi_edge_ros_bridge/lb/set_data_sets_per_hour"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                disabled
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Z"}>
              <Input
                //value={this.state.dataSetsPerHour !== null ? this.state.dataSetsPerHour : "0"}
                id="PTZRotation"
                //data-topic="nepi_edge_ros_bridge/lb/set_data_sets_per_hour"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                disabled
                style={{ width: "80%" }}
              />
            </Label>
          </Column>
        </Columns>
        <Label title={"Current Position"}/>
        <Columns>
          <Column>
            <Label title={"Pan (deg)"}>
              <Input
                disabled
                style={{ width: "80%" }}
              />
            </Label>
          </Column>
          <Column>
            <Label title={"Tilt (deg)"}>
              <Input
                disabled
                style={{ width: "80%" }}
              />
            </Label>
          </Column>
        </Columns>
      </Section>
    )
  }

  render() {
    return (
      <Columns>
        <Column>
          {this.renderCurrentNavPos()}
          {this.renderExternalNavPos()}
        </Column>
        <Column>
          {this.renderFixedNavPos()}
          {this.renderPanTilt()}
        </Column>
      </Columns>
    )
  }
}

/*
<Columns>
  <Column>
    {this.renderCurrentNavPos()}
    {this.renderExternalNavPos()}
  </Column>
  <Column>
    {this.renderFixedNavPos()}
    {this.renderPanTilt()}
  </Column>
</Columns>
*/

export default NavPose
