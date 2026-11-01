"""Parse every published SVG and reconcile the static calendar with the public data."""
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent.parent
count = 0
for path in (root / "assets").rglob("*.svg"):
    svg = ET.parse(path).getroot()
    assert svg.tag.endswith("svg"), path
    ids = set()
    for node in svg.iter():
        assert node.tag.split("}")[-1].lower() not in {"script", "foreignobject"}, path
        if "id" in node.attrib:
            assert node.attrib["id"] not in ids, (path, node.attrib["id"])
            ids.add(node.attrib["id"])
        for key, value in node.attrib.items():
            assert not key.lower().startswith("on"), path
            if key.split("}")[-1] == "href":
                assert value.startswith(("#", "data:image/")), (path, value)
            assert not re.search(r"url\(\s*['\"]?(?:https?:|//)", value, re.I), path
        if node.tag.split("}")[-1].lower() == "style":
            assert not re.search(r"@import|url\(\s*['\"]?(?:https?:|//)", node.text or "", re.I), path
    count += 1
data = json.loads((root / "assets/profile-data.json").read_text(encoding="utf-8"))
calendar = ET.parse(root / "assets/contribution-static.svg").getroot()
cells = [{"date": n.attrib["data-date"], "count": int(n.attrib["data-count"])}
         for n in calendar.iter() if "data-date" in n.attrib]
assert cells == data["contributions"]["days"]
assert sum(c["count"] for c in cells) == data["calendar"]["total"]
assert sum(c["count"] > 0 for c in cells) == data["calendar"]["activeDays"]
animation_tags = {"animate", "animatemotion", "animatetransform", "set"}
intro_motion = ET.parse(root / "assets/intro-motion.svg").getroot()
intro_static = ET.parse(root / "assets/intro-static.svg").getroot()
assert not any(n.tag.split("}")[-1].lower() in animation_tags for n in intro_static.iter())
for node in intro_motion.iter():
    if node.tag.split("}")[-1].lower() not in animation_tags:
        continue
    assert node.attrib.get("repeatCount", "1") == "1", "Intro must not loop"
    assert "repeatDur" not in node.attrib, "Intro must not loop"
    duration = re.fullmatch(r"(\d+(?:\.\d+)?)(ms|s)", node.attrib.get("dur", "0s"))
    begin = re.fullmatch(r"(\d+(?:\.\d+)?)(ms|s)", node.attrib.get("begin", "0s"))
    assert duration and begin, "Intro timing must be explicit and finite"
    seconds = lambda value: float(value[1]) / (1000 if value[2] == "ms" else 1)
    assert seconds(duration) + seconds(begin) <= 5, "Intro should finish within five seconds"
print(f"PASS: {count} SVGs parse; finite intro with static fallback; no duplicate IDs or external image dependencies; static calendar matches all dated records.")

portrait_static=ET.parse(root / "assets/portrait-full.svg").getroot()
portrait_motion=ET.parse(root / "assets/portrait-full-motion.svg").getroot()
assert portrait_static.attrib["viewBox"] == portrait_motion.attrib["viewBox"] == "0 0 866 1154"
assert not any(n.tag.split("}")[-1].lower() in animation_tags for n in portrait_static.iter())
for n in portrait_motion.iter():
    if n.tag.split("}")[-1].lower() in animation_tags:
        assert n.attrib.get("repeatCount", "1") == "1"
        assert float(n.attrib["dur"].rstrip("s")) + float(n.attrib.get("begin", "0s").rstrip("s")) <= 5
print("PASS: complete portrait proportions, static alternative and finite light sweep.")
