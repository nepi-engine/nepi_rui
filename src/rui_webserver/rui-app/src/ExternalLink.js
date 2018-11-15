import React from "react"

const ExternalLink = props => {
  const cleanLinkText = props.href
    .replace(/https?:\/\//g, "")
    .replace(/\/$/g, "")

  const extraProps = {
    target: "blank_",
    title: cleanLinkText
  }
  return (
    <a {...props} {...extraProps}>
      {(props.children && props.children) || cleanLinkText}
    </a>
  )
}

export default ExternalLink
