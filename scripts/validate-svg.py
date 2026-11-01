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
snake=ET.parse(root / "assets/contribution-route.svg").getroot()
assert not any(n.tag.split("}")[-1] in {"clipPath", "mask"} for n in snake.iter())
assert len([n for n in snake.iter() if n.attrib.get("class")=="snake-segment"])==4
print(f"PASS: {count} safe SVGs; calendar reconciles; snake uses four visible segments with no clipping or masks.")
