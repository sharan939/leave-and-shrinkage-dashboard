with open('test_js.js', 'r', encoding='utf-8') as f:
    js = f.read()

# The problem is likely unescaped apostrophes in content strings
# Let's check each PRELOADED entry
import re

# Find content between content:' and the closing '},
# Simple check: count single quotes per line
lines = js.split('\n')
for i, line in enumerate(lines):
    if "content:'" in line:
        # Count quotes after content:'
        after = line.split("content:'", 1)[1]
        # This should end with '}, or '}]
        # Check if there's an unescaped ' inside
        in_string = True
        for j, ch in enumerate(after):
            if ch == '\\':
                continue  # skip next
            if ch == "'" and j > 0 and after[j-1] != '\\':
                # This closes the string
                remaining = after[j+1:j+5]
                if not remaining.startswith('}'):
                    print(f"PROBLEM line {i+1}, pos {j}: quote doesn't end object")
                    print(f"  Context: ...{after[max(0,j-30):j+30]}...")
                break
        print(f"Line {i+1}: content string length = {len(after)}")

# Better approach: just try to find the issue with node or a simple parser
# Check if there's a "don't" or "it's" type word
problem_words = ["don't", "it's", "won't", "can't", "doesn't", "isn't"]
for word in problem_words:
    if word in js:
        idx = js.index(word)
        print(f"\nFOUND UNESCAPED APOSTROPHE: '{word}' at position {idx}")
        print(f"Context: {js[max(0,idx-40):idx+40]}")
