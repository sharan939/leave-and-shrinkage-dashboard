with open('notes.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add button after Import button
idx = html.find('importNotes()')
if idx > 0:
    end_btn = html.find('</button>', idx) + len('</button>')
    new_btn = '\n<button class="btn btn-d" onclick="resetNotes()">LOAD QUESTIONS</button>'
    html = html[:end_btn] + new_btn + html[end_btn:]
    print('Button added!')

# 2. Add resetNotes function before "// Init"
if 'function resetNotes' not in html:
    reset_fn = '''
function resetNotes() {
  if (!confirm('Delete current notes and load study questions?')) return;
  localStorage.removeItem(SK);
  notes = [];
  var now = new Date().toISOString();
  for (var i = 0; i < PRELOADED.length; i++) {
    var n = PRELOADED[i];
    notes.push({id:n.id, title:n.title, content:n.content, category:n.category, tags:n.tags, created:now, updated:now});
  }
  save();
  renderList();
  if (notes.length > 0) openNote(notes[0].id);
  toast('Loaded ' + notes.length + ' study notes!');
}

'''
    html = html.replace('// Init', reset_fn + '// Init')
    print('Function added!')

with open('notes.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('DONE - File saved. Refresh your browser and click LOAD QUESTIONS button.')
