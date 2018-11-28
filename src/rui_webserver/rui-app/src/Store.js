import { observable, computed, action, autorun } from "mobx"

import ROS from "roslib"

const ROS_WS_URL = "ws://localhost:9090"

class ROSConnection {
  @observable connectedToROS = false
  @observable rosAutoReconnect = true
  @observable messageLog = ""
  @observable progressBarPercentage = 0
  @observable imageRecognitions = []

  checkROSConnection() {
    if (!this.connectedToROS) {
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

    if (this.rosAutoReconnect) {
      setTimeout(() => {
        this.checkROSConnection()
      }, 3500)
    }
  }

  @action.bound
  destroyROSConnection() {
    this.rosAutoReconnect = false
    this.ros.off("connection", this.onConnectedToROS)
    this.ros.off("error", this.onErrorConnectingToROS)
    this.ros.off("close", this.onDisconnectedToROS)

    this.rosListenerProgressBar.unsubscribe()
    this.rosListenerImageRecognition.unsubscribe()
  }

  @action.bound
  onConnectedToROS() {
    this.rosListenerImageRecognition = new ROS.Topic({
      ros: this.ros,
      name: "/fake_image_recognition",
      messageType: "num_sdk_msgs/Annotation"
    });

    this.rosListenerImageRecognition.subscribe(
      this.onROSListenerrosListenerImageRecognition
    )

    // rostopic pub /progressbar std_msgs/Int32 50
    this.rosListenerProgressBar = new ROS.Topic({
      ros: this.ros,
      name: "/progressbar",
      messageType: "std_msgs/Int32"
    })

    this.rosListenerProgressBar.subscribe(this.onROSListenerProgressBar)

    this.connectedToROS = true
    this.rosLog("Connected to rosbridge")
  }

  @action.bound
  onErrorConnectingToROS() {
    this.connectedToROS = false
    this.rosLog("Error connecting to rosbridge, retrying")
  }

  @action.bound
  onDisconnectedToROS() {
    this.connectedToROS = false
    this.rosLog("Connection to rosbridge closed")
  }

  @action.bound
  rosLog(text) {
    this.messageLog = `${text}\n${this.messageLog}`
  }

  @action.bound
  onROSListenerrosListenerImageRecognition(message) {
    this.rosLog(
      `Received message on ${
        this.rosListenerImageRecognition.name
      }: ${JSON.stringify(message, null, 2)}`
    )
    this.imageRecognitions = [message]
  }

  @action.bound
  onROSListenerProgressBar(message) {
    this.rosLog(
      `Received message on ${this.rosListenerProgressBar.name}: ${message.data}`
    )

    this.progressBarPercentage = message.data
  }
}

class Store {
  @observable imageRecognitions = []
  @observable ros = new ROSConnection()
}

const store = new Store()

export default store
