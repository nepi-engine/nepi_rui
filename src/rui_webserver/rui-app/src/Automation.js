/*
 * NEPI Dual-Use License
 * Project: nepi_rui
 *
 * This license applies to any user of NEPI Engine software
 *
 * Copyright (C) 2023 Numurus, LLC <https://www.numurus.com>
 * see https://github.com/numurus-nepi/nepi_rui
 *
 * This software is dual-licensed under the terms of either a NEPI software developer license
 * or a NEPI software commercial license.
 *
 * The terms of both the NEPI software developer and commercial licenses
 * can be found at: www.numurus.com/licensing-nepi-engine
 *
 * Redistributions in source code must retain this top-level comment block.
 * Plagiarizing this software to sidestep the license obligations is illegal.
 *
 * Contact Information:
 * ====================
 * - https://www.numurus.com/licensing-nepi-engine
 * - mailto:nepi@numurus.com
 *
 */
import React, { Component } from 'react';
import { observer, inject } from "mobx-react"
import { toJS } from 'mobx';
import Toggle from "react-toggle"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Input from "./Input"
import Button, { ButtonMenu } from "./Button"
import ListBox from './ListBox';
import './ListBox.css';
import './Automation.css';
import Styles from "./Styles"


// Utilities
function bytesToKBString(bytes) {
  return ((bytes/1024.0).toFixed(2) + "KB")
}

@inject("ros")
@observer
class Automation extends Component {
  constructor(props) {
    super(props);

    this.state = {
      automationSelectedScript: '',
      runningSelectedScript: ''
    };

    this.handleAutomationScriptSelect = this.handleAutomationScriptSelect.bind(this)
    //this.handleRunningScriptSelect = this.handleRunningScriptSelect.bind(this)
    this.handleStopScriptClick = this.handleStopScriptClick.bind(this)
    this.handleStartScriptClick = this.handleStartScriptClick.bind(this)
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this) 

    this.prevRunningScripts = null;
  }

  handleAutomationScriptSelect = (item) => {
    this.setState({ 
        automationSelectedScript: item, 
        runningSelectedScript: ''
    });
    this.props.ros.callGetSystemStatsQueryService(item) // get script and system status
    this.props.ros.callGetSystemStatsQueryService(item, false) // Fire off a one-shot request for faster feedback
  };

  handleStartScriptClick = () => {
    // Start the currently selected script
    const scriptToLaunch = (this.state.automationSelectedScript !== '')? this.state.automationSelectedScript : this.state.runningSelectedScript
    if (scriptToLaunch) {
      this.props.ros.startLaunchScriptService(scriptToLaunch);
      this.props.ros.callGetSystemStatsQueryService(scriptToLaunch, false) // Fire off a one-shot request for faster feedback
    }
  }

  handleStopScriptClick = () => {
    // Stop the currently selected script
    const scriptToStop = (this.state.automationSelectedScript !== '')? this.state.automationSelectedScript : this.state.runningSelectedScript
    if (scriptToStop) {
      this.props.ros.stopLaunchScriptService(scriptToStop);
      this.props.ros.callGetSystemStatsQueryService(scriptToStop, false) // Fire off a one-shot request for faster feedback
    }
  };

  handleCheckboxChange = (e) => {
    const script = (this.state.automationSelectedScript !== '')? this.state.automationSelectedScript : this.state.runningSelectedScript
    this.props.ros.onToggleAutoStartEnabled(this.state.automationSelectedScript, e.target.checked)
    this.props.ros.callGetSystemStatsQueryService(script, false) // Fire off a one-shot request for faster feedback
  }

  render() {
    const { scripts, running_scripts, systemStats} = this.props.ros;
    //const { scripts, running_scripts, systemStats} = this.props.ros;
    let filesForListBox = []
    let runningFilesForListBox = [];

    //console.log('Automation scripts:', scripts);
    filesForListBox = toJS(scripts)  
    //  console.log('Automation scripts (filesForListBox):', filesForListBox);
    //console.log('systemStats:', systemStats);
    //_systemStats = toJS(systemStats)
    //console.log('_systemStats:', _systemStats);
    //console.log('_systemStats:', _systemStats && _systemStats.cpu_percent);
    //console.log('_systemStats:', _systemStats && _systemStats.disk_usage);
    //console.log('_systemStats:', _systemStats && _systemStats.memory_usage);
    //console.log('_systemStats:', _systemStats && _systemStats.swap_info);
    //console.log('_systemStats:', _systemStats && _systemStats.file_size);
    
    runningFilesForListBox = toJS(running_scripts);
    //console.log('Running scripts (runningFilesForListBox):', runningFilesForListBox);

    const selectedScript = (this.state.automationSelectedScript !== '')? 
      this.state.automationSelectedScript : this.state.runningSelectedScript
    
    return (
      <Columns>
        <Column>
          <Section title={"Automation Scripts"}>
            <ListBox 
              id="automationScriptsListBox" 
              items={filesForListBox.scripts} 
              selectedItem={this.state.automationSelectedScript} 
              onSelect={this.handleAutomationScriptSelect} 
              style={{ color: 'black', backgroundColor: 'white' }}
            />
          </Section>
        </Column>
        <Column>
          <Section title={"Running Scripts"}>
            <ListBox 
              id="runningScriptsListBox" 
              items={runningFilesForListBox.running_scripts} 
              selectedItem={this.state.runningSelectedScript}
              onSelect={this.handleRunningScriptSelect} 
              style={{ color: 'black', backgroundColor: 'white' }} 
            />
          </Section>
        </Column>
        <Column>
          <Section title={"Control and Status"}>
            <Label title={"File name"} >
              <Input 
                disabled 
                value={selectedScript || ''} 
                style={{width: '100%'}} 
              />
            </Label>
            <Label title={"File size"} >
              <Input 
                disabled 
                value={systemStats && typeof systemStats.file_size_bytes !== 'undefined'? bytesToKBString(systemStats.file_size_bytes) : ''} 
                style={{width: '100%'}}
              />
            </Label>
            <Label title={"Log size"} >
              <Input 
                disabled 
                value={systemStats && typeof systemStats.log_size_bytes !== 'undefined'? bytesToKBString(systemStats.log_size_bytes) : ''} 
                style={{width: '100%'}}
              />
            </Label>
            <Label title={"CPU Usage"} >
              <Input 
                disabled 
                value={systemStats && typeof systemStats.cpu_percent !== 'undefined'? 
                  systemStats.cpu_percent.toFixed(1) + "%" 
                  : ''} 
                style={{width: '100%'}} 
              />
            </Label>
            <Label title={"Memory Usage"} >
              <Input 
                disabled 
                value={systemStats && typeof systemStats.memory_percent !== 'undefined'? 
                  systemStats.memory_percent.toFixed(1) + "%"
                  : ''} 
                  style={{width: '100%'}} 
                />
            </Label>
            <Label title={"Run Time"} >
              <Input 
                disabled 
                value={systemStats && typeof systemStats.run_time_s !== 'undefined'?
                  systemStats.run_time_s.toFixed(1) + "s" 
                  : ''} 
                style={{width: '100%'}} 
              />
            </Label>
            <Label title={"Cumulative Run Time"} >
              <Input 
                disabled 
                value={systemStats && typeof systemStats.cumulative_run_time_s !== 'undefined'?
                  systemStats.cumulative_run_time_s.toFixed(1) + "s" 
                  : ''} 
                style={{width: '100%'}} 
              />
            </Label>
            <Label title={"Started Count"} >
              <Input 
                disabled 
                value={systemStats && typeof systemStats.started_runs !== 'undefined'? 
                  systemStats.started_runs
                  : ''}
                style={{width: '100%'}} 
              />
            </Label>
            <Label title={"Completion Count"} >
              <Input 
                disabled 
                value={systemStats && typeof systemStats.completed_runs !== 'undefined'? 
                  systemStats.completed_runs
                  : ''}
                style={{width: '100%'}} 
              />
            </Label>
            <Label title={"Error Count"} >
              <Input 
                disabled 
                value={systemStats && typeof systemStats.error_runs !== 'undefined'? 
                  systemStats.error_runs
                  : ''}
                style={{width: '100%'}} 
              />
            </Label>            
            <Label title={"Stop Count"} >
              <Input 
                disabled 
                value={systemStats && typeof systemStats.stopped_manually !== 'undefined'?
                  systemStats.stopped_manually
                  : ''} 
                style={{width: '100%'}} 
              />
            </Label>
            {(selectedScript !== '')?
              <ButtonMenu>
                <Label title={"Auto Start"} marginTop={Styles.vars.spacing.medium}>
                <Toggle
                  checked={systemStats && typeof systemStats.auto_start_enabled !== 'undefined'?
                    systemStats.auto_start_enabled
                    : false}
                  onChange={this.handleCheckboxChange}
                  //onChange={onToggleAutoStartEnabled}
                />
                </Label>
                <Button disabled={selectedScript === ''} onClick={this.handleStartScriptClick}>{"Start"}</Button>
                <Button disabled={selectedScript === ''} onClick={this.handleStopScriptClick}>{"Stop"}</Button>
              </ButtonMenu>
              : null
            }
          </Section>
        </Column>
      </Columns>
    )
  }
};

export default Automation;
