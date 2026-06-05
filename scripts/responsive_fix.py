"""
Responsive breakpoint fix for frontend components.
Adds base + md breakpoints to single-value Tailwind classes.

Rules:
  - No prefix (e.g. py-6)      -> smaller-base md:original
  - Only md: prefix (e.g. md:py-6) -> smaller-base md:original
  - Already has base + md       -> skip
  - Other prefixes (sm, lg, etc) -> skip
"""

import re
import os

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")

# Spacing reduction: 3/4 of value, round to nearest Tailwind spacing
SPACING_REDUCTION = {
    "0": "0", "0.5": "0.5", "1": "0.5", "1.5": "1", "2": "1.5", "2.5": "2",
    "3": "2", "3.5": "3", "4": "3", "5": "4", "6": "4", "7": "5", "8": "6",
    "9": "7", "10": "8", "11": "8", "12": "10", "14": "10", "16": "12",
    "20": "14", "24": "20", "28": "20", "32": "24", "36": "28", "40": "32",
    "44": "32", "48": "36", "52": "40", "56": "44", "60": "48", "64": "48",
    "72": "56", "80": "60", "96": "72",
}

# Text size: one level smaller
TEXT_REDUCTION = {
    "xs": "xs", "sm": "xs", "base": "sm", "lg": "base", "xl": "lg",
    "2xl": "xl", "3xl": "2xl", "4xl": "3xl", "5xl": "4xl", "6xl": "5xl",
    "7xl": "6xl", "8xl": "7xl", "9xl": "8xl",
}

# Spacing prefixes (p, px, py, pt, pb, pl, pr, m, mx, my, mt, mb, ml, mr, gap, space-x, space-y)
SPACING_PREFIX_RE = r'\b(p[pxytblr]?|m[pxytblr]?|gap|space-[xy])\b'

# Tailwind class pattern: optional prefix: + classname
TAILWIND_CLASS_RE = re.compile(r'([a-z]+:)?([a-z-]+)-(\d+(?:\.\d+)?[a-z]*|[a-z]+)')

def reduce_spacing(value):
    return SPACING_REDUCTION.get(value, value)

def reduce_text(value):
    return TEXT_REDUCTION.get(value, value)

def is_numeric(value):
    return value.isdigit() or (value.replace('.', '', 1).isdigit() and value.count('.') <= 1)

def _parse_tw(cls):
    """Parse a Tailwind class into (prefix, base, value) or None."""
    m = TAILWIND_CLASS_RE.match(cls)
    if not m:
        return None
    prefix = m.group(1) or ''
    prefix = prefix.rstrip(':')
    base = m.group(2)
    value = m.group(3)
    return (prefix, base, value)

def _has_responsive_pair(classes, cls):
    """Check if a class already forms a responsive pair in the list.
    e.g. 'py-4' and 'md:py-6' -> already responsive, skip transformation."""
    parsed = _parse_tw(cls)
    if not parsed:
        return False
    prefix, base, value = parsed
    if prefix == 'md':
        # md:py-6 -> look for any no-prefix py-* class
        return any(_parse_tw(c) for c in classes if _parse_tw(c) and _parse_tw(c)[0] == '' and _parse_tw(c)[1] == base)
    else:
        # py-4 -> look for any md:py-* class
        return any(_parse_tw(c) for c in classes if _parse_tw(c) and _parse_tw(c)[0] == 'md' and _parse_tw(c)[1] == base)

def should_transform(cls):
    """Check if a single Tailwind class needs responsive transformation."""
    if ':' in cls:
        prefix = cls.split(':')[0]
        if prefix in ('sm', 'lg', 'xl', '2xl', 'xs'):
            return False
        if prefix == 'md':
            return True
        return False
    return True

def transform_single(cls):
    """Transform a single TARGET class (no prefix or md: prefix)."""
    if ':' in cls:
        prefix, rest = cls.split(':', 1)
        if prefix == 'md':
            return _transform_single(rest, cls)
        return cls
    else:
        return _transform_single(cls, cls)

def _transform_single(cls, input_cls):
    """Transform (cls) -> (reduced-base, md:original) unless unchanged."""
    m = TAILWIND_CLASS_RE.match(cls)
    if not m:
        return input_cls

    base = m.group(2)
    value = m.group(3)

    if re.match(SPACING_PREFIX_RE, base):
        new_value = reduce_spacing(value)
    elif base == 'text':
        new_value = reduce_text(value)
    elif base in ('h', 'w', 'min-h', 'min-w', 'max-w', 'max-h'):
        if is_numeric(value):
            new_value = reduce_spacing(value)
        else:
            return input_cls
    elif base == 'leading':
        new_value = reduce_spacing(value)
    elif base == 'rounded':
        rd = {"none": "none", "sm": "none", "": "", "md": "sm", "lg": "md", "xl": "lg", "2xl": "xl", "3xl": "2xl", "full": "full"}
        new_value = rd.get(value, value)
    else:
        return input_cls

    if new_value == value:
        return input_cls

    return f"{base}-{new_value} md:{base}-{value}"

def _transform_class_str(cls_str):
    """Transform all eligible classes in a class string."""
    classes = cls_str.split()
    new_classes = []
    changed = False

    for cls in classes:
        if ':' in cls:
            p = cls.split(':')[0]
            if p in ('sm', 'lg', 'xl', '2xl', 'xs'):
                new_classes.append(cls)
                continue

        if _has_responsive_pair(classes, cls):
            new_classes.append(cls)
            continue

        if should_transform(cls):
            transformed = transform_single(cls)
            if transformed != cls:
                changed = True
                new_classes.append(transformed)
            else:
                new_classes.append(cls)
        else:
            new_classes.append(cls)

    return ' '.join(new_classes), changed


def _transform_content(content):
    """Transform all class name strings in content, handling both className and cn()."""

    def _replace_classname(m):
        """Replace classes inside className="..." or className='...'."""
        quote = m.group(1)
        content_str = m.group(2)
        new_str, changed = _transform_class_str(content_str)
        if changed:
            return f'className={quote}{new_str}{quote}'
        return m.group(0)

    def _replace_quoted(m):
        """Replace classes inside a bare quoted string (used inside cn())."""
        quote = m.group(1)
        content_str = m.group(2)
        new_str, changed = _transform_class_str(content_str)
        if changed:
            return f'{quote}{new_str}{quote}'
        return m.group(0)

    # 1. Process className="..." and className='...'
    content = re.sub(
        r'className=(["\'])([^"\']+?)(\1)',
        _replace_classname,
        content
    )

    # 2. Process cn("...", "..."...) — process all quoted strings inside cn()
    def _replace_cn(m):
        raw = m.group(0)
        inner = m.group(1)
        new_inner = re.sub(
            r'(["\'])([^"\']+?)(\1)',
            _replace_quoted,
            inner
        )
        if new_inner != inner:
            return f'cn({new_inner})'
        return raw

    content = re.sub(r'cn\(([^)]*)\)', _replace_cn, content)
    return content


def process_file(filepath):
    """Process a single TSX/TS file, adding responsive breakpoints."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    content = _transform_content(content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    # Collect all TSX/TS files
    files = []
    for root, dirs, fnames in os.walk(os.path.join(FRONTEND_DIR, 'app')):
        for fname in fnames:
            if fname.endswith(('.tsx', '.ts')):
                files.append(os.path.join(root, fname))
    for root, dirs, fnames in os.walk(os.path.join(FRONTEND_DIR, 'components')):
        for fname in fnames:
            if fname.endswith(('.tsx', '.ts')):
                files.append(os.path.join(root, fname))
    
    # Skip API routes (no JSX)
    files = [f for f in files if 'api' not in f.replace('\\', '/').split('/')]
    
    modified = 0
    for fp in files:
        if process_file(fp):
            modified += 1
            print(f"  Modified: {os.path.relpath(fp, FRONTEND_DIR)}")
    
    print(f"\nTotal files modified: {modified}")

if __name__ == '__main__':
    main()
