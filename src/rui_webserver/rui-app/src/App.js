import React, { Component } from "react"
import { Route, Switch, withRouter } from "react-router-dom"
import { observer, inject } from "mobx-react"

import Page from "./Page"
import Nav from "./Nav"
import HorizontalDivider from "./HorizontalDivider"
import PageLock from "./PageLock"

import Dashboard from "./Dashboard"
import CameraApp from "./CameraApp"
import NDSensor from "./NDSensor"
import Files from "./Files"
import Settings from "./Settings"

const IS_DEBUG = window.location.hostname === "localhost"

@inject("ros")
@withRouter
@observer
class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      pageLocked: !IS_DEBUG
    }

    this.onUnlockPage = this.onUnlockPage.bind(this)
  }

  componentDidMount() {
    this.props.ros.checkROSConnection()
  }

  onUnlockPage(e) {
    this.setState({ pageLocked: false })
  }

  render() {
    const { pageLocked } = this.state
    return (
      <Page>
        <Nav
          pageLocked={pageLocked}
          pages={[
            { path: "/", label: "Dashboard" },
            {
              path: "/applications",
              label: "Applications",
              subItems: [
                { path: "/camera", label: "Camera" },
                { path: "/ndsensor", label: "ND Sensor" }
              ]
            },
            { path: "/files", label: "Files" },
            { path: "/settings", label: "Settings" }
          ]}
        />
        <HorizontalDivider />
        {pageLocked && <PageLock onUnlockPage={this.onUnlockPage} />}
        {!pageLocked && (
          <Switch>
            <Route exact path="/" component={Dashboard} />
            <Route path="/camera" component={CameraApp} />
            <Route path="/ndsensor" component={NDSensor} />
            <Route
              path="/files/:path*"
              component={props => <Files {...props} />}
            />
            <Route path="/settings" component={Settings} />
          </Switch>
        )}
      </Page>
    )
  }
}

export default App
