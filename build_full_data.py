import json, shutil

# All weeks date mapping
weeks = {
    'w1': ['2025-12-29','2025-12-30','2025-12-31','2026-01-01','2026-01-02'],
    'w2': ['2026-01-05','2026-01-06','2026-01-07','2026-01-08','2026-01-09'],
    'w3': ['2026-01-12','2026-01-13','2026-01-14','2026-01-15','2026-01-16'],
    'w4': ['2026-01-19','2026-01-20','2026-01-21','2026-01-22','2026-01-23'],
    'w5': ['2026-01-26','2026-01-27','2026-01-28','2026-01-29','2026-01-30'],
    'w6': ['2026-02-02','2026-02-03','2026-02-04','2026-02-05','2026-02-06'],
    'w7': ['2026-02-09','2026-02-10','2026-02-11','2026-02-12','2026-02-13'],
    'w8': ['2026-02-16','2026-02-17','2026-02-18','2026-02-19','2026-02-20'],
    'w9': ['2026-02-23','2026-02-24','2026-02-25','2026-02-26','2026-02-27'],
    'w10': ['2026-03-02','2026-03-03','2026-03-04','2026-03-05','2026-03-06'],
    'w11': ['2026-03-09','2026-03-10','2026-03-11','2026-03-12','2026-03-13'],
    'w12': ['2026-03-16','2026-03-17','2026-03-18','2026-03-19','2026-03-20'],
    'w13': ['2026-03-23','2026-03-24','2026-03-25','2026-03-26','2026-03-27'],
    'w14': ['2026-03-30','2026-03-31','2026-04-01','2026-04-02','2026-04-03'],
    'w15': ['2026-04-06','2026-04-07','2026-04-08','2026-04-09','2026-04-10'],
    'w16': ['2026-04-13','2026-04-14','2026-04-15','2026-04-16','2026-04-17'],
    'w17': ['2026-04-20','2026-04-21','2026-04-22','2026-04-23','2026-04-24'],
    'w18': ['2026-04-27','2026-04-28','2026-04-29','2026-04-30','2026-05-01'],
}

# Full data for all associates across all weeks
data = {
'vankithe': {'w1':['WFO','WFO','WFO','WFO','WFO'],'w2':['WFO','WFO','WFO','WFO','WFO'],'w3':['WFO','WFO','WFO','WFO','WFO'],'w4':['WFO','WFO','WFO','WFO','CL'],'w5':['MO','WFO','WFO','WFO','WFO'],'w6':['WFO','WFO','WFO','WFO','WFO'],'w7':['WFO','WFO','WFO','WFO','WFO'],'w8':['WFO','WFO','WFO','WFO','WFO'],'w9':['SL','WFO','WFO','WFO','WFO'],'w10':['WFO','WFO','WFO','WFO','WFO'],'w11':['CL','WFO','WFO','SL','WFO'],'w12':['WFO','WFO','WFO','WFO','CL'],'w13':['WFO','WFO','WFO','WFO','WFO'],'w14':['WFO','WFO','WFO','WFO','WFO'],'w15':['WFO','CL','WFO','WFO','WFO'],'w16':['WFO','WFO','WFO','WFO','WFO'],'w17':['WFO','WFO','WFO','WFO','SL'],'w18':['WFO','WFO','WFO','SL','WFO']},
'gvatsala': {'w1':['WFO','WFO','WFO','WFO','WFO'],'w2':['SL','WFO','WFO','WFO','SL'],'w3':['WFO','WFO','WFO','WFO','SL'],'w4':['WFO','WFO','WFO','WFO','WFO'],'w5':['MO','WFO','WFO','WFO','WFO']},
'musaddm': {'w1':['WFO','WFO','WFO','WFO','WFO'],'w2':['WFO','WFO','WFO','WFO','WFO'],'w3':['WFO','WFO','WFO','WFO','WFO'],'w4':['AL','AL','AL','AL','AL'],'w5':['MO','AL','AL','AL','AL'],'w6':['AL','AL','AL','AL','AL'],'w7':['WFO','WFO','WFO','WFO','WFO'],'w8':['WFO','WFO','WFO','WFO','CL'],'w9':['WFO','WFO','WFO','WFO','CL'],'w10':['WFO','WFO','WFO','WFO','SL'],'w11':['WFO','SL','WFO','WFO','SL'],'w12':['WFO','WFO','WFO','WFO','OL'],'w13':['CL','WFO','WFO','WFO','WFO']},
'syesule': {'w1':['WFO','WFO','WFO','WFO','WFO'],'w2':['WFO','WFO','SL','WFO','WFO'],'w3':['WFO','WFO','WFO','WFO','WFO'],'w4':['WFO','WFO','SL','WFO','WFO'],'w5':['MO','SL','WFO','WFO','WFO'],'w6':['WFO','WFO','WFO','WFO','WFO'],'w7':['WFO','WFO','WFO','WFO','WFO'],'w8':['WFO','WFO','WFO','WFO','CL'],'w9':['WFO','WFO','WFO','WFO','CL'],'w10':['WFO','WFO','WFO','WFO','CL'],'w11':['WFO','WFO','WFO','WFO','CL'],'w12':['WFO','WFO','WFO','WFO','OL'],'w13':['CL','WFO','WFO','WFO','WFO'],'w14':['WFO','WFO','WFO','WFO','WFO'],'w15':['SL','WFO','WFO','WFO','WFO'],'w16':['WFO','WFO','WFO','WFO','WFO'],'w17':['WFO','WFO','WFO','WFO','WFO'],'w18':['SL','WFO','WFO','WFO','WFO']},
'ketiredd': {'w1':['WFO','WFO','WFO','WFO','WFO'],'w2':['WFO','WFO','WFO','WFO','WFO'],'w3':['AL','AL','AL','AL','AL'],'w4':['WFO','WFO','WFO','WFO','SL'],'w5':['MO','WFO','SL','WFO','WFO'],'w6':['WFO','SL','WFO','WFO','WFO'],'w7':['WFO','WFO','WFO','WFO','WFO'],'w8':['SL','WFO','WFO','WFO','WFO'],'w9':['WFO','WFO','WFO','WFO','WFO'],'w10':['WFO','WFO','WFO','WFO','WFO'],'w11':['SL','SL','SL','WFO','WFO'],'w12':['WFO','WFO','WFO','OL','CL'],'w13':['WFO','WFO','WFO','WFO','WFO'],'w14':['WFO','WFO','WFO','WFO','WFO'],'w15':['WFO','WFO','WFO','WFO','WFO'],'w16':['WFO','WFO','WFO','WFO','WFO'],'w17':['SL','WFO','WFO','WFO','SL'],'w18':['WFO','WFO','WFO','WFO','WFO']},
'muqeemah': {'w1':['WFO','WFO','WFO','OL','CL'],'w2':['WFO','WFO','SL','WFO','WFO'],'w3':['WFO','WFO','WFO','WFO','WFO'],'w4':['WFO','WFO','WFO','WFO','CL'],'w5':['MO','WFO','WFO','WFO','WFO'],'w6':['WFO','WFO','WFO','WFO','WFO'],'w7':['WFO','WFO','WFO','WFO','WFO'],'w8':['WFO','WFO','WFO','WFO','CL'],'w9':['WFO','WFO','WFO','WFO','CL'],'w10':['WFO','WFO','WFO','WFO','CL'],'w11':['WFO','WFO','WFO','WFO','CL'],'w12':['WFO','WFO','WFO','WFO','OL'],'w13':['CL','WFO','WFO','WFO','WFO'],'w14':['WFO','WFO','WFO','WFO','WFO'],'w15':['WFO','WFO','WFO','WFO','WFO'],'w16':['WFO','WFO','WFO','WFO','WFO'],'w17':['WFO','WFO','WFO','WFO','CL'],'w18':['WFO','WFO','WFO','WFO','WFO']},
'sharkoth': {'w1':['WFO','WFO','WFO','WFO','WFO'],'w2':['WFO','WFO','WFO','WFO','CL'],'w3':['CL','WFO','WFO','WFO','WFO'],'w4':['CL','WFO','CL','WFO','CL'],'w5':['MO','SL','SL','WFO','WFO'],'w6':['WFO','WFO','WFO','WFO','WFO'],'w7':['WFO','WFO','WFO','WFO','CL'],'w8':['CL','WFO','WFO','WFO','WFO'],'w9':['WFO','WFO','WFO','WFO','WFO'],'w10':['WFO','WFO','WFO','CL','WFO'],'w11':['WFO','WFO','WFO','WFO','WFO'],'w12':['WFO','WFO','WFO','OL','WFO'],'w13':['WFO','WFO','WFO','WFO','WFO'],'w14':['WFO','WFO','WFO','WFO','WFO'],'w15':['WFO','WFO','WFO','WFO','WFO'],'w16':['SL','WFO','WFO','WFO','WFO'],'w17':['WFO','WFO','WFO','WFO','CL'],'w18':['CL','WFO','WFO','WFO','WFO']},
'rundevak': {'w1':['WFO','WFO','WFO','WFO','WFO'],'w2':['WFO','WFO','WFO','WFO','WFO'],'w3':['AL','AL','AL','AL','AL'],'w4':['AL','WFO','WFO','WFO','WFO'],'w5':['MO','WFO','WFO','WFO','WFO'],'w6':['WFO','WFO','SL','WFO','WFO'],'w7':['WFO','WFO','WFO','WFO','WFO'],'w8':['WFO','WFO','WFO','WFO','WFO'],'w9':['WFO','SL','SL','WFO','WFO'],'w10':['WFO','WFO','WFO','WFO','CL'],'w11':['WFO','WFO','WFO','SL','WFO'],'w12':['AL','AL','AL','AL','AL'],'w13':['WFO','WFO','WFO','CL','CL'],'w14':['WFO','WFO','WFO','WFO','SL'],'w15':['SL','WFO','WFO','WFO','WFO'],'w16':['WFO','WFO','WFO','WFO','WFO'],'w17':['WFO','WFO','WFO','WFO','WFO'],'w18':['WFO','WFO','WFO','WFO','WFO']},
'valavoju': {'w1':['WFO','WFO','WFO','WFO','WFO'],'w2':['WFO','AL','AL','AL','AL'],'w3':['AL','AL','AL','AL','AL'],'w4':['WFO','WFO','WFO','WFO','WFO'],'w5':['MO','WFO','WFO','WFO','WFO'],'w6':['WFO','WFO','SL','WFO','WFO'],'w7':['WFO','WFO','WFO','WFO','WFO'],'w8':['WFO','WFO','WFO','WFO','WFO'],'w9':['WFO','WFO','WFO','WFO','WFO'],'w10':['WFO','WFO','OL','WFO','WFO'],'w11':['WFO','WFO','WFO','WFO','WFO'],'w12':['WFO','WFO','WFO','OL','CL'],'w13':['WFO','WFO','WFO','CL','CL']},
'sudaveda': {'w1':['WFO','WFO','WFO','OL','WFO'],'w2':['WFO','WFO','WFO','WFO','WFO'],'w3':['AL','AL','AL','AL','AL'],'w4':['WFO','WFO','WFO','WFO','WFO'],'w5':['MO','WFO','WFO','WFO','WFO'],'w6':['SL','WFO','WFO','WFO','WFO'],'w7':['SL','WFO','WFO','WFO','WFO'],'w8':['WFO','WFO','WFO','CL','CL'],'w9':['SL','WFO','WFO','WFO','WFO'],'w10':['WFO','WFO','WFO','SL','WFO'],'w11':['WFO','WFO','WFO','WFO','WFO'],'w12':['WFO','WFO','SL','WFO','WFO'],'w13':['WFO','WFO','WFO','WFO','WFO'],'w14':['WFO','WFO','WFO','WFO','WFO'],'w15':['SL','WFO','WFO','WFO','WFO'],'w16':['WFO','WFO','SL','SL','WFO'],'w17':['WFO','WFO','SL','WFO','WFO'],'w18':['WFO','WFO','WFO','WFO','WFO']},
'ahmshaiq': {'w1':['SL','WFO','WFO','OL','WFO'],'w2':['WFO','WFO','WFO','WFO','WFO'],'w3':['SL','WFO','WFO','WFO','WFO'],'w4':['WFH','WFH','WFH','WFH','AL'],'w5':['MO','AL','AL','AL','AL'],'w6':['AL','AL','AL','AL','AL'],'w7':['AL','AL','AL','AL','AL'],'w8':['SL','WFO','WFO','WFO','SL'],'w9':['WFO','WFO','SL','WFO','WFO'],'w10':['WFO','SL','WFO','SL','SL'],'w11':['AL','AL','AL','AL','AL'],'w12':['AL','AL','AL','AL','AL'],'w13':['AL','AL','AL','AL','AL'],'w14':['WFO','WFO','WFO','WFO','WFO'],'w15':['WFO','WFO','WFO','WFO','WFO'],'w16':['WFO','CL','WFO','WFO','WFO'],'w17':['WFO','WFO','WFO','WFO','WFO'],'w18':['WFO','WFO','WFO','WFO','WFO']},
'vijaupot': {'w1':['WFO','WFO','WFO','OL','CL'],'w2':['WFO','WFO','WFO','WFO','WFO'],'w3':['AL','AL','AL','AL','AL'],'w4':['AL','WFO','WFO','WFO','WFO'],'w5':['MO','WFO','WFO','WFO','SL'],'w6':['WFO','WFO','WFO','WFO','WFO'],'w7':['WFO','WFO','WFO','WFO','WFO'],'w8':['WFO','WFO','WFO','WFO','WFO'],'w9':['WFO','WFO','WFO','WFO','WFO'],'w10':['WFO','WFO','WFO','WFO','WFO'],'w11':['WFO','WFO','WFO','WFO','WFO'],'w12':['WFO','WFO','WFO','OL','CL'],'w13':['WFO','WFO','WFO','WFO','WFO'],'w14':['WFO','WFO','WFO','WFO','WFO'],'w15':['WFO','WFO','WFO','WFO','WFO'],'w16':['CL','WFO','WFO','WFO','WFO'],'w17':['WFO','WFO','WFO','WFO','WFO'],'w18':['SL','SL','SL','SL','WFO']},
'chikbal': {'w1':['AL','AL','AL','OL','AL'],'w2':['WFO','WFO','WFO','WFO','WFO'],'w3':['WFO','WFO','OL','WFO','WFO'],'w4':['WFO','WFO','SL','WFO','WFO'],'w5':['MO','WFO','WFO','WFO','WFO'],'w6':['WFO','WFO','WFO','WFO','WFO'],'w7':['SL','SL','WFO','WFO','WFO'],'w8':['WFO','WFO','WFO','SL','WFO'],'w9':['WFO','WFO','CL','SL','WFO'],'w10':['WFO','WFO','WFO','WFO','WFO'],'w11':['WFO','WFO','WFO','CL','WFO'],'w12':['WFO','SL','WFO','OL','CL'],'w13':['WFO','WFO','CL','WFO','WFO']},
'ypreksha': {'w1':['AL','AL','AL','OL','CL'],'w2':['WFO','WFO','WFO','WFO','WFO'],'w3':['SL','WFO','OL','CL','WFO'],'w4':['CL','WFO','WFO','WFO','WFO'],'w5':['MO','WFO','WFO','WFO','WFO'],'w6':['WFO','SL','SL','WFO','WFO'],'w7':['WFO','WFO','WFO','WFO','WFO'],'w8':['WFO','WFO','WFO','AL','AL'],'w9':['AL','AL','AL','AL','AL'],'w10':['AL','AL','AL','AL','AL'],'w11':['AL','AL','AL','AL','AL'],'w12':['AL','AL','AL','AL','AL'],'w13':['AL','AL','AL','AL','AL']},
'cheedel': {'w1':['AL','AL','CL','CL','WFO'],'w2':['WFO','WFO','WFO','WFO','WFO'],'w3':['WFO','WFO','WFO','WFO','WFO'],'w4':['WFO','WFO','WFO','HD','CL'],'w5':['MO','WFO','WFO','WFO','WFO'],'w6':['WFO','WFO','WFO','WFO','WFO'],'w7':['WFO','WFO','WFO','WFO','WFO'],'w8':['WFO','WFO','WFO','WFO','WFO'],'w9':['WFO','WFO','WFO','WFO','WFO'],'w10':['WFO','WFO','WFO','WFO','WFO'],'w11':['WFO','WFO','WFO','WFO','WFO'],'w12':['WFO','WFO','WFO','OL','CL'],'w13':['WFO','WFO','WFO','WFO','WFO']},
'abhanwad': {'w1':['WFO','WFO','WFO','WFO','WFO'],'w2':['WFO','WFO','WFO','WFO','WFO'],'w3':['SL','WFO','OL','WFO','WFO'],'w4':['WFO','WFO','WFO','WFO','SL'],'w5':['MO','WFO','WFO','WFO','WFO'],'w6':['SL','WFO','WFO','WFO','WFO'],'w7':['SL','WFO','WFO','CL','CL'],'w8':['WFO','WFO','WFO','WFO','WFO'],'w9':['WFO','WFO','SL','WFO','WFO'],'w10':['WFO','WFO','OL','WFO','WFO'],'w11':['SL','WFO','WFO','SL','SL'],'w12':['WFO','WFO','WFO','WFO','OL'],'w13':['WFO','WFO','WFO','WFO','WFO']},
'thotteja': {'w1':['WFO','WFO','CL','CL','CL'],'w2':['WFO','WFO','WFO','WFO','WFO'],'w3':['WFO','WFO','WFO','WFO','WFO'],'w4':['WFO','WFO','WFO','WFO','WFO'],'w5':['MO','WFO','WFO','WFO','WFO'],'w6':['SL','WFO','WFO','WFO','WFO'],'w7':['WFO','WFO','WFO','WFO','WFO'],'w8':['WFO','WFO','WFO','WFO','WFO'],'w9':['WFO','WFO','WFO','WFO','WFO'],'w10':['WFO','WFO','WFO','WFO','WFO'],'w11':['WFO','WFO','WFO','WFO','WFO'],'w12':['WFO','WFO','WFO','OL','WFO'],'w13':['WFO','WFO','WFO','WFO','WFO']},
'aggannam': {'w1':['AL','AL','AL','AL','AL'],'w2':['WFO','WFO','WFO','WFO','WFO'],'w3':['WFO','SL','WFO','WFO','WFO'],'w4':['WFO','WFO','WFO','WFO','WFO'],'w5':['MO','WFO','WFO','WFO','WFO'],'w6':['WFO','WFO','WFO','WFO','SL'],'w7':['WFO','WFO','WFO','WFO','WFO']},
}

# Build database
db = {"leaves": {"aggannam": []}, "dailyTracker": {"aggannam": {}}, "monthlySheets": {}}

status_map = {'WFO':'present','WFH':'present','CL':'absent','SL':'absent','AL':'absent','OL':'absent','MO':'mandate_off','HD':'halfday'}
leave_type_map = {'CL':'planned','SL':'unplanned','AL':'unplanned','OL':'planned','MO':'mandatory_off','HD':'halfday'}

leave_id = 3000
for alias, week_data in data.items():
    db["dailyTracker"]["aggannam"][alias] = {}
    for wk, statuses in week_data.items():
        if wk not in weeks:
            continue
        dates = weeks[wk]
        for i, code in enumerate(statuses):
            if i >= len(dates):
                break
            date = dates[i]
            st = status_map.get(code, 'present')
            lt = leave_type_map.get(code, '')
            db["dailyTracker"]["aggannam"][alias][date] = {"status": st, "leaveType": lt, "notes": code}
            if code not in ['WFO', 'WFH']:
                leave_id += 1
                days = 0.5 if code == 'HD' else 1
                ltype = leave_type_map.get(code, 'unplanned')
                db["leaves"]["aggannam"].append({
                    "id": "L" + str(leave_id),
                    "alias": alias,
                    "type": ltype,
                    "from": date,
                    "to": date,
                    "days": days,
                    "status": "approved",
                    "reason": code,
                    "appliedOn": "2026-01-01"
                })

with open("shared-data.json", "w") as f:
    json.dump(db, f)

shutil.copy("shared-data.json", "deploy/shared-data.json")
shutil.copy("shared-data.json", "C:/Users/sharkoth/github-upload/shared-data.json")

print(f"SUCCESS!")
print(f"  Leave records: {len(db['leaves']['aggannam'])}")
print(f"  Associates: {len(db['dailyTracker']['aggannam'])}")
total_days = sum(len(v) for v in db['dailyTracker']['aggannam'].values())
print(f"  Total day entries: {total_days}")
