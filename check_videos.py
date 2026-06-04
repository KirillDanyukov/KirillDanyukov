import re
import os
text = open('index.html', encoding='utf-8').read()
urls = re.findall(r'(?:data-video|src)="([^"]+\.webm)"', text)
print('COUNT', len(urls))
for u in urls:
    print(u, os.path.exists(u))
