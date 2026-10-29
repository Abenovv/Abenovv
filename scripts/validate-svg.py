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
                assert not re.match(r"(?:https?:|javascript:)", value, re.I), path
    count += 1
data = json.loads((root / "assets/profile-data.json").read_text(encoding="utf-8"))
calendar = ET.parse(root / "assets/contribution-static.svg").getroot()
cells = [{"date": n.attrib["data-date"], "count": int(n.attrib["data-count"])}
         for n in calendar.iter() if "data-date" in n.attrib]
assert cells == data["contributions"]["days"]
assert sum(c["count"] for c in cells) == data["calendar"]["total"]
print(f"PASS: {count} SVGs parse; no duplicate IDs or external image dependencies; static calendar matches all dated records.")
