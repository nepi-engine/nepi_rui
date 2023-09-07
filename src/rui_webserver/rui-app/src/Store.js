import { observable, action } from "mobx"
import moment from "moment"
import ROS from "roslib"
import cannon from "cannon"
import yaml from "js-yaml"

const ROS_WS_URL = `ws://${window.location.hostname}:9090`
const FLASK_URL = `http://${window.location.hostname}:5003`
const LICENSE_SERVER_WS_URL = `ws://${window.location.hostname}:9092`

const TRIGGER_MASKS = {
  OUTPUT_ENABLED: 0xffffffff,
  DEFAULT: 0x7fffffff
}

const EULER_ORDER_FOR_CANNON = "YZX" // Only supported angle ordering for Cannon library quaternion.toEuler() function

// TODO: Would be better to query the display_name property of all nodes to generate
// this dictionary... requires a new SDKNode service to do so
const NODE_DISPLAY_NAMES = {
  stereo_cam_mgr: "Stereo Camera",
  config_mgr: "Config Manager",
  nav_pose_mgr: "Nav./Pose/GPS",
  network_mgr: "Network",
  nepi_darknet_ros_mgr: "Classifier",
  system_mgr: "System",
  time_sync_mgr: "Time Sync",
  trigger_mgr: "Triggering",
  nepi_link_ros_bridge: "NEPI Connect",
  gpsd_ros_client: "GPSD Client",
  illumination_mgr: "Illumination",
  automation_mgr: "Automation",
  sequential_image_mux: "Sequencer"
}

const CLASSIFIER_IMG_TOPIC_SUFFIX = '/classifier/detection_image'
const TARG_LOCALIZER_IMG_TOPIC_SUFFIX = '/target_localizer/localization_image'

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
    return null
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
  @observable systemDefsDiskCapacityMB = null

  @observable systemSoftwareStatus = null

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

  @observable navPose = null
  @observable navPoseLocationLat = null
  @observable navPoseLocationLng = null
  @observable navPoseLocationAlt = null
  @observable navPoseDirectionHeadingDeg = null
  @observable navPoseDirectionSpeedMpS = null
  @observable navPoseOrientationYawAngle = null
  @observable navPoseOrientationYawRate = null
  @observable navPoseOrientationPitchAngle = null
  @observable navPoseOrientationPitchRate = null
  @observable navPoseOrientationRollAngle = null
  @observable navPoseOrientationRollRate = null
  @observable navPoseOrientationFrame = null
  @observable navPoseOrientationIsTransformed = false
  @observable navSatFixStatus = null
  @observable navSatFixService = null

  @observable navPoseStatus = null
  @observable gpsClockSyncEnabled = false
  @observable selectedNavSatFixTopic = null
  @observable lastNavSatFix = null
  @observable navSatFixRate = null
  @observable selectedOrientationTopic = null
  @observable lastOrientation = null
  @observable orientationRate = null
  @observable selectedHeadingTopic = null
  @observable lastHeading = null
  @observable headingRate = null  
  @observable navSrcFrame = null
  @observable navTargetFrame = null
  @observable navTransformXTrans = null
  @observable navTransformYTrans = null
  @observable navTransformZTrans = null
  @observable navTransformXRot = null
  @observable navTransformYRot = null
  @observable navTransformZRot = null
  @observable navHeadingOffset = null
  @observable transformNavPoseOrientation = null
    
  @observable imageRecognitions = []

  @observable triggerStatus = null
  @observable triggerAutoRateHz = 0
  @observable triggerMask = TRIGGER_MASKS.DEFAULT

  @observable saveFreqHz = 1.0

  @observable topicQueryLock = false
  @observable topicNames = null
  @observable topicTypes = null
  @observable imageTopics = []
  @observable sensor3DXTopics = []
  @observable idxSensors = {}
  @observable ptxUnits = []
  @observable resetTopics = []
  @observable navSatFixTopics = []
  @observable orientationTopics = []
  @observable headingTopics = []

  @observable imageFilterDetection = null
  @observable imageFilterSequencer = null
  @observable imageFilterPTX = null
  
  @observable last3DXUpdate = new Date()

  @observable classifiers = []
  @observable classifierImgTopic = null
  @observable targLocalizerImgTopic = null

  @observable ip_query_response = null
  @observable bandwidth_usage_query_response = null
  @observable wifi_query_response = null

  @observable NUID = "INVALID"
  @observable NEPIConnectStatus = null
  @observable alias = ""
  @observable ssh_public_key = ""
  @observable bot_running = null
  @observable lb_last_connection_time = null
  @observable hb_last_connection_time = null
  @observable lb_do_msg_count = "1"
  @observable lb_dt_msg_count = null
  @observable hb_do_transfered_mb = null
  @observable hb_dt_transfered_mb = null
  @observable lb_data_sets_per_hour = null
  @observable lb_enabled = null
  @observable hb_enabled = null
  @observable lb_available_data_sources = null
  @observable lb_selected_data_sources = null
  @observable lb_comms_types = null
  @observable auto_attempts_per_hour = null
  @observable lb_data_queue_size_kb = null
  @observable hb_data_queue_size_mb = null
  @observable hb_auto_data_offloading_enabled = null
  @observable log_storage_enabled = null

  @observable reportedClassifier = null

  @observable streamingImageQuality = 95
  @observable nepiLinkHbAutoDataOffloadingCheckboxVisible = false

  @observable scripts = []
  @observable running_scripts = []
  @observable launchScript = false
  @observable stopScript = false
  @observable systemStats = null
  @observable scriptForPolledStats = null

  @observable imgMuxSequences = null

  @observable license_server = null
  @observable commercial_licensed = false
  @observable license_info = null
  @observable license_request_info = null
  @observable license_request_mode = false

  async checkLicense() {
    var retry_delay_ms = 3000
    if (!this.license_server) {
      try {
        this.license_server = new WebSocket(LICENSE_SERVER_WS_URL)

        this.license_server.onmessage = (event) => {
          var response_dict = yaml.load(event.data)         
          
          if ('licensed_components' in response_dict)
          {
            this.license_info = yaml.load(event.data)
            if (this.license_info['licensed_components']['nepi_base']['commercial_license_type'] === 'Developer') {
              this.commercial_licensed = false
            }
            else {
              if (this.license_request_mode && !this.commercial_licensed) {
                this.license_request_mode = false
              }
              this.commercial_licensed = true
            }
          }

          else if ('license_request' in response_dict)
          {
            this.license_request_info = yaml.load(event.data)
          }
        }

        retry_delay_ms = 250 // Fast to avoid a lot of latency while connecting
      } catch (e) {
        //console.error(e)
        console.error("License check failed")
        this.license_yaml = null
        this.commercial_licensed = false
        this.license_info = null
        this.license_request_info = null
        this.license_request_mode = false
      }
    }

    else if (this.license_server.readyState === 1) { // READY
      // Check for license updates
      this.license_server.send("license_check") 
      retry_delay_ms = 5000 // Slow down the updates now that we are connected
    }

    else if (this.license_server.readyState === 3) { // CLOSED
      this.license_server = null
      this.commercial_licensed = false
      this.license_info = null
      this.license_request_info = null
      this.license_request_mode = false
    }

    setTimeout(async () => {
      await this.checkLicense()
    }, retry_delay_ms)
  }

  async checkROSConnection() {
    if (!this.connectedToROS) {
      try {
        // get the image filters
        const imageFilterDetectionJson = await getFileJson("img_filter_detection.json")
        if (imageFilterDetectionJson && imageFilterDetectionJson.filter) {
          this.imageFilterDetection = new RegExp(imageFilterDetectionJson.filter)
        }

        const imageFilterSequencerJson = await getFileJson("img_filter_sequencer.json")
        if (imageFilterSequencerJson && imageFilterSequencerJson.filter) {
          this.imageFilterSequencer = new RegExp(imageFilterSequencerJson.filter)
        }

        const imageFilterPTXJson = await getFileJson("img_filter_ptx.json")
        if (imageFilterPTXJson && imageFilterPTXJson.filter) {
          this.imageFilterPTX = new RegExp(imageFilterPTXJson.filter)
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
        var newImageTopics = this.updateImageTopics()
                
        this.updateIDXSensorList()
        this.updatePTXUnits()
        this.updateNavPoseSourceTopics()

        if (newPrefix || newSensor3DXs || newResettables || newImageTopics) {
          this.initalizeListeners()
        }
        this.topicQueryLock = false
      })
    }
  }

  validPrefix() {
    return this.namespacePrefix && this.deviceId
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
        this.topicTypes[i] === "nepi_ros_interfaces/SystemStatus"
      ) {
        if (
          this.namespacePrefix !== topic_name_parts[1] &&
          this.deviceId !== topic_name_parts[2]
        ) {
          this.namespacePrefix = topic_name_parts[1]
          this.deviceId = topic_name_parts[2]
          if (this.validPrefix()) {
            ret = true
            this.rosLog(
              `Fetched device info ${this.namespacePrefix}/${this.deviceId}`
            )
            // And update the (fixed) classifier image topic
            this.classifierImgTopic = '/'
            this.classifierImgTopic = this.classifierImgTopic.concat(this.namespacePrefix, '/', this.deviceId, CLASSIFIER_IMG_TOPIC_SUFFIX)

            this.targLocalizerImgTopic = '/'
            this.targLocalizerImgTopic = this.targLocalizerImgTopic.concat(this.namespacePrefix, '/', this.deviceId, TARG_LOCALIZER_IMG_TOPIC_SUFFIX)
            break
          }
        }
      }
    }
    return ret
  }

  @action.bound
  updateImageTopics() {
    // Function for updating image topics list
    var newImageTopics = []
    for (var i = 0; i < this.topicNames.length; i++) {
      if (this.topicTypes[i] === "sensor_msgs/Image") {
        newImageTopics.push(this.topicNames[i])
      }
    }

    // sort the image topics for comparison to work
    newImageTopics.sort()

    if (!this.imageTopics.equals(newImageTopics)) {
      this.imageTopics = newImageTopics
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
        this.topicTypes[i] === "nepi_ros_interfaces/Status3DX"
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
  updateIDXSensorList() {
    var idx_sensors_changed = false
    var sensors_detected = []
    for (var i = 0; i < this.topicNames.length; i++) {
      if (this.topicNames[i].endsWith("/idx/status")) {
        const idx_sensor_namespace = this.topicNames[i].split("/idx")[0]
        if (!(sensors_detected.includes(idx_sensor_namespace))) {
          this.callIDXCapabilitiesQueryService(idx_sensor_namespace) // Testing
          if (this.idxSensors[idx_sensor_namespace]) { // Testing
            sensors_detected.push(idx_sensor_namespace)
          }
          idx_sensors_changed = true // Testing -- always declare changed
        }
        /*
        if (!(idx_sensor_namespace in this.idxSensors)) {
          //this.idxSensors[idx_sensor_namespace] = null // Initialize an empty object
          idx_sensors_changed = true
          this.callIDXCapabilitiesQueryService(idx_sensor_namespace) // Will update this.idxSensors upon successful call
        }
        */
      }
    }

    // Now clean out any sensors that are no longer detected
    const previously_known = Object.keys(this.idxSensors)
    for (i = 0; i < previously_known.length; ++i) {
      if (!(sensors_detected.includes(previously_known[i]))) {
        delete this.idxSensors[previously_known[i]]
        idx_sensors_changed = true
      }
    }
    return idx_sensors_changed
  }

  @action.bound
  updatePTXUnits() {
    var ptx_units_changed = false
    var ptx_units_detected = []
    for (var i = 0; i < this.topicNames.length; i++) {
      if (this.topicNames[i].endsWith("/ptx/status")) {
        const ptx_unit_namespace = this.topicNames[i].split("/ptx")[0]
        if (!(ptx_units_detected.includes(ptx_unit_namespace))) {
          ptx_units_detected.push(ptx_unit_namespace)
        }
        if (!(this.ptxUnits.includes(ptx_unit_namespace))) {
          this.ptxUnits.push(ptx_unit_namespace)
        }
        ptx_units_changed = true
      }
    }

    // Now clean out any units that are no longer detected
    for (i = 0; i < this.ptxUnits.length; ++i) {
      if (!(ptx_units_detected.includes(this.ptxUnits[i]))) {
        this.ptxUnits.splice(i, 1)
        ptx_units_changed = true
      }
    }
    return ptx_units_changed
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
        this.topicTypes[i] === "nepi_ros_interfaces/Reset"
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
  updateNavPoseSourceTopics() {
    // Function for updating image topics list
    var newNavSatFixTopics = []
    var newOrientationTopics = []
    var newHeadingTopics = []
    for (var i = 0; i < this.topicNames.length; i++) {
      if (this.topicTypes[i] === "sensor_msgs/NavSatFix") {
        newNavSatFixTopics.push(this.topicNames[i])
      }
      else if ((this.topicTypes[i] === "nav_msgs/Odometry") || (this.topicTypes[i] === "sensor_msgs/Imu")) {
        newOrientationTopics.push(this.topicNames[i])
      }
      else if (this.topicTypes[i] === "std_msgs/Float64") {
        // Float64 ==> Not a very good differentiator!
        newHeadingTopics.push(this.topicNames[i])
      }
    }

    var topicsChanged = false
    newNavSatFixTopics.sort()
    if (!this.navSatFixTopics.equals(newNavSatFixTopics)) {
      this.navSatFixTopics = newNavSatFixTopics
      topicsChanged = true
    }

    newOrientationTopics.sort()
    if (!this.orientationTopics.equals(newOrientationTopics)) {
      this.orientationTopics = newOrientationTopics
      topicsChanged = true
    }

    newHeadingTopics.sort()
    if (!this.headingTopics.equals(newHeadingTopics)) {
      this.headingTopics = newHeadingTopics
      topicsChanged = true
    }

    return topicsChanged
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
    return `/${this.namespacePrefix}/${this.deviceId}`
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
        name: name.startsWith('/')? name : `${this.rosPrefix}/${name}`,
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
    this.rosLog("Connected to NEPI device")
  }

  @action.bound
  initalizeListeners() {
    this.rosListeners.forEach(listener => {
      listener.unsubscribe()
    })

    // listeners
    this.setupImageSystemStatusListener()
    this.setupRUISettingsListener()

    // services
    this.callSystemDefsService()
    this.callSystemSoftwareStatusQueryService()
    this.callNepiStatusService()
    this.callImgClassifierListQueryService()
    this.startPollingIPAddrQueryService()
    this.startPollingBandwidthUsageService()
    this.startPollingWifiQueryService()
    this.startPollingOpEnvironmentQueryService()
    this.startPollingTriggerStatusQueryService()
    this.startPollingNavPoseService()
    this.startPollingNavPoseStatusService()
    this.startPollingTimeStatusService()
    this.startPollingImgClassifierStatusQueryService()

    // automation manager services
    this.startPollingGetScriptsService()  // populate listbox with files
    this.startPollingGetRunningScriptsService()  // populate listbox with active files
    //this.startPollingLaunchScriptService() // invoke script execution
    //this.startPollingStopScriptService() // stop script execution
    //this.callGetSystemStatsQueryService() // get script and system status

    // sequential image mux services
    this.callMuxSequenceQuery(true) // Start it polling
  }

  @action.bound
  onErrorConnectingToROS() {
    this.connectedToROS = false
    this.rosLog("Error connecting to NEPI device, retrying")
  }

  @action.bound
  onDisconnectedToROS() {
    this.connectedToROS = false

    this.namespacePrefix = null
    this.deviceType = null
    this.deviceId = null
    this.deviceSerial = null

    this.rosLog("Connection to NEPI device closed")
  }

  setupImageSystemStatusListener() {
    this.addListener({
      name: "system_status",
      messageType: "nepi_ros_interfaces/SystemStatus",
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
          100 * this.systemStatusDiskUsageMB / this.systemDefsDiskCapacityMB,
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
        messageType: "nepi_ros_interfaces/Status3DX",
        noPrefix: true,
        callback: callback,
        manageListener: false
      })
    }
  }

  setupIDXStatusListener(idxSensorNamespace, callback) {
    if (idxSensorNamespace) {
      return this.addListener({
        name: idxSensorNamespace + "/idx/status",
        messageType: "nepi_ros_interfaces/IDXStatus",
        noPrefix: true,
        callback: callback,
        manageListener: false
      })
    }
  }

  setupPTXStatusListener(ptxNamespace, callback) {
    if (ptxNamespace) {
      return this.addListener({
        name: ptxNamespace + "/ptx/status",
        messageType: "nepi_ros_interfaces/PanTiltStatus",
        noPrefix: true,
        callback: callback,
        manageListener: false
      })
    }
  }

  setupRUISettingsListener() {
    this.addListener({
      name: "rui_config_mgr/settings",
      messageType: "nepi_ros_interfaces/RUISettings",
      callback: message => {
        this.streamingImageQuality = message.streaming_image_quality
        this.nepiLinkHbAutoDataOffloadingCheckboxVisible = message.nepi_hb_auto_offload_visible
      }
    })
  }

  async callNepiStatusService() {
    const _pollOnce = async () => {
      this.NEPIConnectStatus = await this.callService({
        name: "nepi_link_status_query",
        messageType: "nepi_ros_interfaces/NEPIConnectStatusQuery",
        msgKey: "status"
      })
      this.NUID = this.NEPIConnectStatus.nuid
      this.alias = this.NEPIConnectStatus.alias
      this.ssh_public_key = this.NEPIConnectStatus.public_ssh_key
      this.bot_running = this.NEPIConnectStatus.bot_running
      this.NEPIConnectenabled = this.NEPIConnectStatus.enabled
      this.lb_last_connection_time = moment.unix(this.NEPIConnectStatus.lb_last_connection_time.secs)
      this.hb_last_connection_time = moment.unix(this.NEPIConnectStatus.hb_last_connection_time.secs)
      this.lb_do_msg_count = this.NEPIConnectStatus.lb_do_msg_count
      this.lb_dt_msg_count = this.NEPIConnectStatus.lb_dt_msg_count
      this.hb_do_transfered_mb = this.NEPIConnectStatus.hb_do_transfered_mb
      this.hb_dt_transfered_mb = this.NEPIConnectStatus.hb_dt_transfered_mb
      this.lb_data_sets_per_hour = this.NEPIConnectStatus.lb_data_sets_per_hour
      this.lb_enabled = this.NEPIConnectStatus.lb_enabled
      this.hb_enabled = this.NEPIConnectStatus.hb_enabled
      this.lb_available_data_sources = this.NEPIConnectStatus.lb_available_data_sources
      this.lb_selected_data_sources = this.NEPIConnectStatus.lb_selected_data_sources
      this.lb_comms_types = this.NEPIConnectStatus.lb_comms_types
      this.auto_attempts_per_hour = this.NEPIConnectStatus.auto_attempts_per_hour
      this.lb_data_queue_size_kb = this.NEPIConnectStatus.lb_data_queue_size_kb
      this.hb_data_queue_size_mb = this.NEPIConnectStatus.hb_data_queue_size_mb
      this.hb_auto_data_offloading_enabled = this.NEPIConnectStatus.hb_auto_data_offloading_enabled
      this.log_storage_enabled = this.NEPIConnectStatus.log_storage_enabled

      if (this.connectedToROS) {
        setTimeout(_pollOnce, 500)
      }
    }
    _pollOnce()
  }

  async callSystemDefsService() {
    this.systemDefs = await this.callService({
      name: "system_defs_query",
      messageType: "nepi_ros_interfaces/SystemDefs",
      msgKey: "defs"
    })
    this.deviceType = this.systemDefs.device_type
    this.deviceSerial = this.systemDefs.device_sn
    this.systemDefsFirmwareVersion = this.systemDefs.firmware_version
    this.systemDefsDiskCapacityMB = this.systemDefs.disk_capacity
  }

  @action.bound
  async callIDXCapabilitiesQueryService(idxSensorNamespace) {
    const capabilities = await this.callService({
      name: idxSensorNamespace + "/idx/capabilities_query",
      messageType: "nepi_ros_interfaces/IDXCapabilitiesQuery",  
    })
    this.idxSensors[idxSensorNamespace] = capabilities
  }

  @action.bound
  async callSystemSoftwareStatusQueryService() {
    this.systemSoftwareStatus = await this.callService({
      name: "sw_update_status_query",
      messageType: "nepi_ros_interfaces/SystemSoftwareStatusQuery"
    })
  }

  @action.bound
  async onInstallFullSysImg(new_img_filename) {
    this.publishMessage({
      name: "install_new_image",
      messageType: "std_msgs/String",
      data: { data: new_img_filename }
    })    
  }

  @action.bound
  async onSwitchActiveInactiveRootfs() {
    this.publishMessage({
      name: "switch_active_inactive_rootfs",
      messageType: "std_msgs/Empty",
      data: {}
    })
  }

  @action.bound
  async onStartSysBackup() {
    this.publishMessage({
      name: "archive_inactive_rootfs",
      messageType: "std_msgs/Empty",
      data: {}
    })
  }  

  async callImgClassifierListQueryService() {
    this.classifiers = await this.callService({
      name: "img_classifier_list_query",
      messageType: "nepi_ros_interfaces/ImageClassifierListQuery",
      msgKey: "classifiers"
    })
  }

  async startPollingIPAddrQueryService() {
    const _pollOnce = async () => {
      this.ip_query_response = await this.callService({
        name: "ip_addr_query",
        messageType: "nepi_ros_interfaces/IPAddrQuery"
      })

      if (this.connectedToROS) {
        setTimeout(_pollOnce, 3000)
      }
    }

    _pollOnce()
  }

  async startPollingBandwidthUsageService() {
    const _pollOnce = async () => {
      this.bandwidth_usage_query_response = await this.callService({
        name: "bandwidth_usage_query",
        messageType: "nepi_ros_interfaces/BandwidthUsageQuery",
      })

      if (this.connectedToROS) {
        setTimeout(_pollOnce, 3000)
      }
    }

    _pollOnce()
  }

  async startPollingWifiQueryService() {
    const _pollOnce = async () => {
      this.wifi_query_response = await this.callService({
        name: "wifi_query",
        messageType: "nepi_ros_interfaces/WifiQuery",
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
        messageType: "nepi_ros_interfaces/OpEnvironmentQuery",
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
        messageType: "nepi_ros_interfaces/TriggerStatusQuery",
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

  startPollingNavPoseService() {
    var resp = null
    const _pollOnce = async () => {
      resp = await this.callService({
        name: "nav_pose_query",
        messageType: "nepi_ros_interfaces/NavPoseQuery",
        args: {query_time: 0.0, 
               transform: (this.transformNavPoseOrientation !== null)? this.transformNavPoseOrientation : true}
      })

      this.navPose = resp.nav_pose
      this.navPoseOrientationIsTransformed = resp.transformed

      this.navPoseLocationLat = this.navPose.fix.latitude
      this.navPoseLocationLng = this.navPose.fix.longitude
      this.navPoseLocationAlt = this.navPose.fix.altitude
      this.navPoseDirectionHeadingDeg = this.navPose.heading.heading

      this.navSatFixStatus = this.navPose.fix.status.status
      this.navSatFixService = this.navPose.fix.status.service

      // magnitude of linear_velocity?
      let { x, y, z } = this.navPose.odom.twist.twist.linear
      this.navPoseDirectionSpeedMpS = Math.sqrt(x * x + y * y + z * z)

      this.navPoseOrientationYawRate = this.navPose.odom.twist.twist.angular.z * (180/Math.PI)
      this.navPoseOrientationPitchRate = this.navPose.odom.twist.twist.angular.y * (180/Math.PI)
      this.navPoseOrientationRollRate = this.navPose.odom.twist.twist.angular.x * (180/Math.PI)

      const q = new cannon.Quaternion(
        this.navPose.odom.pose.pose.orientation.x,
        this.navPose.odom.pose.pose.orientation.y,
        this.navPose.odom.pose.pose.orientation.z,
        this.navPose.odom.pose.pose.orientation.w
      )
      const vec = new cannon.Vec3()
      // cannon exception says "Euler order XYZ not supported yet,:" so we must switch X and Z manually here
      //q.toEuler(vec, "XYZ")
      q.toEuler(vec, EULER_ORDER_FOR_CANNON)
      //this.navPoseOrientationYawAngle = vec.z * (180/Math.PI)
      this.navPoseOrientationYawAngle = vec.x * (180/Math.PI)
      this.navPoseOrientationPitchAngle = vec.y * (180/Math.PI)
      //this.navPoseOrientationRollAngle = vec.x * (180/Math.PI)
      this.navPoseOrientationRollAngle = vec.z * (180/Math.PI)

      this.navPoseOrientationFrame = this.navPose.odom.child_frame_id
      
      if (this.transformNavPoseOrientation === null){
        this.transformNavPoseOrientation = this.navPoseOrientationIsTransformed
      }


      if (this.connectedToROS) {
        setTimeout(_pollOnce, 500)
      }
    }

    _pollOnce()
  }

  startPollingNavPoseStatusService() {
    const _pollOnce = async () => {
      this.navPoseStatus = await this.callService({
        name: "nav_pose_status_query",
        messageType: "nepi_ros_interfaces/NavPoseStatusQuery",
        msgKey: "status"
      })

      this.selectedNavSatFixTopic = this.navPoseStatus.nav_sat_fix_topic
      this.lastNavSatFix = this.navPoseStatus.last_nav_sat_fix
      this.navSatFixRate = this.navPoseStatus.nav_sat_fix_rate
      
      this.selectedOrientationTopic = this.navPoseStatus.orientation_topic
      this.lastOrientation = this.navPoseStatus.last_orientation
      this.orientationRate = this.navPoseStatus.orientation_rate

      this.selectedHeadingTopic = this.navPoseStatus.heading_topic
      this.lastHeading = this.navPoseStatus.last_heading
      this.headingRate = this.navPoseStatus.heading_rate
      
      this.navSrcFrame = this.navPoseStatus.transform.header.frame_id
      this.navTargetFrame = this.navPoseStatus.transform.child_frame_id
      this.navTransformXTrans = this.navPoseStatus.transform.transform.translation.x
      this.navTransformYTrans = this.navPoseStatus.transform.transform.translation.y
      this.navTransformZTrans = this.navPoseStatus.transform.transform.translation.z

      const q = new cannon.Quaternion(
        this.navPoseStatus.transform.transform.rotation.x,
        this.navPoseStatus.transform.transform.rotation.y,
        this.navPoseStatus.transform.transform.rotation.z,
        this.navPoseStatus.transform.transform.rotation.w
      )
      const vec = new cannon.Vec3()
      q.toEuler(vec, EULER_ORDER_FOR_CANNON)
      this.navTransformXRot = vec.x * (180/Math.PI)
      this.navTransformYRot = vec.y * (180/Math.PI)
      this.navTransformZRot = vec.z * (180/Math.PI)

      this.navHeadingOffset = this.navPoseStatus.heading_offset

      this.gpsClockSyncEnabled = this.navPoseStatus.gps_clock_sync_enabled

      if (this.connectedToROS) {
        setTimeout(_pollOnce, 2000)
      }
    }

    _pollOnce()
  }

  startPollingTimeStatusService() {
    const _pollOnce = async () => {
      this.timeStatus = await this.callService({
        name: "time_status_query",
        messageType: "nepi_ros_interfaces/TimeStatus",
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
        messageType: "nepi_ros_interfaces/ImageClassifierStatusQuery"
      })

      if (this.connectedToROS) {
        setTimeout(_pollOnce, 1000)
      }
    }

    _pollOnce()
  }

  async startPollingGetScriptsService() {
    const _pollOnce = async () => {
      this.scripts = await this.callService({
        name: "get_scripts",
        messageType: "nepi_ros_interfaces/GetScriptsQuery"
      })

      if (this.connectedToROS) {
        setTimeout(_pollOnce, 1000)
      }
    }

    _pollOnce()
  }

  async startPollingGetRunningScriptsService() {
    const _pollOnce = async () => {
      this.running_scripts = await this.callService({
        name: "get_running_scripts",
        messageType: "nepi_ros_interfaces/GetRunningScriptsQuery"
      })

      if (this.connectedToROS) {
        setTimeout(_pollOnce, 1000)
      }
    }

    _pollOnce()
  }

  async startLaunchScriptService(item) {
    const _pollOnce = async () => {
      this.launchScript = await this.callService({
        name: "launch_script",
        messageType: "nepi_ros_interfaces/LaunchScript",
        args: {script : item}
      })
    }
    _pollOnce()
  }


  async stopLaunchScriptService(item) {
    const _pollOnce = async () => {
      this.stopScript = await this.callService({
        name: "stop_script",
        messageType: "nepi_ros_interfaces/StopScript",
        args: {script : item}
      })
    }
    _pollOnce()
  }

  async callGetSystemStatsQueryService(item, poll = true) {
    const _pollOnce = async () => {
      this.systemStats = await this.callService({
        name: "get_system_stats",
        messageType: "nepi_ros_interfaces/GetSystemStatsQuery",
        args: {script : this.scriptForPolledStats}
      })

      if (this.connectedToROS && poll) {
        setTimeout(_pollOnce, 1000)
      }
    }

    const firstCall = (this.scriptForPolledStats === null)
    this.scriptForPolledStats = item
    
    // Only launch this once, then just change state to start polling a different script
    if (firstCall === true || !poll) {
      _pollOnce()
    }
    
  }

  async callMuxSequenceQuery(poll = false) {
    const _pollOnce = async () => {
      this.imgMuxSequences = await this.callService({
        name: "sequential_image_mux/mux_sequence_query",
        messageType: "nepi_ros_interfaces/ImageMuxSequenceQuery",
        msgKey: "img_mux_sequences"
      })
      
      if (this.connectedToROS && poll) {
        setTimeout(_pollOnce, 1000)
      }
    }

    _pollOnce()
  }
  //=====
  
  @action.bound
  onNEPIConnectConnectNow() {
    this.publishMessage({
      name: "nepi_link_ros_bridge/connect_now",
      messageType: "std_msgs/Empty",
      data: {}
    })
  }

  @action.bound
  onNEPIConnectDataSetNow() {
    this.publishMessage({
      name: "nepi_link_ros_bridge/lb/create_data_set_now",
      messageType: "std_msgs/Empty",
      data: {}
    })
  }

  @action.bound
  onSnapshotEventTriggered() {
    this.publishMessage({
      name: "snapshot_event",
      messageType: "std_msgs/Empty",
      data: {}
    })
  }

  @action.bound
  onToggleTopic(e) {
    const topic = e.target.getAttribute("data-topic")
    if(!this.lb_selected_data_sources.includes(topic)) {
      this.publishMessage({
        name: "nepi_link_ros_bridge/lb/select_data_sources",
        messageType: "nepi_ros_interfaces/StringArray",
        data: { entries: this.lb_selected_data_sources.concat(topic) }
      })
    } else {
      var sources = this.lb_selected_data_sources.filter(function(value, index, arr) {
        return value !== topic
      });
      this.publishMessage({
        name: "nepi_link_ros_bridge/lb/select_data_sources",
        messageType: "nepi_ros_interfaces/StringArray",
        data: { entries: sources }
      })
    }
  }

  @action.bound
  onToggleLB(e) {
    const checked = e.target.checked
    this.publishMessage({
      name: "nepi_link_ros_bridge/lb/enable",
      messageType: "std_msgs/Bool",
      data: { data: checked ? true : false }
    })
  }

  @action.bound
  onToggleAutoOffloading(e) {
    const checked = e.target.checked
    this.publishMessage({
      name: "nepi_link_ros_bridge/hb/set_auto_data_offloading",
      messageType: "std_msgs/Bool",
      data: { data: checked ? true : false }
    })
  }

  @action.bound
  onToggleHB(e) {
    const checked = e.target.checked
    this.publishMessage({
      name: "nepi_link_ros_bridge/hb/enable",
      messageType: "std_msgs/Bool",
      data: { data: checked ? true : false }
    })
  }

  @action.bound
  onToggleLogStorage(e) {
    const checked = e.target.checked
    this.publishMessage({
      name: "nepi_link_ros_bridge/enable_nepi_log_storage",
      messageType: "std_msgs/Bool",
      data: { data: checked ? true : false }
    })
  }

  @action.bound
  onToggleNEPIConnectComms(e) {
    const checked = e.target.checked
    this.publishMessage({
      name: "nepi_link_ros_bridge/enable",
      messageType: "std_msgs/Bool",
      data: { data: checked ? true : false }
    })
  }

  @action.bound
  onChangeNEPIConnect(topic, value) {
    let rate = parseFloat(value)
    if (isNaN(rate)) {
      rate = 0
    }
    this.publishMessage({
      name: topic,
      messageType: "std_msgs/Float32",
      data: {data: rate}
    })

    if (rate === 0) {
      this.lb_data_sets_per_hour = rate
    }
    else {
      this.lb_data_sets_per_hour = value
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
  onChangeTriggerRate(rate) {
    let freq = parseFloat(rate)

    if (isNaN(freq)) {
      freq = 0
    }

    this.publishMessage({
      name: "set_periodic_sw_trig",
      messageType: "nepi_ros_interfaces/PeriodicSwTrig",
      data: {
        enabled: freq > 0,
        sw_trig_mask: this.triggerMask,
        rate_hz: freq
      }
    })

    // Update the state variable -- if rejected, will get set back on next periodic update
    // This allows the text entry box to immediately switch to using the state variable
    this.triggerAutoRateHz = freq
  }

  @action.bound
  onChangeTXRateLimit(limit) {
    let lim = parseInt(limit, 10)

    if (isNaN(lim)) {
      lim = -1
    }

    this.publishMessage({
      name: "set_tx_bw_limit_mbps",
      messageType: "std_msgs/Int32",
      data: { data: lim }
    })

    // Update locally for display purposes... will be corrected on next periodic update if value is rejected
    this.bandwidth_usage_query_response.tx_limit_mbps = lim
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
  onToggleDHCPEnabled(e) {
    const checked = e.target.checked

    this.publishMessage({
      name: "enable_dhcp",
      messageType: "std_msgs/Bool",
      data: { data: checked }
    })

    // Set local immediately, will correct on next update if values is rejected
    this.ip_query_response.dhcp_enabled = checked
  }

  @action.bound
  onToggleWifiAPEnabled(e) {
    const checked = e.target.checked

    this.publishMessage({
      name: "enable_wifi_access_point",
      messageType: "std_msgs/Bool",
      data: { data: checked }
    })
  }

  @action.bound
  onToggleWifiClientEnabled(e) {
    const checked = e.target.checked

    this.publishMessage({
      name: "enable_wifi_client",
      messageType: "std_msgs/Bool",
      data: { data: checked }
    })
  }

  @action.bound
  onUpdateWifiClientCredentials(new_ssid, new_passphrase) {

    this.publishMessage({
      name: "set_wifi_client_credentials",
      messageType: "nepi_ros_interfaces/WifiCredentials",
      data: { ssid: new_ssid, passphrase: new_passphrase }
    })
  }

  @action.bound
  onUpdateWifiAPCredentials(new_ssid, new_passphrase) {

    this.publishMessage({
      name: "set_wifi_access_point_credentials",
      messageType: "nepi_ros_interfaces/WifiCredentials",
      data: { ssid: new_ssid, passphrase: new_passphrase }
    })
  }  

  @action.bound
  onRefreshWifiNetworks() {
    this.publishMessage({
      name: "refresh_available_wifi_networks",
      messageType: "std_msgs/Empty",
      data: {}
    })    
  }

  @action.bound
  onGenerateLicenseRequest() {
    if (this.license_server && (this.license_server.readyState === 1)) { // Connected
      this.license_server.send("license_request")
      this.license_request_mode = true
    }
    else {
      this.license_request_mode = false
    }
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
      messageType: "nepi_ros_interfaces/SaveData",
      data: {
        save_continuous: checked,
        save_raw: false
      }
    })
  }

  @action.bound
  onChangeSaveFreq(rate) {
    let freq = parseFloat(rate)

    if (isNaN(freq)) {
      freq = 0
    }

    this.publishMessage({
      name: "save_data_rate",
      messageType: "nepi_ros_interfaces/SaveDataRate",
      data: {
        data_product: "all",
        save_rate_hz: freq,
      }
    })

    this.saveFreqHz = freq
  }

  @action.bound
  startClassifier(selectedImageTopic, selectedClassifier, detectionThreshold) {
    this.publishMessage({
      name: "start_classifier",
      messageType: "nepi_ros_interfaces/ClassifierSelection",
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
      messageType: "nepi_ros_interfaces/Reset",
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

  @action.bound
  deleteAllData() {
    this.publishMessage({
      name: "clear_data_folder",
      messageType: "std_msgs/Empty",
      data: {}
    })
  }

  @action.bound
  onToggleAutoStartEnabled(autoStartScriptName, isEnabled) {
    this.publishMessage({
      name: "enable_script_autostart",
      messageType: "nepi_ros_interfaces/AutoStartEnabled",
      data: { 
        script: autoStartScriptName,
        enabled: isEnabled
       }
    })
  }

  @action.bound
  onReinitNavPoseSolution() {
    this.publishMessage({
      name: "nav_pose_mgr/reinit_solution",
      messageType: "std_msgs/Empty",
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

  publishValue(
    topic,
    msgType,
    value,
    throttle = true,
    noPrefix = false,
  ) {
    if (throttle && this.isThrottled()) {
      return
    }

    this.publishMessage({
      name: topic,
      messageType: msgType,
      data: {data: Number(value)},
      noPrefix: noPrefix,
    })
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
        messageType: "nepi_ros_interfaces/AutoManualSelection3DX",
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
        messageType: "nepi_ros_interfaces/Range3DX",
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
        messageType: "nepi_ros_interfaces/Angle3DX",
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

  publishSetPointcloudTargetFrame(topic, value) {
    if (topic) {
      this.publishMessage({
        name: topic + "/set_pointcloud_target_frame",
        messageType: "std_msgs/String",
        noPrefix: true,
        data: {
          data: value
        }
      })
    } else {
      console.warn("publishSetPointcloudTargetFrame: sensor3DXTopicBase not set")
    }
  }

  publishStitchedCloudEnabled(topic, enabled) {
    if (topic) {
      this.publishMessage({
        name: topic + "/enable_stitched_cloud",
        messageType: "std_msgs/Bool",
        noPrefix: true,
        data: {
          data: enabled
        }
      })
    } else {
      console.warn("publishStitchedCloudEnabled: sensor3DXTopicBase not set")
    }
  }

  /////////////////////////////////////////////////////////////////////////

  // Nav/Pose Control methods /////////////////////////////////////////////
  @action.bound
  onSetInitOrientation(roll_deg, pitch_deg, yaw_deg) {
    var q = new cannon.Quaternion()
    q.setFromEuler(roll_deg * (Math.PI/180), pitch_deg * (Math.PI/180), yaw_deg * (Math.PI/180), EULER_ORDER_FOR_CANNON) // Use YZX order because that's the only one available for the reverse operation
    this.publishMessage({
      name: "nav_pose_mgr/set_init_orientation",
      messageType: "geometry_msgs/QuaternionStamped",
      data: {
        header: {
          seq: 0,
          stamp: {
            sec: moment().unix(),
            nsec: 0
          },
          frame_id: "na"
        },
        quaternion: {
          x: q.x,
          y: q.y,
          z: q.z,
          w: q.w
        }
      }
    })
  }

  @action.bound
  onSetInitGPS(latitude_deg, longitude_deg, altitude_m) {
    this.publishMessage({
      name: "nav_pose_mgr/set_init_gps_fix",
      messageType: "sensor_msgs/NavSatFix",
      data: {
        header: {
          seq: 0,
          stamp: {
            sec: 0,
            nsec: 0
          },
          frame_id: "na"
        },
        status: {
          status: 0, // Valid FIX
          service: 1 // GPS
        },
        latitude: parseFloat(latitude_deg),
        longitude: parseFloat(longitude_deg),
        altitude: parseFloat(altitude_m),
        position_covariance_type: 0 // Unknown
      }
    })
  }

  @action.bound
  onSetInitHeading(heading_mag_deg) {
    this.publishMessage({
      name: "nav_pose_mgr/set_init_heading",
      messageType: "std_msgs/Float64",
      data: {
        data: parseFloat(heading_mag_deg),
      }
    })
  }

  @action.bound
  onSetAHRSOffsets(x_trans, y_trans, z_trans, x_rot, y_rot, z_rot, heading) {
    this.publishMessage({
      name: "nav_pose_mgr/set_ahrs_offset",
      messageType: "nepi_ros_interfaces/Offset",
      data: {
        translation: {
          x: parseFloat(x_trans),
          y: parseFloat(y_trans),
          z: parseFloat(z_trans),
        },
        rotation: {
          x: parseFloat(x_rot),
          y: parseFloat(y_rot),
          z: parseFloat(z_rot)
        },
        heading: parseFloat(heading)
      }
    })
  }

  @action.bound
  onSetAHRSOutFrame(ahrs_out_frame) {
    this.publishMessage({
      name: "nav_pose_mgr/set_ahrs_out_frame",
      messageType: "std_msgs/String",
      data: {
        data: ahrs_out_frame
      }
    })
  }

  @action.bound
  onToggletransformNavPoseOrientation() {
    this.transformNavPoseOrientation = !(this.transformNavPoseOrientation)
  }

  @action.bound
  onSetGPSFixTopic(topic) {
    this.publishMessage({
      name: "nav_pose_mgr/set_gps_fix_topic",
      messageType: "std_msgs/String",
      data: {
        data: topic
      }
    })
  }

  @action.bound
  onToggleGPSClockSync() {
    this.gpsClockSyncEnabled = !(this.gpsClockSyncEnabled)
    this.publishMessage({
      name: "nav_pose_mgr/enable_gps_clock_sync",
      messageType: "std_msgs/Bool",
      data: {
        data: this.gpsClockSyncEnabled
      }
    })
  }

  @action.bound
  onSetOrientationTopic(topic) {
    this.publishMessage({
      name: "nav_pose_mgr/set_orientation_topic",
      messageType: "std_msgs/String",
      data: {
        data: topic
      }
    })
  }

  @action.bound
  onSetHeadingTopic(topic) {
    this.publishMessage({
      name: "nav_pose_mgr/set_heading_topic",
      messageType: "std_msgs/String",
      data: {
        data: topic
      }
    })
  }

  @action.bound
  onChangeStreamingImageQuality(quality) {
    this.streamingImageQuality = quality
    this.publishMessage({
      name: "rui_config_mgr/set_streaming_image_quality",
      messageType: "std_msgs/UInt8",
      data: { data: quality }
    })
  }

  /////////////////////////////////////////////////////////////////////////

  // Mux Sequencer
  @action.bound
  onConfigureMuxSequence(updated_sequence_dict) {
    this.publishMessage({
      name: "sequential_image_mux/configure_mux_sequence",
      messageType: "nepi_ros_interfaces/ImageMuxSequence",
      data: updated_sequence_dict
    })
  }

  @action.bound
  onDeleteMuxSequence(sequence_id) {
    this.publishMessage({
      name: "sequential_image_mux/delete_mux_sequence",
      messageType: "std_msgs/String",
      data: { data: sequence_id }
    })
  }

  // PTX
  @action.bound
  onPTXGoHome(ptxNamespace) {
    this.publishMessage({
      name: ptxNamespace + "/ptx/go_home",
      messageType: "std_msgs/Empty",
      data: {},
      noPrefix: true
    })    
  }

  @action.bound
  onPTXStop(ptxNamespace) {
    this.publishMessage({
      name: ptxNamespace + "/ptx/stop_moving",
      messageType: "std_msgs/Empty",
      data: {},
      noPrefix: true
    }) 
  }

  @action.bound
  onSetPTXHomePos(ptxNamespace, yawHomePos, pitchHomePos) {
    this.publishMessage({
      name: ptxNamespace + "/ptx/set_home_position",
      messageType: "nepi_ros_interfaces/PanTiltPosition",
      data: {"yaw_deg": yawHomePos, "pitch_deg": pitchHomePos},
      noPrefix: true
    })
  }

  @action.bound
  onSetPTXSoftStopPos(ptxNamespace, yawMin, yawMax, pitchMin, pitchMax) {
    this.publishMessage({
      name: ptxNamespace + "/ptx/set_soft_limits",
      messageType: "nepi_ros_interfaces/PanTiltLimits",
      data: {"min_yaw_softstop_deg": yawMin,
             "max_yaw_softstop_deg": yawMax,
             "min_pitch_softstop_deg": pitchMin,
             "max_pitch_softstop_deg": pitchMax},
      noPrefix: true
    })
  }
}

const stores = {
  ros: new ROSConnectionStore(),
}

export default stores
