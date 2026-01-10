/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */
import React, { Component } from "react"

//import moment from "moment"
import { observer, inject } from "mobx-react"

//import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import Section from "./Section"
//import EnableAdjustment from "./EnableAdjustment"
import Button, { ButtonMenu } from "./Button"
import Toggle from "react-toggle"
import Label from "./Label"
import RangeAdjustment from "./RangeAdjustment"
import { SliderAdjustment} from "./AdjustmentWidgets"
import { Column, Columns } from "./Columns"
import Styles from "./Styles"
import Input from "./Input"

import NepiIFConfig from "./Nepi_IF_Config"
import NavPoseViewer from "./Nepi_IF_NavPoseViewer"

import {  onChangeSwitchStateValue } from "./Utilities"

function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}


const styles = Styles.Create({

  
  canvas: {
    width: "100%",
    height: "auto",
    transform: "scale(1)"
  }
})

const COMPRESSION_HIGH_QUALITY = 95
const COMPRESSION_MED_QUALITY = 50
const COMPRESSION_LOW_QUALITY = 10

const PORT = 9091
const ROS_WEBCAM_URL_BASE = `http://${
  window.location.hostname
}:${PORT}/stream?topic=`

@inject("ros")
@observer
class ImageViewer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      has_status: false,
      show_controls: false,
      show_status: false,
      show_renders: false,
      controls_namespace: null,
      has_overlay: false,
      show_overlayss: false,
      has_navpose: false,
      show_navpose: false,
      hasInitialized: false,
      shouldUpdate: true,
      streamWidth: null,
      streamHeight: null,
      streamSize: 0,
      currentStreamingImageQuality: COMPRESSION_HIGH_QUALITY,
      status_listenter: null,
      status_msg: null,
      pixel: null,
      mouse_drag: false,


      filter_list_viewable: false,

      connected: false
    }
    this.updateFrame = this.updateFrame.bind(this)
    this.onCanvasRef = this.onCanvasRef.bind(this)
    this.updateImageSource = this.updateImageSource.bind(this)
    this.onChangeImageQuality = this.onChangeImageQuality.bind(this)

    this.renderImageViewer = this.renderImageViewer.bind(this)
    this.renderFilterControls = this.renderFilterControls.bind(this)
    this.renderRenderControls = this.renderRenderControls.bind(this)
    this.renderResOrientControls = this.renderResOrientControls.bind(this)
    this.renderOverlayControls = this.renderOverlayControls.bind(this)

    this.renderStats = this.renderStats.bind(this)
    this.getImgStatsText = this.getImgStatsText.bind(this)

    this.mouseDownEvent = this.mouseDownEvent.bind(this)
    this.mouseDragEvent = this.mouseDragEvent.bind(this)
    this.mouseUpEvent = this.mouseUpEvent.bind(this)

    this.onKeySaveInputOverlayValue = this.onKeySaveInputOverlayValue.bind(this)
    this.onUpdateInputOverlayValue = this.onUpdateInputOverlayValue.bind(this)

    //this.ZoomViewer = this.ZoomViewer.bind(this)

    this.statusListener = this.statusListener.bind(this)
    this.updateStatusListener = this.updateStatusListener.bind(this)

  }

  updateFrame() {
    const square_canvas = this.props.squareCanvas ? this.props.squareCanvas : false
    const shouldUpdate = this.state.shouldUpdate
    const hasInitialized = this.state.hasInitialized
    const connected = this.state.connected

    if (shouldUpdate === true && hasInitialized === true && this.canvas) {

      // Firset check for image size change
      const { width, height } = this.image
      const streamWidth = this.state.streamWidth
      const streamHeight = this.state.streamHeight

      const width_changed = width !== streamWidth
      const height_changed = height  !== streamHeight
      const size_changed = (width_changed === true || height_changed === true)
      if (size_changed === true || connected === false) {
        this.setState({
            hasInitialized: true,
            streamWidth: width,
            streamHeight: height,
            streamSize: width * height,
            connected: true
            })

        if (square_canvas === true){
          var size = 0
          if (width > height){
            size = width
          }
          else {
            size = height
          }
          this.canvas.width = size
          this.canvas.height = size

        }
        else {
          this.canvas.width = width
          this.canvas.height = height
        }
      }

      // Then update
      const context = this.canvas.getContext("2d")
      context.fillStyle = "red"
      context.textAlign = "center"
      context.font = "50px Arial"
      context.clearRect(0, 0, streamWidth, streamHeight)
      context.drawImage(this.image, 0, 0, streamWidth, streamHeight)
      //this.setState({ clockTime: moment() })
      requestAnimationFrame(this.updateFrame)
      

    }
  }
  

  getPixelLoc(canvas,event){

      const rect = canvas.getBoundingClientRect()
      const xr = (event.clientX - rect.left) / (canvas.offsetWidth ) 
      const yr = (event.clientY - rect.top) / (canvas.offsetHeight )

      const w = canvas.width
      const h = canvas.height

      const x = Math.floor(w * xr )
      const y = Math.floor(h * yr )

    return [x,y]
  }


  getPixelColor(canvas,x, y){


      // pixelData is a Uint8ClampedArray with 4 values: [R, G, B, A]
      const ctx = canvas.getContext('2d')
      const imageData = ctx.getImageData(x, y, 1, 1)
      const pixelData = imageData.data // This is a Uint8ClampedArray [R, G, B, A]
      const r = pixelData[0]
      const g = pixelData[1]
      const b = pixelData[2]
      const a = pixelData[3] / 255 // Alpha is in range [0, 255], convert to [0, 1]
    return [r,g,b,a]
  }

  mouseDownEvent(canvas, event) {
      //const rect = canvas.getBoundingClientRect()
      const [x,y] = this.getPixelLoc(canvas, event)
      const [r,g,b,a] = this.getPixelColor(canvas,x, y)
      this.setState({pixel: [x,y,r,g,b,a], mouse_drag: true})
      console.log("x coords: " + x + ", y coords: " + y);
  }


  mouseDragEvent(canvas,event){
      const {sendImageDragMsg} = this.props.ros
      const namespace = this.state.controls_namespace
      //const rect = canvas.getBoundingClientRect()

      const is_drag = this.state.mouse_drag
      if (is_drag === true){
          const [x2,y2] = this.getPixelLoc(canvas, event)
          const pixel = this.state.pixel
          if (pixel !== null){
            const [x1,y1] = pixel
            const dx = Math.abs(x2 - x1) 
            const dy = Math.abs(y2 - y1) 

            const pt = 5
            if (dx > pt && dy > pt){
              const [r,g,b,a] = this.getPixelColor(canvas,x2, y2)
              sendImageDragMsg(namespace + '/set_drag',x2,y2,r,g,b,a)
            }
          }
      }
  }

  mouseUpEvent(canvas,event){
      const {sendImagePixelMsg, sendImageWindowMsg} = this.props.ros
      const namespace = this.state.controls_namespace
      //const rect = canvas.getBoundingClientRect()

      const [x2,y2] = this.getPixelLoc(canvas, event)
      const pixel = this.state.pixel
      this.setState({pixel: null, mouse_drag: false})
      if (pixel !== null){
        const [x1,y1,r,g,b,a] = pixel
        const dx = Math.abs(x2 - x1) 
        const dy = Math.abs(y2 - y1) 

        const pt = 5
        if (dx < pt && dy < pt){
          const [r,g,b,a] = this.getPixelColor(canvas,x1, y1)
          //const cur_ms = Date.now()
          //const last_click_ms = this.state.last_click_ms
          sendImagePixelMsg(namespace + '/set_click',x1,y1,r,g,b,a)

          //this.setState({last_click_ms: cur_ms})
        }

        const wt = Math.max(canvas.width, canvas.height) * 0.05
        if (dx > wt && dy > wt){
          sendImageWindowMsg(namespace + '/set_window',x1,x2,y1,y2)
        }


      }
      
    
  }

  onCanvasRef(ref) {
    this.canvas = ref
    if (ref != null){
          this.canvas.addEventListener('mousedown', (e) => {
          this.mouseDownEvent(this.canvas, e)
          })

          this.canvas.addEventListener('mousemove', (e) => {
          this.mouseDragEvent(this.canvas, e)
          })

          this.canvas.addEventListener('mouseup', (e) => {
          this.mouseUpEvent(this.canvas, e)
          })
      }

    //this.updateImageSource()
  }

  // Callback for handling ROS Status messages
  statusListener(message) {
    this.setState({
      status_msg: message
    })    

  }

  // Function for configuring and subscribing to Status
  updateStatusListener() {
    const namespace = this.props.status_namespace ? this.props.status_namespace : this.props.imageTopic
    const statusNamespace = namespace + '/status'
    if (this.state.status_listenter) {
      this.state.status_listenter.unsubscribe()
      this.setState({status_msg: null})

    }
    var status_listenter = this.props.ros.setupStatusListener(
          statusNamespace,
          "nepi_interfaces/ImageStatus",
          this.statusListener
        )
    this.setState({ status_listenter: status_listenter,
                    controls_namespace: namespace
    })
  }


  updateImageSource() {
    if (this.props.imageTopic) {
      if (!this.image) {
        this.image = new Image() // EXPERIMENT -- Only create a new Image when strictly required
      }
      this.image.crossOrigin = "Anonymous"
      this.image.onload = () => {
        const { width, height } = this.image
        this.setState(
          {
            hasInitialized: true,
            connected: false,
            streamWidth: width,
            streamHeight: height,
            streamSize: width * height
          },
          () => {
            requestAnimationFrame(this.updateFrame)
          }
        )
      }
    }
    if (this.image) {
      const { streamingImageQuality } = this.props.ros
      this.image.src = ROS_WEBCAM_URL_BASE + this.props.imageTopic + '&quality=' + streamingImageQuality
    }
  }

  // Lifecycle method called when the props change.
  // Used to track changes in the image topic value
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { imageTopic } = this.props
    const size = this.state.streamSize
    const width = (this.image) ? this.image.width : 0
    const height = (this.image) ? this.image.height : 0
    const got_size = width * height
    const size_changed = (size !== got_size)
    if (prevProps.imageTopic !== imageTopic || size_changed === true || prevState.currentStreamingImageQuality !== this.state.currentStreamingImageQuality){
      this.updateImageSource()
      if (prevProps.imageTopic !== imageTopic) {
        this.updateStatusListener()
      }
    }
  }

  componentWillUnmount() {
    this.setState({ shouldUpdate: false })
    if (this.image) {
      this.image.src = null
    }
  }

  componentDidMount() {
    this.updateImageSource()
    this.updateStatusListener()
  }

  onChangeImageQuality(quality) {
    this.props.ros.onChangeStreamingImageQuality(quality)
    this.setState({currentStreamingImageQuality: quality})
    this.updateImageSource()

  }




  getImgInfoText(){
    const status_msg = this.state.status_msg
    var msg = ""
    if (status_msg !== null){
      const frame_3d = status_msg.frame_3d
      const encoding = status_msg.encoding
      const width_px = round(status_msg.width_px, 0)
      const height_px = round(status_msg.height_px, 0)
      const width_deg = round(status_msg.width_deg, 0)
      const height_deg = round(status_msg.height_deg, 0)
      const perspective = status_msg.perspective

      msg = ("\n\n3D Frame: " + frame_3d + 
      "\n\nEncoding: " + encoding + 
      "\n\nWidth/Height (Pixals): " + width_px.replace('.','') + ':' + height_px.replace('.','') +
      "\n\nWidth/Height (Deg): " + width_deg.replace('.','') + ':' + height_deg.replace('.','') +
      "\nPerspective: " + perspective )
    }
    else {
      msg = "No Stats Available"

    }
    return msg
  }


  renderInfo() {
   
    if (this.state.status_msg !== null){
      const msg = this.getImgInfoText()
      return (
        <Columns>
        <Column>
         <pre style={{ height: "200px", overflowY: "auto" }} align={"left"} textAlign={"left"}>
                  {msg}
                  </pre>
    
        </Column>
        </Columns>

      )
    }
    else {
      return (
        <Columns>
        <Column>

        </Column>
        </Columns>
      )

    }

  }



  getImgStatsText(){
    const status_msg = this.state.status_msg
    const has_status = this.props.has_status ? this.props.has_status : true
    var msg = ""
    if (status_msg !== null && has_status === true){
      const get_lat = round(status_msg.get_latency_time, 3)
      const pub_lat = round(status_msg.pub_latency_time, 3)
      const proc_time = round(status_msg.process_time, 3)
      const avg_fps = round(status_msg.avg_pub_rate, 3)
      msg = ("\n\nGet Latency: " + get_lat + 
      "\n\nPublish Latency: " + pub_lat + 
      "\n\nProcess Times (Image): " + proc_time +
      "\n\nAvg FPS: " + avg_fps )
    }
    else {
      msg = "No Stats Available"

    }
    return msg
  }

  renderStats() {
    const status_msg = this.state.status_msg
    const has_status = this.props.has_status ? this.props.has_status : true
    if (status_msg != null && has_status === true){
      const msg = this.getImgStatsText()
      return (
        <Columns>
        <Column>
         <pre style={{ height: "200px", overflowY: "auto" }} align={"left"} textAlign={"left"}>
                  {msg}
                  </pre>
    
        </Column>
        </Columns>

      )
    }
    else {
      return (
        <Columns>
        <Column>

        </Column>
        </Columns>
      )

    }

  }

  renderFilters(namespace, filter_options, filter_states, filter_ratios) {
    if (filter_options.length > 0){
      var filter_name = ""
      var filter_enabled = false
      var filter_ratio = 0.0
      var filter_display_name = 'None'

      for (var i = 0; i < filter_options.length; i++) {
        filter_name = filter_options[i]
        filter_enabled = filter_states[i]
        filter_ratio = filter_ratios[i]
        filter_display_name = filter_name.replace('_',' ')
        return (
           
          <Columns>
          <Column>
   
                        <Label title={filter_display_name}>
         
                            <Toggle
                              checked={filter_enabled === true}
                              onClick={() => this.props.ros.sendUpdateStateMsg(namespace + "/set_filter_enable",filter_name,!filter_enabled)}>
                            </Toggle>
                      
                      </Label>

                </Column>
                <Column>

                </Column>
                </Columns>

                )
      }
    }
    else {
      return (
        <Columns>
        <Column>

        </Column>
        </Columns>
      )
    }
  }

  renderFilterControls() {

    const namespace = this.state.controls_namespace
    const show_filters = this.props.show_filters ? this.props.show_filters : true

    const { imageCaps, sendTriggerMsg, sendBoolMsg } = this.props.ros
    const capabilities = (imageCaps !== null) ? (imageCaps[namespace] !== null ? imageCaps[namespace] : null) : null

   
    if (show_filters === true && this.state.status_msg !== null && namespace !== null && capabilities !== null){
      const has_auto_adjust = (capabilities && capabilities.has_auto_adjust && !this.state.disabled)
      const has_contrast = (capabilities && capabilities.has_contrast && !this.state.disabled)
      const has_brightness = (capabilities && capabilities.has_brightness && !this.state.disabled)
      const has_threshold = (capabilities && capabilities.has_threshold && !this.state.disabled)
      const has_framerate = (capabilities && capabilities.has_framerate && !this.state.disabled)


      const message = this.state.status_msg
      const auto_adjust_enabled = message.auto_adjust_enabled
      const auto_adjust_ratio = message.auto_adjust_ratio
      const auto_adjust_controls = message.auto_adjust_controls
      const brightness_ratio = message.brightness_ratio
      const contrast_ratio = message.contrast_ratio
      const threshold_ratio = message.threshold_ratio


      const auto_controls = auto_adjust_enabled ? auto_adjust_controls : []
      //Unused const hide_framerate = (!has_framerate || auto_controls.indexOf('framerate') !== -1)
      const hide_brightness = (!has_brightness || auto_controls.indexOf('brightness') !== -1)
      const hide_contrast = (!has_contrast || auto_controls.indexOf('contrast') !== -1)
      const hide_threshold = (!has_threshold || auto_controls.indexOf('threshold') !== -1)



      const filter_options = message.filter_options
      const filter_states = message.filter_states
      const filter_ratios = message.filter_ratios




      return (

        <Columns>
        <Column>
 

             <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
            <Label title={"FILTERS"} />
 
        
            {this.renderFilters(namespace, filter_options, filter_states, filter_ratios)}




            <div hidden={(has_auto_adjust !== true )}>
            
                    <Columns>
                    <Column>

                            <Label title={"Auto Adjust"}>
                              <Toggle
                                checked={auto_adjust_enabled===true}
                                onClick={() => sendBoolMsg(namespace + "/set_auto_adjust_enable",!auto_adjust_enabled)}>
                              </Toggle>
                            </Label>


                        </Column>
                        <Column>

                        </Column>
                      </Columns>

                </div>


            <div hidden={(has_auto_adjust !== true || auto_adjust_enabled !== true )}>
                      <SliderAdjustment
                          title={"Auto Adjust Sensitivity"}
                          msgType={"std_msgs/Float32"}
                          adjustment={auto_adjust_ratio}
                          topic={namespace + "/set_auto_adjust_ratio"}
                          scaled={0.01}
                          min={0}
                          max={100}
                          tooltip={"Adjustable Adjust"}
                          unit={"%"}
                      />

            </div>


          <div hidden={(hide_brightness)}>
                      <SliderAdjustment
                          title={"Brightness"}
                          msgType={"std_msgs/Float32"}
                          adjustment={brightness_ratio}
                          topic={namespace + "/set_brightness_ratio"}
                          scaled={0.01}
                          min={0}
                          max={100}
                          tooltip={"Adjustable brightness"}
                          unit={"%"}
                      />

            </div>


            <div hidden={(hide_contrast)}>
                      <SliderAdjustment
                        title={"Contrast"}
                        msgType={"std_msgs/Float32"}
                        adjustment={contrast_ratio}
                        topic={namespace + "/set_contrast_ratio"}
                        scaled={0.01}
                        min={0}
                        max={100}
                        tooltip={"Adjustable contrast"}
                        unit={"%"}
                      />

            </div>

            <div hidden={(hide_threshold)}>
                      <SliderAdjustment
                          title={"Thresholding"}
                          msgType={"std_msgs/Float32"}
                          adjustment={threshold_ratio}
                          topic={namespace + "/set_threshold_ratio"}
                          scaled={0.01}
                          min={0}
                          max={100}
                          tooltip={"Adjustable threshold"}
                          unit={"%"}
                      />
              </div>



          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/> 


          <ButtonMenu>
            <Button onClick={() => sendTriggerMsg( namespace + "/reset_filters")}>{"Reset Controls"}</Button>
          </ButtonMenu>


      </Column>
      </Columns>
      )
    }
    else {
      return (
        <Columns>
        <Column>

        </Column>
        </Columns>
      )

    }

  }


  renderRenderControls() {

    const namespace = this.state.controls_namespace
    const show_renders = this.props.show_renders ? this.props.show_renders : true

    const { imageCaps, sendTriggerMsg } = this.props.ros
    const capabilities = (imageCaps !== null) ? (imageCaps[namespace] !== null ? imageCaps[namespace] : null) : null

   
    if (show_renders === true && this.state.status_msg !== null && namespace !== null && capabilities !== null){
      const has_range = (capabilities && capabilities.has_range && !this.state.disabled)
      const has_zoom = (capabilities && capabilities.has_zoom && !this.state.disabled)
      const has_pan = (capabilities && capabilities.has_pan && !this.state.disabled)
      const has_window = (capabilities && capabilities.has_window && !this.state.disabled)
      const has_rotate_3d = (capabilities && capabilities.has_rotate_3d && !this.state.disabled)
      const has_tilt_3d = (capabilities && capabilities.has_tilt_3d && !this.state.disabled)


      const message = this.state.status_msg
      const auto_adjust_enabled = message.auto_adjust_enabled
      const auto_adjust_controls = message.auto_adjust_controls
      const range_start_ratio = message.range_ratios.start_range
      const range_stop_ratio = message.range_ratios.stop_range
      const zoom_ratio = message.zoom_ratio
      const pan_x_ratio = message.pan_x_ratio
      const pan_y_ratio = message.pan_y_ratio
      const x_min_ratio = message.window_x_ratios.start_range
      const x_max_ratio = message.window_x_ratios.stop_range
      const y_min_ratio = message.window_y_ratios.start_range
      const y_max_ratio = message.window_y_ratios.stop_range
      const rotate_3d_ratio = message.rotate_3d_ratio
      const tilt_3d_ratio = message.tilt_3d_ratio

      const auto_controls = auto_adjust_enabled ? auto_adjust_controls : []
      const hide_range = (!has_range || auto_controls.indexOf('range') !== -1)
      const hide_window = (!has_window || auto_controls.indexOf('window') !== -1)



      return (

        <Columns>
        <Column>
 

             <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
            <Label title={"RENDER  CONTROLS"} />
 
    

            <div hidden={(hide_range)}>
                    <RangeAdjustment
                      title="Range Clip"
                      min={range_start_ratio}
                      max={range_stop_ratio}
                      min_limit_m={0.2}
                      max_limit_m={1.0}
                      topic={namespace + "/set_range_ratios"}
                      tooltip={"Adjustable range ratio"}
                      unit={"%"}
                    />
          </div>


          <div hidden={(has_zoom !== true )}>

                      <SliderAdjustment
                            title={"Zoom"}
                            msgType={"std_msgs/Float32"}
                            adjustment={zoom_ratio}
                            topic={namespace + "/set_zoom_ratio"}
                            scaled={0.01}
                            min={0}
                            max={100}
                            disabled={false}
                            tooltip={"Zoom controls"}
                            unit={"%"}
                        />
          </div>


          <div hidden={(has_pan !== true )}>

                      <SliderAdjustment
                            title={"Pan X"}
                            msgType={"std_msgs/Float32"}
                            adjustment={pan_x_ratio}
                            topic={namespace + "/set_pan_x_ratio"}
                            scaled={0.01}
                            min={0}
                            max={100}
                            disabled={false}
                            tooltip={"Pan left-right controls"}
                            unit={"%"}
                        />

                  

          </div>


          <div hidden={(hide_window)}>
                    <RangeAdjustment
                      title="X Window"
                      min={x_min_ratio}
                      max={x_max_ratio}
                      min_limit_m={0.2}
                      max_limit_m={1.0}
                      disabled={true}
                      tooltip={"Adjustable x_min and x_max ratios"}
                      unit={"%"}
                    />

                 
          </div>

          <div hidden={(has_pan !== true )}>



                      <SliderAdjustment
                            title={"Pan Y"}
                            msgType={"std_msgs/Float32"}
                            adjustment={pan_y_ratio}
                            topic={namespace + "/set_pan_y_ratio"}
                            scaled={0.01}
                            min={0}
                            max={100}
                            disabled={false}
                            tooltip={"Pan up-down controls"}
                            unit={"%"}
                        />

          </div>


          <div hidden={(hide_window)}>


                    <RangeAdjustment
                      title="Y Window"
                      min={y_min_ratio}
                      max={y_max_ratio}
                      min_limit_m={0.2}
                      max_limit_m={1.0}
                      disabled={true}
                      tooltip={"Adjustable y_min and y_max ratios"}
                      unit={"%"}
                    />
          </div>

          <div hidden={(has_rotate_3d !== true )}>

                      <SliderAdjustment
                            title={"Rotate"}
                            msgType={"std_msgs/Float32"}
                            adjustment={rotate_3d_ratio}
                            topic={namespace + "/set_rotate_3d_ratio"}
                            scaled={0.01}
                            min={0}
                            max={100}
                            disabled={false}
                            tooltip={"Rotate controls"}
                            unit={"%"}
                        />

          </div>

          <div hidden={(has_tilt_3d !== true )}>

                        <SliderAdjustment
                            title={"Tilt"}
                            msgType={"std_msgs/Float32"}
                            adjustment={tilt_3d_ratio}
                            topic={namespace + "/set_tilt_3d_ratio"}
                            scaled={0.01}
                            min={0}
                            max={100}
                            disabled={false}
                            tooltip={"Tilt controls"}
                            unit={"%"}
                        />
          </div>



          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/> 


          <ButtonMenu>
            <Button onClick={() => sendTriggerMsg( namespace + "/reset_renders")}>{"Reset Controls"}</Button>
          </ButtonMenu>


      </Column>
      </Columns>
      )
    }
    else {
      return (
        <Columns>
        <Column>

        </Column>
        </Columns>
      )

    }

  }

  renderResOrientControls() {

    const namespace = this.state.controls_namespace
    const show_res_orient = this.props.show_res_orient ? this.props.show_res_orient : true

    const { imageCaps, sendTriggerMsg, sendBoolMsg } = this.props.ros
    const capabilities = (imageCaps !== null) ? (imageCaps[namespace] !== null ? imageCaps[namespace] : null) : null

   
    if (show_res_orient === true && this.state.status_msg !== null && namespace !== null && capabilities !== null){
      const has_rotate_2d = (capabilities && capabilities.has_rotate_2d && !this.state.disabled)
      const has_flip_horz = (capabilities && capabilities.has_flip_horz && !this.state.disabled)
      const has_flip_vert = (capabilities && capabilities.has_flip_vert && !this.state.disabled)
      const has_resolution = (capabilities && capabilities.has_resolution && !this.state.disabled)


      const message = this.state.status_msg
      const auto_adjust_enabled = message.auto_adjust_enabled
      const auto_adjust_controls = message.auto_adjust_controls
      const resolution_ratio = message.resolution_ratio
      const resolution_str = message.resolution_current
      const rotate_2d_deg = message.rotate_2d_deg
      const flip_horz = message.flip_horz
      const flip_vert = message.flip_vert

      const auto_controls = auto_adjust_enabled ? auto_adjust_controls : []
      const hide_resolution = (!has_resolution || auto_controls.indexOf('resolution') !== -1)
      const hide_rotate_2d = (!has_rotate_2d || auto_controls.indexOf('rotate_2d_deg') !== -1)
      const hide_flip_horz = (!has_flip_horz || auto_controls.indexOf('flip_horz') !== -1)
      const hide_flip_vert = (!has_flip_vert || auto_controls.indexOf('flip_vert') !== -1)




      return (

        <Columns>
        <Column>
 
          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>
        <Label title={"ORIENTATION & SIZE"} />

              <div hidden={(hide_rotate_2d)}>

                          <Columns>
                          <Column>


                            <ButtonMenu>
                              <Button onClick={() => sendTriggerMsg( namespace + "/rotate_2d")}>{"Rotate 90 Degs"}</Button>
                            </ButtonMenu>

                          </Column>
                          <Column>

                          <Label title={"Current Angle"}>
                        <Input
                          value={rotate_2d_deg}
                          id="cur_rotate_deg"
                          style={{ width: "100%" }}
                          disabled={true}
                        />
                      </Label>

                          </Column>
                        </Columns>         

               </div>           



              

                          <Columns>
                          <Column>

                          <div hidden={(hide_flip_horz)}>

  
                            <Label title={"Flip Horz"}>
                                <Toggle
                                  checked={flip_horz}
                                  onClick={() => sendBoolMsg(namespace + '/set_flip_horz',!flip_horz)}
                                /> 
                              </Label>

                          </div>

                          </Column>
                          <Column>

                           <div hidden={(hide_flip_vert)}>

  
                            <Label title={"Flip Vert"}>
                                <Toggle
                                  checked={flip_vert}
                                  onClick={() => sendBoolMsg(namespace + '/set_flip_vert',!flip_vert)}
                                /> 
                              </Label>

                          </div>

                          </Column>
                        </Columns>         
 

 
              <div hidden={(hide_resolution)}>



                            <SliderAdjustment
                                  title={"Resolution"}
                                  msgType={"std_msgs/Float32"}
                                  adjustment={resolution_ratio}
                                  topic={namespace + '/set_resolution_ratio'}
                                  scaled={0.01}
                                  min={0}
                                  max={100}
                                  tooltip={"Adjustable Resolution"}
                                  unit={"%"}
                              />

              </div>

                          <Columns>
                          <Column>

                          </Column>
                          <Column>

                          <Label title={"Current Resolution"}>
                        <Input
                          value={resolution_str}
                          id="cur_res"
                          style={{ width: "100%" }}
                          disabled={true}
                        />
                      </Label>

                          </Column>
                        </Columns>             






          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/> 


          <ButtonMenu>
            <Button onClick={() => sendTriggerMsg( namespace + "/reset_res_orients")}>{"Reset Controls"}</Button>
          </ButtonMenu>


      </Column>
      </Columns>
      )
    }
    else {
      return (
        <Columns>
        <Column>

        </Column>
        </Columns>
      )

    }

  }


  onUpdateInputOverlayValue(event) {
    this.setState({ custom_overlay_input: event.target.value })
    document.getElementById("input_overlay").style.color = Styles.vars.colors.red
    this.render()
  }

  onKeySaveInputOverlayValue(event) {
    const {sendStringMsg}  = this.props.ros
    if(event.key === 'Enter'){
      const value = this.state.custom_overlay_input
      const namespace = this.state.controls_namespace
      sendStringMsg(namespace + '/add_overlay_text', value)
      this.setState({custom_overlay_input: ''})
    }
  }

  renderOverlayControls() {
    const { sendTriggerMsg, sendBoolMsg } = this.props.ros
    const namespace = this.state.controls_namespace
    const show_overlays = this.props.show_overlays ? this.props.show_overlays : true
   
    if (show_overlays === true && this.state.status_msg !== null && namespace !== null){
      const message = this.state.status_msg
      const size_ratio = message.overlay_size_ratio
      const name = message.overlay_img_name
      const date = message.overlay_date_time
      const nav = message.overlay_nav
      const pose = message.overlay_pose


      return (

        <Columns>
        <Column>


        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>




                        <SliderAdjustment
                            title={"Overlay Size"}
                            msgType={"std_msgs/Float32"}
                            adjustment={size_ratio}
                            topic={namespace + "/set_overlay_size_ratio"}
                            scaled={0.01}
                            min={0}
                            max={100}
                            disabled={false}
                            tooltip={"Overlay size controls"}
                            unit={"%"}
                        />



            <Columns>
            <Column>
                  <Label title={"Source Name"}>
                      <Toggle
                        checked={name}
                        onClick={() => sendBoolMsg(namespace + '/set_overlay_source_name',!name)}
                      /> 
                    </Label>

                    <Label title={"Date Time"}>
                      <Toggle
                        checked={date}
                        onClick={() => sendBoolMsg(namespace + '/set_overlay_date_time',!date)}
                      /> 
                    </Label>

                    <Label title={"Location"}>
                      <Toggle
                        checked={nav}
                        onClick={() => sendBoolMsg(namespace + '/set_overlay_nav',!nav)}
                      /> 
                    </Label>

                    <Label title={"Pose"}>
                      <Toggle
                        checked={pose}
                        onClick={() => sendBoolMsg(namespace + '/set_overlay_pose',!pose)}
                      /> 
                    </Label>


                </Column>
                <Column>

                </Column>
              </Columns>

              <Label title={'Add'}>
                <Input id="input_overlay" 
                  value={this.state.custom_overlay_input} 
                  onChange={this.onUpdateInputOverlayValue} 
                  onKeyDown= {this.onKeySaveInputOverlayValue} />
              </Label>

                <ButtonMenu>
                    <Button onClick={() => sendTriggerMsg( namespace + "/clear_overlay_list")}>{"Clear"}</Button>
                  </ButtonMenu>


              <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/> 

          <ButtonMenu>
            <Button onClick={() => sendTriggerMsg( namespace + "/reset_overlays")}>{"Reset Overlays"}</Button>
          </ButtonMenu>

      </Column>
      </Columns>
      )
    }
    else {
      return (
        <Columns>
        <Column>

        </Column>
        </Columns>
      )

    }

  }

  renderCompression(){
    const {
      streamingImageQuality
    } = this.props.ros
    const hideQualitySelector = this.props.hideQualitySelector ? this.props.hideQualitySelector: false


    if (streamingImageQuality !== this.state.currentStreamingImageQuality)
    {
      this.setState({currentStreamingImageQuality: streamingImageQuality})
    }

    

    return(
          <Columns>
          <Column>
          <div align={"left"} textAlign={"left"}>
            { hideQualitySelector ?
              null :
              <Label title={"Compression Level"} />
            }
          </div>
          </Column>
          <Column>
          <div align={"left"} textAlign={"left"}>
            { hideQualitySelector ?
              null :
              <div>
                <Label title={"Low"} />
                <Toggle
                  checked={streamingImageQuality >= COMPRESSION_HIGH_QUALITY}
                  onClick={() => {this.onChangeImageQuality(COMPRESSION_HIGH_QUALITY)}}
                />
              </div>
            }
          </div>
          </Column>
          <Column>
          <div align={"left"} textAlign={"left"}>
            { hideQualitySelector ?
              null :
              <div>
                <Label title={"Medium"} />
                <Toggle
                  checked={streamingImageQuality >= COMPRESSION_MED_QUALITY && streamingImageQuality < COMPRESSION_HIGH_QUALITY}
                  onClick={() => {this.onChangeImageQuality(COMPRESSION_MED_QUALITY)}}
                />
              </div>
            }
          </div>
          </Column>
          <Column>
          <div align={"left"} textAlign={"left"}>
            { hideQualitySelector ?
              null :
              <div>
                <Label title={"High"} />
                <Toggle
                  checked={streamingImageQuality <= COMPRESSION_LOW_QUALITY}
                  onClick={() => {this.onChangeImageQuality(COMPRESSION_LOW_QUALITY)}}
                />
              </div>
            }
          </div>
          </Column>
        </Columns>

    )

  }






  renderImageViewer() {

    const namespace = this.props.imageTopic ? this.props.imageTopic : 'None'
    const { sendTriggerMsg } = this.props.ros
    const show_image_options = (this.props.show_image_options !== undefined)? this.props.show_image_options : true
    const show_status = this.state.show_status
    const show_controls = this.state.show_controls
    const show_renders = this.state.show_renders
    const show_navpose = this.state.show_navpose 
    const navpose_namespace = this.props.navpose_namespace ? this.props.navpose_namespace : namespace  + "/navpose"

    
    return (
      
      <Columns>
      <Column>


                  <ButtonMenu>
                    <Button onClick={() => sendTriggerMsg( namespace + "/reset_renders")}>{"Reset"}</Button>
                  </ButtonMenu>

                  <canvas style={styles.canvas} ref={this.onCanvasRef} />


      <div align={"left"} textAlign={"left"} hidden={(show_image_options === false || namespace === 'None')}>

                <div style={{ display: 'flex' }}>
                        <div style={{ width: '15%' }}>
                              <Label title="Show Image Controls">
                                <Toggle
                                  checked={this.state.show_controls===true}
                                  onClick={() => onChangeSwitchStateValue.bind(this)("show_controls",this.state.show_controls)}>
                                </Toggle>
                            </Label>
                        </div>
                        <div style={{ width: '10%' }}>
                        </div>

            
                        <div style={{ width: '15%' }}>
                            <Label title="Show Image Info">
                                <Toggle
                                  checked={this.state.show_status===true}
                                  onClick={() => onChangeSwitchStateValue.bind(this)("show_status",this.state.show_status)}>
                                </Toggle>
                              </Label>
                        </div>
                        <div style={{ width: '10%' }}>
                        </div>

                        <div style={{ width: '15%' }}>
                            <Label title="Show NavPose Data">
                                <Toggle
                                  checked={this.state.show_navpose===true}
                                  onClick={() => onChangeSwitchStateValue.bind(this)("show_navpose",this.state.show_navpose)}>
                                </Toggle>
                              </Label>
                        </div>
                        <div style={{ width: '10%' }}>
                        </div>


                       <div style={{ width: '15%' }}>
                              <Label title="Show Render Controls">
                                <Toggle
                                  checked={this.state.show_renders===true}
                                  onClick={() => onChangeSwitchStateValue.bind(this)("show_renders",this.state.show_renders)}>
                                </Toggle>
                            </Label>
                        </div>


                        <div style={{ width: '10%' }}>
                        </div>

                  </div>



                  <div align={"left"} textAlign={"left"} hidden={(show_status !== true || namespace === 'None')}>


                        <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>


                        <div style={{ display: 'flex' }}>
                          <div style={{ width: '40%' }}>


                          <Label title={"INFO"} />
                              {this.renderInfo()}


                          </div>

                          <div style={{ width: '20%' }}>
                            {}
                          </div>

                          <div style={{ width: '40%' }}>


                          <Label title={"STATS"} />
                              {this.renderStats()}


                          </div>
                        </div>




                  </div>

       


                  <div align={"left"} textAlign={"left"} hidden={(show_renders !== true || namespace === 'None')}>

                          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                          <div style={{ display: 'flex' }}>
                                <div style={{ width: '40%' }}>


                                    <Label title={"OVERLAYS"} />
                                      {this.renderOverlayControls()}


                                </div>

                                <div style={{ width: '20%' }}>
                                  {}
                                </div>

                                <div style={{ width: '40%' }}>
                                  <Label title={"ZOOM PAN ROTATE"} />
                                  {this.renderRenderControls()}
                                </div>
                
                          </div>

                          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>      

                            {this.renderCompression()}

                            <NepiIFConfig
                                namespace={namespace}
                                title={"Nepi_IF_Config"}
                            />

                    </div>


                  <div align={"left"} textAlign={"left"} hidden={(show_controls !== true || namespace === 'None')}>

                          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>

                          <div style={{ display: 'flex' }}>
                                <div style={{ width: '40%' }}>

                                  <Label title={"FILTERS"} />
                                  {this.renderFilterControls()}


                                </div>

                                <div style={{ width: '20%' }}>
                                  {}
                                </div>

                                <div style={{ width: '40%' }}>
                                <Label title={"SIZE ORIENTATION"} />
                                  {this.renderResOrientControls()}
                                </div>
                
                          </div>

                          <div style={{ borderTop: "1px solid #ffffff", marginTop: Styles.vars.spacing.medium, marginBottom: Styles.vars.spacing.xs }}/>      

                            {this.renderCompression()}

                            <NepiIFConfig
                                namespace={namespace}
                                title={"Nepi_IF_Config"}
                            />

                    </div>

                    <div align={"left"} textAlign={"left"} hidden={(show_navpose !== true || namespace === 'None')}>          

                                <NavPoseViewer
                                  namespace={navpose_namespace}
                                  make_section={false}
                                  title={"IDX NavPose Data"}
                                />

                    </div>

        </div>

        </Column>
        </Columns>
      

    )
  }


  render() {
    const make_section = (this.props.make_section !== undefined)? this.props.make_section : true

    if (make_section === false){
      return (
        <Columns>
        <Column>
        {this.renderImageViewer()}
        </Column>
        </Columns>
      )
    }
    else {
      return (

      <Section title={this.props.title}>

        {this.renderImageViewer()}

      </Section>
      )

    }
  }


}

ImageViewer.defaultProps = {
  imageRecognitions: [
    // {
    //   label: "foobar",
    //   roi: { x_offset: 500, y_offset: 100, width: 300, height: 400 }
    // }
  ]
}

export default ImageViewer