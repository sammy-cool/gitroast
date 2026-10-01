import re

files = [
    'client/src/components/RoastCard.jsx',
    'client/src/components/BattleCard.jsx',
    'client/src/components/RepoRoastCard.jsx'
]

for fpath in files:
    with open(fpath, 'r') as f:
        content = f.read()

    # Replace white semi-transparent backgrounds with a light mode equivalent token
    content = re.sub(r'background:\s*rgba\(255,\s*255,\s*255,\s*0\.\d+\);', 'background: var(--bg-primary);', content)
    
    # Replace white semi-transparent borders with var(--border)
    content = re.sub(r'border(-top|-bottom|-left|-right)?:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.\d+\);', r'border\1: 1px solid var(--border);', content)
    
    with open(fpath, 'w') as f:
        f.write(content)

