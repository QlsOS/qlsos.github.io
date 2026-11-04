#!/usr/bin/env python3
"""Usage: python3 tools/gen_roadmap.py QlsOS_tasks.txt [--done 29] [--current 30]  ->  data/roadmap.json + data/roadmap.js
Parses goals 1..46 (top-level 'N. title' lines under block headers A..G) from the task list."""
import re,sys,json,pathlib,datetime
a=sys.argv[1:];src=pathlib.Path(a[0]).read_text(encoding='utf-8')
def opt(n,d):return int(a[a.index(n)+1]) if n in a else d
done,cur=opt('--done',29),opt('--current',30)
EN="Roll back signals|Task slot generations|Per-task limits|Clean page fault|Blocking sleep|General blocking mechanism|Baseline measurements|ARCHITECTURE.md v0|Handle table|handle_close and handle_dup|Channels|Blocking and non-blocking mode|Handles in messages|Channel tests|Free on last close|SYS_SPAWN from ring 3|Result channel|Task control handle|Revoke and handle lifetime|Shell waits on the result channel|Remove fork and wait|System Dispatcher|Console service (VGA)|Keyboard service|Shell in ring 3|The caps command|First real-hardware test|Regression tests|ATA as a service task|QlsFS directories, space reclaim|File protocol over channels|Mini-libc|Utilities|File rights as capabilities|Measurement table|Documentation|ISO and installer|Tag v1.0.0|x86-64 port|RISC-V RV64 port|AArch64 port|RISC-V RV32 port|No-MMU mode|ARM Cortex-M port|WebAssembly port|MIPS port".split('|')
BL={'A':('Preparation','Подготовка'),'B':('Handles and channels','Хэндлы и каналы'),'C':('Spawn and task control','Spawn и управление задачами'),'D':('System in userspace','Система в userspace'),'E':('Disk and programs','Диск и программы'),'F':('Release','Релиз'),'G':('Platforms (after v1.0.0)','Платформы (после v1.0.0)')}
POST=[("GUI on 32 bits","GUI на 32 битах"),("More platforms","Другие платформы"),("SMP (multikernel)","SMP (мультиядро)"),("POSIX subset, SDK, WASM runtime","POSIX-подмножество, SDK, WASM-рантайм"),("Network, persistence, USB","Сеть, персистентность, USB"),("IoT hardware: GPIO, I2C, SPI","Железо IoT: GPIO, I2C, SPI")]
items=[];b='A';last=0
for l in src.split('\n'):
    m=re.match(r'([A-G])\. ',l)
    if m:b=m.group(1);continue
    m=re.match(r'(\d+)\. (.*)',l)
    if m and int(m.group(1))==last+1 and last<46:
        n=last=int(m.group(1));t=re.split(r'[:;]| \(|\. ',m.group(2))[0].strip()[:90]
        items.append({'n':n,'b':b,'en':EN[n-1],'ru':t})
out={'updated':datetime.date.today().isoformat(),'done':done,'current':cur,'total':len(items),'blocks':{k:{'en':v[0],'ru':v[1]} for k,v in BL.items()},'items':items,'post':[{'en':e,'ru':r} for e,r in POST]}
d=pathlib.Path(__file__).resolve().parent.parent/'data'
(d/'roadmap.json').write_text(json.dumps(out,ensure_ascii=False,indent=1),encoding='utf-8')
(d/'roadmap.js').write_text('window.QLS_ROADMAP='+json.dumps(out,ensure_ascii=False)+';\n',encoding='utf-8');print(len(items),'goals')
