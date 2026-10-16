// CLEARLY IDENTIFIED MOCK — in-memory Firestore/Auth/Storage stand-in for offline review.
// No network. Every write is recorded in window.__MOCK_DB__.log for inspection.
(function(){
 var seed=window.__MOCK_SEED__||{};var store={};var log=[];var listeners=[];var auto=0;
 Object.keys(seed).forEach(function(c){store[c]={};Object.keys(seed[c]).forEach(function(id){store[c][id]=JSON.parse(JSON.stringify(seed[c][id]));});});
 function clone(x){return x===undefined?undefined:JSON.parse(JSON.stringify(x,function(k,v){return v&&v._mockFV==='serverTimestamp'?new Date().toISOString():v;}));}
 function col(c){return store[c]||(store[c]={});}
 function docSnap(c,id){var d=col(c)[id];return {id:id,exists:d!==undefined,data:function(){return clone(d);}};}
 function match(d,w){if(!w)return true;var v=d[w.f];return w.op==='=='?v===w.v:true;}
 function qSnap(c,w){var docs=Object.keys(col(c)).filter(function(id){return match(col(c)[id],w);}).map(function(id){return docSnap(c,id);});return {docs:docs,size:docs.length,empty:!docs.length,forEach:function(f){docs.forEach(f);}};}
 function notify(c){setTimeout(function(){listeners.forEach(function(l){if(l.c!==c)return;try{l.id?l.cb(docSnap(c,l.id)):l.cb(qSnap(c,l.w));}catch(e){console.error(e);}});},0);}
 function failW(c,id){var f=window.__MOCK_FAIL_WRITES__;if(!f)return null;var hit=f.some(function(k){return k===c+'/'+id||k===c+'/*';});return hit?Promise.reject(Object.assign(Error('MOCK: write refused (simulated)'),{code:'unavailable'})):null;}
 function ref(c,id){return {id:id,
  set:function(data,opts){var fw=failW(c,id);if(fw)return fw;var prev=col(c)[id];var merge=opts&&opts.merge;col(c)[id]=merge&&prev?Object.assign(clone(prev),clone(data)):clone(data);log.push({op:merge?'set-merge':'set',c:c,id:id,keys:Object.keys(data||{})});notify(c);return Promise.resolve();},
  update:function(data){var fw=failW(c,id);if(fw)return fw;col(c)[id]=Object.assign(col(c)[id]||{},clone(data));log.push({op:'update',c:c,id:id,keys:Object.keys(data||{})});notify(c);return Promise.resolve();},
  get:function(){if(window.__MOCK_FAIL_READS__)return Promise.reject(Object.assign(Error('MOCK: cloud unreachable (simulated)'),{code:'unavailable'}));return Promise.resolve(docSnap(c,id));},
  
  onSnapshot:function(cb){var l={c:c,id:id,cb:cb};listeners.push(l);setTimeout(function(){cb(docSnap(c,id));},0);return function(){listeners.splice(listeners.indexOf(l),1);};}};}
 function whereQ(c,w){return {onSnapshot:function(cb){var l={c:c,w:w,cb:cb};listeners.push(l);setTimeout(function(){cb(qSnap(c,w));},0);return function(){};}};}
 function query(c,w){return {get:function(){if(window.__MOCK_FAIL_READS__)return Promise.reject(Object.assign(Error('MOCK: cloud unreachable (simulated)'),{code:'unavailable'}));return Promise.resolve(qSnap(c,w));},where:function(f,op,v){return whereQ(c,{f:f,op:op,v:v});},
  onSnapshot:function(cb){var l={c:c,w:w,cb:cb};listeners.push(l);setTimeout(function(){cb(qSnap(c,w));},0);return function(){listeners.splice(listeners.indexOf(l),1);};}};}
 var db={collection:function(c){var q=query(c);q.doc=function(id){return ref(c,id||('mock'+(++auto)));};q.add=function(data){var id='web_mock'+(++auto);return ref(c,id).set(data).then(function(){log[log.length-1].op='add';return docSnap(c,id);});};return q;},
  __rawSet:function(c,id,data){col(c)[id]=clone(data);log.push({op:'raw-other-device',c:c,id:id});},
  __dump:function(){return clone(store);},log:log};
 window.__MOCK_DB__=db;
 var FieldValue={serverTimestamp:function(){return {_mockFV:'serverTimestamp',_methodName:'serverTimestamp'};},delete:function(){return undefined;},arrayUnion:function(){return [].slice.call(arguments);},increment:function(n){return n;}};
 var user={uid:'MOCK-ANON',isAnonymous:true,getIdToken:function(){return Promise.resolve('MOCK-TOKEN');}};
 var auth={currentUser:user,signInAnonymously:function(){return Promise.resolve({user:user});},onAuthStateChanged:function(cb){setTimeout(function(){cb(user);},0);return function(){};},signOut:function(){return Promise.resolve();}};
 var fs=function(){return db;};fs.FieldValue=FieldValue;
 window.firebase={MOCK:true,initializeApp:function(){return {name:'MOCK'};},firestore:fs,auth:function(){return auth;},storage:function(){return {ref:function(){return {put:function(){return Promise.reject(Error('MOCK storage: uploads disabled'));},child:function(){return this;},getDownloadURL:function(){return Promise.reject(Error('MOCK storage'));}};}};}};
})();
