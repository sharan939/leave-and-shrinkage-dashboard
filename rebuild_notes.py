import json

# The notes data as proper Python strings (newlines will be correctly escaped for JS)
notes_data = [
    {
        "id": 1001,
        "title": "RCC - Most Repeated (30 Questions)",
        "category": "rcc",
        "tags": ["important", "repeated", "IS456"],
        "content": """MOST REPEATED RCC QUESTIONS - TSPSC AEE

Q1. Partial safety factor for concrete in limit state of collapse?
Ans: 1.5

Q2. Partial safety factor for steel?
Ans: 1.15

Q3. Maximum strain in concrete at failure?
Ans: 0.0035

Q4. xu,max/d for Fe415?
Ans: 0.48

Q5. xu,max/d for Fe500?
Ans: 0.46

Q6. xu,max/d for Fe250?
Ans: 0.53

Q7. Mu,lim for Fe415?
Ans: 0.138 fck.b.d2

Q8. Min tension reinforcement in beam?
Ans: As,min = 0.85bd/fy

Q9. Max reinforcement in beam?
Ans: 4% of bD

Q10. Max spacing of shear reinforcement?
Ans: 0.75d or 300mm whichever less

Q11. One-way slab: Ly/Lx > ?
Ans: 2

Q12. Distribution steel HYSD?
Ans: 0.12%

Q13. Span/depth simply supported slab?
Ans: 20

Q14. Span/depth cantilever?
Ans: 7

Q15. Short column: Le/D <= ?
Ans: 12

Q16. Pu short column?
Ans: 0.4fck.Ac + 0.67fy.Asc

Q17. Min steel in column?
Ans: 0.8%

Q18. Max steel in column?
Ans: 6%

Q19. Ties spacing?
Ans: Least of: least dimension, 16d, 300mm

Q20. Ld for Fe415 M20?
Ans: 47 phi

Q21. Punching shear at?
Ans: d/2 from column face

Q22. One-way shear at?
Ans: d from column face

Q23. Cover beam/column/footing?
Ans: 25/40/50 mm

Q24. Modular ratio M20?
Ans: 13.33

Q25. Load factor DL+LL?
Ans: 1.5DL + 1.5LL

Q26. Anchorage 90 degree bend?
Ans: 8 phi

Q27. Side face reinforcement when depth >?
Ans: 750mm

Q28. Min grade prestressed concrete?
Ans: M30

Q29. Concordant cable produces?
Ans: No secondary moments

Q30. Kern distance rectangular?
Ans: D/6 from centroid

FORMULAS:
Design strength concrete = 0.447fck
Design strength steel = 0.87fy
Ld = 0.87fy x phi / (4 x tau_bd)
tau_bd M20 deformed = 1.92 N/mm2"""
    },
    {
        "id": 1002,
        "title": "SOM - Most Repeated (30 Questions)",
        "category": "som",
        "tags": ["important", "repeated", "formulas"],
        "content": """MOST REPEATED SOM QUESTIONS - TSPSC AEE

Q1. E, G, mu relation? E = 2G(1+mu). Steel: E=200, G=80, mu=?
Ans: 0.25

Q2. E, K, mu relation? Max Poisson ratio incompressible?
Ans: 0.5

Q3. Elongation of bar?
Ans: delta = PL/AE

Q4. Stress sudden load vs gradual?
Ans: 2 times

Q5. Thermal stress?
Ans: E x alpha x T

Q6. Max BM simply supported UDL?
Ans: wL2/8 at midspan

Q7. Max BM cantilever point load free end?
Ans: PL at fixed end

Q8. Max BM cantilever UDL?
Ans: wL2/2 at fixed end

Q9. Fixed beam central load FEM?
Ans: PL/8

Q10. Fixed beam UDL FEM?
Ans: wL2/12

Q11. Bending equation?
Ans: M/I = sigma/y = E/R

Q12. Section modulus rectangular?
Ans: bd2/6

Q13. Max shear stress rectangular?
Ans: 1.5 V/A

Q14. Max shear stress circular?
Ans: 4V/3A

Q15. Deflection SS beam central load?
Ans: PL3/48EI

Q16. Deflection SS beam UDL?
Ans: 5wL4/384EI

Q17. Deflection cantilever point load?
Ans: PL3/3EI

Q18. Torsion equation?
Ans: T/J = tau/r = G.theta/L

Q19. Polar MOI solid shaft?
Ans: pi.d4/32

Q20. Max shear stress shaft?
Ans: 16T/(pi.d3)

Q21. Euler load both ends pinned?
Ans: pi2.EI/L2

Q22. Effective length fixed-fixed?
Ans: 0.5L

Q23. Effective length fixed-free?
Ans: 2L

Q24. Hoop stress thin cylinder?
Ans: pd/2t

Q25. Longitudinal stress thin cylinder?
Ans: pd/4t

Q26. Hoop:Longitudinal ratio?
Ans: 2:1

Q27. Carry over factor far end fixed?
Ans: 1/2

Q28. Stiffness far end fixed?
Ans: 4EI/L

Q29. Stiffness far end pinned?
Ans: 3EI/L

Q30. Shape factor rectangular?
Ans: 1.5"""
    },
    {
        "id": 1003,
        "title": "Fluid Mechanics - Most Repeated (25 Questions)",
        "category": "fm",
        "tags": ["important", "repeated", "hydraulics"],
        "content": """MOST REPEATED FLUID MECHANICS - TSPSC AEE

Q1. Reynolds number?
Ans: Re = rho.V.D/mu = VD/nu

Q2. Laminar flow Re < ?
Ans: 2000

Q3. Turbulent flow Re > ?
Ans: 4000

Q4. Bernoulli equation?
Ans: P/rho.g + V2/2g + z = constant

Q5. Continuity equation?
Ans: A1.V1 = A2.V2

Q6. Darcy-Weisbach hf = ?
Ans: fLV2/2gD

Q7. Friction factor laminar?
Ans: f = 64/Re

Q8. Vmax/Vavg laminar pipe?
Ans: 2

Q9. Manning equation?
Ans: V = (1/n).R^(2/3).S^(1/2)

Q10. Hydraulic radius R?
Ans: A/P (area/wetted perimeter)

Q11. Most economical rectangular channel?
Ans: b = 2d

Q12. Critical depth rectangular yc?
Ans: (q2/g)^(1/3)

Q13. Froude number critical flow?
Ans: Fr = 1

Q14. Subcritical flow Fr < 1 depth?
Ans: Greater than critical depth

Q15. Hydraulic jump changes from?
Ans: Supercritical to subcritical

Q16. Energy loss hydraulic jump?
Ans: (y2-y1)3 / (4.y1.y2)

Q17. Metacentric height stability?
Ans: GM = BM - BG = I/V - BG (positive = stable)

Q18. Centre of pressure below centroid?
Ans: Ig/(A.ybar)

Q19. Cd venturimeter?
Ans: 0.95 to 0.98

Q20. Pitot tube measures?
Ans: Velocity at a point

Q21. Water hammer caused by?
Ans: Sudden closure of valve

Q22. Hardy-Cross method for?
Ans: Pipe network analysis

Q23. HGL represents?
Ans: P/rho.g + z

Q24. TEL above HGL by?
Ans: V2/2g

Q25. Head loss sudden expansion?
Ans: (V1-V2)2/2g"""
    },
    {
        "id": 1004,
        "title": "Soil Mechanics - Most Repeated (25 Questions)",
        "category": "sm",
        "tags": ["important", "repeated", "geotechnical"],
        "content": """MOST REPEATED SOIL MECHANICS - TSPSC AEE

Q1. Void ratio e?
Ans: Vv/Vs

Q2. Porosity n?
Ans: Vv/V = e/(1+e)

Q3. Relationship?
Ans: Se = wGs

Q4. Dry density?
Ans: gamma/(1+w)

Q5. Plasticity Index PI?
Ans: LL - PL

Q6. A-line equation?
Ans: PI = 0.73(LL-20)

Q7. Soils above A-line?
Ans: Clays

Q8. Darcy law v?
Ans: ki

Q9. Constant head test for?
Ans: Coarse grained (sand/gravel)

Q10. Falling head test for?
Ans: Fine grained (silt/clay)

Q11. Quick sand critical gradient?
Ans: ic = (Gs-1)/(1+e) approx 1.0

Q12. Standard Proctor rammer?
Ans: 2.6kg, 310mm drop, 3 layers, 25 blows

Q13. Modified Proctor rammer?
Ans: 4.89kg, 450mm drop, 5 layers, 25 blows

Q14. Tv for 50% consolidation?
Ans: 0.197

Q15. Tv for 90% consolidation?
Ans: 0.848

Q16. Cc (Terzaghi-Peck)?
Ans: 0.009(LL-10)

Q17. Mohr-Coulomb tau?
Ans: c + sigma.tan(phi)

Q18. Terzaghi bearing capacity strip?
Ans: qu = cNc + qNq + 0.5.gamma.B.Ngamma

Q19. Square footing c factor?
Ans: 1.3cNc

Q20. Rankine Ka?
Ans: (1-sin phi)/(1+sin phi)

Q21. Rankine Kp?
Ans: (1+sin phi)/(1-sin phi)

Q22. K0 at rest?
Ans: 1 - sin phi

Q23. FOS overturning retaining wall?
Ans: >= 2.0

Q24. FOS sliding?
Ans: >= 1.5

Q25. Vane shear test for?
Ans: In-situ undrained shear strength of soft clay"""
    },
    {
        "id": 1005,
        "title": "Environmental Engg - Most Repeated (20 Questions)",
        "category": "env",
        "tags": ["important", "repeated", "water-treatment"],
        "content": """MOST REPEATED ENVIRONMENTAL ENGG - TSPSC AEE

Q1. Per capita water demand?
Ans: 135 lpcd (towns), 150-200 lpcd (cities)

Q2. Residual chlorine after disinfection?
Ans: 0.2 mg/L minimum

Q3. BOD5 at 20C is what % of ultimate?
Ans: 68%

Q4. BOD formula?
Ans: BODt = Lo(1 - e^(-k.t))

Q5. Detention time sedimentation tank?
Ans: 2-4 hours

Q6. Detention time septic tank?
Ans: 24 hours minimum

Q7. Self-cleansing velocity sewer?
Ans: 0.6 to 0.9 m/s

Q8. Max velocity sewer?
Ans: 3.0 m/s

Q9. pH drinking water?
Ans: 6.5 to 8.5

Q10. Hardness limit?
Ans: 200 mg/L desirable, 600 permissible

Q11. TDS limit?
Ans: 500 mg/L desirable, 2000 permissible

Q12. Turbidity limit?
Ans: 1 NTU desirable, 5 NTU permissible

Q13. MLSS in activated sludge?
Ans: 1500-3500 mg/L

Q14. SVI good settling?
Ans: 50-150 mL/g

Q15. F/M ratio ASP?
Ans: 0.2-0.5 kg BOD/kg MLSS/day

Q16. DO for fish survival?
Ans: > 4 mg/L

Q17. Noise limit residential?
Ans: 55 dB day, 45 dB night

Q18. Fire demand Kuichling?
Ans: Q = 3182 sqrt(P) lit/min

Q19. Peak factor?
Ans: 1.5 to 2.5

Q20. Trickling filter low rate loading?
Ans: 1-4 m3/m3/day"""
    },
    {
        "id": 1006,
        "title": "Transportation - Most Repeated (20 Questions)",
        "category": "trans",
        "tags": ["important", "repeated", "highway"],
        "content": """MOST REPEATED TRANSPORTATION - TSPSC AEE

Q1. CBR test for?
Ans: Pavement thickness design

Q2. Camber cement concrete road?
Ans: 1.7% to 2%

Q3. Camber bituminous road?
Ans: 2% to 2.5%

Q4. Ruling gradient plains?
Ans: 1 in 30 (3.3%)

Q5. SSD formula?
Ans: vt + v2/2gf

Q6. Superelevation e?
Ans: V2/127R (V in kmph)

Q7. Max superelevation?
Ans: 7% plain, 10% hilly

Q8. Ruling min radius?
Ans: R = V2/127(e+f)

Q9. Extra widening?
Ans: We = nl2/2R + V/(9.5 sqrt R)

Q10. Transition curve India?
Ans: Spiral (clothoid)

Q11. Length transition Ls?
Ans: V3/(CR)

Q12. Marshall test for?
Ans: Bituminous mix design

Q13. Penetration test conditions?
Ans: 25C, 100g, 5 seconds

Q14. Ductility test conditions?
Ans: 27C, 5 cm/min

Q15. Softening point test?
Ans: Ring and Ball method

Q16. Group Index formula?
Ans: GI = 0.2a + 0.005ac + 0.01bd

Q17. IRC C value?
Ans: 0.5 to 0.8 m/s3

Q18. OSD components?
Ans: d1 + d2 + d3

Q19. Min sight distance?
Ans: SSD (Stopping Sight Distance)

Q20. Flexible pavement layers?
Ans: Subgrade, sub-base, base, surface"""
    },
    {
        "id": 1007,
        "title": "Steel Structures - Most Repeated (20 Questions)",
        "category": "steel",
        "tags": ["important", "repeated", "IS800"],
        "content": """MOST REPEATED STEEL STRUCTURES - TSPSC AEE

Q1. Partial safety factor steel yielding?
Ans: gamma_m0 = 1.10

Q2. Partial safety factor ultimate?
Ans: gamma_m1 = 1.25

Q3. Effective length both ends pinned?
Ans: L

Q4. Effective length both ends fixed?
Ans: 0.65L

Q5. Max slenderness compression member?
Ans: 180

Q6. Max slenderness tension member?
Ans: 400

Q7. Min edge distance bolt?
Ans: 1.7 x hole diameter

Q8. Min pitch bolts?
Ans: 2.5 x bolt diameter

Q9. Effective throat fillet weld?
Ans: 0.7 x size of weld

Q10. Min fillet weld 10-20mm plate?
Ans: 5mm

Q11. Max fillet weld at edge?
Ans: thickness - 1.5mm

Q12. Gusset plate min thickness?
Ans: 8mm

Q13. Lug angle purpose?
Ans: Reduce connection length (shear lag)

Q14. Deflection limit beam imposed?
Ans: L/300

Q15. Deflection limit total?
Ans: L/240

Q16. Net section with holes?
Ans: An = (b - n.dh + sum p2/4g).t

Q17. Max pitch tension?
Ans: 16t or 200mm whichever less

Q18. Bearing strength bolt?
Ans: Vdpb = 2.5.kb.d.t.fu/gamma_mb

Q19. Web crippling checked at?
Ans: Concentrated loads and reactions

Q20. Column base plate area?
Ans: A = P/(0.45fck)"""
    },
    {
        "id": 1008,
        "title": "Surveying - Most Repeated (15 Questions)",
        "category": "survey",
        "tags": ["important", "repeated"],
        "content": """MOST REPEATED SURVEYING - TSPSC AEE

Q1. Least count vernier theodolite?
Ans: 20 seconds

Q2. Prismatic compass measures?
Ans: Whole circle bearing (WCB)

Q3. Surveyor compass measures?
Ans: Reduced bearing (QB)

Q4. Contour lines close together?
Ans: Steep slope

Q5. Contour lines far apart?
Ans: Gentle slope

Q6. Reciprocal leveling eliminates?
Ans: Curvature and refraction error

Q7. Combined correction curvature+refraction?
Ans: 0.0673 d2 (d in km, result in m)

Q8. Tacheometry D?
Ans: Ks + C (K=100, s=staff intercept)

Q9. GPS min satellites?
Ans: 4

Q10. Total station combines?
Ans: Theodolite + EDM + computer

Q11. Plane table methods?
Ans: Radiation, intersection, resection, traversing

Q12. Three-point problem?
Ans: Resection using 3 known points

Q13. EDM principle?
Ans: Time of electromagnetic wave travel

Q14. Two contour lines same value?
Ans: Cliff or overhang

Q15. Benchmark types?
Ans: GTS, permanent, arbitrary, temporary"""
    },
    {
        "id": 1009,
        "title": "Hydrology & Irrigation - Most Repeated (15 Questions)",
        "category": "fm",
        "tags": ["important", "repeated", "irrigation"],
        "content": """MOST REPEATED HYDROLOGY & IRRIGATION - TSPSC AEE

Q1. Rational formula peak runoff?
Ans: Q = CIA/360

Q2. Unit hydrograph?
Ans: 1cm excess rainfall over unit time

Q3. Duty D?
Ans: Area irrigated per unit discharge (ha/cumec)

Q4. Delta?
Ans: Total depth of water for crop in base period

Q5. D, B, delta relation?
Ans: D = 8.64B/delta

Q6. Lacey silt factor?
Ans: f = 1.76 sqrt(d_mm)

Q7. Kennedy critical velocity?
Ans: V0 = 0.55 m D^0.64

Q8. Bligh creep theory?
Ans: Safe gradient = 1/C

Q9. Khosla theory based on?
Ans: Flow nets and pressure distribution

Q10. Ogee spillway shaped like?
Ans: Lower nappe of sharp-crested weir

Q11. Runoff coefficient urban?
Ans: 0.7 to 0.9

Q12. Runoff coefficient forest?
Ans: 0.1 to 0.3

Q13. Thiessen polygon gives?
Ans: Weighted average rainfall

Q14. Lacey regime velocity?
Ans: V = (Qf2/140)^(1/6)

Q15. Siphon spillway works on?
Ans: Siphonic action"""
    },
    {
        "id": 1010,
        "title": "ALL FORMULAS - Quick Revision",
        "category": "general",
        "tags": ["formulas", "revision", "quick"],
        "content": """QUICK REVISION - ALL KEY FORMULAS

=== STRENGTH OF MATERIALS ===
E = 2G(1+mu) = 3K(1-2mu)
delta = PL/AE
M/I = sigma/y = E/R
T/J = tau/r = G.theta/L
Euler: Pcr = pi2.EI/Le2
Hoop: sigma = pd/2t
Deflection SS central: PL3/48EI
Deflection SS UDL: 5wL4/384EI

=== RCC (IS 456) ===
Mu,lim = 0.138fck.bd2 (Fe415)
Mu,lim = 0.133fck.bd2 (Fe500)
Pu = 0.4fck.Ac + 0.67fy.Asc
Ld = 0.87fy.phi/(4.tau_bd)
As,min = 0.85bd/fy

=== FLUID MECHANICS ===
Re = rho.V.D/mu
hf = fLV2/2gD (Darcy)
V = (1/n).R^(2/3).S^(1/2) (Manning)
yc = (q2/g)^(1/3)
Fr = V/sqrt(g.y)
Q = Cd.A.sqrt(2gH)

=== SOIL MECHANICS ===
Se = wGs
gamma_d = gamma/(1+w)
Ka = (1-sin phi)/(1+sin phi)
Kp = (1+sin phi)/(1-sin phi)
qu = cNc + qNq + 0.5.gamma.B.Ngamma
ic = (Gs-1)/(1+e)

=== TRANSPORTATION ===
SSD = vt + v2/2gf
e = V2/127R
R = V2/127(e+f)
Ls = V3/CR

=== ENVIRONMENTAL ===
BODt = Lo(1-e^(-kt))
Q = CIA/360 (Rational)

=== SURVEYING ===
D = Ks + C (tacheometry K=100)
Correction = 0.0673d2

=== STEEL (IS 800) ===
Effective throat = 0.7 x weld size
Min pitch = 2.5d
gamma_m0 = 1.10, gamma_m1 = 1.25"""
    }
]

# Convert to JavaScript
js_lines = ["const PRELOADED = ["]
for i, note in enumerate(notes_data):
    # Escape content for JS string
    content_escaped = note["content"].replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n")
    title_escaped = note["title"].replace("'", "\\'")
    tags_js = json.dumps(note["tags"])
    
    js_lines.append(f"  {{id:{note['id']},title:'{title_escaped}',category:'{note['category']}',tags:{tags_js},content:'{content_escaped}'}},")

js_lines.append("];")
preloaded_js = "\n".join(js_lines)

# Read the HTML file
with open('notes.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove old PRELOADED if exists
import re
html = re.sub(r'const PRELOADED = \[.*?\];', '', html, flags=re.DOTALL)

# Insert new PRELOADED before "const SK ="
html = html.replace('const SK =', preloaded_js + '\nconst SK =')

# Make sure the load function uses PRELOADED
old_load = "if (notes.length === 0) {\n    const now = new Date().toISOString();\n    PRELOADED.forEach(n => { notes.push({...n, created: now, updated: now}); });\n    save();\n  }"
if old_load not in html:
    # Find and replace whatever is there
    pattern = r'if \(notes\.length === 0\) \{[^}]*\}'
    new_load = """if (notes.length === 0) {
    var now = new Date().toISOString();
    for (var i = 0; i < PRELOADED.length; i++) {
      var n = PRELOADED[i];
      notes.push({id:n.id,title:n.title,content:n.content,category:n.category,tags:n.tags,created:now,updated:now});
    }
    save();
  }"""
    html = re.sub(pattern, new_load, html, count=1)

# Make sure resetNotes also uses proper loop
if 'function resetNotes' in html:
    old_reset_pattern = r'function resetNotes\(\) \{[^}]*\}'
    new_reset = """function resetNotes() {
  if (!confirm('Delete current notes and load study questions?')) return;
  localStorage.removeItem(SK);
  notes = [];
  var now = new Date().toISOString();
  for (var i = 0; i < PRELOADED.length; i++) {
    var n = PRELOADED[i];
    notes.push({id:n.id,title:n.title,content:n.content,category:n.category,tags:n.tags,created:now,updated:now});
  }
  save();
  renderList();
  if (notes.length > 0) openNote(notes[0].id);
  toast('Loaded ' + notes.length + ' study notes!');
}"""
    html = re.sub(old_reset_pattern, new_reset, html, count=1)

with open('notes.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f"SUCCESS! File rebuilt with {len(notes_data)} preloaded notes.")
print("Each note has proper escaped content.")
