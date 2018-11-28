import React, { Component } from "react"
import moment from "moment"
import { observer } from "mobx-react"

import Section from "./Section"
import Button, { ButtonMenu } from "./Button"

import Styles from "./Styles"

const styles = Styles.Create({
  canvas: {
    width: "100%",
    height: "auto",
    transform: "scale(1)"
  }
})

const ROS_WEBCAM_URL =
  "http://localhost:9091/stream?topic=/v4l/camera/image_raw"

class CameraViewer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      hasInitialized: false,
      shouldUpdate: true,
      clockTime: moment(),
      streamWidth: null,
      streamHeight: null,
      containerWidth: null,
      containerHeight: null
    }

    this.updateFrame = this.updateFrame.bind(this)
    this.onCanvasRef = this.onCanvasRef.bind(this)
    this.onTakeSnapshot = this.onTakeSnapshot.bind(this)
  }

  updateFrame() {
    const {
      shouldUpdate,
      hasInitialized,
      streamWidth,
      streamHeight,
      containerWidth,
      containerHeight
    } = this.state
    const { imageRecognitions } = this.props.store.ros
    if (shouldUpdate && hasInitialized) {
      if (!containerWidth) {
        this.setState({
          containerWidth: this.canvas.width
        })
        this.canvas.width = streamWidth
      }

      if (!containerHeight) {
        this.setState({
          containerHeight: this.canvas.height
        })
        this.canvas.height = streamHeight
      }

      const context = this.canvas.getContext("2d")
      context.fillStyle = "red"
      context.textAlign = "center"
      context.font = "50px Arial"
      context.clearRect(0, 0, streamWidth, streamHeight)
      context.drawImage(this.image, 0, 0, streamWidth, streamHeight)

      imageRecognitions.forEach(
        ({ label, roi: { x_offset, y_offset, width, height } }) => {
          // debugger
          context.beginPath()
          context.lineWidth = "10"
          context.strokeStyle = "red"
          context.rect(x_offset, y_offset, width, height)
          context.stroke()
          context.fillText(
            label,
            x_offset + width / 2,
            y_offset + 70,
            width - 30
          )
        }
      )

      this.setState({
        clockTime: moment()
      })
      setTimeout(() => {
        this.updateFrame()
      }, 0)
    }
  }

  onCanvasRef(ref) {
    this.canvas = ref
    this.image = new Image()
    this.image.crossOrigin = "Anonymous"
    this.image.onload = () => {
      const { hasInitialized } = this.state
      if (!hasInitialized) {
        const { width, height } = this.image
        this.setState(
          {
            hasInitialized: true,
            streamWidth: width,
            streamHeight: height
          },
          () => {
            this.updateFrame()
          }
        )
      }
    }
    this.image.src = ROS_WEBCAM_URL
  }

  componentWillUnmount() {
    this.setState({ shouldUpdate: false })
  }

  onTakeSnapshot() {
    const { clockTime } = this.state
    const link = window.document.createElement("a")
    const dt = this.canvas.toDataURL("image/png")
    window.location.href = dt
    link.href = dt
    link.setAttribute("download", `frame-${clockTime.format()}.png`)
    link.click()
  }

  render() {
    return (
      <Section title={"Camera Preview"}>
        <canvas style={styles.canvas} ref={this.onCanvasRef} />
        <ButtonMenu>
          <Button onClick={this.onTakeSnapshot}>{"Take Snapshot"}</Button>
        </ButtonMenu>
      </Section>
    )
  }
}

CameraViewer.defaultProps = {
  imageRecognitions: [
    // {
    //   label: "foobar",
    //   roi: { x_offset: 500, y_offset: 100, width: 300, height: 400 }
    // }
  ]
}

export default observer(CameraViewer)
