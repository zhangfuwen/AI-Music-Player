#!/usr/bin/env python3
import re

with open('android/app/build.gradle', 'r') as f:
    content = f.read()

# Replace signingConfig debug -> release in buildType
content = content.replace(
    'signingConfig signingConfigs.debug',
    'signingConfig signingConfigs.release'
)

# Add release signingConfig after debug in signingConfigs block
def add_release(match):
    block = match.group(0)
    if 'release {' in block:
        return block
    return block + '''
            release {
                storeFile file('play-store-keystore.jks')
                storePassword project.findProperty("KEYSTORE_PASSWORD") ?: System.getenv("KEYSTORE_PASSWORD")
                keyAlias project.findProperty("KEYSTORE_ALIAS") ?: System.getenv("KEYSTORE_ALIAS")
                keyPassword project.findProperty("KEYSTORE_KEY_PASSWORD") ?: System.getenv("KEYSTORE_KEY_PASSWORD")
                v1SigningEnabled true
                v2SigningEnabled true
            }
'''

content = re.sub(
    r'(signingConfigs \{[\s\S]*?debug \{[\s\S]*?\})',
    add_release,
    content,
    count=1
)

with open('android/app/build.gradle', 'w') as f:
    f.write(content)

print("Done modifying app/build.gradle")
