import * as React from "react"

const { trackEvent } = require("../utils/analytics")

const TrackedActionLink = ({
  eventName,
  eventParams = {},
  onClick,
  children,
  ...anchorProps
}) => {
  const handleClick = event => {
    trackEvent(eventName, eventParams)
    onClick?.(event)
  }

  return (
    <a {...anchorProps} onClick={handleClick}>
      {children}
    </a>
  )
}

export default TrackedActionLink
