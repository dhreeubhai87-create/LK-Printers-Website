import re

path = r'e:\New folder\lk\copy\src\lib\fallback-data.ts'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

keywords = [
    "Product Code",
    "Production Time",
    "Lamination",
    "UV Option",
    "Foil Option",
    "Die Cut Option"
]

def clean_features(match):
    features_str = match.group(1)
    # Split by comma but handle quotes
    # Simple regex for items: ".*?"
    items = re.findall(r'"(.*?)"', features_str)
    cleaned_items = [i for i in items if not any(k.lower() in i.lower() for k in keywords)]
    return 'features: [' + ', '.join(f'"{i}"' for i in cleaned_items) + ']'

# Replace features: [...]
new_content = re.sub(r'features:\s*\[(.*?)\]', clean_features, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
