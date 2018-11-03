import React, { Component } from "react"
import Toggle from "react-toggle"
import CircularProgressbar from "react-circular-progressbar"
import moment from "moment"

import ROS from "roslib"

import Page from "./Page"
import Nav from "./Nav"
import Input from "./Input"
import Section from "./Section"
import HorizontalDivider from "./HorizontalDivider"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import PageLock from "./PageLock"
import Button, { ButtonMenu } from "./Button"
import Select, { Option } from "./Select"

import camPlaceholder from "./camPlaceholder.png"

const ROS_WS_URL = "ws://localhost:9090"
const IS_DEBUG = window.location.hostname === "localhost"

const PAGES = ["Dashboard", "Applications", "Files", "Settings"]

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      pageLocked: !IS_DEBUG,
      activePage: PAGES[0],
      connectedToROS: false,
      rosAutoReconnect: true,
      rosLog: "",
      text: "test1",
      disabledText: "test2",
      toggle: true,
      disabledToggle: false,
      progressBarPercentage: 0,
      deviceInfoName: "3DSC-64",
      deviceInfoSerial: "100100",
      deviceClockNTPActive: true,
      deviceClockPPSActive: true,
      deviceClockTime: moment(),
      deviceLocationLat: "44.968046",
      deviceLocationLng: "-94.420307",
      deviceLocationAlt: "567.4",
      deviceTriggerSWActive: true,
      deviceTriggerDualCamsActive: true,
      deviceTriggerToFCamActive: true,
      deviceTrigger3DSonarActive: true,
      deviceTriggerActualRateHz: "15.5",
      deviceTriggerAutoRateHz: "20",
      deviceStatusTempC: "75 C",
      deviceStatusStorage: "90%",
      deviceStatusStorageCapacityMB: "500000",
      deviceStatusStorageUsedMB: "450000",
      deviceDirectionHeadingDeg: "40.3",
      deviceDirectionSpeedMpS: "2.1",
      deviceOrientationYawAngle: "44.96",
      deviceOrientationYawRate: "1",
      deviceOrientationPitchAngle: "-4.2",
      deviceOrientationPitchRate: ".1",
      deviceOrientationRollAngle: "-2",
      deviceOrientationRollRate: ".2"
    }

    this.onNavChange = this.onNavChange.bind(this)

    this.checkROSConnection = this.checkROSConnection.bind(this)
    this.onConnectedToROS = this.onConnectedToROS.bind(this)
    this.onErrorConnectingToROS = this.onErrorConnectingToROS.bind(this)
    this.onDisconnectedToROS = this.onDisconnectedToROS.bind(this)

    this.rosLog = this.rosLog.bind(this)
    this.onROSListenerHelloWorld = this.onROSListenerHelloWorld.bind(this)
    this.onROSListenerProgressBar = this.onROSListenerProgressBar.bind(this)

    this.onInputChange = this.onInputChange.bind(this)
    this.onToggleChange = this.onToggleChange.bind(this)
    this.onUnlockPage = this.onUnlockPage.bind(this)

    this.renderExampleSection = this.renderExampleSection.bind(this)
    this.renderROSStatus = this.renderROSStatus.bind(this)
    this.renderDeviceInfo = this.renderDeviceInfo.bind(this)
    this.renderSystemClock = this.renderSystemClock.bind(this)
    this.updateClock = this.updateClock.bind(this)
    this.renderLocation = this.renderLocation.bind(this)
    this.renderTriggerSettings = this.renderTriggerSettings.bind(this)
    this.renderSystemStatus = this.renderSystemStatus.bind(this)
    this.renderDirection = this.renderDirection.bind(this)
    this.renderOrientation = this.renderOrientation.bind(this)
    this.renderSystemMessages = this.renderSystemMessages.bind(this)
    this.renderAppContent = this.renderAppContent.bind(this)
    this.renderCameraPreview = this.renderCameraPreview.bind(this)
  }

  onNavChange(pageName) {
    this.setState({ activePage: pageName })
  }

  checkROSConnection() {
    const { connectedToROS, rosAutoReconnect } = this.state
    if (!connectedToROS) {
      try {
        if (!this.ros) {
          this.ros = new ROS.Ros({
            url: ROS_WS_URL
          })
          this.ros.on("connection", this.onConnectedToROS)
          this.ros.on("error", this.onErrorConnectingToROS)
          this.ros.on("close", this.onDisconnectedToROS)
        } else {
          this.ros.connect(ROS_WS_URL)
        }
      } catch (e) {
        console.error(e)
      }
    }

    if (rosAutoReconnect) {
      setTimeout(() => {
        this.checkROSConnection()
      }, 3500)
    }
  }

  updateClock() {
    this.setState({
      deviceClockTime: moment()
    })
    setTimeout(() => {
      this.updateClock()
    }, 1000)
  }

  componentDidMount() {
    this.checkROSConnection()
    this.updateClock()
  }

  componentWillUnmount() {
    this.setState({ rosAutoReconnect: false })
    this.ros.off("connection", this.onConnectedToROS)
    this.ros.off("error", this.onErrorConnectingToROS)
    this.ros.off("close", this.onDisconnectedToROS)

    this.rosListenerHelloWorld.unsubscribe()
    this.rosListenerProgressBar.unsubscribe()
  }

  onConnectedToROS() {
    // rostopic pub /helloworld std_msgs/String "Hello, World"
    this.rosListenerHelloWorld = new ROS.Topic({
      ros: this.ros,
      name: "/helloworld",
      messageType: "std_msgs/String"
    })

    this.rosListenerHelloWorld.subscribe(this.onROSListenerHelloWorld)

    // rostopic pub /progressbar std_msgs/Int32 50
    this.rosListenerProgressBar = new ROS.Topic({
      ros: this.ros,
      name: "/progressbar",
      messageType: "std_msgs/Int32"
    })

    this.rosListenerProgressBar.subscribe(this.onROSListenerProgressBar)

    this.setState({
      connectedToROS: true
    })
    this.rosLog("Connected to rosbridge")
  }

  onErrorConnectingToROS() {
    this.setState({
      connectedToROS: false
    })
    this.rosLog("Error connecting to rosbridge, retrying")
  }

  onDisconnectedToROS() {
    this.setState({ connectedToROS: false })
    this.rosLog("Connection to rosbridge closed")
  }

  rosLog(text) {
    const { rosLog } = this.state
    this.setState({ rosLog: `${text}\n` + rosLog })
  }

  onROSListenerHelloWorld(message) {
    this.rosLog(
      `Received message on ${this.rosListenerHelloWorld.name}: ${message.data}`
    )
  }

  onROSListenerProgressBar(message) {
    this.rosLog(
      `Received message on ${this.rosListenerHelloWorld.name}: ${message.data}`
    )

    this.setState({ progressBarPercentage: message.data })
  }

  onInputChange(e) {
    this.setState({ text: e.target.value })
  }

  onToggleChange(e) {
    this.setState({ toggle: e.target.checked })
  }

  onUnlockPage(e) {
    this.setState({ pageLocked: false })
  }

  renderExampleSection() {
    const {
      text,
      disabledText,
      toggle,
      disabledToggle,
      progressBarPercentage
    } = this.state
    return (
      <React.Fragment>
        <Section title={"Example Section"}>
          <Label title={"Modifiable text"}>
            <Input value={text} onChange={this.onInputChange} />
          </Label>
          <Label title={"Unmodifiable text"}>
            <Input disabled value={disabledText} />
          </Label>
          <Label title={"Modifiable toggle"}>
            <Toggle checked={toggle} onChange={this.onToggleChange} />
          </Label>
          <Label title={"Unmodifiable toggle"}>
            <Toggle disabled checked={disabledToggle} />
          </Label>
        </Section>
        <Section title={"Example progress bar"}>
          <CircularProgressbar
            percentage={progressBarPercentage}
            text={`${progressBarPercentage}%`}
          />
        </Section>
        <Section title={"Debug info"}>
          <pre>
            {JSON.stringify({ ...this.state, rosLog: "hidden" }, null, 2)}
          </pre>
        </Section>
      </React.Fragment>
    )
  }

  renderROSStatus() {
    const { connectedToROS, rosLog } = this.state
    return (
      <Section title={"ROS status"}>
        <Label title={"ROS Connection"}>
          <Toggle disabled checked={connectedToROS} />
        </Label>
        <pre>{rosLog}</pre>
      </Section>
    )
  }

  renderDeviceInfo() {
    const { deviceInfoName, deviceInfoSerial } = this.state
    return (
      <Section title={"Device Info"}>
        <Label title={"Device Name"}>
          <Input disabled value={deviceInfoName} />
        </Label>
        <Label title={"Device Serial Number"}>
          <Input disabled value={deviceInfoSerial} />
        </Label>
      </Section>
    )
  }

  renderSystemClock() {
    const {
      deviceClockNTPActive,
      deviceClockPPSActive,
      deviceClockTime
    } = this.state
    return (
      <Section title={"System Clock"}>
        <Label title={"NTP"}>
          <Toggle disabled checked={deviceClockNTPActive} />
        </Label>
        <Label title={"PPS"}>
          <Toggle disabled checked={deviceClockPPSActive} />
        </Label>
        <Label title={"Time"}>
          <Input disabled value={deviceClockTime.format("h:mm a")} />
        </Label>
        <Label title={"Date"}>
          <Input disabled value={deviceClockTime.format("l")} />
        </Label>
        <Label title={"Timezone"}>
          <Input disabled value={"MDT"} />
        </Label>
      </Section>
    )
  }

  renderLocation() {
    const {
      deviceLocationLat,
      deviceLocationLng,
      deviceLocationAlt
    } = this.state
    return (
      <Section title={"Location"}>
        <Label title={"Latitude"}>
          <Input disabled value={deviceLocationLat} />
        </Label>
        <Label title={"Longitude"}>
          <Input disabled value={deviceLocationLng} />
        </Label>
        <Label title={"Altitude (m)"}>
          <Input disabled value={deviceLocationAlt} />
        </Label>
      </Section>
    )
  }

  renderTriggerSettings() {
    const {
      deviceTriggerSWActive,
      deviceTriggerDualCamsActive,
      deviceTriggerToFCamActive,
      deviceTrigger3DSonarActive,
      deviceTriggerActualRateHz,
      deviceTriggerAutoRateHz
    } = this.state
    return (
      <Section title={"Trigger Settings"}>
        <Label title={"Dual Cams"}>
          <Toggle disabled checked={deviceTriggerDualCamsActive} />
        </Label>
        <Label title={"ToF Cam"}>
          <Toggle disabled checked={deviceTriggerToFCamActive} />
        </Label>
        <Label title={"3D Sonar"}>
          <Toggle disabled checked={deviceTrigger3DSonarActive} />
        </Label>

        <Label title={"Actual Rate (Hz)"}>
          <Input disabled value={deviceTriggerActualRateHz} />
        </Label>
        <Label title={"Auto Rate (Hz)"}>
          <Input disabled value={deviceTriggerAutoRateHz} />
        </Label>
      </Section>
    )
  }

  renderSystemStatus() {
    const {
      connectedToROS,
      deviceStatusTempC,
      deviceStatusStorage,
      deviceStatusStorageCapacityMB,
      deviceStatusStorageUsedMB
    } = this.state
    return (
      <Section title={"System Status"}>
        <Label title={"Heartbeat"}>
          <Toggle disabled checked={connectedToROS} />
        </Label>

        <Label title={"Temp (C)"}>
          <Input disabled value={deviceStatusTempC} />
        </Label>

        <Label title={"Storage"}>
          <Input disabled value={deviceStatusStorage} />
        </Label>

        <Label title={"Capacity (MB)"}>
          <Input disabled value={deviceStatusStorageCapacityMB} />
        </Label>

        <Label title={"Used (MB)"}>
          <Input disabled value={deviceStatusStorageUsedMB} />
        </Label>
      </Section>
    )
  }

  renderDirection() {
    const { deviceDirectionHeadingDeg, deviceDirectionSpeedMpS } = this.state
    return (
      <Section title={"Direction"}>
        <Label title={"Heading (deg)"}>
          <Input disabled value={deviceDirectionHeadingDeg} />
        </Label>
        <Label title={"Speed (m/s)"}>
          <Input disabled value={deviceDirectionSpeedMpS} />
        </Label>
      </Section>
    )
  }

  renderOrientation() {
    const {
      deviceOrientationYawAngle,
      deviceOrientationYawRate,
      deviceOrientationPitchAngle,
      deviceOrientationPitchRate,
      deviceOrientationRollAngle,
      deviceOrientationRollRate
    } = this.state
    return (
      <Section title={"Orientation (deg, deg/s)"}>
        <Label title={"Yaw"}>
          <Input
            disabled
            style={{ width: "50%" }}
            value={deviceOrientationYawAngle}
          />
          <Input
            disabled
            style={{ width: "50%" }}
            value={deviceOrientationYawRate}
          />
        </Label>
        <Label title={"Pitch"}>
          <Input
            disabled
            style={{ width: "50%" }}
            value={deviceOrientationPitchAngle}
          />
          <Input
            disabled
            style={{ width: "50%" }}
            value={deviceOrientationPitchRate}
          />
        </Label>
        <Label title={"Roll"}>
          <Input
            disabled
            style={{ width: "50%" }}
            value={deviceOrientationRollAngle}
          />
          <Input
            disabled
            style={{ width: "50%" }}
            value={deviceOrientationRollRate}
          />
        </Label>
      </Section>
    )
  }

  renderSystemMessages() {
    const { rosLog } = this.state
    return (
      <Section title={"System Messages"}>
        <pre style={{ height: "220px", overflowY: "auto" }}>{rosLog}</pre>
      </Section>
    )
  }

  renderCameraPreview() {
    return (
      <Section title={"Camera Preview"}>
        <img src={camPlaceholder} />
        <ButtonMenu>
          <Button>{"Take Snapshot"}</Button>
          <Button>{"Clear Fence"}</Button>
        </ButtonMenu>
      </Section>
    )
  }

  renderCameraSettings() {
    return (
      <Section title={"Settings"}>
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
    )
  }

  renderAppContent() {
    const { activePage } = this.state

    switch (activePage) {
      case PAGES[0]: // dashboard
        return (
          <Columns>
            {/* <Column>{this.renderExampleSection()}</Column> */}
            {/* <Column>{this.renderROSStatus()}</Column> */}
            <Column>
              {this.renderDeviceInfo()}
              {this.renderSystemClock()}
              {this.renderLocation()}
            </Column>
            <Column>
              {this.renderTriggerSettings()}
              {this.renderSystemStatus()}
            </Column>
            <Column>
              {this.renderSystemMessages()}
              {this.renderOrientation()}
              {this.renderDirection()}
            </Column>
          </Columns>
        )
      case PAGES[1]: // apps
        return (
          <Columns>
            <Column>{this.renderCameraPreview()}</Column>
            <Column>{this.renderCameraSettings()}</Column>
          </Columns>
        )
      default:
        return <div>{"Page not implemented"}</div>
    }
  }

  render() {
    const { pageLocked } = this.state
    return (
      <Page>
        <Nav
          pageLocked={pageLocked}
          onNavChange={this.onNavChange}
          pages={PAGES}
        />
        <HorizontalDivider />
        {pageLocked && <PageLock onUnlockPage={this.onUnlockPage} />}
        {!pageLocked && this.renderAppContent()}
      </Page>
    )
  }
}

export default App
