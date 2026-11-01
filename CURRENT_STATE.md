# Current state

Portrait uses the approved original refined B PNG directly: avoids blank SVG rendering while preserving the full image and palette. Snake segments are wrapped in a fixed calendar clip during render, including every scheduled refresh. Metrics and contribution animation remain automatic.

Portrait background is transparent. The portrait fills its proportional column width, avoiding extra side gutters while preserving full framing and the approved soft-blue dot pattern.

Snake uses a new contribution-contained.svg URL to avoid the cached uncontained artwork. Its root viewport is cropped exactly to calendar bounds with overflow hidden, in addition to the fixed parent clip. Scheduled refresh commits both assets.
