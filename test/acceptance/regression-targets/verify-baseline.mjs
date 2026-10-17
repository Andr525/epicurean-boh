// Verifies red-baseline EVIDENCE only. Never converts a failing application suite into a green suite.
import fs from 'node:fs';import {createHash} from 'node:crypto';
const contract=JSON.parse(fs.readFileSync(new URL('./contract.json',import.meta.url)));
const files=process.argv.slice(2);if(!files.length)throw Error('Provide one or both full-suite baseline JSON reports');
let total=0,controls=0;const seen=new Set();
for(const file of files){
 const r=JSON.parse(fs.readFileSync(file)),repo=r.suite==='phase0-boh-regression-targets'?'boh':r.suite==='phase0-pos-regression-targets'?'pos':null;
 if(!repo||seen.has(repo))throw Error('Unknown or duplicate suite');seen.add(repo);
 const cases=contract.cases.filter(c=>c.repo===repo);
 if(r.source.baseline!==contract.baselines[repo]||!r.source.indexMatchesBaseline||r.source.baselineDeltaOutsideNewSuite.length)throw Error('Source does not match the pinned unmodified baseline');
 if(r.selected!=='ALL'||r.passed||r.errors||r.unrun||r.controlFailures||r.failed!==cases.length)throw Error('Baseline requires all business cases FAIL, no ERROR/UNRUN/control failures');
 if(JSON.stringify(r.results.map(c=>c.id))!==JSON.stringify(cases.map(c=>c.id)))throw Error('Missing or reordered acceptance ID');
 if(r.contractSha256!==createHash('sha256').update(fs.readFileSync(new URL('./contract.json',import.meta.url))).digest('hex'))throw Error('Contract differs from evidence');
 for(const c of r.results){
  if(c.status!=='FAIL'||c.error||!c.assertions.some(a=>a.kind==='target'&&!a.pass&&a.label!=='application produces no uncaught browser errors'))throw Error(c.id+' did not reproduce a business defect');
  const labels=new Set(c.assertions.map(a=>a.label));for(const label of cases.find(t=>t.id===c.id).requiredAssertions)if(!labels.has(label))throw Error(c.id+' missing '+label);
  controls+=c.assertions.filter(a=>a.kind==='control'&&a.pass).length;
 }
 total+=cases.length;
}
console.log(JSON.stringify({baselineDefectsReproduced:total,positiveControlAssertionsPassed:controls,setupErrors:0,applicationAcceptance:'FAIL',meaning:'Failing-baseline evidence verified; not application acceptance.'}));
