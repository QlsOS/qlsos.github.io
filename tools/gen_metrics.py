#!/usr/bin/env python3
"""Usage: python3 tools/gen_metrics.py /path/to/QlsOS  ->  data/metrics.json
Reads numbers from a QlsOS checkout (Makefile budget, test targets, line counts)."""
import re,sys,json,pathlib,datetime
root=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '.')
mk=(root/'Makefile').read_text(errors='ignore')
def num(n):
    m=re.search(r'^%s\s*=\s*(\d+)'%n,mk,re.M);return int(m.group(1)) if m else None
def loc(globs):
    t=0
    for g in globs:
        for f in root.glob(g):t+=sum(1 for _ in f.open(errors='ignore'))
    return t
out={"updated":datetime.date.today().isoformat(),
 "kernel_budget_now":num('KERNEL_BUDGET_NOW'),"kernel_budget_v1":num('KERNEL_BUDGET_V1'),
 "test_targets":len(re.findall(r'^test[a-z0-9_-]*:',mk,re.M)),
 "host_tests":len(list((root/'tests').glob('*_host_test.c'))),
 "kernel_loc":loc(['kernel/**/*.c','kernel/**/*.h','kernel/**/*.asm','kernel/**/*.S']),
 "user_loc":loc(['user/*.c','user/*.h']),"tests_loc":loc(['tests/*.c','tests/*.h','tests/*.py'])}
p=pathlib.Path(__file__).resolve().parent.parent/'data'/'metrics.json'
p.write_text(json.dumps(out,indent=1))
(p.parent/'metrics.js').write_text('window.QLS_METRICS='+json.dumps(out)+';\n');print(out)
