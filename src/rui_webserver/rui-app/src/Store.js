import { observable, action } from "mobx"
import moment from "moment"
import ROS from "roslib"
import cannon from "cannon"

const ROS_WS_URL = "ws://localhost:9090"
const FLASK_URL = "http://localhost:5003"

async function apiCall(endpoint) {
  try {
    const r = await fetch(`${FLASK_URL}/api/${endpoint}`, {
      method: "GET"
    })
    const json = await r.json()
    return json
  } catch (err) {
    console.error(err)
  }
}

class ROSConnectionStore {
  @observable connectedToROS = false
  @observable rosAutoReconnect = true
  @observable messageLog = ""
  rosListers = []

  @observable namespacePrefix = null
  @observable deviceName = null
  @observable deviceSerial = null

  @observable systemDefs = null
  @observable systemDefsFirmwareVersion = null
  @observable systemDefsDiskCapacity = null

  @observable systemStatus = null
  @observable heartbeat = false
  @observable systemStatusDiskUsageMB = null
  @observable systemStatusTempC = null
  @observable systemStatusWarnings = []
  @observable diskUsagePercent = null

  @observable navPos = null
  @observable navPosLocationLat = null
  @observable navPosLocationLng = null
  @observable navPosLocationAlt = null
  @observable navPosDirectionHeadingDeg = null
  @observable navPosDirectionSpeedMpS = null
  @observable navPosOrientationYawAngle = null
  @observable navPosOrientationYawRate = null
  @observable navPosOrientationPitchAngle = null
  @observable navPosOrientationPitchRate = null
  @observable navPosOrientationRollAngle = null
  @observable navPosOrientationRollRate = null

  @observable imageRecognitions = []

  async checkROSConnection() {
    if (!this.connectedToROS) {
      try {
        const deviceInfo = await apiCall("deviceinfo")
        this.namespacePrefix = deviceInfo.namespacePrefix
        this.deviceName = deviceInfo.deviceName
        this.deviceSerial = deviceInfo.deviceSerial
        if (this.namespacePrefix && this.deviceName && this.deviceSerial) {
          this.rosLog(
            `Fetched device info ${this.namespacePrefix}/${this.deviceName}/${
              this.deviceSerial
            }`
          )
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
        }
      } catch (e) {
        console.error(e)
      }
    }

    if (this.rosAutoReconnect) {
      setTimeout(async () => {
        await this.checkROSConnection()
      }, 3500)
    }
  }

  @action.bound
  destroyROSConnection() {
    this.rosAutoReconnect = false
    this.ros.off("connection", this.onConnectedToROS)
    this.ros.off("error", this.onErrorConnectingToROS)
    this.ros.off("close", this.onDisconnectedToROS)

    this.rosListers.forEach(listener => {
      listener.unsubscribe()
    })
  }

  @action.bound
  rosLog(text) {
    this.messageLog = `${text}\n${this.messageLog}`
  }

  get rosPrefix() {
    return `/${this.namespacePrefix}/${this.deviceName}/${this.deviceSerial}`
  }

  addListener(name, messageType, cb, noPrefix = false) {
    const listener = new ROS.Topic({
      ros: this.ros,
      name: noPrefix ? name : `${this.rosPrefix}/${name}`,
      messageType
    })
    listener.subscribe(action(cb))
    this.rosListers.push(listener)
  }

  @action.bound
  onConnectedToROS() {
    this.connectedToROS = true
    this.rosLog("Connected to rosbridge")

    this.setupImageRecognitionListener()
    this.setupImageSystemStatusListener()

    const systemDefsClient = new ROS.Service({
      ros: this.ros,
      name: `${this.rosPrefix}/system_defs_query`,
      serviceType: "num_sdk_msgs/SystemDefs"
    })
    const systemDefsRequest = new ROS.ServiceRequest()

    systemDefsClient.callService(systemDefsRequest, result => {
      this.systemDefs = result.defs

      this.systemDefsFirmwareVersion = this.systemDefs.firmware_version
      this.systemDefsDiskCapacity = this.systemDefs.disk_capacity
    })

    const navPosClient = new ROS.Service({
      ros: this.ros,
      name: `${this.rosPrefix}/nav_pos_query`,
      serviceType: "num_sdk_msgs/NavPosQuery"
    })
    const navPosRequest = new ROS.ServiceRequest({ query_time: 0 })

    const _pollNavPosOnce = () => {
      navPosClient.callService(navPosRequest, result => {
        this.navPos = result.nav_pos

        this.navPosLocationLat = this.navPos.fix.latitude
        this.navPosLocationLng = this.navPos.fix.longitude
        this.navPosLocationAlt = this.navPos.fix.altitude
        this.navPosDirectionHeadingDeg = this.navPos.heading

        // magnitude of linear_velocity?
        let { x, y, z } = this.navPos.linear_velocity
        this.navPosDirectionSpeedMpS = Math.sqrt(x * x + y * y + z * z)

        // TODO check the ordering of these?
        this.navPosOrientationYawRate = this.navPos.angular_velocity.x
        this.navPosOrientationPitchRate = this.navPos.angular_velocity.y
        this.navPosOrientationRollRate = this.navPos.angular_velocity.z

        const q = new cannon.Quaternion(
          this.navPos.orientation.x,
          this.navPos.orientation.y,
          this.navPos.orientation.z,
          this.navPos.orientation.w
        )
        const vec = new cannon.Vec3()
        q.toEuler(vec)
        this.navPosOrientationYawAngle = vec.x
        this.navPosOrientationPitchAngle = vec.y
        this.navPosOrientationRollAngle = vec.z

        if (this.connectedToROS) {
          setTimeout(_pollNavPosOnce, 500)
        }
      })
    }

    _pollNavPosOnce()
  }

  @action.bound
  onErrorConnectingToROS() {
    this.connectedToROS = false
    this.rosLog("Error connecting to rosbridge, retrying")
  }

  @action.bound
  onDisconnectedToROS() {
    this.connectedToROS = false

    this.namespacePrefix = null
    this.deviceName = null
    this.deviceSerial = null

    this.rosLog("Connection to rosbridge closed")
  }

  setupImageRecognitionListener() {
    this.addListener(
      "/fake_image_recognition",
      "num_sdk_msgs/Annotation",
      message => {
        this.imageRecognitions = [message]
      },
      true
    )
  }

  setupImageSystemStatusListener() {
    this.addListener("system_status", "num_sdk_msgs/SystemStatus", message => {
      // turn heartbeat on for half a second
      this.heartbeat = true
      setTimeout(() => {
        this.heartbeat = false
      }, 500)

      this.systemStatus = message
      this.systemStatusDiskUsageMB = message.disk_usage

      this.diskUsagePercent = `${parseInt(
        100 * this.systemStatusDiskUsageMB / this.systemDefsDiskCapacity,
        10
      )}%`

      this.systemStatusTempC =
        message.temperatures.length && message.temperatures[0]
      this.systemStatusWarnings = message.warnings && message.warnings.flags
      this.rosLog(`Received status message`)
    })
  }
}

class NetworkInfoStore {
  @observable ipAddress = null

  @action.bound
  async fetch() {
    const networkInfo = await apiCall("networkinfo")
    this.ipAddress = networkInfo.ipAddress
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
