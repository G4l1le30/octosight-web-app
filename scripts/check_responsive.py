import os, re

frontend = 'frontend'
files = [
    'components/admin/KanbanBoard.tsx',
    'components/home/Hero.tsx',
    'components/layout/Navbar.tsx',
    'app/(user)/check/page.tsx',
    'components/auth/AuthCard.tsx',
    'app/(auth)/login/page.tsx',
]

for rel in files:
    fp = os.path.join(frontend, rel)
    with open(fp, encoding='utf-8') as f:
        content = f.read()
    classname_matches = re.findall(r'className=["\']([^"\']+)["\']', content)
    cn_matches = re.findall(r'cn\("([^"]+)"', content)
    total = classname_matches + cn_matches
    md_count = sum(1 for c in total if 'md:' in c)
    print(f'{rel:45s} className={len(total):3d}  md:{md_count}')
