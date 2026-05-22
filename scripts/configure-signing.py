#!/usr/bin/env python3
import re

with open('android/app/build.gradle', 'r') as f:
    content = f.read()

# Find and replace the release buildType block's signingConfig
# Replace: signingConfig signingConfigs.debug
# With inline release signing
content = re.sub(
    r'(buildTypes\s*\{[^}]*release[^}]*?)signingConfig\s+signingConfigs\.debug',
    r'''\1signingConfig signingConfigs.release
            signingOptions {
                storeFile file('play-store-keystore.jks')
                storePassword project.findProperty("KEYSTORE_PASSWORD") ?: System.getenv("KEYSTORE_PASSWORD")
                keyAlias project.findProperty("KEYSTORE_ALIAS") ?: System.getenv("KEYSTORE_ALIAS")
                keyPassword project.findProperty("KEYSTORE_KEY_PASSWORD") ?: System.getenv("KEYSTORE_KEY_PASSWORD")
                v1SigningEnabled true
                v2SigningEnabled true
            }''',
    content
)

# Also add release signingConfig to signingConfigs block
def add_release_config(match):
    block = match.group(0)
    if 'release {' in block:
        return block
    # Find the closing brace of the last config (debug)
    # Insert release config before signingConfigs closing brace
    return block.rstrip().rstrip('}') + '''
            release {
                storeFile file('play-store-keystore.jks')
                storePassword project.findProperty("KEYSTORE_PASSWORD") ?: System.getenv("KEYSTORE_PASSWORD")
                keyAlias project.findProperty("KEYSTORE_ALIAS") ?: System.getenv("KEYSTORE_ALIAS")
                keyPassword project.findProperty("KEYSTORE_KEY_PASSWORD") ?: System.getenv("KEYSTORE_KEY_PASSWORD")
            }
}'''

content = re.sub(
    r'(signingConfigs \{[\s\S]*?debug \{[\s\S]*?\}[\s\S]*?\})',
    add_release_config,
    content,
    count=1
)

with open('android/app/build.gradle', 'w') as f:
    f.write(content)

print("Done modifying app/build.gradle")

# Verify
with open('android/app/build.gradle', 'r') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'release' in line and ('signingConfig' in line or 'signingOptions' in line):
        print(f"Line {i}: {line.rstrip()}")
