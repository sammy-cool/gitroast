import os
import re

directories = ['client/src/components', 'client/src/app']

replacements = {
    '#141414': 'var(--bg-card, #ffffff)',
    '#1a1a1a': 'var(--bg-primary, #f8fafc)',
    '#1A1A1A': 'var(--bg-primary, #f8fafc)',
    '#070707': 'var(--bg-primary, #f8fafc)',
    '#0A0A0A': 'var(--bg-primary, #f8fafc)',
    '#0a0a0a': 'var(--bg-primary, #f8fafc)',
    '#0F0F0F': 'var(--bg-primary, #f8fafc)',
    '#222222': '#e2e8f0',
    '#222': '#e2e8f0',
    '#111111': 'var(--bg-elevated, #ffffff)',
    '#111': 'var(--bg-elevated, #ffffff)',
}

og_replacements = {
    '#070707': '#FAFAFA',
    '#0F0F0F': '#FFFFFF',
    '#141414': '#FFFFFF',
    '#0A0A0A': '#FAFAFA',
    '#0a0a0a': '#FAFAFA',
    '#111111': '#FFFFFF',
    '#111': '#FFFFFF',
    '#222222': '#e2e8f0',
    '#222': '#e2e8f0',
    '#1a1a1a': '#FAFAFA',
    '#1A1A1A': '#FAFAFA',
}

# Add Rule 7 educational comments when replacing
comment = " /* Rule 7: Use Luminous light-mode variables instead of hardcoded dark hex codes */"

for d in directories:
    for root, _, files in os.walk(d):
        for file in files:
            if not (file.endswith('.jsx') or file.endswith('.js')):
                continue
            
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            is_og = 'api/og' in filepath or 'api/og-battle' in filepath or 'api/badge' in filepath
            
            reps = og_replacements if is_og else replacements
            
            new_content = content
            # sort keys by length descending to replace longer hex codes first (e.g., #222222 before #222)
            for k in sorted(reps.keys(), key=len, reverse=True):
                # use regex to ensure we don't replace #111 inside #111827
                # negative lookahead for valid hex characters
                pattern = re.compile(k + r'(?![0-9a-fA-F])')
                
                # Check if file has match
                if pattern.search(new_content):
                    # We might want to add a comment but it could break inline JSX if not careful.
                    # The prompt says: "Use Rule 7 educational comments."
                    # E.g. in styled-jsx: /* Rule 7: ... */
                    # Or in inline styles: // Rule 7: ...
                    # It's safer to just replace and then manually add a comment or just add a JS comment at the top of the file.
                    # Wait, if we append a comment on the same line, it might break JSX inline style: `backgroundColor: "var(--bg-card, #ffffff)" /* Rule 7... */` - actually this breaks JS object literal syntax!
                    # For styled-jsx, `background: var(--bg-card, #ffffff); /* Rule 7... */` is fine.
                    # Let's just do a simple replace first.
                    pass
            
            for k in sorted(reps.keys(), key=len, reverse=True):
                pattern = re.compile(k + r'(?![0-9a-fA-F])')
                
                # Only add comment if it's styled-jsx (css) and not inside an object literal
                def replacer(match):
                    return reps[k]
                
                new_content = pattern.sub(replacer, new_content)
                
            if new_content != content:
                # Add Rule 7 comment at the top of the file if modified
                if "// Rule 7: Eradicate all remaining hardcoded Dark Mode Hex Codes" not in new_content:
                    new_content = "// Rule 7: Eradicate all remaining hardcoded Dark Mode Hex Codes. Switched to Luminous light-mode variables.\n" + new_content
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")

