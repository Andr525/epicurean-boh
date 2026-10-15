import {schema} from './schema.mjs';
export function assertShape(value, definition='Catalog') {
  function check(v, s, path) {
    if (s.$ref) return check(v, schema.$defs[s.$ref.split('/').pop()], path);
    if (s.anyOf) { if (!s.anyOf.some(t=>{try {check(v,t,path);return true;} catch{return false;}})) throw Error(path+': invalid type/value'); return; }
    if ('const' in s && v !== s.const) throw Error(path+': unexpected constant');
    if (s.enum && !s.enum.includes(v)) throw Error(path+': invalid enum');
    const types=s.type ? (Array.isArray(s.type)?s.type:[s.type]):[];
    const is=t=>t==='null'?v===null:t==='array'?Array.isArray(v):t==='object'?v!==null&&typeof v==='object'&&!Array.isArray(v):t==='integer'?Number.isSafeInteger(v):t==='number'?typeof v==='number'&&Number.isFinite(v):typeof v===t;
    if(types.length&&!types.some(is))throw Error(path+': expected '+types.join('/'));
    if(typeof v==='number'&&(s.minimum!=null&&v<s.minimum||s.maximum!=null&&v>s.maximum))throw Error(path+': out of range');
    if(typeof v==='string'){
      if(s.minLength&&v.trim().length<s.minLength||s.pattern&&!new RegExp(s.pattern).test(v))throw Error(path+': invalid string');
      if(s.format==='media-url'){let u;try{u=new URL(v);}catch{throw Error(path+': invalid media URL');}if(u.protocol!=='https:'||u.username||u.password)throw Error(path+': media URL must be HTTPS without credentials');}
    }
    if(Array.isArray(v)&&s.items)v.forEach((x,i)=>check(x,s.items,path+'['+i+']'));
    if(v&&typeof v==='object'&&!Array.isArray(v)){
      for(const k of s.required||[])if(!(k in v))throw Error(path+'.'+k+': required');
      for(const [k,x]of Object.entries(v)){if(s.properties?.[k])check(x,s.properties[k],path+'.'+k);else if(s.additionalProperties===false)throw Error(path+'.'+k+': unknown field');else if(s.additionalProperties&&typeof s.additionalProperties==='object')check(x,s.additionalProperties,path+'.'+k);}
    }
  }
  check(value,schema.$defs[definition],definition);return value;
}
