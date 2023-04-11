import React, { Component } from 'react';
import { observer, inject } from "mobx-react"
import { toJS } from 'mobx';
import ListBox from './ListBox';
import './ListBox.css';
import './Automation.css';

@inject("ros")
@observer
class Automation extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedScript: '',
      input1: '',
      input2: '',
      input3: '',
      toggleEnabled: true,
    };

    this.handleScriptSelect = this.handleScriptSelect.bind(this)

    this.prevRunningScripts = null;

      //this.startPollingSetScriptEnabledService() // set scripts enabled to be true or false
    //this.startPollingLaunchScriptService() // invoke script execution
    //stores.startPollingStopScriptService() // stop script execution
    //stores.startPollingGetScriptStatusQueryService() // get status of script
    //stores.startPollingGetSystemStatsQueryService() // get script and system status
  }

  handleScriptSelect = (item) => {
    //alert(`You have selected ${item}`);
    this.setState({ selectedScript: item });

    this.props.ros.startLaunchScriptService(item);
    this.props.ros.startPollingGetSystemStatsQueryService(item) // get script and system status
  };


  // Add handleStopScriptClick method
  handleStopScriptClick = () => {
    // Stop the currently selected script
    if (this.state.selectedScript) {
      this.props.ros.stopLaunchScriptService(this.state.selectedScript);
    }
  };

  
  render() {

    const { scripts, running_scripts, selectedScript, systemStats} = this.props.ros;
    let filesForListBox = [];
    let activeFilesForListBox = [];
    let _systemStats = [];

    //console.log('Automation scripts:', scripts);
    filesForListBox = toJS(scripts)  
  //  console.log('Automation scripts (filesForListBox):', filesForListBox);
    console.log('systemStats:', systemStats);
    _systemStats = toJS(systemStats)
    console.log('_systemStats:', _systemStats);
    console.log('_systemStats:', _systemStats && _systemStats.cpu_percent);
    console.log('_systemStats:', _systemStats && _systemStats.disk_usage);
    console.log('_systemStats:', _systemStats && _systemStats.memory_usage);
    console.log('_systemStats:', _systemStats && _systemStats.swap_info);
    console.log('_systemStats:', _systemStats && _systemStats.file_size);
    
    activeFilesForListBox = toJS(running_scripts);
    console.log('Running scripts (activeFilesForListBox):', activeFilesForListBox);

    return (
        <div className="Automation">
          <h1>Automation</h1>
          <div className="automation-container">
            <div className="listboxes-container">
              <div className="listbox-wrapper">
                <label htmlFor="automationScriptsListBox" className="listbox-label">AUTOMATION Scripts</label>
                <ListBox id="automationScriptsListBox" items={filesForListBox.scripts} selectedItem={selectedScript} onSelect={this.handleScriptSelect} style={{ color: 'black', backgroundColor: 'white' }} />
              </div>
              <div className="listbox-wrapper">
                <label htmlFor="activeScriptsListBox" className="listbox-label">ACTIVE Scripts</label>
                <ListBox id="activeScriptsListBox" items={activeFilesForListBox.running_scripts} readOnly style={{ color: 'black', backgroundColor: 'white' }} />
              </div>
            </div>
            <div className="inputs-container">
            <div className="readonly-input">
              <label htmlFor="scriptName">Script Name:</label>
              <input type="text" id="scriptName" value={this.state.selectedScript || ''} readOnly style={{ color: 'black', backgroundColor: 'white' }} />
            </div>
            <div className="readonly-input">
              <label htmlFor="fileSize">File Size:</label>
              <input type="text" id="fileSize" value={_systemStats && typeof _systemStats.file_size !== 'undefined' ? JSON.stringify(_systemStats.file_size) : ''} readOnly style={{ color: 'black', backgroundColor: 'white' }} />
            </div>
            <div className="readonly-input">
          <label htmlFor="cpuPercent">CPU Percent:</label>
          <input
            type="text"
            id="cpuPercent"
            value={_systemStats && typeof _systemStats.cpu_percent !== 'undefined' ? JSON.stringify(_systemStats.cpu_percent) : ''}
            readOnly
            style={{ color: 'black', backgroundColor: 'white' }}
          />
        </div>
        <div className="readonly-input">
          <label htmlFor="memoryUsage">Memory Usage:</label>
          <input
            type="text"
            id="memoryUsage"
            value={_systemStats && typeof _systemStats.memory_usage !== 'undefined' ? JSON.stringify(_systemStats.memory_usage) : ''}
            readOnly
            style={{ color: 'black', backgroundColor: 'white' }}
          />
        </div>
        <div className="readonly-input">
          <label htmlFor="swapInfo">Swap Info:</label>
          <input
            type="text"
            id="swapInfo"
            value={_systemStats && typeof _systemStats.swap_info !== 'undefined' ? JSON.stringify(_systemStats.swap_info) : ''}
            readOnly
            style={{ color: 'black', backgroundColor: 'white' }}
          />
        </div>
        <div className="readonly-input">
          <label htmlFor="diskUsage">Disk Usage:</label>
          <input
            type="text"
            id="diskUsage"
            value={_systemStats && typeof _systemStats.disk_usage !== 'undefined' ? JSON.stringify(_systemStats.disk_usage) : ''}
            readOnly
            style={{ color: 'black', backgroundColor: 'white' }}
          />
        </div>
            <div className="readonly-input">
              <label htmlFor="runToCompletion">Run to Completion:</label>
              <input type="text" id="runToCompletion" value={_systemStats && typeof _systemStats.completed_runs !== 'undefined' ? JSON.stringify(_systemStats.completed_runs) : ''} readOnly style={{ color: 'black', backgroundColor: 'white' }} />            
            </div>
            <div className="readonly-input">
              <label htmlFor="manualStops">Manual Stops:</label>
              <input type="text" id="manualStops" value={_systemStats && typeof _systemStats.stopped_manually !== 'undefined' ? JSON.stringify(_systemStats.stopped_manually) : ''} readOnly style={{ color: 'black', backgroundColor: 'white' }} />
            </div>
            <div className="button-container">
            <label htmlFor="stopScriptButton">Stop Script:</label>
            <button id="stopScriptButton" onClick={this.handleStopScriptClick}>
              Stop
            </button>
          </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Automation;
