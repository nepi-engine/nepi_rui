import { observable, action } from "mobx"
import moment from "moment"
import ROS from "roslib"
import cannon from "cannon"

const ROS_WS_URL = `ws://${window.location.hostname}:9090`
const FLASK_URL = `http://${window.location.hostname}:5003`

const TRIGGER_MASKS = {
  OUTPUT_ENABLED: 0xffffffff,
  DEFAULT: 0xefffffff
}

const UPDATE_PERIOD = 100 // ms between sending updates

export { TRIGGER_MASKS }

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

// gets a file through the flask api and parses it as Json
async function getFileJson(filename) {
  try {
    const r = await fetch(`${FLASK_URL}/files/${filename}`, {
      method: "GET"
    })
    const json = await r.json()
    return json
  } catch (err) {
    console.error(err)
  }
}

function getLocalTZ() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

class ROSConnectionStore {
  @observable connectedToROS = false
  @observable rosAutoReconnect = true
  @observable messageLog = ""
  rosListeners = []

  @observable namespacePrefix = null
  @observable deviceName = null
  @observable deviceSerial = null

  @observable systemDefs = null
  @observable systemDefsFirmwareVersion = null
  @observable systemDefsDiskCapacity = null

  @observable systemStatus = null
  @observable heartbeat = false
  @observable systemStatusDiskUsageMB = null
  @observable systemStatusDiskRate = null
  @observable systemStatusTempC = null
  @observable systemStatusWarnings = []
  @observable diskUsagePercent = null

  @observable systemStatusTime = null
  @observable clockUTCMode = false
  @observable clockTZ = getLocalTZ()
  @observable clockNTP = false
  @observable clockPPS = false

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

  @observable triggerAutoRateHz = 0
  @observable triggerMask = TRIGGER_MASKS.DEFAULT

  @observable topicQueryLock = false
  @observable topicNames = null
  @observable topicTypes = null
  @observable imageTopics = []

  @observable ndSensorTopicBase = null

  @observable ndStatus = null

  @observable rangeMax = null
  @observable rangeMin = null

  @observable angleOffset = null
  @observable angleTotal = null

  @observable resolutionEnabled = false
  @observable resolutionAdjustment = null

  @observable gainEnabled = false
  @observable gainAdjustment = null

  @observable filterEnabled = false
  @observable filterAdjustment = null

  @observable ndDisplayName = null
  @observable pauseEnable = false

  @observable imageFilter = null

  @observable lastNDUpdate = new Date()

  async checkROSConnection() {
    if (!this.connectedToROS) {
      try {
        // get the image filter
        const imageFilterJson = await getFileJson("img_filter.json")
        if (imageFilterJson.filter) {
          this.imageFilter = imageFilterJson.filter
        }

        // setup rosbridge connection
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
    this.updateTopics()

    if (this.rosAutoReconnect) {
      setTimeout(async () => {
        await this.checkROSConnection()
      }, 3500)
    }
  }

  @action.bound
  updateTopics() {
    // topicQueryLock is used so we don't call getTopics many times
    // while witing for it to return.  With many topics on a slow
    // target it takes a few seconds to retrun.
    if (this.ros && !this.topicQueryLock) {
      this.topicQueryLock = true
      this.ros.getTopics(result => {
        this.topicNames = result.topics
        this.topicTypes = result.types
        var newPrefix = this.updatePrefix()
        var newNDSensor = this.updateNDSensorTopic()
        this.updateImageTopics()

        if (newPrefix || newNDSensor) {
          this.initalizeListeners()
        }
        this.topicQueryLock = false
      })
    }
  }

  validPrefix() {
    return this.namespacePrefix && this.deviceName && this.deviceSerial
  }

  @action.bound
  updatePrefix() {
    // This function looks to see if we need to update the prefix properties.
    // It loops though the topics and uses the testTopicForPrefix to test and
    // perform the update.  If it updates we are done, break.

    // we return true if the prefix was updated
    var ret = false
    for (var i = 0; i < this.topicNames.length; i++) {
      var topic_name_parts = this.topicNames[i].split("/")
      if (
        topic_name_parts[topic_name_parts.length - 1] === "system_status" &&
        this.topicTypes[i] === "num_sdk_msgs/SystemStatus"
      ) {
        if (
          this.namespacePrefix !== topic_name_parts[1] &&
          this.deviceName !== topic_name_parts[2] &&
          this.deviceSerial !== topic_name_parts[3]
        ) {
          this.namespacePrefix = topic_name_parts[1]
          this.deviceName = topic_name_parts[2]
          this.deviceSerial = topic_name_parts[3]
          if (this.validPrefix()) {
            ret = true
            this.rosLog(
              `Fetched device info ${this.namespacePrefix}/${this.deviceName}/${
                this.deviceSerial
              }`
            )
            break
          }
        }
      }
    }
    return ret
  }

  @action.bound
  updateImageTopics() {
    // find all the image source topics in the topic list
    var newImageTopics = []
    for (var i = 0; i < this.topicNames.length; i++) {
      if (
        this.topicTypes[i] === "sensor_msgs/Image"
      ) {
        // if we don't have a filter, or if we do and this topic name includes
        // the filter text (substring search) then push it onto the list
        if (!this.imageFilter || this.topicNames[i].includes(this.imageFilter)) {
          newImageTopics.push(this.topicNames[i])
        }
      }
    }

    this.imageTopics = newImageTopics
  }

  @action.bound
  updateNDSensorTopic() {
    // find path of publisher of NDStatus msgs
    var ret = false // returns true if ND Sensor Topic changes
    for (var i = 0; i < this.topicNames.length; i++) {
      var topic_name_parts = this.topicNames[i].split("/")
      var last_element = topic_name_parts.pop()
      var topic_base = topic_name_parts.join("/")
      if (
        last_element === "nd_status" &&
        this.topicTypes[i] === "num_sdk_msgs/NDStatus" &&
        topic_base !== this.ndSensorTopicBase
      ) {
        this.ndSensorTopicBase = topic_base
        ret = true
      }
    }
    return ret
  }

  @action.bound
  destroyROSConnection() {
    this.rosAutoReconnect = false
    this.ros.off("connection", this.onConnectedToROS)
    this.ros.off("error", this.onErrorConnectingToROS)
    this.ros.off("close", this.onDisconnectedToROS)

    this.rosListeners.forEach(listener => {
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

  publishMessage({ name, messageType, data, noPrefix = false }) {
    const publisher = new ROS.Topic({
      ros: this.ros,
      name: noPrefix ? name : `${this.rosPrefix}/${name}`,
      messageType
    })
    const message = new ROS.Message(data)
    publisher.publish(message)
  }

  addListener({ name, messageType, callback, noPrefix = false }) {
    const listener = new ROS.Topic({
      ros: this.ros,
      name: noPrefix ? name : `${this.rosPrefix}/${name}`,
      messageType
    })
    listener.subscribe(action(callback))
    this.rosListeners.push(listener)
  }

  callService({ name, messageType, args = null, msgKey = null }) {
    return new Promise(resolve => {
      const client = new ROS.Service({
        ros: this.ros,
        name: `${this.rosPrefix}/${name}`,
        serviceType: messageType
      })
      const request = new ROS.ServiceRequest(args)
      client.callService(
        request,
        action(result => {
          resolve(msgKey ? result[msgKey] : result)
        })
      )
    })
  }

  @action.bound
  onConnectedToROS() {
    this.connectedToROS = true
    this.rosLog("Connected to rosbridge")
  }

  @action.bound
  initalizeListeners() {
    this.rosListeners.forEach(listener => {
      listener.unsubscribe()
    })

    // listeners
    this.setupImageRecognitionListener()
    this.setupImageSystemStatusListener()
    this.setupNDStatusListener()

    // services
    this.callSystemDefsService()
    this.startPollingNavPosService()
    this.startPollingTimeStatusService()
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
    this.addListener({
      name: "/fake_image_recognition",
      messageType: "num_sdk_msgs/Annotation",
      callback: message => {
        this.imageRecognitions = [message]
      },
      noPrefix: true
    })
  }

  setupImageSystemStatusListener() {
    this.addListener({
      name: "system_status",
      messageType: "num_sdk_msgs/SystemStatus",
      callback: message => {
        // turn heartbeat on for half a second
        this.heartbeat = true
        setTimeout(() => {
          this.heartbeat = false
        }, 500)

        this.systemStatus = message
        this.systemStatusDiskUsageMB = message.disk_usage
        this.systemStatusDiskRate = message.storage_rate

        this.systemStatusTime = moment.unix(message.sys_time.secs)

        // add timezone offset if not in UTC mode
        if (!this.clockUTCMode) {
          const tzOffset = new Date().getTimezoneOffset()
          this.systemStatusTime.add(tzOffset, "minutes")
        }

        this.diskUsagePercent = `${parseInt(
          100 * this.systemStatusDiskUsageMB / this.systemDefsDiskCapacity,
          10
        )}%`

        this.systemStatusTempC =
          message.temperatures.length && message.temperatures[0]
        this.systemStatusWarnings = message.warnings && message.warnings.flags
        this.rosLog(`Received status message`)
      }
    })
  }

  @action.bound
  ndStatusListener(message) {
    this.ndStatus = message

    this.rangeMax = message.range.max_range
    this.rangeMin = message.range.min_range

    this.angleOffset = message.angle.angle_offset
    this.angleTotal = message.angle.total_angle

    this.resolutionEnabled = message.resolution_settings.enabled
    this.resolutionAdjustment = message.resolution_settings.adjustment

    this.gainEnabled = message.gain_settings.enabled
    this.gainAdjustment = message.gain_settings.adjustment

    this.filterEnabled = message.filter_settings.enabled
    this.filterAdjustment = message.filter_settings.adjustment

    this.ndDisplayName = message.display_name
    this.pauseEnable = message.pause_enable

    this.rosLog(`Received NDStatus message`)
  }

  setupNDStatusListener() {
    if (this.ndSensorTopicBase) {
      this.addListener({
        name: this.ndSensorTopicBase + "/nd_status",
        messageType: "num_sdk_msgs/NDStatus",
        noPrefix: true,
        callback: this.ndStatusListener
      })
    }
  }

  async callSystemDefsService() {
    this.systemDefs = await this.callService({
      name: "system_defs_query",
      messageType: "num_sdk_msgs/SystemDefs",
      msgKey: "defs"
    })
    this.systemDefsFirmwareVersion = this.systemDefs.firmware_version
    this.systemDefsDiskCapacity = this.systemDefs.disk_capacity
  }

  startPollingNavPosService() {
    const _pollOnce = async () => {
      this.navPos = await this.callService({
        name: "nav_pos_query",
        messageType: "num_sdk_msgs/NavPosQuery",
        msgKey: "nav_pos"
      })

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
        setTimeout(_pollOnce, 500)
      }
    }

    _pollOnce()
  }

  startPollingTimeStatusService() {
    const _pollOnce = async () => {
      this.timeStatus = await this.callService({
        name: "time_status_query",
        messageType: "num_sdk_msgs/TimeStatus",
        msgKey: "time_status"
      })

      // if last_ntp_sync is 10y, no sync has happened
      this.clockNTP = false
      const lastNTPSync = this.timeStatus.last_ntp_sync
      lastNTPSync &&
        lastNTPSync.length &&
        lastNTPSync.forEach(sync => {
          if (sync !== "10y") {
            this.clockNTP = true
          }
        })

      // if last_pps – current_time < 1 second no sync has happened
      this.clockPPS = true
      const lastPPSTS = moment.unix(this.timeStatus.last_pps.secs).unix()
      const currTS = this.systemStatusTime && this.systemStatusTime.unix()
      if (currTS && lastPPSTS - currTS < 1) {
        this.clockPPS = false
      }

      if (this.connectedToROS) {
        setTimeout(_pollOnce, 1000)
      }
    }

    _pollOnce()
  }

  @action.bound
  onToggleClockUTCMode() {
    this.clockUTCMode = !this.clockUTCMode
    this.clockTZ = this.clockUTCMode ? "UTC" : getLocalTZ()
  }

  @action.bound
  onSyncUTCToDevice() {
    const tzOffset = new Date().getTimezoneOffset()
    const utcTS = moment()
      .subtract(tzOffset, "minutes")
      .unix()
    this.publishMessage({
      name: "set_time",
      messageType: "std_msgs/Time",
      data: {
        data: {
          secs: utcTS,
          nsecs: utcTS
        }
      }
    })
  }

  @action.bound
  onChangeTriggerRate(e) {
    let freq = parseFloat(e.target.value)

    if (isNaN(freq)) {
      freq = 0
    }

    this.publishMessage({
      name: "set_periodic_sw_trig",
      messageType: "num_sdk_msgs/PeriodicSwTrig",
      data: {
        enabled: freq > 0,
        sw_trig_mask: this.triggerMask,
        rate_hz: freq
      }
    })

    this.triggerAutoRateHz = freq
  }

  @action.bound
  onToggleHWTriggerOutputEnabled(e) {
    const checked = e.target.checked

    // If HW Trig Output Enable selected, trig mask is 0xFFFFFFFF, otherwise trig mask is 0x8FFFFFFF
    this.triggerMask = checked
      ? TRIGGER_MASKS.OUTPUT_ENABLED
      : TRIGGER_MASKS.DEFAULT

    // republish rate change with new mask
    this.onChangeTriggerRate({
      target: {
        value: this.triggerAutoRateHz
      }
    })
  }

  @action.bound
  onToggleHWTriggerInputEnabled(e) {
    const checked = e.target.checked

    this.publishMessage({
      name: "hw_trigger_in_enab",
      messageType: "std_msgs/UInt32",
      data: { data: checked ? this.triggerMask : 0 }
    })
  }

  @action.bound
  onPressManualTrigger() {
    // Pressing Manual Trigger publishes mask on the sw_trigger topic.
    this.publishMessage({
      name: "sw_trigger",
      messageType: "std_msgs/UInt32",
      data: { data: this.triggerMask }
    })
  }

  @action.bound
  onToggleSaveData(e) {
    const checked = e.target.checked

    this.publishMessage({
      name: "save_data",
      messageType: "num_sdk_msgs/SaveData",
      data: {
        save_continuous: checked,
        save_raw: false
      }
    })
  }

  // for ND Control Component to configure ND Sensor values ////////////////
  @action.bound
  isThrottled() {
    var now = new Date()
    if (now - this.lastNDUpdate < UPDATE_PERIOD) {
      return true
    }
    this.lastNDUpdate = now
    return false
  }

  publishNDAutoManualSelection(name, checked, adjustment, throttle = true) {
    if (throttle && this.isThrottled()) {
      return
    }

    if (this.ndSensorTopicBase) {
      this.publishMessage({
        name: this.ndSensorTopicBase + "/set_" + name,
        messageType: "num_sdk_msgs/NDAutoManualSelection",
        noPrefix: true,
        data: {
          enabled: checked,
          adjustment: adjustment
        }
      })
    } else {
      console.warn("publishNDAutoManualSelection: ndSensorTopicBase not set")
    }
  }

  publishNDRange(min, max, throttle = true) {
    if (throttle && this.isThrottled()) {
      return
    }

    if (this.ndSensorTopicBase) {
      this.publishMessage({
        name: this.ndSensorTopicBase + "/set_range",
        messageType: "num_sdk_msgs/NDRange",
        noPrefix: true,
        data: {
          min_range: min,
          max_range: max
        }
      })
    } else {
      console.warn("publishNDRange: ndSensorTopicBase not set")
    }
  }

  publishNDAngle(offset, total, throttle = true) {
    if (throttle && this.isThrottled()) {
      return
    }

    if (this.ndSensorTopicBase) {
      this.publishMessage({
        name: this.ndSensorTopicBase + "/set_angle",
        messageType: "num_sdk_msgs/NDAngle",
        noPrefix: true,
        data: {
          angle_offset: offset,
          total_angle: total
        }
      })
    } else {
      console.warn("publishNDAngle: ndSensorTopicBase not set")
    }
  }
  /////////////////////////////////////////////////////////////////////////
}

class NetworkInfoStore {
  @observable ipAddress = null

  @action.bound
  async fetch() {
    const networkInfo = await apiCall("networkinfo")
    this.ipAddress = networkInfo.ipAddress
  }
}

const stores = {
  ros: new ROSConnectionStore(),
  networkInfo: new NetworkInfoStore()
}

export default stores
