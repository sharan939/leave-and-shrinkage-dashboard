with open('notes.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract the PRELOADED section
start = html.find('const PRELOADED = [')
if start < 0:
    print("ERROR: PRELOADED not found!")
    exit()

# Find the end of PRELOADED array
depth = 0
end = start
found_start = False
for i in range(start, len(html)):
    if html[i] == '[' and not found_start:
        found_start = True
        depth = 1
        continue
    if found_start:
        if html[i] == '[':
            depth += 1
        elif html[i] == ']':
            depth -= 1
            if depth == 0:
                end = i + 1
                break

preloaded_text = html[start:end]
print(f"PRELOADED section: {len(preloaded_text)} chars")
print(f"First 200 chars: {preloaded_text[:200]}")
print(f"Last 100 chars: {preloaded_text[-100:]}")

# Check for common JS issues
if "\\n" in preloaded_text:
    print("\nWARNING: Contains literal backslash-n (might be double-escaped)")
    # Count occurrences
    print(f"  \\\\n count: {preloaded_text.count(chr(92)+'n')}")
