import React, { Component } from "react"
import { observer, inject } from "mobx-react"

import Section from "./Section"
import EnableAdjustment from "./EnableAdjustment"
import RangeAdjustment from "./RangeAdjustment"
import AngleAdjustment from "./AngleAdjustment"

@inject("ros")
@observer
class NDControl extends Component {
  render() {
    const {
      rangeMin,
      rangeMax,
      angleOffset,
      angleTotal,
      resolutionEnabled,
      resolutionAdjustment,
      gainEnabled,
      gainAdjustment,
      filterEnabled,
      filterAdjustment
    } = this.props.ros

    return (
      <Section>
        <RangeAdjustment
          min={rangeMin}
          max={rangeMax}
          tooltip={
            "Min and max range.  Expressed as a percentage of the sensor's maximum range."
          }
        />

        <AngleAdjustment
          offset={angleOffset}
          total={angleTotal}
          tooltip={
            "Angular offset and total angle.  Expressed as a percentage of the sensor's native angular range."
          }
        />

        <EnableAdjustment
          title="Resolution"
          enabled={resolutionEnabled}
          adjustment={resolutionAdjustment}
          tooltip={"Manual resolution scaling."}
        />

        <EnableAdjustment
          title="Gain"
          enabled={gainEnabled}
          adjustment={gainAdjustment}
          tooltip={"Adjustable manual gain."}
        />

        <EnableAdjustment
          title="Filter"
          enabled={filterEnabled}
          adjustment={filterAdjustment}
          tooltip={"Adjustable generic filter."}
        />
      </Section>
    )
  }
}
export default NDControl
