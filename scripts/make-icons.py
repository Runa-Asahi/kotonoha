# Generates PWA + Android icons/splash from the original v1 言叶 mark (ink diamond).
from PIL import Image, ImageDraw
import glob, os
INK=(16,18,20,255); PAPER=(243,241,236,255)
def mark(d, s, ox=0, oy=0, k=1.0):
    f=lambda x,y:(ox+x*k*s/192, oy+y*k*s/192)
    d.polygon([f(96,19),f(153,94),f(96,169),f(39,94)],fill=PAPER)
    d.rectangle([f(91.5,74),f(100.5,156)],fill=INK)
def icon(s, shape="rounded", fg_only=False, scale=1.0):
    S=s*4; im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    if not fg_only:
        if shape=="rounded": d.rounded_rectangle((0,0,S-1,S-1),radius=int(S*42/192),fill=INK)
        elif shape=="round": d.ellipse((0,0,S-1,S-1),fill=INK)
        else: d.rectangle((0,0,S,S),fill=INK)
    off=S*(1-scale)/2; mark(d,S,off,off,scale)
    return im.resize((s,s),Image.LANCZOS)
os.makedirs('public/icons',exist_ok=True)
icon(192).save('public/icons/icon-192.png'); icon(512).save('public/icons/icon-512.png')
icon(512,"square",scale=0.72).save('public/icons/maskable-512.png')
icon(180,"square",scale=0.86).save('public/icons/apple-touch-icon.png')
for p in glob.glob('android/app/src/main/res/mipmap-*/*.png'):
    s=Image.open(p).size[0]; n=os.path.basename(p)
    if 'foreground' in n: icon(s,fg_only=True,scale=0.62).save(p)
    elif 'round' in n: icon(s,"round",scale=0.8).save(p)
    else: icon(s).save(p)
for p in glob.glob('android/app/src/main/res/drawable*/splash.png'):
    w,h=Image.open(p).size; im=Image.new('RGBA',(w,h),INK); m=min(w,h)//3
    im.alpha_composite(icon(m,fg_only=True),((w-m)//2,(h-m)//2)); im.convert('RGB').save(p)
