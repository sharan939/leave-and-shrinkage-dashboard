import json

# Correct manager mapping from phonetool
manager_map = {
    'muqeemah': 'aggannam',
    'syesule': 'aggannam',
    'ketiredd': 'aggannam',
    'sharkoth': 'aggannam',
    'rundevak': 'aggannam',
    'ahmshaiq': 'aggannam',
    'vijaupot': 'aggannam',
    'sudaveda': 'aggannam',
    'vankithe': 'aggannam',
    'gvatsala': 'aggannam',  # was in quip data, likely under aggannam
    'musaddm': 'jorrigal',
    'valavoju': 'jorrigal',
    'chikbal': 'jorrigal',
    'abhanwad': 'jorrigal',
    'thotteja': 'jorrigal',
    'ypreksha': 'kumarshu',
    'cheedel': 'kumarshu',
    'aggannam': 'kumarshu',
}

with open('shared-data.json', 'r') as f:
    db = json.load(f)

# Redistribute leaves to correct managers
all_leaves = db.get('leaves', {}).get('aggannam', [])
new_leaves = {}

for l in all_leaves:
    alias = l['alias']
    mgr = manager_map.get(alias, 'aggannam')
    if mgr not in new_leaves:
        new_leaves[mgr] = []
    new_leaves[mgr].append(l)

db['leaves'] = new_leaves

# Redistribute daily tracker
old_tracker = db.get('dailyTracker', {}).get('aggannam', {})
new_tracker = {}

for alias, dates in old_tracker.items():
    mgr = manager_map.get(alias, 'aggannam')
    if mgr not in new_tracker:
        new_tracker[mgr] = {}
    new_tracker[mgr][alias] = dates

db['dailyTracker'] = new_tracker

with open('shared-data.json', 'w') as f:
    json.dump(db, f)

# Print summary
for mgr, leaves in db['leaves'].items():
    print(f"{mgr}: {len(leaves)} leave records")
for mgr, aliases in db['dailyTracker'].items():
    print(f"{mgr} tracker: {len(aliases)} associates")
