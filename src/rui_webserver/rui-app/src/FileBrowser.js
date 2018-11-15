import React, { Component } from "react"
import { Route, Switch, Link } from "react-router-dom"
import filesize from "filesize"

const FLASK_URL = "http://localhost:5003"

const REFRESH_INTERVAL = 3000

class FileBrowser extends Component {
  constructor(props) {
    super(props)
    this.state = {
      currPath: this.getDefaultPath(),
      files: []
    }

    this.pollData = this.pollData.bind(this)
    this.fetchOnce = this.fetchOnce.bind(this)
    this.changePath = this.changePath.bind(this)
    this.getDefaultPath = this.getDefaultPath.bind(this)
    this.makeReqURLForPath = this.makeReqURLForPath.bind(this)
    this.onClickItem = this.onClickItem.bind(this)
  }

  componentWillMount() {
    this.fetchOnce()
    this._polling = true
    this.pollData()
  }

  componentWillUnmount() {
    this._polling = false
  }

  getDefaultPath() {
    const params = this.props.match && this.props.match.params
    return (params && params.path) || ""
  }

  makeReqURLForPath(path) {
    return `${FLASK_URL}/files/${path || ""}`
  }

  changePath(path) {
    this.setState({ currPath: path }, this.fetchOnce)
  }

  fetchOnce(cb) {
    const { currPath } = this.state
    const reqURL = this.makeReqURLForPath(currPath)
    fetch(reqURL)
      .then(r => r.json())
      .then(files => {
        this.setState({ files })
        cb && cb()
      })
  }

  pollData() {
    this.fetchOnce(() => {
      if (this._polling) {
        setTimeout(this.pollData, REFRESH_INTERVAL)
      }
    })
  }

  onClickItem(f) {
    if (f.isFile) {
      const reqURL = this.makeReqURLForPath(f.path)
      window.location.href = reqURL
    } else {
      this.changePath(f.path)
    }
  }

  render() {
    const path = this.getDefaultPath()
    const splitPath = path.split("/")
    const isRoot = !path
    const { files } = this.state
    return (
      <div>
        {!isRoot && <Link to="/files">Files</Link>}
        {!isRoot &&
          splitPath.map((part, i) => {
            if (!part) {
              return null
            }
            const partPath = splitPath.slice(0, i + 1).join("/")
            const innerComponent =
              i === splitPath.length - 1 ? (
                part
              ) : (
                <Link
                  to={`/files/${partPath}`}
                  onClick={() => this.changePath(partPath)}
                >
                  {part}
                </Link>
              )
            return (
              <div key={part} style={{ display: "inline-block" }}>
                <div style={{ display: "inline-block", margin: "5px" }}>/</div>
                {innerComponent}
              </div>
            )
          })}

        <ul>
          {files.map(f => {
            return (
              <li key={f.name}>
                <Link
                  to={!f.isFile && `/files/${f.path}`}
                  onClick={() => this.onClickItem(f)}
                >
                  {f.name}
                </Link>
                {f.isFile && ` - ${filesize(f.size)}`}
                {!f.isFile && ` - ${f.numItems} items`}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }
}

export default FileBrowser
