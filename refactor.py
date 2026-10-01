import re

files = [
    'client/src/components/RoastCard.jsx',
    'client/src/components/BattleCard.jsx',
    'client/src/components/RepoRoastCard.jsx'
]

for fpath in files:
    with open(fpath, 'r') as f:
        content = f.read()

    # Generic replaces
    content = content.replace('linear-gradient(160deg, #111 0%, #180800 100%)', 'var(--bg-elevated)')
    content = content.replace('linear-gradient(160deg, #121212 0%, #190a02 100%)', 'var(--bg-elevated)')
    content = content.replace('linear-gradient(135deg, #110900 0%, #0F0F0F 100%)', 'var(--bg-elevated)')
    content = content.replace('linear-gradient(180deg, rgba(24, 12, 4, 0.5) 0%, rgba(10, 10, 10, 0.6) 100%)', 'var(--bg-elevated)')
    content = content.replace('linear-gradient(180deg, rgba(24, 12, 4, 0.45) 0%, rgba(10, 10, 10, 0.6) 100%)', 'var(--bg-elevated)')
    
    content = content.replace('background:      #161616;', 'background:      var(--bg-card);')
    content = content.replace('background:      #161616', 'background:      var(--bg-card)')
    
    content = content.replace('background:     #080808;', 'background:     var(--bg-primary);')
    content = content.replace('background: #080808;', 'background: var(--bg-primary);')
    
    content = content.replace('background:    rgba(0, 0, 0, 0.35);', 'background:    var(--bg-elevated);')
    content = content.replace('background: rgba(0, 0, 0, 0.3);', 'background: var(--bg-elevated);')
    content = content.replace('background: rgba(0, 0, 0, 0.2);', 'background: var(--bg-elevated);')
    content = content.replace('background: rgba(0, 0, 0, 0.4);', 'background: var(--bg-elevated);')
    
    content = content.replace('background: #0d0a08;', 'background: var(--bg-card);')
    content = content.replace('background: #0d0d0d;', 'background: var(--bg-card);')
    
    content = content.replace('background: rgba(13, 10, 8, 0.65);', 'background: var(--bg-elevated);')
    
    # Typography
    content = content.replace('color: #f0f0f0;', 'color: var(--text-primary);')
    
    # Borders - checking for any hardcoded like #222 or #1c1c1c? The prompt says "Ensure border colors are using var(--border) instead of hardcoded dark greys like #222 or #1c1c1c"
    # Actually I didn't see #222 or #1c1c1c in the files, they already use var(--border) heavily, but let me check just in case.
    content = re.sub(r'border:\s*1px\s*solid\s*(#222|#1c1c1c|rgba\(255,\s*255,\s*255,\s*0\.\d+\))', 'border: 1px solid var(--border)', content)
    
    with open(fpath, 'w') as f:
        f.write(content)

