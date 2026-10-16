import json
from pathlib import Path
p=Path(__file__).resolve().parent.parent
S={'type':'string'}; ID={'type':'string','minLength':1}; B={'type':'boolean'}; N={'type':'integer','minimum':0,'maximum':9007199254740991}; Signed={'type':'integer','minimum':-9007199254740991,'maximum':9007199254740991}
def arr(x):return {'type':'array','items':x}
def obj(props,req=None,extra=False):return {'type':'object','properties':props,'required':list(props) if req is None else req,'additionalProperties':extra}
def ref(x):return {'$ref':'#/$defs/'+x}
def nullable(x):return {'anyOf':[x,{'type':'null'}]}
def enum(*x):return {'enum':list(x)}
strings=arr(ID)
D={}
D['Rule']=obj(dict(id=ID,name=S,kind=enum('individual','fixed-price','selection'),min=N,max=nullable(N),automatic=B,deferred=B),['id','kind'])
ruleProperties=D['Rule']['properties']
D['Rule']={'anyOf':[obj({**ruleProperties,'kind':enum('selection')},['id','kind','min','max','automatic','deferred']),obj({k:v for k,v in ruleProperties.items() if k in ['id','name','kind']}|{'kind':enum('individual','fixed-price')},['id','kind'])]}
D['AllergenFreeVerification']=obj({'issuerId':ID,'verificationId':ID,'verifierId':ID,'reason':ID,'verifiedAt':ID,'expiresAt':ID})
D['Menu']=obj(dict(id=ID,name=ID,orderingRuleId=ID,basePriceCents=nullable(N),presentationGroup=S,active=B,channels=arr(enum('pos','voice','digital')),availabilityPolicyId=nullable(ID),sectionIds=strings,taxRuleIds=strings,metadata={'type':'object'}))
D['Section']=obj(dict(id=ID,menuId=ID,name=ID,orderingRuleId=ID,offeringIds=strings,pricing=enum('individual','included'),fireTiming=obj({'fireEach':B,'fireAfter':S}),metadata={'type':'object'}))
D['Offering']=obj(dict(id=ID,sectionId=ID,productId=ID,priceCents=nullable(N),upchargeCents=N,taxRuleIds=strings,active=B,availabilityPolicyId=nullable(ID),pour=S,displayName=S,description=S),['id','sectionId','productId','priceCents','upchargeCents','taxRuleIds','active','availabilityPolicyId'])
D['Scoop']=obj(dict(id=ID,name=ID,allergens=strings,allergenVerified=B,allergenFreeVerification=ref('AllergenFreeVerification'),description=S,voiceKeyword=S,kind=S),['id','name','allergens','allergenVerified','description','voiceKeyword','kind'])
D['Product']=obj(dict(id=ID,sourceId=ID,name=ID,description=S,photos=arr({'type':'string','format':'media-url'}),allergens=strings,allergenDataStatus=enum('unknown','declared','verified'),allergenVerified=B,allergenFreeVerification=ref('AllergenFreeVerification'),modifierGroupIds=strings,temperatureGroupId=nullable(ID),routeId=nullable(ID),dietary=strings,voiceKeyword=S,voiceAliases=strings,temperature=obj({'prompt':S,'groupId':nullable(ID)}),chooseCount=N,choices=arr(ref('Scoop')),ingredients=S,pairingSuggestions=arr(obj({'kind':enum('pairing','white','red','dessert'),'label':ID})),requiresWineComponents=B,wineComponents=arr(obj({'productId':ID,'pourOz':{'type':'number','minimum':0}})),cookNote=S,cookMinutes=N,fireTiming=obj({'fireEach':B,'fireAfter':S}),displayMetadata=obj({k: {'type':['string','number']} for k in ['code','vin','lin','vintage','producer','region','country','varietal','grape','size','unit','group','kind','category']},[]),translations={'type':'object','additionalProperties':obj({'name':S,'desc':S,'subtitle':S},[])},availability=obj({'active':B,'available':B,'eightySixed':B,'stock':nullable({'type':'number','minimum':0}),'ozOnHand':nullable({'type':'number','minimum':0}),'startDate':nullable(S),'endDate':nullable(S),'timezone':nullable(S)}),legacy={'type':'object'}),None)
D['Product']['required'].remove('allergenFreeVerification')
D['ModifierGroup']=obj(dict(id=ID,name=ID,min=N,max=N,kind=enum('temperature','preference','ingredient','pricing','unknown'),options=arr(obj({'id':ID,'name':ID,'priceDeltaCents':Signed,'allergens':strings,'allergenVerified':B,'allergenFreeVerification':ref('AllergenFreeVerification')},['id','name','priceDeltaCents','allergens','allergenVerified'])),legacy={'type':'object'}),['id','name','min','max','kind','options'])
D['TaxRule']=obj(dict(id=ID,name=ID,ratePercent={'type':'number','minimum':0,'maximum':100},isDefault=B,legacy={'type':'object'}),['id','name','ratePercent','isDefault'])
D['Route']=obj(dict(id=ID,name=ID))
D['AvailabilityPolicy']=obj(dict(id=ID,timezone=ID,windows=arr(obj({'days':arr({'type':'integer','minimum':0,'maximum':6}),'start':{'type':'string','pattern':'^([01][0-9]|2[0-3]):[0-5][0-9]$'},'end':{'type':'string','pattern':'^([01][0-9]|2[0-3]):[0-5][0-9]$'}}))))
D['ImportReport']=obj({'sourceRecords':arr(obj({'path':ID,'targetIds':strings,'disposition':enum('mapped','preserved','unresolved'),'reason':S})),'unresolved':arr(ID)})
props=dict(schemaVersion={'const':'epicurean.catalog/v1'},currency={'const':'USD'})
for key,typ in [('menus','Menu'),('sections','Section'),('offerings','Offering'),('products','Product'),('orderingRules','Rule'),('modifierGroups','ModifierGroup'),('taxRules','TaxRule'),('routes','Route'),('availabilityPolicies','AvailabilityPolicy')]:props[key]=arr(ref(typ))
props.update(provenance=arr({'type':'object'}),legacySnapshots=arr(obj({'id':ID,'records':{'type':'object'}})),importReport=ref('ImportReport'))
D['Catalog']=obj(props)
collections=[k for k in props if k not in ['schemaVersion','currency','importReport']]
# importReport is a singleton carried as one record in releases.
collections+=['importReport']
hashs={'type':'string','pattern':'^[a-f0-9]{64}$'}
D['Release']=obj({'id':hashs,'manifest':obj({'schemaVersion':{'const':'epicurean.catalog/v1'},'currency':{'const':'USD'},'recordCounts':obj({k:N for k in collections}),'chunks':arr(obj({'id':hashs,'hash':hashs,'collection':enum(*collections),'count':N}))}),'chunks':arr(obj({'id':hashs,'hash':hashs,'data':obj({'collection':enum(*collections),'records':arr({})})}))})
schema={'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'urn:epicurean:catalog:v1','oneOf':[ref('Catalog'),ref('Release')],'$defs':D}
(p/'schema.json').write_text(json.dumps(schema,indent=2)+'\n')
(p/'schema.mjs').write_text('// Generated from the same schema as schema.json; regenerate: python catalog/tools/generate-schema.py; parity: node --test catalog/test/corrections.test.mjs\nexport const schema = '+json.dumps(schema,indent=2)+';\n')
