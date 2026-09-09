/*
#
# Copyright (c) 2024 Numurus <https://www.numurus.com>.
#
# This file is part of nepi rui (nepi_rui) repo
# (see https://github.com/nepi-engine/nepi_rui)
#
# License: NEPI RUI repo source-code and NEPI Images that use this source-code
# are licensed under the "Numurus Software License",
# which can be found at: <https://numurus.com/wp-content/uploads/Numurus-Software-License-Terms.pdf>
#
# Redistributions in source code must retain this top-level comment block.
# Plagiarizing this software to sidestep the license obligations is illegal.
#
# Contact Information:
# ====================
# - mailto:nepi@numurus.com
#
 */
import React, { Component } from "react"
import { observer, inject } from "mobx-react"

//import Toggle from "react-toggle"
import AsyncToggle from "./AsyncToggle"
//import Section from "./Section"
import { Columns, Column } from "./Columns"
import Select, { Option } from "./Select"
import Label from "./Label"
import Input from "./Input"
import Styles from "./Styles"
import Button, { ButtonMenu } from "./Button"
import { SliderAdjustment } from "./AdjustmentWidgets"
import RangeAdjustment from "./RangeAdjustment"
//import BooleanIndicator from "./BooleanIndicator"
import ColoredIndicator from "./ColoredIndicator"

import { round, rgbToIindicatorColor, setElementStyleModified, clearElementStyleModified, onChangeSwitchStateValue } from "./Utilities"

@inject("ros")
@observer

// Component that contains the DatumIF datum. Renders one widget per
// datum from a nepierfaces/Datatatus message.
class Nepi_IF_Datum extends Component {
  constructor(props) {
    super(props)

    this.state = {
      // name -> in-progress edit string for editable text/number inputs
      editValues: {},

      // name -> { baseline, typed, datum_type } for values we have sent but not yet
      // seen confirmed in an incoming status. Keeps the optimistic override in
      // editValues alive until statusListener() reconciles it (see below).

      // "Selections" only: whether its option list is expanded. One
      // Nepi_IF_Datum renders exactly one datum_msg, so this is a plain
      // boolean rather than a name-keyed map. Local view state with no backend
      // round trip -- deliberately not mirrored into the datum.
      ddOpen: false,

    }

    this.getDatumValue = this.getDatumValue.bind(this)

    this.renderBounds = this.renderBounds.bind(this)

    this.renderDoubleDatum = this.renderDoubleDatum.bind(this)
    this.renderTripleDatum = this.renderTripleDatum.bind(this)

    this.renderIntS = this.renderIntS.bind(this)
    this.renderFloatS = this.renderFloatS.bind(this)

    this.toggleDropDown = this.toggleDropDown.bind(this)
  }

  toggleDropDown() {
    this.setState({ ddOpen: this.state.ddOpen === false })
  }

  // Read the current value a datum reports in a status message, by name and
  // datum_type. Returns null if the datum isn't present or isn't an editable datum_type.
  getDatumValue() {
    const datum_msg = this.props.datum_msg !== undefined ? this.props.datum_msg : null
    

    const DATUM_TYPES = ["Trigger","Bool", "Bools", "String", "Strings",
               "Int","IntDouble","IntTriple", "Ints",
               "Float","FloatDouble","FloatTriple","Floats",
               "ColorRGB"]

    const LIST_TYPES = ["Bools", "Strings",
              "IntDouble","IntTriple", "Ints",
              "FloatDouble","FloatTriple","Floats",
              "ColorRGB"]

    const LABELS_TYPES = ["Bools", "Strings",
              "IntDouble","IntTriple", "Ints",
              "FloatDouble","FloatTriple","Floats",
              "ColorRGB"]


    const STRING_TYPES = ["String", "Strings"]
    const BOOL_TYPES = ["value = msg_value.map(item => parseFloat(item))", "Bools"]
    const INT_TYPES = [ "Int","IntDouble","IntTriple", "Ints","ColorRGB"]
    const FLOAT_TYPES = ["Float","FloatDouble","FloatTriple","Floats"]
    const TRIGGER_TYPES = ['Trigger']


    if (datum_msg == null) { return null }
    const msg_value = datum_msg.value
    const datum_type = datum_msg.type
    const IS_LIST_TYPE = LIST_TYPES.indexOf(datum_type)

    const IS_STRING_TYPE = STRING_TYPES.indexOf(datum_type)
    const IS_BOOL_TYPE = BOOL_TYPES.indexOf(datum_type)
    const IS_INT_TYPE = INT_TYPES.indexOf(datum_type)
    const IS_FLOAT_TYPE = FLOAT_TYPES.indexOf(datum_type)
    const IS_TRIGGER_TYPE = TRIGGER_TYPES.indexOf(datum_type)

    var values_list = null
    var value = null

    if (IS_STRING_TYPE !== -1){
      values_list = msg_value
    }
    if (IS_BOOL_TYPE !== -1){
      values_list = msg_value.map(item => item === 'True')
    }
    if (IS_FLOAT_TYPE !== -1){
      values_list = msg_value.map(item => parseFloat(item))
    }
    if (IS_INT_TYPE !== -1){
      values_list = msg_value.map(item => parseInt(item))
    }
    if (IS_TRIGGER_TYPE !== -1){
      values_list = msg_value.map(item => parseFloat(item))
    }
    if (values_list != null){
      if (IS_LIST_TYPE !== -1) { 
        value = values_list
      }
      else if (values_list.length > 0){
        value = values_list[0]
      }
    }

    return value
  }


  renderBounds(min,max){
       
        const min_bound = (min !== parseInt(-999) ) ? min : 'Nan'
        const max_bound = (max !== parseInt(-999) ) ? max : 'Nan'
        return (

          <React.Fragment>

                <Columns>
                <Column>

                  <label > {"Min"} </label>                
                  <Input disabled={true} value={min_bound} />

                </Column>
                <Column>

                  <label > {"Max"} </label>                
                  <Input disabled={true} value={max_bound} />
                  
                </Column>
              </Columns>

          </React.Fragment>              

        )
      }



  renderDoubleDatum(name, datum_type, value,labels, datum_disabled){

        return (

          <React.Fragment>

                <Columns>
                <Column>

                  <label > {labels[0]} </label>                
                  <Input
                    disabled={datum_disabled}
                    value={value}
                  />

                </Column>
                <Column>

                  <label > {labels[1]} </label>                
                  <Input
                    disabled={datum_disabled}
                    value={value}
                  />
                  
                </Column>
              </Columns>

          </React.Fragment>              

        )
      }


  renderTripleDatum(name, datum_type, value, labels, datum_disabled){

        return (

          <React.Fragment>

                <Columns>
                <Column>

                  <label > {labels[0]} </label>                
                  <Input
                    disabled={datum_disabled}
                    value={value}
                  />

                </Column>
                <Column>

                  <label > {labels[1]} </label>                
                  <Input
                    disabled={datum_disabled}
                    value={value}
                  />
                  
                </Column>
                <Column>

                  <label > {labels[2]} </label>                
                  <Input
                    disabled={datum_disabled}
                    value={value}
                  />

                </Column>
              </Columns>

          </React.Fragment>              

        )
      }


  renderIntS(name,value,min,max, index, datum_disabled){

        return (

                <Input
                  disabled={datum_disabled}
                  value={value}                 
                />


        )
      }




  renderFloatS(name,value,min,max,round_value, round_display, index, datum_disabled){
        return (
                <Input
                  disabled={datum_disabled}
                  value={value}                 
                />

        )
      }


  // Render a single datum given its datum_type and Datum message.
  // Each block below maps one nepi_datum datum datum_type to its RUI widget and
  // the nepi_datum "value_*_datum_value" topic it publishes to on change.
  render() {
    const { sendUpdateDatumValue } = this.props.ros
    const namespace = this.props.namespace !== undefined ? this.props.namespace : null
    const topic = (this.props.topic !== undefined) ? this.props.topic : 'update_datum'
    const datum_msg = this.props.datum_msg !== undefined ? this.props.datum_msg : null

  
    if (namespace == null || datum_msg == null) {
      return (
        <React.Fragment>
          
        </React.Fragment>
      )
    }
    else {

      const name = datum_msg.name
      const datum_type =  datum_msg.type
      const display_name = (datum_msg.display_name && datum_msg.display_name !== '') ? datum_msg.display_name : name
      const show_header_label = display_name === '' || display_name === 'None'
      const datum_hidden = this.props.hidden !== undefined ? this.props.hidden : datum_msg.hidden
      const datum_disabled = true
      const labels = datum_msg.labels
      const min_bound = datum_msg.min_bound
      const max_bound = datum_msg.max_bound
      const show_bounds = false
      const value = this.getDatumValue()
      const round_display =  (datum_msg.round_display >= 0) ? datum_msg.round_display : 6
      const values = (value != null) ? value : []
      // Value inputs whose value tracks either the in-progress edit or the message



      if (datum_hidden === true){
        return (
            <React.Fragment>

            </React.Fragment>
        )


      }

      // Bool -- a single on/off switch. Sends the *opposite* of the current
      // value as a Toggle each time it is clicked.
      else if (datum_type === "Bool") {
        const checked = (value === 'True' || value === 'true' || value === true)
        return (
          <Label title={display_name} key={name}>
            <AsyncToggle
              disabled={datum_disabled}
              checked={checked}
              onClick={() => sendUpdateDatumValue(namespace  + "/" + topic, name, !checked)}
            />
          </Label>
        )
      }



      // Bools -- a multi-select: each option gets its own toggle. The value
      // is the full array of currently-selected option strings. On every toggle
      // we send the complete desired selection (declarative), not a single delta.
      else if (datum_type === "Bools") {
        const na_options = ['NONE','ALL']
        const show_options =  [...na_options, ...labels]
        return (

        <React.Fragment>
          <div hidden={show_header_label }>
          <Label title={display_name} key={name}></Label>
          </div>

            <div>
              {show_options.map((opt, i) => (
                <div key={name + '_' + i} style={{ display: "inline-block", marginRight: Styles.vars.spacing.regular, textAlign: "center" }}>
                  <div style={{ fontSize: Styles.vars.fontSize.small, marginBottom: Styles.vars.spacing.xs }}>{opt}</div>
                  <AsyncToggle
                    disabled={datum_disabled}
                    checked={values.indexOf(opt) !== -1}
                    onClick={() => {
                      // Send the complete desired selection (declarative), not a toggle.
                      const next = (opt === 'ALL') ? labels : 
                                      (opt === 'NONE') ? [] :
                                          values.indexOf(opt) !== -1
                                            ? values.filter((s) => s !== opt)
                                            : [...values, opt]
                    
                      sendUpdateDatumValue(namespace  + "/" + topic, name, next)
                    }}
                  />
                </div>
              ))}
            </div>
        </React.Fragment>
        )
      }



      // STRING  -- free-form typed values. These follow the PTX
      // editable-input pattern: the box shows an in-progress edit string while
      // the user types, and the value is sent (parsed to the right datum_type) only on
      // Enter. See onInputChange / onInputKey above.
      else if (datum_type === "String") {
        const show_value =  value
        return (
          <Label title={display_name} key={name}>
            <Input
              disabled={datum_disabled}             
              value={show_value}
            />
          </Label>
        )
      }
  
      else if (datum_type === "Strings") {
        const show_value =  values
        return (
          <Label title={display_name} key={name}>
            <Input
              disabled={datum_disabled}             
              value={show_value}
            />
          </Label>
        )
      }

    
      // TRIGGER -- a momentary action. There is no persistent value; pressing the
      // button fires a one-shot trigger (an empty String payload).
      else if (datum_type === "Trigger") {

        const show_value = round( value, round_display)
        var button_title = "Trigger"
        if (labels.length > 0){
          button_title = labels[0]
        }
        return (

        <React.Fragment>
          <div hidden={show_header_label }>
          <Label title={display_name} key={name}></Label>
          </div>

                <Columns>
                <Column>

                              
                  <ButtonMenu>
                      disabled={datum_disabled}
                    <Button onClick={() => sendUpdateDatumValue(namespace  + "/" + topic, name, value)}>{button_title}</Button>
                  </ButtonMenu>

                </Column>
                <Column>
 
                  <Input
                    disabled={true}
                    value={show_value}
                  
                  />
                  
                </Column>
              </Columns>

          </React.Fragment>   
        )

      }



      // INT -- free-form typed values. These follow the PTX
      // editable-input pattern: the box shows an in-progress edit string while
      // the user types, and the value is sent (parsed to the right datum_type) only on
      // Enter. See onInputChange / onInputKey above.
      else if (datum_type === "Int") {
        const show_value =  value
        return (

            <React.Fragment>
              <Label title={display_name} key={name}>


                <div hidden={show_bounds === false}>
                  {this.renderBounds(min_bound,max_bound)}
                </div>
                
                
                <Input
                  disabled={datum_disabled}
                  value={show_value}                 
                />
              </Label>
            </React.Fragment> 
        )
      }

      else if (datum_type === "IntDouble") {
        
        return (

        <React.Fragment>
          <div hidden={show_header_label }>
          <Label title={display_name} key={name}></Label>
          </div>

            <div hidden={show_bounds === false}>
              {this.renderBounds(min_bound,max_bound)}
            </div>
            
            {this.renderDoubleDatum(name, datum_type, value, labels,datum_disabled)}

        </React.Fragment> 
        )
      }

      else if (datum_type === "IntTriple") {
        
        return (

        <React.Fragment>
          <div hidden={show_header_label }>
          <Label title={display_name} key={name}></Label>
          </div>
            <div hidden={show_bounds === false}>
              {this.renderBounds(min_bound,max_bound)}
            </div>
            
            {this.renderTripleDatum(name, datum_type, value, labels, datum_disabled)}

        </React.Fragment> 
        )
      }



      // Ints -- a multi-select: each option gets its own int slider. 
      // names come from the labels list. On every toggle
      // we send the complete desired selection (declarative), not a single delta.
      else if (datum_type === "Ints") {
        const min = (min_bound !== -999) ? min_bound : 0
        const max = (max_bound !== -999) ? max_bound : 255
        return (

        <React.Fragment>
          <div hidden={show_header_label }>
          <Label title={display_name} key={name}></Label>
          </div>
                  <div>
                    {/* Map over the device names array */}
                    {labels.map((int_name, index) => (
                      this.renderIntS(int_name, values[index], min, max, index, datum_disabled)
                    ))}
                  </div>
          </React.Fragment>
        )
      }



      // FLOAT -- free-form typed values. These follow the PTX
      // editable-input pattern: the box shows an in-progress edit string while
      // the user types, and the value is sent (parsed to the right datum_type) only on
      // Enter. See onInputChange / onInputKey above.
      else if (datum_type === "Float") {
        const show_value = round( value, round_display)
        return (

        <React.Fragment>
          <div hidden={show_header_label }>
          <Label title={display_name} key={name}></Label>
          </div>

            <div hidden={show_bounds === false}>
              {this.renderBounds(min_bound,max_bound)}
            </div>
            
            <Input
              disabled={datum_disabled}
              value={show_value}
            />

        </React.Fragment> 
        )
      }

      else if (datum_type === "FloatDouble") {
        const show_value = round( value, round_display)
        return (

        <React.Fragment>
          <div hidden={show_header_label }>
          <Label title={display_name} key={name}></Label>
          </div>

            <div hidden={show_bounds === false}>
              {this.renderBounds(min_bound,max_bound)}
            </div>
            
            {this.renderDoubleDatum(name, datum_type, show_value, labels, datum_disabled)}

        </React.Fragment> 
        )
      }

      else if (datum_type === "FloatTriple") {
        const show_value = round( value, round_display)
        return (

        <React.Fragment>
          <div hidden={show_header_label }>
          <Label title={display_name} key={name}></Label>
          </div>

            <div hidden={show_bounds === false}>
              {this.renderBounds(min_bound,max_bound)}
            </div>
            
            {this.renderTripleDatum(name, datum_type, show_value, labels, datum_disabled)}

        </React.Fragment> 
        )
      }



      // Floats -- a multi-select: each option gets its own float slider. 
      // names come from the labels list. On every toggle
      // we send the complete desired selection (declarative), not a single delta.
      else if (datum_type === "Floats") {
        const min = (min_bound !== -999) ? min_bound : 0
        const max = (max_bound !== -999) ? max_bound : 1
        return (


        <React.Fragment>
          <div hidden={show_header_label }>
          <Label title={display_name} key={name}></Label>
          </div>
                  <div>
                    {/* Map over the device names array */}
                    {labels.map((float_name, index) => (
                      this.renderFloatS(float_name, values[index], min, max, index, datum_disabled)
                    ))}
                  </div>
            </React.Fragment>
        )
      }


      // ColorRGB -- an multi-select: each option (R,G,B) gets its own int slider.
      // names come from the labels list. On every toggle
      // we send the complete desired selection (declarative), not a single delta.
      else if (datum_type === "ColorRGB") {
        const min = 0
        const max = 255
        const indicator_color = rgbToIindicatorColor(value[0],value[1],value[2])
        return (

          <React.Fragment>
                


                <Columns>
                <Column>

                <Label title={display_name} key={name}> </Label>

                </Column>
                <Column>

                  <ColoredIndicator indicator_color={indicator_color} />
                  
                </Column>
              </Columns>

                  {this.renderTripleDatum(name, datum_type, value, labels)}
          

          </React.Fragment>


         
        )
      }



      else {
        return (
            <React.Fragment>

            </React.Fragment>
        )


      }
    }
  }

}

export default Nepi_IF_Datum
