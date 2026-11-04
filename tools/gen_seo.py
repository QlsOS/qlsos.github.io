#!/usr/bin/env python3
"""Writes sitemap.xml, robots.txt, site.webmanifest, and (needs Pillow) assets/img/og.png + apple-touch-icon.png."""
import pathlib,datetime,json
S=pathlib.Path(__file__).resolve().parent.parent;B='https://qlsos.github.io/';d=datetime.date.today().isoformat()
pages=['']+['download/']+['docs/']+['docs/'+p.name for p in sorted((S/'docs').glob('*.html')) if p.name!='index.html']+['docs/ru/'+p.name for p in sorted((S/'docs'/'ru').glob('*.html'))]
(S/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('<url><loc>%s%s</loc><lastmod>%s</lastmod></url>\n'%(B,p,d) for p in pages)+'</urlset>\n')
(S/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: %ssitemap.xml\n'%B)
(S/'site.webmanifest').write_text(json.dumps({'name':'QlsOS','short_name':'QlsOS','start_url':'./','display':'standalone','background_color':'#04060b','theme_color':'#04060b','icons':[{'src':'assets/img/apple-touch-icon.png','sizes':'180x180','type':'image/png'}]},indent=1))
try:
    from PIL import Image,ImageDraw,ImageFont,ImageFilter
except ImportError:
    print('Pillow missing: skipped images');raise SystemExit
def font(sz):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/Library/Fonts/Arial Bold.ttf','C:/Windows/Fonts/arialbd.ttf'):
        try:return ImageFont.truetype(f,sz)
        except OSError:pass
    return ImageFont.load_default()
def mark(sz):
    k=sz/120;im=Image.new('RGBA',(sz*2,sz*2),(0,0,0,0));g=ImageDraw.Draw(im);c=sz
    g.polygon([(c,c-55*k),(c+1.5*k,c),(c,c+1),(c-1.5*k,c)],fill=(0,163,255,255));g.polygon([(c,c),(c+1.2*k,c),(c,c+55*k),(c-1.2*k,c)],fill=(0,163,255,255))
    g.ellipse([c-15*k,c-46*k,c+15*k,c+46*k],fill=(255,255,255,255));g.ellipse([c-1.4*k,c-4.5*k,c+1.4*k,c+4.5*k],fill=(0,0,0,255))
    return im.rotate(-55,resample=Image.BICUBIC).crop((sz//2,sz//2,sz*3//2,sz*3//2))
W,H=1200,630;bg=Image.new('RGB',(W,H),(4,6,11));L=Image.new('RGB',(W,H),(4,6,11));g=ImageDraw.Draw(L)
g.ellipse([-200,-250,420,330],fill=(10,124,255));g.ellipse([800,-100,1400,400],fill=(122,77,255));g.ellipse([300,420,900,900],fill=(0,194,255))
L=L.filter(ImageFilter.GaussianBlur(120));bg=Image.blend(bg,L,.55).convert('RGBA')
bg.alpha_composite(mark(300),(70,115));d2=ImageDraw.Draw(bg)
d2.text((390,150),'Qls',font=font(150),fill='white');w=d2.textlength('Qls',font=font(150));d2.text((390+w+6,150),'OS',font=font(150),fill=(0,163,255))
d2.text((396,340),'QUICK LIGHT SECURE OS',font=font(40),fill=(0,163,255));d2.text((396,420),'A small capability microkernel',font=font(36),fill=(220,230,240));d2.text((396,470),'written from scratch. x86 + ARM.',font=font(36),fill=(150,165,182))
bg.convert('RGB').save(S/'assets/img/og.png');ic=Image.new('RGBA',(180,180),(4,6,11,255));m=mark(150);ic.alpha_composite(m,(15,15));ic.convert('RGB').save(S/'assets/img/apple-touch-icon.png');print('images ok')
