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
import BooleanIndicator from "./BooleanIndicator"
import ColoredIndicator from "./ColoredIndicator"

import { round, rgbToIindicatorColor, setElementStyleModified, clearElementStyleModified, onChangeSwitchStateValue } from "./Utilities"






@inject("ros")
@observer

// Component that contains the DatumIF datum. Renders one widget per
// datum from a nepierfaces/Datatatus message.
class Nepi_IF_Datum extends Component {
  constructor(props) {
    super(props)

    this.STRING_TYPES = ["String"]
    this.BOOL_TYPES = ["Bool","Bools"]
    this.INT_TYPES = ["Int","Ints","ColorRGB"]
    this.FLOAT_TYPES = ["Float","Floats"]
    this.TRIGGER_TYPES = ['Trigger','Triggers']
    // The single-value types, mirroring nepi_data.SINGLE_TYPES. The engine
    // tests this list FIRST and hands back value[0] for anything in it, so a
    // Selection reports one option string even though it is also a LIST_TYPE.
    // getDatumValue has to make the same call in the same order.
    
    this.SINGLE_TYPES = ["Trigger","Bool", 
                        "String",
                        "Int",
                        "Float"]
    this.DOUBLE_TYPES = []

    this.TRIPLE_TYPES = ["ColorRGB"]


    this.state = {

      ddOpen: false,

    }


    this.getDatumValue = this.getDatumValue.bind(this)

    this.renderBounds = this.renderBounds.bind(this)
    this.renderDatum = this.renderDatum.bind(this)


  }




  
  toggleDropDown() {
    this.setState({ ddOpen: this.state.ddOpen === false })
  }

  // Read the current value a datum reports in a status message, by name and
  // datum_type. Returns null if the datum isn't present or isn't an editable datum_type.
  getDatumValue() {

    const datum_msg = this.props.datum_msg !== undefined ? this.props.datum_msg : null
    if (datum_msg == null) { return null }
    const msg_value = datum_msg.value
    const datum_type = datum_msg.type
    const display_round =  (datum_msg.display_round >= 0) ? datum_msg.display_round : 6

    const IS_STRING_TYPE = this.STRING_TYPES.indexOf(datum_type)
    const IS_BOOL_TYPE =this.BOOL_TYPES.indexOf(datum_type)
    const IS_INT_TYPE = this.INT_TYPES.indexOf(datum_type)
    const IS_FLOAT_TYPE = this.FLOAT_TYPES.indexOf(datum_type)
    const IS_TRIGGER_TYPE = this.TRIGGER_TYPES.indexOf(datum_type)

    var values_list = null

    if (IS_STRING_TYPE !== -1){
      values_list = msg_value
    }
    else if (IS_BOOL_TYPE !== -1){
      values_list = msg_value.map(item => item === 'True')
    }
    else if (IS_FLOAT_TYPE !== -1){
      values_list = msg_value.map(item => round(parseFloat(item),display_round))
    }
    else if (IS_INT_TYPE !== -1){
      values_list = msg_value.map(item => parseInt(item))
    }
    else if (IS_TRIGGER_TYPE !== -1){
      values_list = msg_value.map(item => round(parseFloat(item),display_round))
    }

    if (values_list == null) { return null }
    // Datum.value is always a string[] on the wire, one entry per component.
    // Single-value types unwrap to their one entry; everything else keeps the
    // list, which is what the multi-component branches map over.
    if (this.SINGLE_TYPES.indexOf(datum_type) !== -1 ) {
      return (values_list.length > 0) ? [values_list[0]] : null
    }
    if (this.DOUBLE_TYPES.indexOf(datum_type) !== -1 ) {
      return (values_list.length > 1) ? [values_list[0],values_list[1]] : null
    }
    if (this.TRIPLE_TYPES.indexOf(datum_type) !== -1 ) {
      return (values_list.length > 2) ? [values_list[0],values_list[1],values_list[2]] : null
    }
    return values_list
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




  renderDatum(datum_value, datum_index, datum_msg) {
     
    if (datum_value == null || datum_msg == null) {
      return (
        <React.Fragment>
          
        </React.Fragment>
      )
    }
    else {
      const topic = (this.props.topic !== undefined) ? this.props.topic : 'update_datum'
      // Bound here as in every other handler in this file: the widgets below
      // publish, and neither name was in scope.
      const namespace = this.props.namespace !== undefined ? this.props.namespace : null
      const { sendUpdateDatumValue } = this.props.ros
      const name = datum_msg.name
      const datum_type =  datum_msg.type
      const display_label = datum_msg.display_labels[datum_index]
      // Datum.msg spells it display_disabled.
      const datum_disabled = true


      const IS_STRING_TYPE = this.STRING_TYPES.indexOf(datum_type)
      const IS_BOOL_TYPE =this.BOOL_TYPES.indexOf(datum_type)
      const IS_INT_TYPE = this.INT_TYPES.indexOf(datum_type)
      const IS_FLOAT_TYPE = this.FLOAT_TYPES.indexOf(datum_type)
      const IS_TRIGGER_TYPE = this.TRIGGER_TYPES.indexOf(datum_type)


      const show_value = datum_value


    if (IS_BOOL_TYPE !== -1){

        const BOOL_VALUE = (show_value === 'True' || show_value === 'true' || show_value === true)
        return (
          <React.Fragment>

            <Label title={display_label} key={name}>
            <BooleanIndicator value={BOOL_VALUE} />
            </Label>

          </React.Fragment>  
        )


    }
    else if (IS_INT_TYPE !== -1){
        return (

            <React.Fragment>

          <Label title={display_label} key={name}></Label>
                
                <Input
                  disabled={datum_disabled}
                  id={'csbx_' + name}
                  style={{ width: "100%" }}
                  value={show_value}
                />

            </React.Fragment> 
        )
    }

    else if (IS_FLOAT_TYPE !== -1){
        return (

        <React.Fragment>
           
            <Input
              disabled={datum_disabled}
              id={'csbx_' + name}
              style={{ width: "100%" }}
              value={show_value}
            />
        
        </React.Fragment> 
        )
    }

    else if (IS_TRIGGER_TYPE !== -1){
        return (
            <React.Fragment>

          <Label title={display_label} key={name}></Label>
                
                <Input
                  disabled={datum_disabled}
                  id={'csbx_' + name}
                  style={{ width: "100%" }}
                  value={show_value}
                />

            </React.Fragment> 
        )
    }

      else{
        return (null)
      }
    }
  }





  // Render a single datum given its datum_type and Datum message.
  // Each block below maps one nepi_datum datum datum_type to its RUI widget and
  // the nepi_datum "value_*_datum_value" topic it publishes to on change.
  render() {
    const datum_msg = this.props.datum_msg !== undefined ? this.props.datum_msg : null

  
    if (datum_msg == null) {
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
      // Datum.msg spells these display_hidden / display_disabled. Read under
      // the old names both were undefined, so nothing ever hid or disabled --
      // and show_bounds, which gates on datum_disabled === false, never
      // rendered the min/max boxes.
      const datum_hidden = this.props.hidden !== undefined ? this.props.hidden : datum_msg.display_hidden
      const datum_disabled = true
      // Datum.display_row: true lays a multi-value datum's widgets side by
      // side in one row, false stacks them. Defaulted rather than read bare so
      // a publisher built against the older message -- where this field was a
      // string, and arrives here undefined -- keeps the stacked layout it has
      // always had.
      const display_row = (datum_msg.display_row === true)
      const display_labels = datum_msg.display_labels
      const min_bound = datum_msg.min_bound
      const max_bound = datum_msg.max_bound
      const show_bounds = (this.props.show_bounds !== undefined ? this.props.show_bounds : false)
      const values = this.getDatumValue()



      if (datum_hidden === true || values == null){
        return (
          <React.Fragment>
            
          </React.Fragment>
        )
      }

      // STRING  -- free-form typed values. These follow the PTX
      // editable-input pattern: the box shows an in-progress edit string while
      // the user types, and the value is sent (parsed to the right datum_type) only on
      // Enter. See onInputChange / onInputKey above.
      else if (datum_type === "String" ) {
        const value = values[0]
        const show_value = value
        return (
          <Label title={display_name} key={name}>
            <Input
              disabled={datum_disabled}
              value={show_value}
            />
          </Label>
        )
      }


      // ColorRGB -- an multi-select: each option (R,G,B) gets its own int slider.
      // names come from the display_labels list. On every toggle
      // we send the complete desired selection (declarative), not a single delta.
      else if (datum_type === "ColorRGB") {
        const value = (values.length > 2) ? [values[0],values[1],,values[2]] : [255, 255, 255]
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



                <Columns>
                <Column>

                  <label > {display_labels[0]} </label>                
                  <Input
                    disabled={datum_disabled}
                    id={'csbx_' + name + '_' + display_labels[0]}
                    style={{ width: "100%" }}
                    value={value}
                  />

                </Column>
                <Column>

                  <label > {display_labels[1]} </label>                
                  <Input
                    disabled={datum_disabled}
                    id={'csbx_' + name + '_' + display_labels[1]}
                    style={{ width: "100%" }}
                    value={value}
                  />
                  
                </Column>
                <Column>

                  <label > {display_labels[2]} </label>                
                  <Input
                    disabled={datum_disabled}
                    id={'csbx_' + name + '_' + display_labels[2]}
                    style={{ width: "100%" }}
                    value={value}
                  />

                </Column>
              </Columns>


          </React.Fragment>
        )
      }

      // Fallthrough for every remaining type -- one renderDatum per value
      // entry -- reached because each branch above returns. It was written as an
      // empty `else {}` followed by this return, which is the same thing; the
      // brace that closed that else is the one this return needs to stay inside
      // the enclosing block. show_values must be the LIST: round() of the whole
      // value returned a number, which has no .map(). An in-progress edit
      // already holds the full updated array (onInputChangeIndex writes it so).
      // Same list guard as `values`: onInputChangeIndex stores the whole updated
      // array, but onInputChange stores a bare string for a single-value datum.
      const show_values = values

      return (

        <React.Fragment>
          <div hidden={show_header_label === false }>
          <Label title={display_name} key={name}></Label>
          </div>


        <div hidden={show_bounds === false}>
          {this.renderBounds(min_bound,max_bound)}
        </div>

          {(display_row === true) ?
            <Columns>
              {/* Same renderDatum calls as the stacked layout below, one per
                  value entry -- only the wrapper differs, so what each widget
                  publishes is unchanged. */}
              {show_values.map((comp_value, index) => (
                <Column key={name + '_row_' + index}>
                  {this.renderDatum(comp_value, index, datum_msg)}
                </Column>
              ))}
            </Columns>
          :
            <div>
              {/* Map over the device names array */}
              {show_values.map((comp_value, index) => (
                this.renderDatum(comp_value, index, datum_msg)
              ))}
            </div>
          }

          </React.Fragment>
        )

      }

  }

}

export default Nepi_IF_Datum
