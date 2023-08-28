import React, { Component } from "react"
import Toggle from "react-toggle"
import { observer, inject } from "mobx-react"

import Input from "./Input"
import Section from "./Section"
import Button, { ButtonMenu } from "./Button"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Styles from "./Styles"
import Select, { Option } from "./Select"
//import createShortUniqueValues from "./Utilities"

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

function navSatFixStatusAsString(status_id) {
  if ((status_id === null)){
    return "Unknown"
  }
  else if (status_id === -1) {
    return "No Fix"
  }
  else if (status_id === 0) {
    return "Valid"
  }
  else if (status_id === 1) {
    return "Valid (w/ SBAS)"
  }
  else if (status_id === 2) {
    return "Valid (w/ GBAS)"
  }
  return "Unknown"
}

function navSatFixServiceAsString(service_id) {
  if ((service_id === null)){
    return "Unknown"
  }
  else if (service_id === 1) {
    return "GPS"
  }
  else if (service_id === 2) {
    return "GLONASS"
  }
  else if (service_id === 4) {
    return "COMPASS"
  }
  else if (service_id === 8) {
    return "GALILEO"
  }
  return "Unknown"
}

@inject("ros")
@observer
class NavPose extends Component {
  constructor(props) {
    super(props)

    this.state = {
      initRollEdited: null,
      initPitchEdited: null,
      initYawEdited: null,
      initLatitudeEdited: null,
      initLongitudeEdited: null,
      initAltitudeEdited: null,
      initHeadingEdited: null,
      xTranslationEdited: null,
      yTranslationEdited: null,
      zTranslationEdited: null,
      xRotationEdited: null,
      yRotationEdited: null,
      zRotationEdited: null,
      headingEdited: null,
      ahrsOutFrameEdited: null,
    }

    this.renderNavPoseSetup = this.renderNavPoseSetup.bind(this)
    this.renderCurrentNavPose = this.renderCurrentNavPose.bind(this)
    this.renderNavPoseStatus = this.renderNavPoseStatus.bind(this)
    this.setElementStyleModified = this.setElementStyleModified.bind(this)
    this.clearElementStyleModified = this.clearElementStyleModified.bind(this)
    this.onUpdateText = this.onUpdateText.bind(this)
    this.onKeyText = this.onKeyText.bind(this)
    this.createInputOptions = this.createInputOptions.bind(this)
    this.onNavSatFixTopicSelected = this.onNavSatFixTopicSelected.bind(this)
    this.onOrientationTopicSelected = this.onOrientationTopicSelected.bind(this)
    this.onHeadingTopicSelected = this.onHeadingTopicSelected.bind(this)
  }

  setElementStyleModified(e) {
    e.style.color = Styles.vars.colors.red
    e.style.fontWeight = "bold"
  }

  clearElementStyleModified(e) {
    e.style.color = Styles.vars.colors.black
    e.style.fontWeight = "normal"
  }

  onUpdateText(e) {
    var stateObject = function() {
      const returnObj = {};
      returnObj[this.target.id] = this.target.value;
      return returnObj;
    }.bind(e)();
    this.setState( stateObject );
    if ((e.target.id === "InitRoll") || (e.target.id === "InitPitch") || (e.target.id === "InitYaw"))
    {
      var rollElement = document.getElementById("InitRoll")
      this.setElementStyleModified(rollElement)
      this.setState({initRollEdited: rollElement.value})

      var pitchElement = document.getElementById("InitPitch")
      this.setElementStyleModified(pitchElement)
      this.setState({initPitchEdited: pitchElement.value})

      var yawElement = document.getElementById("InitYaw")
      this.setElementStyleModified(yawElement)
      this.setState({initYawEdited: yawElement.value})
    }
    else if ((e.target.id === "InitLatitude") || (e.target.id === "InitLongitude") || (e.target.id === "InitAltitude"))
    {
      var latitudeElement = document.getElementById("InitLatitude")
      this.setElementStyleModified(latitudeElement)
      this.setState({initLatitudeEdited: latitudeElement.value})

      var longitudeElement = document.getElementById("InitLongitude")
      this.setElementStyleModified(longitudeElement)
      this.setState({initLongitudeEdited: longitudeElement.value})

      var altitudeElement = document.getElementById("InitAltitude")
      this.setElementStyleModified(altitudeElement)
      this.setState({initAltitudeEdited: altitudeElement.value})
    }
    else if (e.target.id === "InitHeading")
    {
      var headingElement = document.getElementById("InitHeading")
      this.setElementStyleModified(headingElement)
      this.setState({initHeadingEdited: headingElement.value})
    }
    else if ((e.target.id === "XTranslation") || (e.target.id === "YTranslation") || (e.target.id === "ZTranslation") ||
             (e.target.id === "XRotation") || (e.target.id === "YRotation") || (e.target.id === "ZRotation") || (e.target.id === "Heading"))
    {
      var xTranslationElement = document.getElementById("XTranslation")
      this.setElementStyleModified(xTranslationElement)
      this.setState({xTranslationEdited: xTranslationElement.value})

      var yTranslationElement = document.getElementById("YTranslation")
      this.setElementStyleModified(yTranslationElement)
      this.setState({yTranslationEdited: yTranslationElement.value})

      var zTranslationElement = document.getElementById("ZTranslation")
      this.setElementStyleModified(zTranslationElement)
      this.setState({zTranslationEdited: zTranslationElement.value})

      var xRotationElement = document.getElementById("XRotation")
      this.setElementStyleModified(xRotationElement)
      this.setState({xRotationEdited: xRotationElement.value})

      var yRotationElement = document.getElementById("YRotation")
      this.setElementStyleModified(yRotationElement)
      this.setState({yRotationEdited: yRotationElement.value})

      var zRotationElement = document.getElementById("ZRotation")
      this.setElementStyleModified(zRotationElement)
      this.setState({zRotationEdited: zRotationElement.value})

      var headingOffsetElement = document.getElementById("Heading")
      this.setElementStyleModified(headingOffsetElement)
      this.setState({headingEdited: headingOffsetElement.value})
    }

    else if (e.target.id === "AHRSOutFrame")
    {
      var ahrsOutFrameElement = document.getElementById("AHRSOutFrame")
      this.setElementStyleModified(ahrsOutFrameElement)
      this.setState({ahrsOutFrameEdited: ahrsOutFrameElement.value})
    }
  }

  onKeyText(e) {
    const {onSetInitOrientation, onSetInitGPS, onSetInitHeading, onSetAHRSOffsets, onSetAHRSOutFrame} = this.props.ros
    if(e.key === 'Enter'){
      if ((e.target.id === "InitRoll") || (e.target.id === "InitPitch") || (e.target.id === "InitYaw"))
      {
        var rollElement = document.getElementById("InitRoll")
        this.clearElementStyleModified(rollElement)
        this.setState({initRollEdited : null})

        var pitchElement = document.getElementById("InitPitch")
        this.clearElementStyleModified(pitchElement)

        var yawElement = document.getElementById("InitYaw")
        this.clearElementStyleModified(yawElement)

        onSetInitOrientation(rollElement.value, pitchElement.value, yawElement.value)
        this.setState({initRollEdited:null, initPitchEdited:null, initYawEdited:null})
      }
      else if ((e.target.id === "InitLatitude") || (e.target.id === "InitLongitude") || (e.target.id === "InitAltitude"))
      {
        var latitudeElement = document.getElementById("InitLatitude")
        this.clearElementStyleModified(latitudeElement)

        var longitudeElement = document.getElementById("InitLongitude")
        this.clearElementStyleModified(longitudeElement)

        var altitudeElement = document.getElementById("InitAltitude")
        this.clearElementStyleModified(altitudeElement)

        onSetInitGPS(latitudeElement.value, longitudeElement.value, altitudeElement.value)
        this.setState({initLatitudeEdited:null, initLongitudeEdited:null, initAltitudeEdited:null})
      }

      else if (e.target.id === "InitHeading")
      {
        var headingElement = document.getElementById("InitHeading")
        this.clearElementStyleModified(headingElement)
        onSetInitHeading(headingElement.value)
        this.setState({initHeadingEdited:null})
      }
      else if ((e.target.id === "XTranslation") || (e.target.id === "YTranslation") || (e.target.id === "ZTranslation") ||
               (e.target.id === "XRotation") || (e.target.id === "YRotation") || (e.target.id === "ZRotation") || (e.target.id === "Heading"))
      {
        var xTranslationElement = document.getElementById("XTranslation")
        this.clearElementStyleModified(xTranslationElement)

        var yTranslationElement = document.getElementById("YTranslation")
        this.clearElementStyleModified(yTranslationElement)

        var zTranslationElement = document.getElementById("ZTranslation")
        this.clearElementStyleModified(zTranslationElement)

        var xRotationElement = document.getElementById("XRotation")
        this.clearElementStyleModified(xRotationElement)

        var yRotationElement = document.getElementById("YRotation")
        this.clearElementStyleModified(yRotationElement)

        var zRotationElement = document.getElementById("ZRotation")
        this.clearElementStyleModified(zRotationElement)

        var headingOffsetElement = document.getElementById("Heading")
        this.clearElementStyleModified(headingOffsetElement)

        onSetAHRSOffsets(xTranslationElement.value, yTranslationElement.value, zTranslationElement.value,
                         xRotationElement.value, yRotationElement.value, zRotationElement.value, headingOffsetElement.value)
        this.setState({xTranslationEdited:null, yTranslationEdited:null, zTranslationEdited:null,
                       xRotationEdited:null, yRotationEdited:null, zRotationEdited:null, headingEdited:null })
      }
      else if (e.target.id === "AHRSOutFrame")
      {
        var ahrsOutFrameElement = document.getElementById("AHRSOutFrame")
        this.clearElementStyleModified(ahrsOutFrameElement)
        onSetAHRSOutFrame(ahrsOutFrameElement.value)
        this.setState({ahrsOutFrameEdited:null})
      }
    }
  }

  createInputOptions(topics, selected) {
    var input_options = []
    //var unique_names = createShortUniqueValues(topics)
    for (var i = 0; i < topics.length; i++) {
      const topicName = topics[i]
      
      // Filter out the set_init_xyz ones -- these are not valid run-time inputs despite having the right topic type
      if (topicName.includes("set_init")){
        continue
      }
      //input_options.push(<Option value={topics[i]}>{unique_names[i]}</Option>)
      
      if (topicName === selected) {
        input_options.push(<Option selected="selected" value={topicName}>{topicName}</Option>)
      }
      else {
        input_options.push(<Option value={topicName}>{topicName}</Option>)
      }
    }
    return input_options
  }

  onNavSatFixTopicSelected(event) {
    const { onSetGPSFixTopic } = this.props.ros
    onSetGPSFixTopic(event.target.value)
  }

  onOrientationTopicSelected(event) {
    const { onSetOrientationTopic } = this.props.ros
    onSetOrientationTopic(event.target.value)    
  }

  onHeadingTopicSelected(event) {
    const { onSetHeadingTopic } = this.props.ros
    onSetHeadingTopic(event.target.value)
  }

  renderNavPoseSetup() {
    const { navTransformXTrans,
            navTransformYTrans,
            navTransformZTrans,
            navTransformXRot,
            navTransformYRot,
            navTransformZRot,
            navHeadingOffset,
            navPoseOrientationFrame,
            transformNavPoseOrientation,
            onToggletransformNavPoseOrientation,
            navSatFixTopics,
            orientationTopics,
            headingTopics,
            selectedNavSatFixTopic,
            selectedOrientationTopic,
            selectedHeadingTopic
    } = this.props.ros
    return (
      <Section title={"NAV/POSE Setup"}>
        <label style={{fontWeight: 'bold'}}>
          {"Initial State"}
        </label>
        <Columns>
          <Column>
            <Label title={"Latitude"}>
              <Input
                value={this.state.initLatitudeEdited !== null? this.state.initLatitudeEdited : round(0, 6)}
                id="InitLatitude"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Longitude"}>
              <Input
                value={this.state.initLongitudeEdited !== null ? this.state.initLongitudeEdited : round(0, 6)}
                id="InitLongitude"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Altitude (m)"}>
              <Input
                value={this.state.initAltitudeEdited !== null ? this.state.initAltitudeEdited : round(0, 2)}
                id="InitAltitude"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{ width: "80%" }}
              />
            </Label>
          </Column>
          <Column>
            <Label title={"Roll (deg)"}>
              <Input
                value={this.state.initRollEdited !== null ? this.state.initRollEdited : round(0, 2)}
                id="InitRoll"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{width: "80%"}}
              />
            </Label>
            <Label title={"Pitch (deg)"}>
              <Input
                value={this.state.initPitchEdited !== null ? this.state.initPitchEdited : round(0, 2)}
                id="InitPitch"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{width: "80%"}}
              />
            </Label>
            <Label title={"Yaw (deg)"}>
              <Input
                value={this.state.initYawEdited !== null ? this.state.initYawEdited : round(0, 2)}
                id="InitYaw"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{width: "80%"}}
              />
            </Label>
            <Label title={"Heading (deg)"}>
              <Input
                value={this.state.initHeadingEdited !== null ? this.state.initHeadingEdited : round(0, 2)}
                id="InitHeading"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{width: "80%"}}
              />
            </Label>
          </Column>
        </Columns>
        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
        <label style={{fontWeight: 'bold'}}>
          {"IMU/AHRS Offsets"}
        </label>
        <Columns>
          <Column>
            <Label title={"X (m)"}>
              <Input
                value={(this.state.xTranslationEdited !== null)? this.state.xTranslationEdited : round(navTransformXTrans, 2)}
                id="XTranslation"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Y (m)"}>
              <Input
                value={(this.state.yTranslationEdited !== null)? this.state.yTranslationEdited : round(navTransformYTrans, 2)}
                id="YTranslation"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Z (m)"}>
              <Input
                value={(this.state.zTranslationEdited !== null)? this.state.zTranslationEdited : round(navTransformZTrans, 2)}
                id="ZTranslation"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{ width: "80%" }}
              />
            </Label>
          </Column>
          <Column>
            <Label title={"Roll (deg)"}>
              <Input
                value={(this.state.xRotationEdited !== null)? this.state.xRotationEdited : round(navTransformXRot, 2)}
                id="XRotation"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Pitch (deg)"}>
              <Input
                value={(this.state.yRotationEdited !== null)? this.state.yRotationEdited : round(navTransformYRot, 2)}
                id="YRotation"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Yaw (deg)"}>
              <Input
                value={(this.state.zRotationEdited !== null)? this.state.zRotationEdited : round(navTransformZRot, 2)}
                id="ZRotation"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Heading (deg)"}>
              <Input
                value={(this.state.headingEdited !== null)? this.state.headingEdited : round(navHeadingOffset, 2)}
                id="Heading"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{ width: "80%" }}
              />
            </Label>
          </Column>
        </Columns>
        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
        <label style={{fontWeight: 'bold'}}>
          {"Input Settings"}
        </label>
        <Label title={"Nav. Source"}>
          <Select
            onChange={this.onNavSatFixTopicSelected}
            value={selectedNavSatFixTopic}
          >
            {this.createInputOptions(navSatFixTopics, selectedNavSatFixTopic)}
          </Select>
        </Label>
        <Label title={"Orientation Source"}>
          <Select
            onChange={this.onOrientationTopicSelected}
            value={selectedOrientationTopic}
          >
            {this.createInputOptions(orientationTopics, selectedOrientationTopic)}
          </Select>
        </Label>
        <Label title={"Heading Source"}>
          <Select
            onChange={this.onHeadingTopicSelected}
            value={selectedHeadingTopic}
          >
            {this.createInputOptions(headingTopics, selectedHeadingTopic)}
          </Select>
        </Label>
        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
        <label style={{fontWeight: 'bold'}}>
          {"Output Settings"}
        </label>
        <Columns>
          <Column>
            <Label title={"Output Ref. Frame"}>
              <Input
                value={(this.state.ahrsOutFrameEdited !== null)? this.state.ahrsOutFrameEdited : navPoseOrientationFrame}
                id="AHRSOutFrame"
                onChange= {this.onUpdateText}
                onKeyDown= {this.onKeyText}
                style={{width: "80%"}}
                disabled={!transformNavPoseOrientation}
              />
            </Label>
          </Column>
          <Column>
            <Label title={"Transform Output"}>
              <Toggle checked={transformNavPoseOrientation} onClick={onToggletransformNavPoseOrientation} />
            </Label>
          </Column>
        </Columns>
      </Section>
    )
  }

  renderCurrentNavPose() {
    const {
      navPoseDirectionHeadingDeg,
      navPoseDirectionSpeedMpS,
      navPoseLocationLat,
      navPoseLocationLng,
      navPoseLocationAlt,
      navPoseOrientationYawAngle,
      navPoseOrientationYawRate,
      navPoseOrientationPitchAngle,
      navPoseOrientationPitchRate,
      navPoseOrientationRollAngle,
      navPoseOrientationRollRate,
      navPoseOrientationFrame,
      onReinitNavPoseSolution
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
                value={round(navPoseLocationLat, 6)}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Longitude"}>
              <Input
                disabled
                value={round(navPoseLocationLng, 6)}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Altitude (m)"}>
              <Input
                disabled
                value={round(navPoseLocationAlt, 2)}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Speed (m/s)"}>
              <Input
                disabled
                value={round(navPoseDirectionSpeedMpS, 2)}
                style={{ width: "80%" }}
              />
            </Label>
            <Label title={"Heading (deg)"}>
              <Input
                disabled
                style={{ width: "80%" }}
                value={round(navPoseDirectionHeadingDeg, 2)}
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
                value={round(navPoseOrientationYawAngle, 2)}
              />
              <Input
                disabled
                style={{ width: "45%" }}
                value={round(navPoseOrientationYawRate, 2)}
              />
            </Label>
            <Label title={"Pitch"}>
              <Input
                disabled
                style={{ width: "45%", float: "left" }}
                value={round(navPoseOrientationPitchAngle, 2)}
              />
              <Input
                disabled
                style={{ width: "45%" }}
                value={round(navPoseOrientationPitchRate, 2)}
              />
            </Label>
            <Label title={"Yaw"}>
              <Input
                disabled
                style={{ width: "45%", float: "left" }}
                value={round(navPoseOrientationRollAngle, 2)}
              />
              <Input
                disabled
                style={{ width: "45%" }}
                value={round(navPoseOrientationRollRate, 2)}
              />
            </Label>
            <Label title={"Ref. Frame"}>
              <Input
                disabled
                style={{ width: "80%" }}
                value={navPoseOrientationFrame}
              />
            </Label>
          </Column>
        </Columns>
        <ButtonMenu>
          <Button onClick={onReinitNavPoseSolution}>{"Reinitialize"}</Button>
        </ButtonMenu>
      </Section>
    )
  }

  renderNavPoseStatus() {
    const {
      navSatFixRate,
      orientationRate,
      headingRate,
      navSatFixStatus,
      navSatFixService
    } = this.props.ros

    return (
      <Section title={"Nav/Pose Status"}>
        <Columns>
            <Column>
              <label style={{fontWeight: 'bold'}}>
                    {"Nav/Sat."}
              </label>            
              <Label title={"Status"}>
                <Input 
                  disabled
                  style={{ width: "80%" }}
                  value={navSatFixStatusAsString(navSatFixStatus)}
                />
              </Label>
              <Label title={"Service"}>
                <Input 
                  disabled
                  style={{ width: "80%" }}
                  value={navSatFixServiceAsString(navSatFixService)}
                />
              </Label>
            </Column>
            <Column>
              <div style={{ display: "flex", marginLeft: Styles.vars.spacing.regular }}>
                <label style={{fontWeight: 'bold', flex: 1, textAlign: "left"}}>
                {"Update Rates (Hz)"}
                </label>
              </div>
              <Label title={"Nav/Sat."}>
                <Input
                  disabled
                  value={round(navSatFixRate, 1)}
                />
              </Label>            
              <Label title={"Orientation"}>
                <Input
                  disabled
                  value={round(orientationRate, 1)}
                />
              </Label>            
              <Label title={"Heading"}>
                <Input
                  disabled
                  value={round(headingRate, 1)}
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
          {this.renderCurrentNavPose()}
          {this.renderNavPoseStatus()}
        </Column>
        <Column>
          {this.renderNavPoseSetup()}
        </Column>
      </Columns>
    )
  }
}

export default NavPose
