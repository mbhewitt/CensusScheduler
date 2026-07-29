#!/usr/bin/env python3
"""Regenerate sampling-history.json for the gate-sampling shift sheets.

Replays the legacy censuslib score walk (censuslib.php ~1300-1338) over the
historical Shiftboard mirror, which lives in the LOCAL census database (the
production app database has no multi-year history). Run on Mew's dev box
before each event year, commit the JSON:

    python3 generate-history.py <event_year>   # e.g. 2027

Output per shiftboard_id: [total, last_date, review_multiplier]
  - total/last: gate-sampling experience walk over the legacy 2-year window
    ((year-2)-08-01 .. (year-1)-12-31): +1 sampler, +2 lead, +0.75 traffic
    tamer, x0.7 decay when the gap since the previous shift exceeds 30 days
  - review_multiplier: review_notes average (7=1.0, <7 penalized, >7 boosted),
    all-time overlaid by the (year-1) calendar-year window (legacy layering)

The API endpoint continues the walk with live current-year signups.
"""
import json
import subprocess
import sys
from datetime import date

YEAR = int(sys.argv[1]) if len(sys.argv) > 1 else date.today().year
START = f"{YEAR - 2}-08-01"
END = f"{YEAR - 1}-12-31"
WEIGHT = {"RandomSampler": 1.0, "SamplingLead": 2.0, "TrafficTamer": 0.75}


def q(sql):
    out = subprocess.run(
        ["mysql", "census", "-N", "-B", "-e", sql],
        capture_output=True, text=True, check=True,
    ).stdout
    return [line.split("\t") for line in out.splitlines()]


events = {}
for sid, d, rc in q(f"""
    select s.shiftboard_id, s.date, c.RoleCategory
    from shiftboard2 s join subject_category c using(subject)
    where c.SubCategory='GateSampling'
      and c.RoleCategory in ('RandomSampler','SamplingLead','TrafficTamer')
      and s.shiftboard_id>0 and s.date between '{START}' and '{END}'
    order by s.shiftboard_id, s.date"""):
    events.setdefault(int(sid), []).append((d, WEIGHT[rc]))

review_sql = """
    select shiftboard_id, avg(case when score=7 then 1 when score<7 then score/7/4
      when score>7 then score/7*2 end)
    from review_notes {where} group by shiftboard_id"""
review = {}
for where in ("", f"where date between '{YEAR - 1}-01-01' and '{YEAR}-01-01'"):
    for sid, rv in q(review_sql.format(where=where)):
        if rv not in ("NULL", ""):
            review[int(sid)] = round(float(rv), 3)

volunteers = {}
for sid, evs in events.items():
    total, last = 0.0, None
    for d, w in evs:
        if last is not None and (date.fromisoformat(d) - date.fromisoformat(last)).days > 30:
            total *= 0.7
        total += w
        last = d
    volunteers[sid] = [round(total, 2), last, review.get(sid, 1)]
for sid, rv in review.items():
    if sid not in volunteers and rv != 1:
        volunteers[sid] = [0, None, rv]

out = {
    "generated": date.today().isoformat(),
    "year": YEAR,
    "window": [START, END],
    "volunteers": volunteers,
}
path = __file__.replace("generate-history.py", "sampling-history.json")
with open(path, "w") as f:
    json.dump(out, f, separators=(",", ":"))
print(f"wrote {path}: {len(volunteers)} volunteers, window {START}..{END}")
