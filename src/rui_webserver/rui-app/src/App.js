import React, { Component } from "react"
import { Route, Switch, withRouter } from "react-router-dom"
import { observer, inject } from "mobx-react"

import Page from "./Page"
import Nav from "./Nav"
import HorizontalDivider from "./HorizontalDivider"
import PageLock from "./PageLock"

import Dashboard from "./Dashboard"
import CameraApp from "./CameraApp"
import Sensor3DX from "./Sensor3DX"
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
                { path: "/detection", label: "Detection" },
                { path: "/sensor3DX", label: "3DX" }
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
            <Route path="/detection" component={CameraApp} />
            <Route path="/sensor3DX" component={Sensor3DX} />
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
