import json

# January 2026 data from Quip sheet
# Status codes: WFO=Present, CL=Casual Leave, SL=Sick Leave, AL=Absent Leave, OL=Optional Leave, WFH=Work From Home

associates = {
    'vankithe': {'name': 'Ankitha Vyas'},
    'gvatsala': {'name': 'Vatsal Gupta'},
    'musaddm': {'name': 'Musaddm'},
    'syesule': {'name': 'Syed Suleman'},
    'ketiredd': {'name': 'Kowshik Reddy'},
    'muqeemah': {'name': 'Ahmed Abdul Muqeem'},
    'sharkoth': {'name': 'Sharan Kotha'},
    'rundevak': {'name': 'Deva Krishna Babu'},
    'valavoju': {'name': 'Valavoju'},
    'sudaveda': {'name': 'Veda Vyas S'},
    'ahmshaiq': {'name': 'Shaik Abdul Ahmed'},
    'vijaupot': {'name': 'Vijay Rajan P'},
    'chikbal': {'name': 'Chikbal'},
    'ypreksha': {'name': 'Ypreksha'},
    'cheedel': {'name': 'Cheedel'},
    'abhanwad': {'name': 'Abhanwad'},
    'thotteja': {'name': 'Thotteja'},
}

# Week 1: 12/29 - 1/2
# Week 2: 1/5 - 1/9
# Week 3: 1/12 - 1/16
# Week 4: 1/19 - 1/23
# Week 5: 1/26 - 1/30

raw_data = {
    'vankithe': {
        'w1': ['WFO','WFO','WFO','WFO','WFO'],
        'w2': ['WFO','WFO','WFO','WFO','WFO'],
        'w3': ['WFO','WFO','WFO','WFO','WFO'],
        'w4': ['WFO','WFO','WFO','WFO','CL'],
        'w5': ['MO','WFO','WFO','WFO','WFO']
    },
    'gvatsala': {
        'w1': ['WFO','WFO','WFO','WFO','WFO'],
        'w2': ['SL','WFO','WFO','WFO','SL'],
        'w3': ['WFO','WFO','WFO','WFO','SL'],
        'w4': ['WFO','WFO','WFO','WFO','WFO'],
        'w5': ['MO','WFO','WFO','WFO','WFO']
    },
    'musaddm': {
        'w1': ['WFO','WFO','WFO','WFO','WFO'],
        'w2': ['WFO','WFO','WFO','WFO','WFO'],
        'w3': ['WFO','WFO','WFO','WFO','WFO'],
        'w4': ['AL','AL','AL','AL','AL'],
        'w5': ['MO','AL','AL','AL','AL']
    },
    'syesule': {
        'w1': ['WFO','WFO','WFO','WFO','WFO'],
        'w2': ['WFO','WFO','SL','WFO','WFO'],
        'w3': ['WFO','WFO','WFO','WFO','WFO'],
        'w4': ['WFO','WFO','SL','WFO','WFO'],
        'w5': ['MO','SL','WFO','WFO','WFO']
    },
    'ketiredd': {
        'w1': ['WFO','WFO','WFO','WFO','WFO'],
        'w2': ['WFO','WFO','WFO','WFO','WFO'],
        'w3': ['AL','AL','AL','AL','AL'],
        'w4': ['WFO','WFO','WFO','WFO','SL'],
        'w5': ['MO','WFO','SL','WFO','WFO']
    },
    'muqeemah': {
        'w1': ['WFO','WFO','WFO','OL','CL'],
        'w2': ['WFO','WFO','SL','WFO','WFO'],
        'w3': ['WFO','WFO','WFO','WFO','WFO'],
        'w4': ['WFO','WFO','WFO','WFO','CL'],
        'w5': ['MO','WFO','WFO','WFO','WFO']
    },
    'sharkoth': {
        'w1': ['WFO','WFO','WFO','WFO','WFO'],
        'w2': ['WFO','WFO','WFO','WFO','CL'],
        'w3': ['CL','WFO','WFO','WFO','WFO'],
        'w4': ['CL','WFO','CL','WFO','CL'],
        'w5': ['MO','SL','SL','WFO','WFO']
    },
    'rundevak': {
        'w1': ['WFO','WFO','WFO','WFO','WFO'],
        'w2': ['WFO','WFO','WFO','WFO','WFO'],
        'w3': ['AL','AL','AL','AL','AL'],
        'w4': ['AL','WFO','WFO','WFO','WFO'],
        'w5': ['MO','WFO','WFO','WFO','WFO']
    },
    'valavoju': {
        'w1': ['WFO','WFO','WFO','WFO','WFO'],
        'w2': ['WFO','AL','AL','AL','AL'],
        'w3': ['AL','AL','AL','AL','AL'],
        'w4': ['WFO','WFO','WFO','WFO','WFO'],
        'w5': ['MO','WFO','WFO','WFO','WFO']
    },
    'sudaveda': {
        'w1': ['WFO','WFO','WFO','OL','WFO'],
        'w2': ['WFO','WFO','WFO','WFO','WFO'],
        'w3': ['AL','AL','AL','AL','AL'],
        'w4': ['WFO','WFO','WFO','WFO','WFO'],
        'w5': ['MO','WFO','WFO','WFO','WFO']
    },
    'ahmshaiq': {
        'w1': ['SL','WFO','WFO','OL','WFO'],
        'w2': ['WFO','WFO','WFO','WFO','WFO'],
        'w3': ['SL','WFO','WFO','WFO','WFO'],
        'w4': ['WFH','WFH','WFH','WFH','AL'],
        'w5': ['MO','AL','AL','AL','AL']
    },
    'vijaupot': {
        'w1': ['WFO','WFO','WFO','OL','CL'],
        'w2': ['WFO','WFO','WFO','WFO','WFO'],
        'w3': ['AL','AL','AL','AL','AL'],
        'w4': ['AL','WFO','WFO','WFO','WFO'],
        'w5': ['MO','WFO','WFO','WFO','SL']
    },
    'chikbal': {
        'w1': ['AL','AL','AL','OL','AL'],
        'w2': ['WFO','WFO','WFO','WFO','WFO'],
        'w3': ['WFO','WFO','OL','WFO','WFO'],
        'w4': ['WFO','WFO','SL','WFO','WFO'],
        'w5': ['MO','WFO','WFO','WFO','WFO']
    },
    'ypreksha': {
        'w1': ['AL','AL','AL','OL','CL'],
        'w2': ['WFO','WFO','WFO','WFO','WFO'],
        'w3': ['SL','WFO','OL','CL','WFO'],
        'w4': ['CL','WFO','WFO','WFO','WFO'],
        'w5': ['MO','WFO','WFO','WFO','WFO']
    },
    'cheedel': {
        'w1': ['AL','AL','CL','CL','WFO'],
        'w2': ['WFO','WFO','WFO','WFO','WFO'],
        'w3': ['WFO','WFO','WFO','WFO','WFO'],
        'w4': ['WFO','WFO','WFO','HD','CL'],
        'w5': ['MO','WFO','WFO','WFO','WFO']
    },
    'abhanwad': {
        'w1': ['WFO','WFO','WFO','WFO','WFO'],
        'w2': ['WFO','WFO','WFO','WFO','WFO'],
        'w3': ['SL','WFO','OL','WFO','WFO'],
        'w4': ['WFO','WFO','WFO','WFO','SL'],
        'w5': ['MO','WFO','WFO','WFO','WFO']
    },
    'thotteja': {
        'w1': ['WFO','WFO','CL','CL','CL'],
        'w2': ['WFO','WFO','WFO','WFO','WFO'],
        'w3': ['WFO','WFO','WFO','WFO','WFO'],
        'w4': ['WFO','WFO','WFO','WFO','WFO'],
        'w5': ['MO','WFO','WFO','WFO','WFO']
    },
}

# Date mapping
weeks = {
    'w1': ['2025-12-29','2025-12-30','2025-12-31','2026-01-01','2026-01-02'],
    'w2': ['2026-01-05','2026-01-06','2026-01-07','2026-01-08','2026-01-09'],
    'w3': ['2026-01-12','2026-01-13','2026-01-14','2026-01-15','2026-01-16'],
    'w4': ['2026-01-19','2026-01-20','2026-01-21','2026-01-22','2026-01-23'],
    'w5': ['2026-01-26','2026-01-27','2026-01-28','2026-01-29','2026-01-30'],
}

# Status mapping
status_map = {
    'WFO': 'present',
    'WFH': 'present',
    'CL': 'absent',
    'SL': 'absent',
    'AL': 'absent',
    'OL': 'absent',
    'MO': 'mandate_off',
    'HD': 'halfday',
}

leave_type_map = {
    'CL': 'planned',
    'SL': 'unplanned',
    'AL': 'unplanned',
    'OL': 'planned',
    'MO': 'mandate_off',
    'HD': 'halfday',
}

# Build the database
db = {"leaves": {"aggannam": []}, "dailyTracker": {"aggannam": {}}, "monthlySheets": {}}

leave_id = 2000
for alias, week_data in raw_data.items():
    db["dailyTracker"]["aggannam"][alias] = {}
    for week_key, statuses in week_data.items():
        dates = weeks[week_key]
        for i, code in enumerate(statuses):
            date = dates[i]
            st = status_map.get(code, 'present')
            lt = leave_type_map.get(code, '')
            
            # Daily tracker entry
            db["dailyTracker"]["aggannam"][alias][date] = {
                "status": st,
                "leaveType": lt,
                "notes": code
            }
            
            # Leave record if not present
            if code not in ['WFO', 'WFH']:
                leave_id += 1
                days = 0.5 if code == 'HD' else 1
                leave_type = 'planned' if code in ['CL', 'OL'] else 'unplanned' if code in ['SL', 'AL'] else 'mandatory_off' if code == 'MO' else 'halfday'
                db["leaves"]["aggannam"].append({
                    "id": "L" + str(leave_id),
                    "alias": alias,
                    "type": leave_type,
                    "from": date,
                    "to": date,
                    "days": days,
                    "status": "approved",
                    "reason": code,
                    "appliedOn": "2026-01-01"
                })

# Write to shared-data.json
with open("shared-data.json", "w") as f:
    json.dump(db, f, indent=2)

# Also copy to deploy and github-upload
import shutil
shutil.copy("shared-data.json", "deploy/shared-data.json")
shutil.copy("shared-data.json", "C:/Users/sharkoth/github-upload/shared-data.json")

print(f"Done! Created shared-data.json")
print(f"  Leave records: {len(db['leaves']['aggannam'])}")
print(f"  Associates tracked: {len(db['dailyTracker']['aggannam'])}")
print(f"  Days tracked per person: {len(list(db['dailyTracker']['aggannam'].values())[0])}")
