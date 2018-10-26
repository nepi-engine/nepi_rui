import React, { Component } from "react"
import Toggle from "react-toggle"

import ROS from "roslib"

import Page from "./Page"
import Nav from "./Nav"
import Section from "./Section"
import HorizontalDivider from "./HorizontalDivider"
import { Columns, Column } from "./Columns"
import Label from "./Label"

const ros = new ROS.Ros({
  url: "ws://localhost:9090"
})

// rostopic pub /listener std_msgs/String "Hello, World"
const rosListener = new ROS.Topic({
  ros,
  name: "/listener",
  messageType: "std_msgs/String"
})

const ROS_CONNECTION_STATE_CONNECTED = "CONNECTED"
const ROS_CONNECTION_STATE_DISCONNECTED = "DISCONNECTED"
const ROS_CONNECTION_STATE_ERROR = "ERROR"

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      rosConnectionState: ROS_CONNECTION_STATE_DISCONNECTED,
      rosConnectionError: null,
      rosLog: "",
      text: "test1",
      disabledText: "test2",
      toggle: true,
      disabledToggle: false
    }

    this.onConnectedToROS = this.onConnectedToROS.bind(this)
    this.onConnectedToROSError = this.onConnectedToROSError.bind(this)
    this.onDisconnectedToROS = this.onDisconnectedToROS.bind(this)

    this.rosLog = this.rosLog.bind(this)
    this.onROSListener = this.onROSListener.bind(this)

    this.onInputChange = this.onInputChange.bind(this)
    this.onToggleChange = this.onToggleChange.bind(this)
  }

  componentDidMount() {
    ros.on("connection", this.onConnectedToROS)
    ros.on("error", this.onConnectedToROSError)
    ros.on("close", this.onDisconnectedToROS)

    rosListener.subscribe(this.onROSListener)
  }

  componentWillUnmount() {
    ros.off("connection", this.onConnectedToROS)
    ros.off("error", this.onConnectedToROSError)
    ros.off("close", this.onDisconnectedToROS)

    rosListener.unsubscribe()
  }

  onConnectedToROS() {
    this.setState({
      rosConnectionState: ROS_CONNECTION_STATE_CONNECTED,
      rosConnectionError: null
    })
    this.rosLog("Connected to rosbridge websocket server.")
  }

  onConnectedToROSError(error) {
    this.setState({
      rosConnectionState: ROS_CONNECTION_STATE_ERROR,
      rosConnectionError: error
    })
    this.rosLog("Error connecting to rosbridge websocket server: ", error)
  }

  onDisconnectedToROS() {
    this.setState({ rosConnectionState: ROS_CONNECTION_STATE_DISCONNECTED })
    this.rosLog("Connection to rosbridge websocket server closed.")
  }

  rosLog(text) {
    const { rosLog } = this.state
    this.setState({ rosLog: rosLog + `${text}\n` })
  }

  onROSListener(message) {
    this.rosLog(`Received message on ${rosListener.name}: ${message.data}`)
  }

  onInputChange(e) {
    this.setState({ text: e.target.value })
  }

  onToggleChange(e) {
    this.setState({ toggle: e.target.checked })
  }

  render() {
    const {
      rosConnectionState,
      rosConnectionError,
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
                <input disabled value={rosConnectionState} />
              </Label>
              {rosConnectionError && `Connection error: ${rosConnectionError}`}
              <pre>{rosLog}</pre>
            </Section>
          </Column>
          <Column>
            <Section title={"Debug info"}>
              <pre>{JSON.stringify(this.state, null, 2)}</pre>
            </Section>
          </Column>
        </Columns>
      </Page>
    )
  }
}

export default App
