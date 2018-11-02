import React, { Component } from "react"
import Toggle from "react-toggle"
import CircularProgressbar from "react-circular-progressbar"

import ROS from "roslib"

import Page from "./Page"
import Nav from "./Nav"
import Section from "./Section"
import HorizontalDivider from "./HorizontalDivider"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import PageLock from "./PageLock"

const ROS_WS_URL = "ws://localhost:9090"

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      pageLocked: window.location.hostname !== "localhost",
      connectedToROS: false,
      rosAutoReconnect: true,
      rosLog: "",
      text: "test1",
      disabledText: "test2",
      toggle: true,
      disabledToggle: false,
      progressBarPercentage: 0
    }

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

  componentDidMount() {
    this.checkROSConnection()
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
    this.rosLog("Connected to rosbridge websocket server")
  }

  onErrorConnectingToROS() {
    this.setState({
      connectedToROS: false
    })
    this.rosLog("Error connecting to rosbridge websocket server, retrying")
  }

  onDisconnectedToROS() {
    this.setState({ connectedToROS: false })
    this.rosLog("Connection to rosbridge websocket server closed")
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

  render() {
    const {
      pageLocked,
      connectedToROS,
      rosLog,
      text,
      disabledText,
      toggle,
      disabledToggle,
      progressBarPercentage
    } = this.state

    return (
      <Page>
        <Nav pageLocked={pageLocked} />
        <HorizontalDivider />
        {pageLocked && <PageLock onUnlockPage={this.onUnlockPage} />}
        {!pageLocked && (
          <Columns>
            <Column>
              <Section title={"Example Section"}>
                <Label title={"Modifiable text"}>
                  <input value={text} onChange={this.onInputChange} />
                </Label>
                <Label title={"Unmodifiable text"}>
                  <input disabled value={disabledText} />
                </Label>
                <Label title={"Modifiable toggle"}>
                  <Toggle checked={toggle} onChange={this.onToggleChange} />
                </Label>
                <Label title={"Unmodifiable toggle"}>
                  <Toggle disabled checked={disabledToggle} />
                </Label>
              </Section>
              <Section title={"ROS status"}>
                <Label title={"ROS Connection"}>
                  <Toggle disabled checked={connectedToROS} />
                </Label>
                <pre>{rosLog}</pre>
              </Section>
            </Column>
            <Column>
              <Section title={"Debug info"}>
                <pre>
                  {JSON.stringify({ ...this.state, rosLog: "hidden" }, null, 2)}
                </pre>
              </Section>
              <Section title={"Example progress bar"}>
                <CircularProgressbar
                  percentage={progressBarPercentage}
                  text={`${progressBarPercentage}%`}
                />
              </Section>
            </Column>
          </Columns>
        )}
      </Page>
    )
  }
}

export default App
