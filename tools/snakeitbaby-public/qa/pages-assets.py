from pathlib import Path
import shutil,sys
root=Path(sys.argv[1])
for page in root.rglob('__PAGE__.txt'):
    if page.parent.name.startswith('__next.'):
        shutil.copyfile(page,page.parent.with_name(page.parent.name+'.__PAGE__.txt'))
