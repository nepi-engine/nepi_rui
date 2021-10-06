import React, { Component } from "react"
import { observer, inject } from "mobx-react"
import Toggle from "react-toggle"
import Input from "./Input"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Button, { ButtonMenu } from "./Button"
import BooleanIndicator from "./BooleanIndicator"
import Select from "./Select"
import Styles from "./Styles"
var qr = require("qrcode")

// const reorder = (list, startIndex, endIndex) => {
//   const result = Array.from(list);
//   const [removed] = result.splice(startIndex, 1);
//   result.splice(endIndex, 0, removed);

//   return result;
// };

@inject("ros")
@observer
class NEPI extends Component {
  constructor(props) {
    super(props)

    this.state = {
      viewableTopics: false,
      viewableOrder: false,
      autoRate: this.props.ros.auto_attempts_per_hour,
      dataSetsPerHour: this.props.ros.lb_data_sets_per_hour,
    }
    this.renderNEPI = this.renderNEPI.bind(this)
    this.renderLBInformation = this.renderLBInformation.bind(this)
    this.renderHBInformation = this.renderHBInformation.bind(this)
    this.renderConnectionSettings = this.renderConnectionSettings.bind(this)
    this.renderLBLinkSettings = this.renderLBLinkSettings.bind(this)
    this.renderQR = this.renderQR.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.toggleViewableTopics = this.toggleViewableTopics.bind(this)
    this.toggleViewableOrder = this.toggleViewableOrder.bind(this)
    this.onUpdateText = this.onUpdateText.bind(this)
    this.onKeyText = this.onKeyText.bind(this)
  }
  onDragEnd(result) {
    // // commented out to prevent movement of comms order list.
    // if (!result.destination) {
    //   return;
    // }

    // const items = reorder(
    //   this.state.items,
    //   result.source.index,
    //   result.destination.index
    // );

    // this.setState({
    //   items
    // });
  }

  onUpdateText(e) {
    var stateObject = function() {
      const returnObj = {};
      returnObj[this.target.id] = this.target.value;
      return returnObj;
    }.bind(e)();
    this.setState( stateObject );
    document.getElementById(e.target.id).style.color = Styles.vars.colors.red
  }

  onKeyText(e) {
    const {onChangeNEPI} = this.props.ros
    if(e.key === 'Enter'){
      onChangeNEPI(e.target.dataset.topic, e.target.value)
      document.getElementById(e.target.id).style.color = Styles.vars.colors.black
    }
  }

  toggleViewableTopics() {
    const set = !this.state.viewableTopics
    this.setState({viewableTopics: set})
  }
  toggleViewableOrder() {
    const set = !this.state.viewableOrder
    this.setState({viewableOrder: set})
  }

  renderNEPI() {
    const { NUID, alias, log_storage_enabled, onToggleLogStorage } = this.props.ros
    return(
      <Section title={"NEPI"}>
        <Label title="NEPI UID">
          <Input
            disabled value= {NUID}
          />
        </Label>
        <Label title="NEPI Device Alias">
          <Input
            disabled value= {alias}
          />
        </Label>
        <Label title="Save Logs">
          <Toggle
            checked={log_storage_enabled}
            onClick= {onToggleLogStorage}
          />
        </Label>
        <Label title="">
          <canvas id="qrcode"></canvas>
        </Label>
      </Section>
    )
  }

  renderQR() {
    const { NUID } = this.props.ros
    qr.toCanvas(document.getElementById("qrcode"), NUID)
  }

  renderLBInformation() {
    const { lb_last_connection_time, lb_do_msg_count, lb_dt_msg_count } = this.props.ros
    if((lb_last_connection_time !== null) && (lb_last_connection_time.unix() !== 0)) {
      var last = lb_last_connection_time.format("l h:mm:ss a")
    } else {
      last = "---"
    }
    return(
      <Section title={"LB Information"}>
        <Label title="Last Lb Link Connection">
          <Input
            disabled value= {last}
          />
        </Label>
        <Label title="Device Originated Messages">
          <Input
            disabled value= {lb_do_msg_count}
          />
        </Label>
        <Label title="Device Terminated Messages">
          <Input
            disabled value= {lb_dt_msg_count}
          />
        </Label>
        <ButtonMenu hidden={true}>
          <Button>{"Open Last LB Log"}</Button>
          <Button>{"Open Last HB Log"}</Button>
        </ButtonMenu>
      </Section>
    )
  }

  renderHBInformation() {
    const { hb_last_connection_time, hb_do_transfered_mb, hb_dt_transfered_mb, hb_data_queue_size_mb } = this.props.ros
    if ((hb_last_connection_time !== null) && (hb_last_connection_time.unix() !== 0)) {
      var last = hb_last_connection_time.format("l h:mm:ss a")
    } else {
      last = "---"
    }
    return(
      <Section title={"HB Information"}>
        <Label title="Last Link Connection">
          <Input
            disabled value= {last}
          />
        </Label>
        <Label title="Device Originated Data (MB)">
          <Input
            disabled value= {hb_do_transfered_mb != null ? hb_do_transfered_mb.toFixed(2) : "0.00"}
          />
        </Label>
        <Label title="Device Terminated Data (MB)">
          <Input
            disabled value= {hb_dt_transfered_mb != null ? hb_dt_transfered_mb.toFixed(2) : "0.00"}
          />
        </Label>
        <Label title="Data to Transmit (MB)">
          <Input
            disabled value= {hb_data_queue_size_mb != null ? hb_data_queue_size_mb.toFixed(2) : "0.00"}
          />
        </Label>
        <ButtonMenu hidden={true}>
          <Button>{"Open Last LB Log"}</Button>
          <Button>{"Open Last HB Log"}</Button>
        </ButtonMenu>
      </Section>
    )
  }

  renderConnectionSettings() {
    const { bot_running, lb_enabled, hb_enabled, hb_auto_data_offloading_enabled, onNEPIConnectNow, onToggleHB, onToggleAutoOffloading, onToggleLB } = this.props.ros
    return(
      <Section title={"Connection Settings"}>
        <Label title={"Connection in Progress"}>
          <BooleanIndicator value={bot_running} />
        </Label>
        <ButtonMenu>
          <Button onClick={onNEPIConnectNow}>{"Connect Now"}</Button>
        </ButtonMenu>
        <Label title="Auto Rate (Attempts Per Hour)">
          <Input
            id="autoRate"
            data-topic="nepi_edge_ros_bridge/set_auto_attempts_per_hour"
            value= {this.state.autoRate}
            onChange= {this.onUpdateText}
            onKeyDown= {this.onKeyText}
          />
        </Label>
        <Label title="Enable HB Link">
          <Toggle
            checked={hb_enabled}
            onClick={onToggleHB}>
          </Toggle>
        </Label>
        <Label title="Enable HB Auto Data Offloading">
          <Toggle
            checked={hb_auto_data_offloading_enabled}
            onClick={onToggleAutoOffloading}>
          </Toggle>
        </Label>
        <Label title="Enable LB Link">
          <Toggle
            checked={lb_enabled}
            onClick={onToggleLB}>
          </Toggle>
        </Label>
      </Section>
    )
  }

  renderLBLinkSettings() {
    const { lb_selected_data_sources, lb_available_data_sources, lb_comms_types, lb_data_queue_size_kb, onNEPIDataSetNow, onToggleTopic } = this.props.ros
    const { viewableTopics, viewableOrder } = this.state
    var sources = []
    var selected_sources = []
    var i;

    if (lb_available_data_sources != null) {
      for(i = 0; i < lb_available_data_sources.length; i++) {
        var split = lb_available_data_sources[i].split("/")
        if(split.length !== 1) {
          sources[i] = {
            long:lb_available_data_sources[i],
            short:split[split.length - 2] + "/" + split[split.length - 1]
          }
        } else {
          sources[i] = {
            long:lb_available_data_sources[i],
            short:split[split.length - 1]
          }
        }
      }
    }

    if (lb_selected_data_sources != null) {
      for(i = 0; i < lb_selected_data_sources.length; i++) {
        split = lb_selected_data_sources[i].split("/")
        if(split.length !== 1) {
          selected_sources[i] = split[split.length - 2] + "/" + split[split.length - 1]
        } else {
          selected_sources[i] = split[split.length - 1]
        }
      }
    }
      return (
        <Section title={"LB Link Settings"}>
          <ButtonMenu>
            <Button onClick={onNEPIDataSetNow}>{"Data Set Now"}</Button>
          </ButtonMenu>
          <Label title="Data Sets per Hour">
            <Input
              value={this.state.dataSetsPerHour !== null ? this.state.dataSetsPerHour : "0"}
              id="dataSetsPerHour"
              data-topic="nepi_edge_ros_bridge/lb/set_data_sets_per_hour"
              onChange= {this.onUpdateText}
              onKeyDown= {this.onKeyText}
            />
          </Label>
          <Label title="Unprocessed Data (KB)">
            <Input
              value={lb_data_queue_size_kb !== null ? lb_data_queue_size_kb.toFixed(2) : "0.00"}
              onChange={this.LBQueueMaxSizeUp}
              disabled="true"
            />
          </Label>
          <Label title="Comms Attempt Order">
            {/* <div>
              <DragList list={items} width="225px" callback={this.onDragEnd}>
              </DragList>
            </div> */}
            <div onClick={this.toggleViewableOrder} style={{backgroundColor: Styles.vars.colors.orange}}>
              <Select style={{backgroundColor: Styles.vars.colors.orange, width: "10px"}}></Select>
            </div>
            <div hidden={!viewableOrder}>
            {lb_comms_types !== null ? lb_comms_types.map((item, index) =>
            <div
              style={{
                textAlign: "center",
                padding: `${Styles.vars.spacing.xs}`,
                color: Styles.vars.colors.black,
                backgroundColor: Styles.vars.colors.orange,
                cursor: "pointer",
                }}>
                <body style={{color: Styles.vars.colors.black}}>{item}</body>
            </div>
            ) : <div></div>}
            </div>
          </Label>
          <Label title="Set Ros Topics to Link">
            <div onClick={this.toggleViewableTopics} style={{backgroundColor: Styles.vars.colors.grey0}}>
              <Select style={{width: "10px"}}></Select>
            </div>
            <div hidden={!viewableTopics}>
            {sources.map((topic) =>
            <div onClick={onToggleTopic}
              style={{
                textAlign: "center",
                padding: `${Styles.vars.spacing.xs}`,
                color: Styles.vars.colors.black,
                backgroundColor: selected_sources.includes(topic.short)? Styles.vars.colors.blue : Styles.vars.colors.grey0,
                cursor: "pointer",
                }}>
                <body data-topic={topic.long} style={{color: Styles.vars.colors.black}}>{topic.short}</body>
            </div>
            )}
            </div>

          </Label>
        </Section>
      )
  }

  render() {
    const { NEPIenabled, onToggleNEPIComms, lb_enabled } = this.props.ros
    return (
      <div>
        <Label title={"Enable/Disable NEPI-COMMS"}>
          <Toggle
            checked={NEPIenabled}
            onClick={onToggleNEPIComms}>
          </Toggle>
        </Label>
        <Columns>
          <Column>
              <div hidden={!NEPIenabled}>
              {this.renderNEPI()}
              {this.renderConnectionSettings()}
              </div>
          </Column>
          <Column>
            <div hidden={!NEPIenabled}>
            {this.renderLBInformation()}
            {this.renderHBInformation()}
            </div>
            <div hidden={!lb_enabled || !NEPIenabled}>
            {this.renderLBLinkSettings()}
            </div>
          </Column>
        </Columns>
      </div>
    )
  }
  componentDidMount() {
    this.renderQR();
  }
}
export default NEPI
