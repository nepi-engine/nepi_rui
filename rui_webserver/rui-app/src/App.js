import React, { Component } from "react"
import Toggle from "react-toggle"

import ROS from "roslib"

import Page from "./Page"
import Nav from "./Nav"
import Section from "./Section"
import HorizontalDivider from "./HorizontalDivider"
import { Columns, Column } from "./Columns"
import Label from "./Label"

const ROS_WS_URL = "ws://localhost:9090"

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      connectedToROS: false,
      rosAutoReconnect: true,
      rosLog: "",
      text: "test1",
      disabledText: "test2",
      toggle: true,
      disabledToggle: false
    }

    this.checkROSConnection = this.checkROSConnection.bind(this)
    this.onConnectedToROS = this.onConnectedToROS.bind(this)
    this.onErrorConnectingToROS = this.onErrorConnectingToROS.bind(this)
    this.onDisconnectedToROS = this.onDisconnectedToROS.bind(this)

    this.rosLog = this.rosLog.bind(this)
    this.onROSListener = this.onROSListener.bind(this)

    this.onInputChange = this.onInputChange.bind(this)
    this.onToggleChange = this.onToggleChange.bind(this)
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
        debugger
        console.error(e)
      }
    }

    if (rosAutoReconnect) {
      setTimeout(() => {
        this.checkROSConnection()
      }, 2000)
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

    this.rosListener.unsubscribe()
  }

  onConnectedToROS() {
    // rostopic pub /listener std_msgs/String "Hello, World"
    this.rosListener = new ROS.Topic({
      ros: this.ros,
      name: "/listener",
      messageType: "std_msgs/String"
    })

    this.rosListener.subscribe(this.onROSListener)

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

  onROSListener(message) {
    this.rosLog(`Received message on ${this.rosListener.name}: ${message.data}`)
  }

  onInputChange(e) {
    this.setState({ text: e.target.value })
  }

  onToggleChange(e) {
    this.setState({ toggle: e.target.checked })
  }

  render() {
    const {
      connectedToROS,
      rosLog,
      text,
      disabledText,
      toggle,
      disabledToggle
    } = this.state
    return (
      <Page>
        <Nav />
        <HorizontalDivider />
        <Columns>
          <Column>
            <Section title={"Section name"}>
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
          </Column>
        </Columns>
      </Page>
    )
  }
}

export default App
