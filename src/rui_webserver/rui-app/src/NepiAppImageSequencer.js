/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */
import React, { Component } from 'react'
import { observer, inject } from "mobx-react"
import Toggle from "react-toggle"

import Section from "./Section"
import { Columns, Column } from "./Columns"
import CameraViewer from "./CameraViewer"
import ListBox, {IndexedListBox} from './ListBox'
import './ListBox.css'
import Label from './Label'
import Input from './Input'
import Button, { ButtonMenu } from "./Button"
import Select, { Option } from "./Select" 
import Styles from "./Styles"

import createShortUniqueValues from "./Utilities"

@inject("ros")
@observer
class NepiAppImageSequencer extends Component {
  constructor(props) {
    super(props)
    
    this.state = {
      selectedSequenceObj: null,
      selectedSequenceModified: false,
      addingNewSequence: false,
      newSequenceCount: 0,
      selectedSeqInputImageLabels: [],
      selectedInputImageIndex: null,
      advancedImgStepConfigEnabled: false
    }

    this.onToggleEnabled = this.onToggleEnabled.bind(this)
    this.onChangeTextField = this.onChangeTextField.bind(this)
    this.handleSequenceSelect = this.handleSequenceSelect.bind(this)
    this.handleInputImageSelect = this.handleInputImageSelect.bind(this)
    this.onNewSequenceButtonPressed = this.onNewSequenceButtonPressed.bind(this)
    this.onDeleteSequenceButtonPressed = this.onDeleteSequenceButtonPressed.bind(this)
    this.onApplyChangesButtonPressed = this.onApplyChangesButtonPressed.bind(this)
    this.onDeleteInputImgButtonPressed = this.onDeleteInputImgButtonPressed.bind(this)
    this.onAddInputImgSelection = this.onAddInputImgSelection.bind(this)
    this.onToggleAdvancedImgStepConfigEnabled = this.onToggleAdvancedImgStepConfigEnabled.bind(this)
    this.renderImageSettings = this.renderImageSettings.bind(this)
    this.renderImageSettingsAdvanced = this.renderImageSettingsAdvanced.bind(this)
  }

  // Lifecycle method called when component updates.
  // Used to track changes in the topic
  componentDidUpdate(prevProps, prevState, snapshot) {
    const {imgMuxSequences} = this.props.ros
    const {selectedSequenceObj, selectedSequenceModified} = this.state
    
    // Keep the selected sequence up-to-date with the remote as long as we aren't currently modifying it
    if ((selectedSequenceObj !== null) && (selectedSequenceModified === false)) {
      for (let i = 0; i < imgMuxSequences.length; ++i) {
        if (imgMuxSequences[i]['sequence_id'] === selectedSequenceObj['sequence_id']) {
          // Check all entries item-by-item to see if there is a change... this avoids the dreaded "Maximum depth exceeded" runtime error
          if ((imgMuxSequences[i]['enabled'] !== selectedSequenceObj['enabled']) ||
              (imgMuxSequences[i]['output_topic'] !== selectedSequenceObj['output_topic']) ||
              (imgMuxSequences[i]['output_img_width_pixels'] !== selectedSequenceObj['output_img_width_pixels']) ||
              (imgMuxSequences[i]['output_img_height_pixels'] !== selectedSequenceObj['output_img_height_pixels']) ||
              (imgMuxSequences[i]['inputs'].length !== selectedSequenceObj['inputs'].length)) {
            this.setState({ selectedSequenceObj: imgMuxSequences[i] })
            break
          }
          for (let j = 0; j < imgMuxSequences[i]['inputs'].length; ++j) {
            if ((imgMuxSequences[i]['inputs'][j]['topic'] !== selectedSequenceObj['inputs'][j]['topic']) ||
                (imgMuxSequences[i]['inputs'][j]['min_frame_count'] !== selectedSequenceObj['inputs'][j]['min_frame_count']) ||
                (imgMuxSequences[i]['inputs'][j]['max_frame_count'] !== selectedSequenceObj['inputs'][j]['max_frame_count']) ||
                (imgMuxSequences[i]['inputs'][j]['min_duration_s'] !== selectedSequenceObj['inputs'][j]['min_duration_s']) ||
                (imgMuxSequences[i]['inputs'][j]['max_duration_s'] !== selectedSequenceObj['inputs'][j]['max_duration_s'])) {
              this.setState({ selectedSequenceObj: imgMuxSequences[i] })
              // We're in a nested loop, so set the exit condition of the outer loop
              i = imgMuxSequences.length
              break // And break from the inner loop
            }
          }
        }
      }
    } 
  }

  onToggleEnabled(e) {
    const { selectedSequenceObj } = this.state
    if (selectedSequenceObj === null) {
      return
    }

    var updatedSequenceObj = selectedSequenceObj
    updatedSequenceObj["enabled"] = e.target.checked

    this.setState({selectedSequenceObj: updatedSequenceObj,
                   selectedSequenceModified: true})

    // And the button
    document.getElementById("apply_changes_button").style.color = Styles.vars.colors.red
    document.getElementById("apply_changes_button").style.fontWeight = "bold"
  }

  onChangeTextField(e) {
    const { selectedSequenceObj, selectedInputImageIndex, addingNewSequence } = this.state
    if (selectedSequenceObj === null) {
      return
    }

    // Make a copy of the selected sequence obj to update as necessary
    var updatedSelectedSequenceObj = selectedSequenceObj

    if ((e.target.id === "min_duration_s") ||
        (e.target.id === "max_duration_s") ||
        (e.target.id === "min_frame_count") ||
        (e.target.id === "max_frame_count"))
    {
      if ((selectedInputImageIndex === null) || 
          (selectedInputImageIndex >= updatedSelectedSequenceObj['inputs'].length)) {
        return
      }

      updatedSelectedSequenceObj['inputs'][selectedInputImageIndex][e.target.id] = e.target.value

      // Ensure that when using the simple config scheme, we maintain a valid relationship between min and max duration
      if ((e.target.id === "min_duration_s") && (this.state.advancedImgStepConfigEnabled === false) && 
          (updatedSelectedSequenceObj['inputs'][selectedInputImageIndex]["max_duration_s"] <= e.target.value))
      {
        const good_max_val = parseFloat(e.target.value, 10) + 1.0
        updatedSelectedSequenceObj['inputs'][selectedInputImageIndex]["max_duration_s"] = good_max_val.toString()
      }
    }

    else if ((e.target.id === "output_topic") ||
             (e.target.id === "output_img_width_pixels") ||
             (e.target.id === "output_img_height_pixels")) {

      updatedSelectedSequenceObj[e.target.id] = e.target.value
    }
    else if(e.target.id === "sequence_id") {
      // Only allowed to change sequence_id if adding a new element
      if (addingNewSequence === false) {
        return
      }

      updatedSelectedSequenceObj[e.target.id] = e.target.value
    }
    
    // Write the update to the state members
    this.setState({selectedSequenceObj: updatedSelectedSequenceObj,
                   selectedSequenceModified: true})
    
    // Turn the text red
    document.getElementById(e.target.id).style.color = Styles.vars.colors.red
    document.getElementById(e.target.id).style.fontWeight = "bold"

    // And the button
    document.getElementById("apply_changes_button").style.color = Styles.vars.colors.red
    document.getElementById("apply_changes_button").style.fontWeight = "bold"
  }

  handleSequenceSelect = (item) => {
    const {imgMuxSequences} = this.props.ros

    if (imgMuxSequences !== null) {
      for (let i = 0; i < imgMuxSequences.length; i++) {
        const seq = imgMuxSequences[i]
        if (seq['sequence_id'] === item) {
          let uniqueInputTopics = []
          let inputIndices = []
          let uniqueInputCount = 0
          for (let j = 0; j < seq['inputs'].length; j++) {
            let newTopic = seq['inputs'][j]['topic']
            if (uniqueInputTopics.includes(newTopic) === false) {
              uniqueInputTopics.push(newTopic)
              inputIndices.push(uniqueInputCount)
              uniqueInputCount += 1
            }
            else {
              inputIndices.push(uniqueInputTopics.indexOf(newTopic))
            }
          }

          let inputImgLabels = createShortUniqueValues(uniqueInputTopics)
          let inputShortnameList = [] // Top line is blank for insertion at top slot
          inputShortnameList.push("...") // Blank line to start
          for (let j = 0; j < inputIndices.length; j++) {
            inputShortnameList.push(inputImgLabels[inputIndices[j]]) 
          }

          // This action basically resets all state
          this.setState({selectedSequenceObj: seq,
                         selectedSequenceModified: false,
                         addingNewSequence: false,
                         selectedSeqInputImageLabels: inputShortnameList, 
                         selectedInputImageIndex: null})

          // Clear all red change indicators
          const ids = [ "output_topic", "output_img_width_pixels", "output_img_height_pixels", 
                        "sequence_id", "apply_changes_button"]
          // Reset all text colors
          for (let i = 0; i < ids.length; ++i) {
            document.getElementById(ids[i]).style.color = Styles.vars.colors.black
            document.getElementById(ids[i]).style.fontWeight = "normal"
          }
          break
        }
      }
    }
  }
  
  handleInputImageSelect = (item, index) => {
    
    this.setState({ selectedInputImageIndex: (index !== 0)? index - 1 : null }) // Offset by 1 to account for the blank line at the top.
    }

  // Function for creating image topic options.
  createImageTopicsOptions() {
    var items = []
    items.push(<Option>{""}</Option>) // Blank at the top serves as the "Cancel" operation
    const { imageTopics, imageFilterSequencer } = this.props.ros
    var imageTopicShortnames = createShortUniqueValues(imageTopics)
    for (var i = 0; i < imageTopics.length; i++) {
      // Run the filter
      if (imageFilterSequencer && !(imageFilterSequencer.test(imageTopics[i]))) {
        continue
      }

      // Make sure to skip the selected sequence's output -- don't want a circular sequencer!
      if (this.state.selectedSequenceObj && (this.state.selectedSequenceObj['output_topic'] !== imageTopics[i])) {
        items.push(<Option value={imageTopics[i]}>{imageTopicShortnames[i]}</Option>)
      }
    }
    return items
  }

  onNewSequenceButtonPressed() {
    const { newSequenceCount } = this.state
    const newSeqCountString = newSequenceCount.toString()
    // Create a new sequence object and assign to the selectedSequeceObj
    var newSequenceObj = {}
    newSequenceObj['enabled'] = true
    newSequenceObj['sequence_id'] = 'new_sequence_' + newSeqCountString
    newSequenceObj['output_topic'] = 'new_output_img_' + newSeqCountString
    newSequenceObj['output_img_width_pixels'] = 256
    newSequenceObj['output_img_height_pixels'] = 256
    newSequenceObj['inputs'] = []
    
    this.setState({selectedSequenceObj: newSequenceObj,
                   selectedSequenceModified: true,
                   addingNewSequence: true,
                   newSequenceCount: this.state.newSequenceCount + 1,
                   selectedSeqInputImageLabels: ["..."],
                   selectedInputImageIndex: null})

    // Identify that all fields are "modified"
    const ids = [ "output_topic", "output_img_width_pixels", "output_img_height_pixels", 
                  "sequence_id", "apply_changes_button"]
    // Reset all text colors
    for (let i = 0; i < ids.length; ++i) {
      document.getElementById(ids[i]).style.color = Styles.vars.colors.red
      document.getElementById(ids[i]).style.fontWeight = "bold"
    }
  }

  onDeleteSequenceButtonPressed() {
    const { selectedSequenceObj, addingNewSequence } = this.state
    if (selectedSequenceObj === null) {
      return
    }

    // Avoid requesting deletion on the backend if this is a new sequence we're in the middle of constructing
    if (addingNewSequence === false) {
      this.props.ros.onDeleteMuxSequence(selectedSequenceObj['sequence_id'])
    }
    
    this.setState({selectedSequenceObj: null,
                   selectedSequenceModified: false,
                   addingNewSequence: false,
                   selectedSeqInputImageLabels: ["..."],
                   selectedInputImageIndex: null
                   })

    // Reset all text colors, since any pending changes are abandoned
    const  ids = [ "min_duration_s", "max_duration_s", "min_frame_count", "max_frame_count",
                   "output_topic", "output_img_width_pixels", "output_img_height_pixels", "sequence_id",
                   "apply_changes_button"]
    for (let i = 0; i < ids.length; ++i) {
      document.getElementById(ids[i]).style.color = Styles.vars.colors.black
      document.getElementById(ids[i]).style.fontWeight = "normal"
    }   
  }

  async onApplyChangesButtonPressed() {
    const { selectedSequenceObj, selectedSequenceModified } = this.state
    if ((selectedSequenceObj === null) || (selectedSequenceModified === false)) {
      return
    }

    // Make sure the selectedSequenceObj has all the right numerical field types
    var updatedSequenceObj = selectedSequenceObj
    updatedSequenceObj["output_img_width_pixels"] = parseInt(selectedSequenceObj["output_img_width_pixels"], 10)
    updatedSequenceObj["output_img_height_pixels"] = parseInt(selectedSequenceObj["output_img_height_pixels"], 10)
    for (let i = 0; i < updatedSequenceObj['inputs'].length; ++i) {
      updatedSequenceObj['inputs'][i]['min_frame_count'] = parseInt(selectedSequenceObj['inputs'][i]['min_frame_count'], 10)
      updatedSequenceObj['inputs'][i]['max_frame_count'] = parseInt(selectedSequenceObj['inputs'][i]['max_frame_count'], 10)
      updatedSequenceObj['inputs'][i]['min_duration_s'] = parseFloat(selectedSequenceObj['inputs'][i]['min_duration_s'])
      updatedSequenceObj['inputs'][i]['max_duration_s'] = parseFloat(selectedSequenceObj['inputs'][i]['max_duration_s'])
    }
    
    // Publish the message
    this.props.ros.onConfigureMuxSequence(updatedSequenceObj)
    await this.props.ros.callMuxSequenceQuery(false)

    // Reset flags and deselect any selected image so that displayed imagery reverts to the output
    this.setState({selectedSequenceModified: false,
                   addingNewSequence: false,
                   selectedInputImageIndex: null
                   })

    const  ids = [ "min_duration_s", "max_duration_s", "min_frame_count", "max_frame_count",
                   "output_topic", "output_img_width_pixels", "output_img_height_pixels", "sequence_id",
                   "apply_changes_button"]
    // Reset all text colors
    for (let i = 0; i < ids.length; ++i) {
      document.getElementById(ids[i]).style.color = Styles.vars.colors.black
      document.getElementById(ids[i]).style.fontWeight = "normal"
    }
  }
    
  onDeleteInputImgButtonPressed() {
    if ((this.state.selectedSequenceObj === null) ||
        (this.state.selectedSeqInputImageLabels === null) ||
        (this.state.selectedInputImageIndex === null)) {
      // Invalid set-up: Do nothing
      return
    }

    var modifiedInputImgLabels = []
    var modifiedSeqInputs = []
    for (let i = 0; i < this.state.selectedSeqInputImageLabels.length; ++i) {
      if (i !== this.state.selectedInputImageIndex + 1) {
        modifiedInputImgLabels.push(this.state.selectedSeqInputImageLabels[i]) // Labels have blank string as first element, so offset index by 1
        if (i !== 0) {
          modifiedSeqInputs.push(this.state.selectedSequenceObj['inputs'][i-1])
        }
      }
    }

    var modifiedSeq = this.state.selectedSequenceObj
    modifiedSeq['inputs'] = modifiedSeqInputs
    
    // Update the selected input: Depends on where in the list the just-deleted item was and how many items are left
    var newSelectedInputImageIndex = this.state.selectedInputImageIndex
    if (modifiedSeqInputs.length === 0) { // Inputs list is now empty, so deselect
      newSelectedInputImageIndex = null
    }
    else if (newSelectedInputImageIndex >= modifiedSeqInputs.length) {
      newSelectedInputImageIndex -= 1
    }
    
    this.setState({ selectedSequenceObj: modifiedSeq,
                    selectedSequenceModified: true,
                    selectedSeqInputImageLabels: modifiedInputImgLabels,
                    selectedInputImageIndex: newSelectedInputImageIndex})

    // Color the button
    document.getElementById("apply_changes_button").style.color = Styles.vars.colors.red
    document.getElementById("apply_changes_button").style.fontWeight = "bold"
  }

  onAddInputImgSelection(event) {
    var idx = event.nativeEvent.target.selectedIndex
    var text = event.nativeEvent.target[idx].text
    var value = event.target.value === "" ? null : event.target.value

    if (this.state.selectedSequenceObj === null) {
      return
    }

    // Check for the "Cancel" operation
    if (text === "") {
      return
    }

    var modifiedInputImgLabels = this.state.selectedSeqInputImageLabels? this.state.selectedSeqInputImageLabels : []
    var nextIndex = (this.state.selectedInputImageIndex !== null)? this.state.selectedInputImageIndex + 1 : 0 
    modifiedInputImgLabels.splice(nextIndex+1, 0, text)
    
    var modifiedSeqInputs = this.state.selectedSequenceObj['inputs']
    var newInput = {}
    newInput['topic'] = value
    // Defaults are set for a simple fixed-duration scheme that is fully controlled by min_duration_s
    newInput['min_frame_count'] = 0
    newInput['max_frame_count'] = 1000000 
    newInput['min_duration_s'] = 1.0
    newInput['max_duration_s'] = 5.0
    modifiedSeqInputs.splice(nextIndex, 0, newInput)

    var modifiedSeq = this.state.selectedSequenceObj
    modifiedSeq['inputs'] = modifiedSeqInputs

    this.setState({ selectedSequenceObj: modifiedSeq,
                    selectedSequenceModified: true,
                    selectedSeqInputImageLabels: modifiedInputImgLabels,
                    selectedInputImageIndex: nextIndex})

    const  ids = ["min_frame_count", "max_frame_count", "min_duration_s", "max_duration_s", "apply_changes_button"]
    // Set all text colors to indicate all fields are "modified"
    for (let i = 0; i < ids.length; ++i) {
      document.getElementById(ids[i]).style.color = Styles.vars.colors.red
      document.getElementById(ids[i]).style.fontWeight = "bold"
    }
  }

  onToggleAdvancedImgStepConfigEnabled() {
    const enabled = this.state.advancedImgStepConfigEnabled
    this.setState({advancedImgStepConfigEnabled: !enabled})
  }

  renderImageSettings(selectedInputImageObj) {
    return (
      <Columns>
        <Column equalWidth={false}>
          <Label title={''}/>
          <Label title={"Duration (s)"}/>
          <Label title={''}/>
        </Column>
        <Column>
          <Label title={'Fixed'}/>
          <Input
            id="min_duration_s"
            value={selectedInputImageObj? selectedInputImageObj['min_duration_s'] : ''}
            style={{width: "6em"}} 
            onChange={this.onChangeTextField}
            disabled={selectedInputImageObj? false : true}
          />
           <Input
            id="min_frame_count"
            value={selectedInputImageObj? selectedInputImageObj['min_frame_count'] : ''} 
            style={{width: "6em", visibility: "hidden"}}
          />
        </Column>
        <Column>
          <Label title={''}/>
          <Input 
            id="max_duration_s"
            style={{width: "6em", visibility: "hidden"}}
          />
          <Input 
            id="max_frame_count"
            style={{width: "6em", visibility: "hidden"}}
          />
        </Column>
      </Columns>
    )
  }

  renderImageSettingsAdvanced(selectedInputImageObj) {
    return (
      <Columns>
        <Column equalWidth={false}>
          <Label title={''} />
          <Label title={"Duration (s)"}/>
          <Label title={"Frames"}/>
        </Column>
        <Column>
          <Label title={"Min"}/>
          <Input
            id="min_duration_s"
            value={selectedInputImageObj? selectedInputImageObj['min_duration_s'] : ''}
            style={{width: "6em"}} 
            onChange={this.onChangeTextField}
            disabled={selectedInputImageObj? false : true} 
          />
          <Input
            id="min_frame_count"
            value={selectedInputImageObj? selectedInputImageObj['min_frame_count'] : ''} 
            style={{width: "6em"}} 
            onChange={this.onChangeTextField}
            disabled={selectedInputImageObj? false : true}
          />
        </Column>
        <Column>
          <Label title={"Max"}/>
          <Input 
            id="max_duration_s"
            value={selectedInputImageObj? selectedInputImageObj['max_duration_s'] : ''} 
            style={{width: "6em"}} 
            onChange={this.onChangeTextField}
            disabled={selectedInputImageObj? false : true}
          />
          <Input 
            id="max_frame_count"
            value={selectedInputImageObj? selectedInputImageObj['max_frame_count'] : ''} 
            style={{width: "6em"}}
            onChange={this.onChangeTextField}
            disabled={selectedInputImageObj? false : true} 
          />
        </Column>
      </Columns>
    )
  }
    
  render() {
    const {imgMuxSequences} = this.props.ros
    const {selectedSequenceObj, selectedSeqInputImageLabels, selectedInputImageIndex, 
           selectedSequenceModified, addingNewSequence, advancedImgStepConfigEnabled} = this.state
        
    let sequencesForListBox = [];
    if (imgMuxSequences !== null) {
      for (let i = 0; i < imgMuxSequences.length; i++) {
        const seq = imgMuxSequences[i]
        sequencesForListBox.push(seq['sequence_id'])
      }
    }

    const selectedSeqId = selectedSequenceObj? selectedSequenceObj['sequence_id'] : ''
    const selectedInputImageObj = (selectedSequenceObj !== null && selectedInputImageIndex !== null)? selectedSequenceObj['inputs'][selectedInputImageIndex] : null
    const applyButtonTextColor = selectedSequenceModified? Styles.vars.colors.red : Styles.vars.colors.black
    
    var cameraViewerImageTopic = null
    var cameraViewerTitle = "Sequence deselected/disabled"
    if (selectedInputImageObj !== null) {
      cameraViewerImageTopic = selectedInputImageObj['topic']
      cameraViewerTitle = selectedSeqId + "(input): " + cameraViewerImageTopic
    }
    else if ((addingNewSequence === false) && (selectedSequenceObj !== null) && 
             (selectedSequenceObj['enabled'] === true || selectedSequenceModified === true)) {
      cameraViewerImageTopic = selectedSequenceObj['output_topic']
      cameraViewerTitle = selectedSeqId + "(output): " + cameraViewerImageTopic
    }

    const showAdvancedStepConfig = (advancedImgStepConfigEnabled === true)
            
    return (
    <Columns>
      <Column>
        <CameraViewer
          imageTopic={cameraViewerImageTopic}
          title={cameraViewerTitle}
          hideQualitySelector={false}
        />
      </Column>
      <Column>
        <Columns>
          <Column>
            <Section title={"Sequences"}>
              <ListBox 
                id="muxSequencesListBox" 
                items={sequencesForListBox} 
                selectedItem={selectedSeqId} 
                onSelect={this.handleSequenceSelect} 
                style={{ color: 'black', backgroundColor: 'white', height: '40vh' }}
              />
              <ButtonMenu>
                <Button onClick={this.onNewSequenceButtonPressed}>{"New"}</Button>
                <Button onClick={this.onDeleteSequenceButtonPressed}>{"Delete"}</Button>
              </ButtonMenu>
              <ButtonMenu>
                <Button
                  id="apply_changes_button"
                  onClick={this.onApplyChangesButtonPressed} 
                  style={{color: applyButtonTextColor}}
                  disabled={!selectedSequenceModified}
                >
                  {"Apply Changes"}
                </Button>
              </ButtonMenu>
            </Section>
            {selectedSequenceObj !== null? 
              <Section title={"Sequence Settings"}>
                <Label title={"Enabled"}>
                  <Toggle 
                    checked={selectedSequenceObj['enabled']} 
                    onClick={this.onToggleEnabled}
                  />
                </Label>
                <Label title={"Name"}>
                  <Input 
                    id="sequence_id"
                    value={selectedSequenceObj['sequence_id']} 
                    style={{width: "20em"}} 
                    onChange={this.onChangeTextField}
                    disabled={!addingNewSequence}
                  />
                </Label>
                <Label title={"Output"}>
                  <Input 
                    id="output_topic"
                    value={selectedSequenceObj['output_topic']}
                    style={{width: "20em"}} 
                    onChange={this.onChangeTextField}
                  />
                </Label>
                <Columns>
                  <Column>
                    <Label title={"Width"}/>
                    <Input 
                      id="output_img_width_pixels"
                      value={selectedSequenceObj['output_img_width_pixels']} 
                      style={{width: "6em"}}
                      onChange={this.onChangeTextField}
                    />
                  </Column>
                  <Column>
                    <Label title={"Height"}/>
                    <Input 
                      id="output_img_height_pixels"
                      value={selectedSequenceObj['output_img_height_pixels']} 
                      style={{width: "6em"}}
                      onChange={this.onChangeTextField}
                    />
                  </Column>
                  <Column/>
                </Columns>
              </Section>
            : null}
          </Column>
          <Column>
            <Section title={"Input Images"}>
              <IndexedListBox 
                id="inputImagesListBox" 
                items={selectedSeqInputImageLabels} 
                selectedItemIndex={(selectedInputImageIndex !== null)? selectedInputImageIndex+1 : 0} 
                onSelect={this.handleInputImageSelect} 
                style={{ color: 'black', backgroundColor: 'white', height: '40vh' }}
              />
              <Label title={"Add"}>
                <Select id="SeqInputImgAdd" onChange={this.onAddInputImgSelection}>
                  {this.createImageTopicsOptions()}
                </Select>
              </Label>
              <ButtonMenu>
                {this.state.selectedInputImageIndex !== null?
                  <Button onClick={this.onDeleteInputImgButtonPressed}>{"Delete"}</Button>
                  : null
                }
              </ButtonMenu>
            </Section>
            {selectedSequenceObj !== null? 
              <Section title={showAdvancedStepConfig? "Image Settings (Advanced)" : "Image Settings"}>
                {showAdvancedStepConfig === true?
                  this.renderImageSettingsAdvanced(selectedInputImageObj)
                : this.renderImageSettings(selectedInputImageObj)
                }
                <Label title={"Advanced Config."}>
                  <Toggle
                    checked={advancedImgStepConfigEnabled} 
                    onClick={this.onToggleAdvancedImgStepConfigEnabled}              
                  />
                </Label>
              </Section>
            : null
            }
          </Column>
        </Columns>
       </Column>
    </Columns> 
    )
  }
}

export default NepiAppImageSequencer
