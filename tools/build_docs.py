#!/usr/bin/env python3
"""Usage: python3 tools/build_docs.py /path/to/QlsOS
Builds docs/*.html (English, from the repo) and docs/ru/*.html (from tools/docs-ru/<file>.md when a translation exists). No dependencies."""
import re,sys,json,html,pathlib
SRC=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '.');SITE=pathlib.Path(__file__).resolve().parent.parent;RUSRC=SITE/'tools'/'docs-ru'
DOCS=[('readme','README.md','Overview','What works today, quick start, limits.','Обзор'),('project','PROJECT.md','Project','Direction, plan of blocks A–F, current status.','Проект'),
('contract','ARCHITECTURE.md','Architecture contract','Handles, channels, spawn, goals and tests. Read this first.','Контракт архитектуры'),('code-layout','docs/architecture.md','Code layout','How the source tree is split.','Устройство кода'),
('hal-design','docs/hal-design.md','HAL design','The contract between common code and ports.','Дизайн HAL'),('elf-loader','docs/elf-loader.md','ELF loader','How static ELF32 programs are loaded.','ELF-загрузчик'),
('hardware-checklist','docs/hardware-checklist.md','Hardware checklist','Running on a real PC.','Чек-лист железа'),('history','docs/history.md','History','The old README and troubleshooting.','История')]
RU={s for s,p,*_ in DOCS if (RUSRC/p.split('/')[-1]).exists()}
LANG='en'
def lmap(u):
    b=u.split('#')[0];f=u[len(b):];n=b.split('/')[-1]
    for s,p,*_ in DOCS:
        if p.split('/')[-1]==n:return (s+'.html' if (LANG=='en' or s in RU) else '../'+s+'.html')+f
    return u
def inline(t):
    cs=[]
    def c(m):cs.append(html.escape(m.group(1)));return '\x00%d\x00'%(len(cs)-1)
    t=html.escape(re.sub(r'`([^`]+)`',c,t),quote=False)
    t=re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)',lambda m:'<a href="%s">%s</a>'%(m.group(2) if re.match(r'(https?:|#|mailto:)',m.group(2)) else lmap(m.group(2)),m.group(1)),t)
    t=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',t);t=re.sub(r'(?<![\w*])\*([^*\s][^*]*)\*(?![\w*])',r'<em>\1</em>',t)
    return re.sub('\x00(\\d+)\x00',lambda m:'<code>%s</code>'%cs[int(m.group(1))],t)
def lst(it):
    def build(k,base):
        s='<%s>'%('ol' if it[k][1] else 'ul');tag=s[1:3]
        while k<len(it) and it[k][0]>=base:
            ind=it[k][0];s+='<li>'+inline(it[k][2]);k+=1
            if k<len(it) and it[k][0]>ind:
                sub,k=build(k,it[k][0]);s+=sub
            s+='</li>'
        return s+'</%s>'%tag,k
    o='';k=0
    while k<len(it):
        s,k=build(k,it[k][0]);o+=s
    return o
LI=r'(\s*)([-*]|\d+\.)\s+(.*)'
def render(md):
    L=md.split('\n');out=[];heads=[];ids={};i=0
    def slug(t):
        s=re.sub(r'[^\w\- ]','',re.sub(r'<[^>]+>','',t).lower()).strip().replace(' ','-');n=ids.get(s,0);ids[s]=n+1;return s if not n else '%s-%d'%(s,n)
    while i<len(L):
        l=L[i]
        if l.startswith('```'):
            j=i+1;b=[]
            while j<len(L) and not L[j].startswith('```'):b.append(L[j]);j+=1
            out.append('<pre><code>%s</code></pre>'%html.escape('\n'.join(b)));i=j+1;continue
        m=re.match(r'(#{1,4})\s+(.*)',l)
        if m:
            n=len(m.group(1));h=inline(m.group(2).strip());sid=slug(m.group(2))
            heads.append((n,re.sub(r'<[^>]+>','',h),sid,len(out)));out.append('<h%d id="%s">%s</h%d>'%(n,sid,h,n));i+=1;continue
        if re.match(r'\s*([-*_])\1{2,}\s*$',l):out.append('<hr>');i+=1;continue
        if l.startswith('|') and i+1<len(L) and re.match(r'\|[\s:|-]+\|?\s*$',L[i+1]):
            r=[];j=i
            while j<len(L) and L[j].startswith('|'):r.append(L[j]);j+=1
            cl=lambda x:[c.strip() for c in x.strip().strip('|').split('|')]
            out.append('<div class="tw"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>'%(''.join('<th>%s</th>'%inline(c) for c in cl(r[0])),''.join('<tr>%s</tr>'%''.join('<td>%s</td>'%inline(c) for c in cl(x)) for x in r[2:])));i=j;continue
        if l.startswith('>'):
            b=[]
            while i<len(L) and L[i].startswith('>'):b.append(L[i].lstrip('> '));i+=1
            out.append('<blockquote>%s</blockquote>'%inline(' '.join(b)));continue
        if re.match(LI,l):
            it=[]
            while i<len(L):
                m=re.match(LI,L[i])
                if m:it.append([len(m.group(1)),m.group(2)[0].isdigit(),m.group(3)])
                elif L[i].strip() and L[i].startswith('  ') and it:it[-1][2]+=' '+L[i].strip()
                else:break
                i+=1
            out.append(lst(it));continue
        if not l.strip():i+=1;continue
        b=[]
        while i<len(L) and L[i].strip() and not re.match(r'(#{1,4}\s|```|\||>|\s*([-*]|\d+\.)\s)',L[i]):b.append(L[i].strip());i+=1
        if not b:b=[l.strip()];i+=1
        out.append('<p>%s</p>'%inline(' '.join(b)))
    return out,heads
idx=(SITE/'index.html').read_text(encoding='utf-8')
hdr0=re.search(r'<header.*?</header>',idx,re.S).group(0)
def mkhdr(cur,up,selfhref):
    h=hdr0.replace('<a href="#%s"'%cur,'<a class="on" href="%s"'%selfhref)
    for x,y in[('href="#','href="%sindex.html#'%up),('src="assets','src="%sassets'%up)]:h=h.replace(x,y)
    return h
REDIR="(function(){try{var l=localStorage.getItem('l')}catch(e){}l=l||((navigator.language||'').toLowerCase().indexOf('ru')==0?'ru':'en');var m=location.pathname.match(/\\/docs\\/(ru\\/)?([a-z-]+)\\.html$/);if(!m)return;var r=!!m[1],s=m[2],a=window.QLS_RU_DOCS||[];if(l==='ru'&&!r&&a.indexOf(s)>-1)location.replace('ru/'+s+'.html'+location.hash);else if(l!=='ru'&&r)location.replace('../'+s+'.html'+location.hash)})();"
def page(title,main,fn,lang='en'):
    up='../' if lang=='en' else '../../';h=mkhdr('docs',up,'index.html' if lang=='en' else '../index.html')
    return '''<!DOCTYPE html>
<html lang="%s"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>%s — QlsOS</title>
<meta name="description" content="QlsOS documentation: %s"><link rel="canonical" href="https://qlsos.github.io/docs/%s%s"><meta property="og:image" content="https://qlsos.github.io/assets/img/og.png">
<link rel="icon" type="image/svg+xml" href="%sassets/img/favicon.svg"><link rel="stylesheet" href="%sassets/lasurpixel/lasurpixel.css"><link rel="stylesheet" href="%sassets/css/style.css"><script src="%sassets/lasurpixel/lasurpixel.js"></script>
<script src="%sdata/docs-ru.js"></script><script>%s</script>
<script src="%s"></script><script src="%sassets/js/i18n.js" defer></script><script src="%sassets/js/main.js" defer></script></head>
<body><div class="bg"><i></i><i></i><i></i></div>%s
%s
<footer class="gl"><div class="wrap"><span>© QlsOS · MPL-2.0</span><span><a href="https://github.com/qlsdev/QlsOS">GitHub ↗</a></span></div></footer></body></html>'''%(lang,html.escape(title),html.escape(title),'ru/' if lang=='ru' else '',fn,up,up,up,up,up,REDIR,'../search-ru.js' if lang=='ru' else 'search.js',up,up,h,main)
def side(cur,toc,lang):
    ru=lang=='ru';s='<aside class="side gl"><input id="dq" type="search" placeholder="%s" autocomplete="off"><div id="dres"></div><nav class="dn">'%('Поиск по документации…' if ru else 'Search docs…')
    for sl,p,t,d,tr in DOCS:
        href=(sl+'.html') if (not ru or sl in RU) else '../'+sl+'.html'
        s+='<a class="%s" href="%s">%s</a>'%('on' if sl==cur else '',href,tr if ru else t)
        if sl==cur and toc:s+='<div class="toc">'+''.join('<a href="#%s">%s</a>'%(i,t2) for i,t2 in toc)+'</div>'
    return s+'</nav></aside>'
S={'en':[],'ru':[]}
def collect(lang,sl,out,heads,prefix=''):
    for k,(n,t,sid,ix) in enumerate(heads):
        if n<=3:
            e=heads[k+1][3] if k+1<len(heads) else len(out)
            S[lang].append([sl,t,sid,re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',' '.join(out[ix+1:e])))[:260],prefix])
(SITE/'docs'/'ru').mkdir(exist_ok=True)
for lang in ('en','ru'):
    LANG=lang
    for sl,p,title,desc,tr in DOCS:
        if lang=='ru' and sl not in RU:continue
        f=(SRC/p) if lang=='en' else RUSRC/p.split('/')[-1]
        if not f.exists():print('missing',p);continue
        out,heads=render(f.read_text(encoding='utf-8'))
        collect(lang,sl,out,heads)
        toc=[(sid,t) for n,t,sid,_ in heads if n==2][:40]
        src='Источник: <a href="https://github.com/qlsdev/QlsOS/blob/HEAD/%s">%s</a> · <a href="../%s.html">оригинал на английском</a>'%(p,p,sl) if lang=='ru' else 'Source: <a href="https://github.com/qlsdev/QlsOS/blob/HEAD/%s">%s</a>'%(p,p)
        d=SITE/'docs'/('ru' if lang=='ru' else '')
        (d/(sl+'.html')).write_text(page(tr if lang=='ru' else title,'<main><div class="wrap dgrid">%s<article class="doc gl">%s<p class="src">%s</p></article></div></main>'%(side(sl,toc,lang),'\n'.join(out),src),sl+'.html',lang),encoding='utf-8')
# Russian search: translated pages plus English entries (linking up) for the rest
S['ru']+= [[e[0],e[1],e[2],e[3],'../'] for e in S['en'] if e[0] not in RU]
cards=''.join('<a class="gl card" href="%s.html"><small>%s</small><h3>%s</h3><p>%s</p></a>'%(s,p,t,d) for s,p,t,d,_ in DOCS)
(SITE/'docs'/'index.html').write_text(page('Documentation','<main><div class="wrap page"><h1>Documentation</h1><p class="note" style="color:var(--dim);font-size:19px">Documents marked with a Russian translation open in Russian when the site language is RU. Use the search inside any page.</p><div class="grid" style="margin-top:28px">%s</div></div></main>'%cards,'index.html'),encoding='utf-8')
for lang,n in(('en','search.js'),('ru','search-ru.js')):(SITE/'docs'/n).write_text('window.QLS_SEARCH='+json.dumps(S[lang],ensure_ascii=False)+';\n',encoding='utf-8')
(SITE/'data'/'docs-ru.js').write_text('window.QLS_RU_DOCS='+json.dumps(sorted(RU))+';\n')
print(len(S['en']),'EN sections,',len(RU),'RU docs:',sorted(RU))
dp=SITE/'download'/'index.html'
dp.write_text(re.sub(r'<header.*?</header>',lambda m:mkhdr('download','../','index.html'),dp.read_text(encoding='utf-8'),count=1,flags=re.S),encoding='utf-8')
