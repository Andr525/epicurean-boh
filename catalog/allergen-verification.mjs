// ISOLATED MOCK AUTHORITY. Opaque approvals cannot be supplied through imported JSON.
// No real login, staff store or production authorization is implemented here.
const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0)):v);
const copy=x=>JSON.parse(JSON.stringify(x));
const subjectKey=subject=>canonical(Object.fromEntries(Object.entries(subject).filter(([k])=>!['allergenFreeVerification','allergenVerified','allergenDataStatus'].includes(k))));
const releaseAuthorities=new WeakMap(),trustedAuthorities=new WeakSet();
export function bindVerificationAuthority(release,authority){if(authority)releaseAuthorities.set(release,authority);return release;}
export const authorityFor=release=>releaseAuthorities.get(release);
export class LocalAllergenVerificationAuthority {
 #id=crypto.randomUUID();#verifiers;#sessions=new WeakMap();#approvals=new Map();
 constructor({authorizedVerifierIds=[]}={}){this.#verifiers=new Set(authorizedVerifierIds);trustedAuthorities.add(this);}
 // Explicit fixture setup only: this is NOT staff authentication.
 openSimulatedSession(verifierId){if(!this.#verifiers.has(verifierId))throw Error('Verifier not authorized in local fixture policy');const token=Object.freeze({});this.#sessions.set(token,verifierId);return token;}
 approveAllergenFree(subject,session,{reason,expiresAt}={}){
  const verifierId=this.#sessions.get(session);if(!verifierId||!this.#verifiers.has(verifierId))throw Error('Authorized verifier session required');
  if(!Array.isArray(subject.allergens)||subject.allergens.length)throw Error('Allergen-free approval contradicts declared allergens');
  if(typeof reason!=='string'||!reason.trim())throw Error('Verification reason required');
  const now=Date.now(),expiry=expiresAt??now+60*60*1000;if(!Number.isFinite(expiry)||expiry<=now||expiry>now+60*60*1000)throw Error('Local approval expires within 60 minutes');
  const proof={issuerId:this.#id,verificationId:crypto.randomUUID(),verifierId,reason,verifiedAt:new Date(now).toISOString(),expiresAt:new Date(expiry).toISOString()};
  this.#approvals.set(proof.verificationId,{proof:canonical(proof),subject:subjectKey(subject)});
  const result={...copy(subject),allergenVerified:true,allergenFreeVerification:proof};if('allergenDataStatus'in result)result.allergenDataStatus='verified';return result;
 }
 verify(subject){const p=subject.allergenFreeVerification,r=this.#approvals.get(p?.verificationId);return !!(p&&r&&p.issuerId===this.#id&&this.#verifiers.has(p.verifierId)&&canonical(p)===r.proof&&Date.parse(p.expiresAt)>Date.now()&&r.subject===subjectKey(subject)&&subject.allergens.length===0);}
 revoke(verificationId,session){if(!this.#sessions.has(session))throw Error('Authorized verifier session required');this.#approvals.delete(verificationId);}
}
export function allergenVerified(subject,authority){
 if(subject.allergenVerified!==true)return false;
 if(subject.allergenFreeVerification||subject.allergens.length===0)return !!(trustedAuthorities.has(authority)&&LocalAllergenVerificationAuthority.prototype.verify.call(authority,subject));
 return true;
}
export function modifierVerified(option,group,authority){
 if(option.allergens.length>0||['ingredient','unknown'].includes(group.kind))return allergenVerified(option,authority);
 return true; // Explicit non-ingredient behavior, never a declaration of ingredient safety.
}
