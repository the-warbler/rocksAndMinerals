import os
import json

# Path to your images folder
IMAGES_DIR = "images"  # or "./images" depending on your setup
output = {}

for filename in os.listdir(IMAGES_DIR):
    # matches names like andesite1.jpg, basalt2.jpg, etc.
    name, ext = os.path.splitext(filename)
    if ext.lower() != ".jpg":
        continue
    # split trailing digits
    import re
    m = re.match(r"^([a-zA-Z]+)(\d+)$", name)
    if not m:
        continue
    rock, idx = m.groups()
    count = int(idx)
    output[rock] = max(output.get(rock, 0), count)

# Write images.json
with open("images.json", "w") as f:
    json.dump(output, f, indent=2)
print("Wrote images.json:", output)
