from PIL import Image
from pathlib import Path
# Only copies in the website are changed. Original game files stay intact.
for name,box in [('fries',(12,20,25,32)),('frosty',(12,15,25,31)),('nuggets',(12,20,25,31))]:
 p=Path('public/game')/(name+'-food.png');im=Image.open(p).convert('RGBA');src=im.copy(); count=0
 for y in range(box[1],box[3]):
  for x in range(box[0],box[2]):
   r,g,b,a=src.getpixel((x,y))
   if a and r>155 and g>85 and b>95:
    candidates=[]
    for nx in range(36):
     cr,cg,cb,ca=src.getpixel((nx,y))
     if ca and cr>130 and cr>cg*1.7 and cr>cb*1.3:candidates.append((abs(nx-x),src.getpixel((nx,y))))
    if candidates:im.putpixel((x,y),min(candidates,key=lambda t:t[0])[1]);count+=1
 im.save(p);print(name,'logo pixels recolored:',count)
# Unused illustration contains lettering: keep only the edited individual icons.
Path('public/game/food-collage.png').unlink()
