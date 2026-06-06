import sys; sys.path.insert(0, 'scripts')
import responsive_fix as rf
import tempfile
import os

# Test process_file with real content
test_content = '''
<div className="py-4 md:py-6">already responsive</div>
<div className="text-lg md:text-xl">already responsive text</div>
<div className="py-6">single class</div>
<div className="md:text-xl">only md class</div>
<div className="px-6 py-4 md:px-8">mixed</div>
<div className="text-sm">single text</div>
<div className="w-full">width full</div>
<div className="h-64">height</div>
<div className={cn("py-6", "text-lg")}>cn test</div>
<div className="p-10">padding</div>
<div className="gap-4">gap</div>
<div className="space-y-3">space</div>
<div className="md:py-8">md only padding</div>
<div className="max-w-2xl">max width</div>
<div className="min-h-screen">min height</div>
<div className="rounded-xl">rounded</div>
<div className="leading-6">leading</div>
<div className={cn("gap-2", "h-12")}>cn multiple</div>
<div className="px-0">zero</div>
'''

with tempfile.NamedTemporaryFile(mode='w', suffix='.tsx', delete=False, encoding='utf-8') as f:
    f.write(test_content)
    tmpfile = f.name

try:
    modified = rf.process_file(tmpfile)
    print(f"Modified: {modified}")
    with open(tmpfile, 'r', encoding='utf-8') as f:
        print("Result:")
        print(f.read())
finally:
    os.unlink(tmpfile)
