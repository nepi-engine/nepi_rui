import { observable, action } from "mobx"
import moment from "moment"
import ROS from "roslib"
import cannon from "cannon"
import { colors } from "./Styles"

const ROS_WS_URL = `ws://${window.location.hostname}:9090`
const FLASK_URL = `http://${window.location.hostname}:5003`

const TRIGGER_MASKS = {
  OUTPUT_ENABLED: 0xffffffff,
  DEFAULT: 0x7fffffff
}

// TODO: Would be better to query the display_name property of all nodes to generate
// this dictionary... requires a new SDKNode service to do so
const NODE_DISPLAY_NAMES = {
  stereo_cam_mgr: "Stereo Camera",
  config_mgr: "Config Manager",
  nav_pos_mgr: "Nav./Pose/GPS",
  network_mgr: "Network",
  num_darknet_ros_mgr: "Classifier",
  system_mgr: "System",
  time_sync_mgr: "Time Sync",
  trigger_mgr: "Triggering"
}

const CLASSIFIER_IMG_TOPIC_SUFFIX = '/classifier/detection_image'

const UPDATE_PERIOD = 100 // ms between sending updates

function displayNameFromNodeName(node_name) {
  var display_name = NODE_DISPLAY_NAMES[node_name]
  if (display_name) {
    return display_name
  }
  return node_name
}

function nodeNameFromDisplayName(display_name) {
  for( var node_name in NODE_DISPLAY_NAMES ) {
    if (NODE_DISPLAY_NAMES[node_name] === display_name) {
      return node_name
    }
  }
  // Don't return anything if we don't find the display name -- callers can check for undefined
}

export { TRIGGER_MASKS, displayNameFromNodeName, nodeNameFromDisplayName }

/*
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
*/

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

//////////////////////////////////////////////////////////////
// from: https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript
// Warn if overriding existing method
if (Array.prototype.equals)
  console.warn(
    "Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code."
  )
// attach the .equals method to Array's prototype to call it on any array
// eslint-disable-next-line no-extend-native
Array.prototype.equals = function(array) {
  // if the other array is a falsy value, return
  if (!array) return false

  // compare lengths - can save a lot of time
  if (this.length !== array.length) return false

  for (var i = 0, l = this.length; i < l; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].equals(array[i])) return false
    } else if (this[i] !== array[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false
    }
  }
  return true
}
// Hide method from for-in loops
// eslint-disable-next-line no-extend-native
Object.defineProperty(Array.prototype, "equals", { enumerable: false })
//////////////////////////////////////////////////////////////

class ROSConnectionStore {
  @observable connectedToROS = false
  @observable rosAutoReconnect = true
  @observable messageLog = ""
  rosListeners = []

  @observable namespacePrefix = null
  @observable deviceType = null
  @observable deviceId = null
  @observable deviceSerial = null
  @observable deviceInWater = false

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

  @observable triggerStatus = null
  @observable triggerAutoRateHz = 0
  @observable triggerMask = TRIGGER_MASKS.DEFAULT

  @observable saveFreqHz = 1.0

  @observable topicQueryLock = false
  @observable topicNames = null
  @observable topicTypes = null
  @observable imageTopicsDetection = []
  @observable imageTopics3DX = []
  @observable sensor3DXTopics = []
  @observable resetTopics = []

  @observable imageFilterDetection = null
  @observable imageFilter3DX = null

  @observable last3DXUpdate = new Date()

  @observable classifiers = []
  @observable classifierImgTopic = null

  @observable ip_addrs = []

  @observable NUID = ""
  @observable NEPIStatus = null
  @observable alias = ""
  @observable lb_last_connection_time = null
  @observable hb_last_connection_time = null
  @observable lb_do_msg_count = "1"
  @observable lb_dt_msg_count = null
  @observable hb_do_transfered_mb = null
  @observable hb_dt_transfered_mb = null
  @observable lb_enabled = null
  @observable hb_enabled = null
  @observable lb_available_data_sources = null
  @observable lb_selected_data_sources = null
  @observable lb_comms_types = null
  @observable auto_attempts_per_hour = null
  @observable link_per_hour = null
  @observable lb_data_queue_size_KB = null
  @observable hb_auto_data_offloading_enabled = null
  @observable log_storage_enabled = null


  //@observable reportedClassifierImg = "Uninitialized"
  //@observable reportedClassifierName = "Uninitialized"
  @observable reportedClassifier = {}

  async checkROSConnection() {
    if (!this.connectedToROS) {
      try {
        // get the image filters
        const imageFilterDetectionJson = await getFileJson("img_filter_detection.json")
        if (imageFilterDetectionJson.filter) {
          this.imageFilterDetection = new RegExp(imageFilterDetectionJson.filter)
        }

        const imageFilter3DXJson = await getFileJson("img_filter_3dx.json")
        if (imageFilter3DXJson.filter) {
          this.imageFilter3DX = new RegExp(imageFilter3DXJson.filter)
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

    // update the topics periodically
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
        var newSensor3DXs = this.updateSensor3DXTopics()
        var newResettables = this.updateResetTopics()
        var newDetectionImageTopics = this.updateDetectionImageTopics()
        var new3DXImageTopics = this.update3DXImageTopics()

        if (newPrefix || newSensor3DXs || newResettables || newDetectionImageTopics || new3DXImageTopics) {
          this.initalizeListeners()
        }
        this.topicQueryLock = false
      })
    }
  }

  validPrefix() {
    return this.namespacePrefix && this.deviceType && this.deviceId
  }

  @action.bound
  updatePrefix() {
    // Function for testing if we need to update the device prefix variables.
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
          this.deviceType !== topic_name_parts[2] &&
          this.deviceId !== topic_name_parts[3]
        ) {
          this.namespacePrefix = topic_name_parts[1]
          this.deviceType = topic_name_parts[2]
          this.deviceId = topic_name_parts[3]
          if (this.validPrefix()) {
            ret = true
            this.rosLog(
              `Fetched device info ${this.namespacePrefix}/${this.deviceType}/${
                this.deviceId
              }`
            )
            // And update the (fixed) classifier image topic
            this.classifierImgTopic = '/'
            this.classifierImgTopic = this.classifierImgTopic.concat(this.namespacePrefix, '/', this.deviceType, '/', this.deviceId, CLASSIFIER_IMG_TOPIC_SUFFIX)
            break
          }
        }
      }
    }
    return ret
  }

  @action.bound
  updateDetectionImageTopics() {
    // Function for updating image topics list
    var newImageTopics = []
    for (var i = 0; i < this.topicNames.length; i++) {
      if (this.topicTypes[i] === "sensor_msgs/Image") {
        // if we don't have a filter, or if we do and this topic name includes
        // the filter text (substring search) then push it onto the list
        if (!this.imageFilterDetection || this.imageFilterDetection.test(this.topicNames[i])) {
          newImageTopics.push(this.topicNames[i])
        }
      }
    }

    // sort the image topics for comparison to work
    newImageTopics.sort()

    if (!this.imageTopicsDetection.equals(newImageTopics)) {
      this.imageTopicsDetection = newImageTopics
      return true
    } else {
      return false
    }
  }

  @action.bound
  update3DXImageTopics() {
    // Function for updating image topics list
    var newImageTopics = []
    for (var i = 0; i < this.topicNames.length; i++) {
      if (this.topicTypes[i] === "sensor_msgs/Image") {
        // if we don't have a filter, or if we do and this topic name includes
        // the filter text (substring search) then push it onto the list
        if (!this.imageFilter3DX || this.imageFilter3DX.test(this.topicNames[i])) {
          newImageTopics.push(this.topicNames[i])
        }
      }
    }

    // sort the image topics for comparison to work
    newImageTopics.sort()

    if (!this.imageTopics3DX.equals(newImageTopics)) {
      this.imageTopics3DX = newImageTopics
      return true
    } else {
      return false
    }
  }

  @action.bound
  updateSensor3DXTopics() {
    // Function for updating 3DX Sensor topic list
    var newSensor3DXTopics = []
    for (var i = 0; i < this.topicNames.length; i++) {
      var topic_name_parts = this.topicNames[i].split("/")
      var last_element = topic_name_parts.pop()
      var topic_base = topic_name_parts.join("/")
      if (
        last_element === "status_3dx" &&
        this.topicTypes[i] === "num_sdk_msgs/Status3DX"
      ) {
        newSensor3DXTopics.push(topic_base)
      }
    }
    // sort the sensor topics for comparison to work
    newSensor3DXTopics.sort()

    if (!this.sensor3DXTopics.equals(newSensor3DXTopics)) {
      this.sensor3DXTopics = newSensor3DXTopics
      return true
    } else {
      return false
    }
  }

  @action.bound
  updateResetTopics() {
    var newResetTopics = []
    for (var i = 0; i < this.topicNames.length; i++) {
      var topic_name_parts = this.topicNames[i].split("/")
      var last_element = topic_name_parts.pop()
      var topic_base = topic_name_parts.join("/")
      if (
        last_element === "reset" &&
        this.topicTypes[i] === "num_sdk_msgs/Reset"
      ) {
        newResetTopics.push(topic_base)
      }
    }

    // sort the topics for comparison to work
    newResetTopics.sort()

    if (!this.resetTopics.equals(newResetTopics)) {
      this.resetTopics = newResetTopics
      return true
    } else {
      return false
    }
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
    return `/${this.namespacePrefix}/${this.deviceType}/${this.deviceId}`
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

  addListener({
    name,
    messageType,
    callback,
    noPrefix = false,
    manageListener = true
  }) {
    const listener = new ROS.Topic({
      ros: this.ros,
      name: noPrefix ? name : `${this.rosPrefix}/${name}`,
      messageType
    })
    listener.subscribe(action(callback))

    // add to listeners that get unsubscribed
    if (manageListener) {
      this.rosListeners.push(listener)
    }

    // return listener for clients that manage their own
    return listener
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

    // services
    this.callSystemDefsService()
    this.callNepiStatusService()
    this.callImgClassifierListQueryService()
    this.startPollingIPAddrQueryService()
    this.startPollingOpEnvironmentQueryService()
    this.startPollingTriggerStatusQueryService()
    this.startPollingNavPosService()
    this.startPollingTimeStatusService()
    this.startPollingImgClassifierStatusQueryService()
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
    this.deviceType = null
    this.deviceId = null
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

        if (this.clockUTCMode) {
          this.systemStatusTime = moment.unix(message.sys_time.secs).utc()
        } else {
          this.systemStatusTime = moment.unix(message.sys_time.secs)
        }

        this.diskUsagePercent = `${parseInt(
          100 * this.systemStatusDiskUsageMB / this.systemDefsDiskCapacity,
          10
        )}%`

        this.systemStatusTempC =
          message.temperatures.length && message.temperatures[0]
        this.systemStatusWarnings = message.warnings && message.warnings.flags
        //this.rosLog("Received Status Message:")
        var i
        for(i in message.info_strings) {
          this.rosLog(message.info_strings[i].payload)
        }
      }
    })
  }

  // returns the listener, clients that use this
  setupStatus3DXListener(topic, callback) {
    if (topic) {
      return this.addListener({
        name: topic + "/status_3dx",
        messageType: "num_sdk_msgs/Status3DX",
        noPrefix: true,
        callback: callback,
        manageListener: false
      })
    }
  }
  setupNUIDListener(callback) {
      return this.addListener({
        name: "nuid",
        messageType: "std_msgs/String",
        callback: callback,
        manageListener: false
      })
  }

  async callNepiStatusService() {
    const _pollOnce = async () => {
      this.NEPIStatus = await this.callService({
        name: "nepi_status_query",
        messageType: "num_sdk_msgs/NEPIStatusQuery",
        msgKey: "status"
      })
      this.NUID = this.NEPIStatus.nuid
      this.alias = this.NEPIStatus.alias
      this.NEPIenabled = this.NEPIStatus.enabled
      this.lb_last_connection_time = this.NEPIStatus.lb_last_connection_time
      this.hb_last_connection_time = this.NEPIStatus.hb_last_connection_time
      this.lb_do_msg_count = this.NEPIStatus.lb_do_msg_count
      this.lb_dt_msg_count = this.NEPIStatus.lb_dt_msg_count
      this.hb_do_transfered_mb = this.NEPIStatus.hb_do_transfered_mb
      this.hb_dt_transfered_mb = this.NEPIStatus.hb_dt_transfered_mb
      //this.DataToTransfer = this.DataToTransfer
      this.lb_enabled = this.NEPIStatus.lb_enabled
      this.hb_enabled = this.NEPIStatus.hb_enabled
      this.lb_available_data_sources = this.NEPIStatus.lb_available_data_sources
      this.lb_selected_data_sources = this.NEPIStatus.lb_selected_data_sources
      this.lb_comms_types = this.NEPIStatus.lb_comms_types
      this.auto_attempts_per_hour = this.NEPIStatus.auto_attempts_per_hour
      this.lb_data_queue_size_KB = this.NEPIStatus.lb_data_queue_size_KB
      this.hb_auto_data_offloading_enabled = this.NEPIStatus.hb_auto_data_offloading_enabled
      this.log_storage_enabled = this.NEPIStatus.log_storage_enabled

      if (this.connectedToROS) {
        setTimeout(_pollOnce, 500)
      }
    }
    _pollOnce()
  }

  async callSystemDefsService() {
    this.systemDefs = await this.callService({
      name: "system_defs_query",
      messageType: "num_sdk_msgs/SystemDefs",
      msgKey: "defs"
    })
    this.deviceSerial = this.systemDefs.device_sn
    this.systemDefsFirmwareVersion = this.systemDefs.firmware_version
    this.systemDefsDiskCapacity = this.systemDefs.disk_capacity
  }

  async callImgClassifierListQueryService() {
    this.classifiers = await this.callService({
      name: "img_classifier_list_query",
      messageType: "num_sdk_msgs/ImageClassifierListQuery",
      msgKey: "classifiers"
    })
  }

  async startPollingIPAddrQueryService() {
    const _pollOnce = async () => {
      this.ip_addrs = await this.callService({
        name: "ip_addr_query",
        messageType: "num_sdk_msgs/IPAddrQuery",
        msgKey: "ip_addrs"
      })

      if (this.connectedToROS) {
        setTimeout(_pollOnce, 3000)
      }
    }

    _pollOnce()
  }

  async startPollingOpEnvironmentQueryService() {
    const _pollOnce = async () => {
      this.opEnv = await this.callService({
        name: "op_environment_query",
        messageType: "num_sdk_msgs/OpEnvironmentQuery",
        msgKey: "op_env"
      })

      this.deviceInWater = (this.opEnv === "water")

      if (this.connectedToROS) {
        setTimeout(_pollOnce, 5000)
      }
    }

    _pollOnce()
  }

  async startPollingTriggerStatusQueryService() {
    const _pollOnce = async () => {
      this.triggerStatus = await this.callService({
        name: "trigger_status_query",
        messageType: "num_sdk_msgs/TriggerStatusQuery",
        args: {trig_val : this.triggerMask},
        msgKey: "status"
      })
      // Leading '+' here keeps us from displaying trailing zeros by converting the string back to a number
      this.triggerAutoRateHz = +this.triggerStatus.auto_rate.toFixed(2)

      if (this.connectedToROS) {
        setTimeout(_pollOnce, 5000)
      }
    }

    _pollOnce()
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

      this.navPosOrientationYawRate = this.navPos.angular_velocity.z * (180/Math.PI)
      this.navPosOrientationPitchRate = this.navPos.angular_velocity.y * (180/Math.PI)
      this.navPosOrientationRollRate = this.navPos.angular_velocity.x * (180/Math.PI)

      const q = new cannon.Quaternion(
        this.navPos.orientation.x,
        this.navPos.orientation.y,
        this.navPos.orientation.z,
        this.navPos.orientation.w
      )
      const vec = new cannon.Vec3()
      q.toEuler(vec)
      this.navPosOrientationYawAngle = vec.z * (180/Math.PI)
      this.navPosOrientationPitchAngle = vec.y * (180/Math.PI)
      this.navPosOrientationRollAngle = vec.x * (180/Math.PI)

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

  async startPollingImgClassifierStatusQueryService() {
    const _pollOnce = async () => {
      this.reportedClassifier = await this.callService({
        name: "img_classifier_status_query",
        messageType: "num_sdk_msgs/ImageClassifierStatusQuery"
      })

      if (this.connectedToROS) {
        setTimeout(_pollOnce, 1000)
      }
    }

    _pollOnce()
  }

  @action.bound
  onToggleTopic(e) {
    const topic = e.target.getAttribute("data-topic")
    if(!this.lb_selected_data_sources.includes(topic)) {
      this.publishMessage({
        name: "nepi_edge_ros_bridge/lb/select_data_sources",
        messageType: "num_sdk_msgs/StringArray",
        data: { entries: this.lb_selected_data_sources.concat(topic) }
      })
    } else {
      var sources = this.lb_selected_data_sources.filter(function(value, index, arr) {
        return value != topic
      });
      this.publishMessage({
        name: "nepi_edge_ros_bridge/lb/select_data_sources",
        messageType: "num_sdk_msgs/StringArray",
        data: { entries: sources }
      })
    }
  }

  @action.bound
  onToggleLB(e) {
    const checked = e.target.checked
    this.publishMessage({
      name: "nepi_edge_ros_bridge/lb/enable",
      messageType: "std_msgs/Bool",
      data: { data: checked ? true : false }
    })
  }

  @action.bound
  onToggleAutoOffloading(e) {
    const checked = e.target.checked
    this.publishMessage({
      name: "nepi_edge_ros_bridge/hb/set_auto_data_offloading",
      messageType: "std_msgs/Bool",
      data: { data: checked ? true : false }
    })
  }

  @action.bound
  onToggleHB(e) {
    const checked = e.target.checked
    this.publishMessage({
      name: "nepi_edge_ros_bridge/hb/enable",
      messageType: "std_msgs/Bool",
      data: { data: checked ? true : false }
    })
  }

  @action.bound
  onToggleLogStorage(e) {
    const checked = e.target.checked
    this.publishMessage({
      name: "nepi_edge_ros_bridge/enable_nepi_log_storage",
      messageType: "std_msgs/Bool",
      data: { data: checked ? true : false }
    })
  }

  @action.bound
  onToggleNEPIComms(e) {
    const checked = e.target.checked
    this.publishMessage({
      name: "nepi_edge_ros_bridge/enable",
      messageType: "std_msgs/Bool",
      data: { data: checked ? true : false }
    })
  }

  @action.bound
  onChangeAutoRate(e) {
    let rate = parseFloat(e.target.value)
    if (isNaN(rate)) {
      rate = 0
    }
    this.publishMessage({
      name: "nepi_edge_ros_bridge/set_auto_attempts_per_hour",
      messageType: "num_sdk_msgs/Float32",
      data: {data: rate}
    })

    if (rate === 0) {
      this.auto_attempts_per_hour = rate
    }
    else {
      this.auto_attempts_per_hour = e.target.value
    }
  }

  @action.bound
  setDeviceID({newDeviceID}) {
    this.publishMessage({
      name: "set_device_id",
      messageType: "std_msgs/String",
      data: { data: newDeviceID }
    })
  }

  @action.bound
  onToggleDeviceInWater() {
    this.deviceInWater = !this.deviceInWater

    let newOpEnv = (this.deviceInWater === true)? "water" : "air"
    this.publishMessage({
      name: "set_op_environment",
      messageType: "std_msgs/String",
      data: { data: newOpEnv }
    })
  }

  @action.bound
  onToggleClockUTCMode() {
    this.clockUTCMode = !this.clockUTCMode
    this.clockTZ = this.clockUTCMode ? "UTC" : getLocalTZ()
  }

  @action.bound
  onSyncUTCToDevice() {
    const utcTS = moment.utc()
      .unix()
    this.publishMessage({
      name: "set_time",
      messageType: "std_msgs/Time",
      data: {
        data: {
          secs: utcTS,
          nsecs: 0
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

    if (freq === 0) {
      this.triggerAutoRateHz = freq
    }
    else {
      this.triggerAutoRateHz = e.target.value
    }
  }

  @action.bound
  onToggleHWTriggerOutputEnabled(e) {
    const checked = e.target.checked

    // If HW Trig Output Enable selected, trig mask is 0xFFFFFFFF, otherwise trig mask is 0x7FFFFFFF
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

  @action.bound
  onChangeSaveFreq(e) {
    let freq = parseFloat(e.target.value)

    if (isNaN(freq)) {
      freq = 0
    }

    this.publishMessage({
      name: "save_data_rate",
      messageType: "num_sdk_msgs/SaveDataRate",
      data: {
        data_product: "all",
        save_rate_hz: freq,
      }
    })

    //this.saveFreqHz = freq
    if (freq === 0) {
      this.saveFreqHz = 0
    }
    else {
      this.saveFreqHz = e.target.value
    }
  }

  @action.bound
  startClassifier(selectedImageTopic, selectedClassifier, detectionThreshold) {
    this.publishMessage({
      name: "start_classifier",
      messageType: "num_sdk_msgs/ClassifierSelection",
      data: {
        img_topic: selectedImageTopic,
        classifier: selectedClassifier,
        detection_threshold: detectionThreshold
      }
    })
  }

  @action.bound
  stopClassifier() {
    this.publishMessage({
      name: "stop_classifier",
      messageType: "std_msgs/Empty",
      data: {}
    })
  }

  @action.bound
  addIPAddr(addr) {
    this.publishMessage({
      name: "add_ip_addr",
      messageType: "std_msgs/String",
      data: { data: addr }
    })
  }

  @action.bound
  removeIPAddr(addr) {
    this.publishMessage({
      name: "remove_ip_addr",
      messageType: "std_msgs/String",
      data: { data: addr }
    })
  }

  @action.bound
  updateDetectionThreshold(newThreshold, throttle = true)
  {
    // Re-use the 3DX throttler here -- no reason to create a new one,
    // as the desired slider bar throttling is the same
    if (throttle && this.isThrottled()) {
      return
    }

    this.publishMessage({
      name: "num_darknet_ros/set_threshold",
      messageType: "std_msgs/Float32",
      data: { data: newThreshold }
    })
  }

  @action.bound
  saveCfg({baseTopic}) {
    this.publishMessage({
      name: baseTopic + "/save_config",
      messageType: "std_msgs/Empty",
      data: {},
      noPrefix: true
    })
  }

  @action.bound
  resetCfg({baseTopic, resetVal}) {
    this.publishMessage({
      name: baseTopic + "/reset",
      messageType: "num_sdk_msgs/Reset",
      data: { reset_type: resetVal },
      noPrefix: true
    })
  }

  @action.bound
  saveSettingsFilePrefix({newFilePrefix}) {
    this.publishMessage({
      name: "save_data_prefix",
      messageType: "std_msgs/String",
      data: { data: newFilePrefix }
    })
  }

  // 3DX Sensor Control methods //////////////////////////////////////////////
  @action.bound
  isThrottled() {
    var now = new Date()
    if (now - this.last3DXUpdate < UPDATE_PERIOD) {
      return true
    }
    this.last3DXUpdate = now
    return false
  }

  publishAutoManualSelection3DX(
    topic,
    name,
    checked,
    adjustment,
    throttle = true
  ) {
    if (throttle && this.isThrottled()) {
      return
    }

    if (topic) {
      this.publishMessage({
        name: topic + "/set_" + name,
        messageType: "num_sdk_msgs/AutoManualSelection3DX",
        noPrefix: true,
        data: {
          enabled: checked,
          adjustment: adjustment
        }
      })
    } else {
      console.warn("publishAutoManualSelection3DX: sensor3DXTopicBase not set")
    }
  }

  publishRange3DX(topic, min, max, throttle = true) {
    if (throttle && this.isThrottled()) {
      return
    }

    if (topic) {
      this.publishMessage({
        name: topic + "/set_range",
        messageType: "num_sdk_msgs/Range3DX",
        noPrefix: true,
        data: {
          min_range: min,
          max_range: max
        }
      })
    } else {
      console.warn("publishRange3DX: sensor3DXTopicBase not set")
    }
  }

  publishAngle3DX(topic, offset, total, throttle = true) {
    if (throttle && this.isThrottled()) {
      return
    }

    if (topic) {
      this.publishMessage({
        name: topic + "/set_angle",
        messageType: "num_sdk_msgs/Angle3DX",
        noPrefix: true,
        data: {
          angle_offset: offset,
          total_angle: total
        }
      })
    } else {
      console.warn("publishAngle3DX: sensor3DXTopicBase not set")
    }
  }
  /////////////////////////////////////////////////////////////////////////
}

const stores = {
  ros: new ROSConnectionStore(),
}

export default stores
