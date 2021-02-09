import React, { Component } from "react"
import { observer, inject } from "mobx-react"
import Toggle from "react-toggle"
import Input from "./Input"
import Section from "./Section"
import { Columns, Column } from "./Columns"
import Label from "./Label"
import Button, { ButtonMenu } from "./Button"
import Select, { Option } from "./Select"
import Styles from "./Styles"
var qr = require("qrcode")

const list =["topic", "bopic", "nopic"]

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
      enabled: false,
      LBenabled: false,
      items: ["test", "best", "nest"],
      topics: [],
      LBQueueMaxSize: 30,
      ROSLinkRate: 30,
      viewableTopics: false,
      viewableOrder: false,
    }
    list.forEach(topic => {
      this.state.topics.push({
        id: topic,
        on: false
      });
    })
    this.onToggleCOMMS = this.onToggleCOMMS.bind(this)
    this.renderNEPI = this.renderNEPI.bind(this)
    this.renderConnectionInformation = this.renderConnectionInformation.bind(this)
    this.renderConnectionSettings = this.renderConnectionSettings.bind(this)
    this.onToggleAutoConnect = this.onToggleAutoConnect.bind(this)
    this.onToggleHB = this.onToggleHB.bind(this)
    this.onToggleAutoOff = this.onToggleAutoOff.bind(this)
    this.onToggleLB = this.onToggleLB.bind(this)
    this.onToggleTopic = this.onToggleTopic.bind(this)
    this.renderLBLinkSettings = this.renderLBLinkSettings.bind(this)
    this.renderQR = this.renderQR.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.ROSLinkRateUp = this.ROSLinkRateUp.bind(this)
    this.LBQueueMaxSizeUp = this.LBQueueMaxSizeUp.bind(this)
    this.logToggle = this.logToggle.bind(this)
    this.toggleViewableTopics = this.toggleViewableTopics.bind(this)
    this.toggleViewableOrder = this.toggleViewableOrder.bind(this)
  }

  onToggleCOMMS() {
    const { enabled } = this.state
    this.setState({enabled: !enabled})
    this.renderQR()
  }

  onToggleAutoConnect() {

  }

  onToggleHB() {

  }

  onToggleAutoOff() {

  }

  onToggleLB() {
    const { LBenabled } = this.state
    this.setState({LBenabled: !LBenabled})
  }

  onToggleTopic(index) {
    const { topics } = this.state
    var upTopics = topics
    upTopics[index] = {id: topics[index].id, on: !topics[index].on}
    this.setState({topics: upTopics})
    console.log(topics) 
  }

  logToggle() {

  }

  ROSLinkRateUp() {

  }

  LBQueueMaxSizeUp() {

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

  toggleViewableTopics() {
    const set = !this.state.viewableTopics
    this.setState({viewableTopics: set})
  }
  toggleViewableOrder() {
    const set = !this.state.viewableOrder
    this.setState({viewableOrder: set})
  }

  renderNEPI() {
    //const { NUID, DeviceAlias } = this.props.ros
    return(
      <Section title={"NEPI"}>
        <Label title="NEPI UID">
          <Input
            disabled value= {"100000001"}
          />
        </Label>
        <Label title="NEPI Device Alias">
          <Input
            disabled value= {"3DX1"}
          />
        </Label>
        <Label title="Save Logs">
          <Toggle
            onClick= {this.logToggle}
          />
        </Label>
        <Label title="">
          <canvas id="qrcode"></canvas>
        </Label>
      </Section>
    )
  }

  renderQR() {
    qr.toCanvas(document.getElementById("qrcode"), "test")
  }

  renderConnectionInformation() {
    return(
      <Section title={"Connection Information"}>
        <Label title="Last Lb Link Connection (Y:Mo:D:H:M:S)">
          <Input
            disabled value= {"2021:1:5:10:04:56"}
          />
        </Label>
        <Label title="Device Originated Messages" marginLeft="15px">
          <Input
            disabled value= {"234,567"}
          />
        </Label>
        <Label title="Device Terminated Messages" marginLeft="15px">
          <Input
            disabled value= {"300"}
          />
        </Label>
        <Label title="Last HB Link Connection (D:H:M)">
          <Input
            disabled value= {"5:10:04"}
          />
        </Label>
        <Label title="Device Originated Messages" marginLeft="15px">
          <Input
            disabled value= {"4,567"}
          />
        </Label>
        <Label title="Device Terminated Messages" marginLeft="15px">
          <Input
            disabled value= {"300"}
          />
        </Label>
        <Label title="Data to Transmit (MB)" marginLeft="15px">
          <Input
            disabled value= {"300"}
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
    const { LBenabled } = this.state
    return(
      <Section title={"Connection Settings"}>
        <ButtonMenu>
          <Button>{"Connect Now"}</Button>
        </ButtonMenu>
        <Label title="Auto Rate (Attempts Per Hour)">
          <Input
            placeholder= {"5"}
          />
        </Label>
        <Label title="Enable HB Link">
          <Toggle
            onClick={this.onToggleHB}>
          </Toggle>
        </Label>
        <Label title="Enable HB Auto Data Offloading">
          <Toggle
            onClick={this.onToggleAutoOff}>
          </Toggle>
        </Label>
        <Label title="Enable LB Link">
          <Toggle
            checked={LBenabled}
            onClick={this.onToggleLB}>
          </Toggle>
        </Label>
      </Section>
    )
  }

  renderLBLinkSettings() {
    const { topics, items, LBQueueMaxSize, ROSLinkRate, viewableTopics, viewableOrder } = this.state
      return (
        <Section title={"LB Link Settings"}>
          <Label title="ROS Topic Link Rate (Per Hour)">
            <Input
              value={ROSLinkRate}
              onChange={this.ROSLinkRateUp}
            />
          </Label>
          <Label title="Unprocessed Data (KB)">
            <Input
              value={LBQueueMaxSize}
              onChange={this.LBQueueMaxSizeUp}
              disabled="true"
            />
          </Label>
          <Label title="Comms Attempt Order">
            {/* <div>
              <DragList list={items} width="225px" callback={this.onDragEnd}>
              </DragList>
            </div> */}
            <div onClick={this.toggleViewableOrder} style={{backgroundColor: Styles.vars.colors.grey0, display:"flex"}}>
              <Select style={{flex: 1, backgroundColor: Styles.vars.colors.orange}}></Select>
            </div>
            <div hidden={!viewableOrder}>
            {items.map((item, index) => 
            <div 
              style={{
                textAlign: "center",
                padding: `${Styles.vars.spacing.xs}`,
                color: Styles.vars.colors.black,
                backgroundColor: Styles.vars.colors.green,
                cursor: "pointer",
                }}>
                <body style={{color: Styles.vars.colors.black}}>{item}</body>
            </div>
            )}
            </div>
          </Label>
          <Label title="Set Ros Topics to Link">
            <div onClick={this.toggleViewableTopics} style={{backgroundColor: Styles.vars.colors.grey0, display:"flex"}}>
              <Select style={{flex: 1}}></Select>
            </div>
            <div hidden={!viewableTopics}>
            {topics.map((topic, index) => 
            <div onClick={this.onToggleTopic.bind(this, index, topic.id, topic.on)} 
              style={{
                textAlign: "center",
                padding: `${Styles.vars.spacing.xs}`,
                color: Styles.vars.colors.black,
                backgroundColor: topic.on? Styles.vars.colors.blue : Styles.vars.colors.grey0,
                cursor: "pointer",
                }}>
                <body style={{color: Styles.vars.colors.black}}>{topic.id}</body>
            </div>
            )}
            </div>
            
          </Label>
        </Section>
      )
  }

  render() {
    const { enabled, LBenabled } = this.state
    return (
      <Columns>
        <Column>
          <Label title={"Enable/Disable NEPI-COMMS"}>
            <Toggle
              onClick={this.onToggleCOMMS}>
            </Toggle>
          </Label>
            <div hidden={!enabled}>
            {this.renderNEPI()}
            {this.renderConnectionInformation()}
            </div>
        </Column>
        <Column>
          <div hidden={!enabled}>
          {this.renderConnectionSettings()}
          </div>
          <div hidden={!LBenabled || !enabled}>
          {this.renderLBLinkSettings()}
          </div>
        </Column>
      </Columns>
    )
  }
}
export default NEPI
