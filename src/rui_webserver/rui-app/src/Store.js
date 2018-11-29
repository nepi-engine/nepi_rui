import { observable, action } from "mobx"
import moment from "moment"
import ROS from "roslib"

const ROS_WS_URL = "ws://localhost:9090"
const FLASK_URL = "http://localhost:5003"

class ROSConnectionStore {
  @observable connectedToROS = false
  @observable rosAutoReconnect = true
  @observable messageLog = ""
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

    this.rosListenerImageRecognition.unsubscribe()
  }

  @action.bound
  onConnectedToROS() {
    this.rosListenerImageRecognition = new ROS.Topic({
      ros: this.ros,
      name: "/fake_image_recognition",
      messageType: "num_sdk_msgs/Annotation"
    })

    this.rosListenerImageRecognition.subscribe(
      this.onROSListenerrosListenerImageRecognition
    )

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
}

class NetworkInfoStore {
  @observable ipAddress = null

  @action.bound
  async fetchNetworkInfo() {
    try {
      const r = await fetch(`${FLASK_URL}/api/networkinfo`, {
        method: "GET"
      })
      const networkInfo = await r.json()
      this.ipAddress = networkInfo.ipAddress
    } catch (err) {
      console.error(err)
    }
  }
}

class ClockStore {
  @observable time = moment()

  constructor() {
    this.tick()
  }

  @action.bound
  tick() {
    this.time = moment()
    setTimeout(() => {
      this.tick()
    }, 1000)
  }
}

const stores = {
  ros: new ROSConnectionStore(),
  networkInfo: new NetworkInfoStore(),
  clock: new ClockStore()
}
export default stores
