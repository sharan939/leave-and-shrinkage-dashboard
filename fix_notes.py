import re

with open('notes.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add reset function before "// Init"
reset_fn = """
// Reset to preloaded notes
function resetNotes() {
  if (!confirm('This will delete all your custom notes and reload the study questions. Continue?')) return;
  localStorage.removeItem(SK);
  notes = [];
  const now = new Date().toISOString();
  PRELOADED.forEach(n => { notes.push({...n, created: now, updated: now}); });
  save();
  renderList();
  if (notes.length > 0) openNote(notes[0].id);
  toast('Notes reset with study questions!');
}

"""

html = html.replace('// Init\n', reset_fn + '// Init\n')

# Add reset button
old_btn = '<button class="btn btn-s" onclick="importNotes()">&#128228; Import</button>'
new_btn = old_btn + '\n<button class="btn btn-d" onclick="resetNotes()">&#128260; Load Questions</button>'
html = html.replace(old_btn, new_btn)

with open('notes.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Done! Reset button added.')
