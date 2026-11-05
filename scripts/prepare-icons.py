from PIL import Image
from pathlib import Path
# Edit website copies only: cover the full logo area, including pale shadow pixels.
for name,box in [('fries',(10,20,26,33)),('frosty',(10,15,25,32)),('nuggets',(12,20,25,31))]:
 p=Path('public/game')/(name+'-food.png');im=Image.open(p).convert('RGBA');src=im.copy()
 for y in range(box[1],box[3]):
  for x in range(box[0],box[2]):
   r,g,b,a=src.getpixel((x,y))
   if not a or r<96:continue
   # Nearby saturated packaging pixels provide the matching red palette.
   candidates=[]
   for nx in range(36):
    cr,cg,cb,ca=src.getpixel((nx,y))
    if ca and cr>145 and cg<80 and cb<140:
     candidates.append((abs(nx-x),src.getpixel((nx,y))))
   color=min(candidates,key=lambda t:t[0])[1] if candidates else (226,42,76,a)
   im.putpixel((x,y),color)
 im.save(p)
