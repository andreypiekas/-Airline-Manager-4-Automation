import type { Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { AirportCatalog, loadReference } from './reference-data';

export interface OwnedHubOption { id:string; name:string }
export interface OwnedHubEvidence { sourceId:number; iata:string; name:string }
export interface OwnedAirlineBasesReport {
  schemaVersion:1;
  observedAt:string;
  status:'observed'|'fallback';
  source:'research_main.php#hubSelect'|'configured-fallback';
  reason:string;
  effectiveBases:string[];
  hubs:OwnedHubEvidence[];
  unresolvedSourceIds:number[];
  fallbackBases:string[];
  dryRun:true;
  mutationAuthorized:false;
}

function validBases(bases:readonly string[]){
  return bases.length>0&&bases.every(x=>/^[A-Z]{3}$/.test(x))&&new Set(bases).size===bases.length;
}

export function resolveOwnedHubOptions(
  options:readonly OwnedHubOption[],
  catalog:AirportCatalog,
  fallbackBases:readonly string[]
):OwnedAirlineBasesReport {
  if(!validBases(fallbackBases))throw new Error('OWNED_BASE_FALLBACK_INVALID');
  const fallback=():OwnedAirlineBasesReport=>({
    schemaVersion:1 as const,observedAt:new Date().toISOString(),status:'fallback' as const,
    source:'configured-fallback' as const,reason:'LIVE_HUB_LIST_UNAVAILABLE_OR_UNRESOLVED',
    effectiveBases:[...fallbackBases],hubs:[],unresolvedSourceIds:[],fallbackBases:[...fallbackBases],
    dryRun:true as const,mutationAuthorized:false as const
  });
  if(!catalog||![1,2].includes(catalog.schemaVersion)||!Array.isArray(catalog.airports)||!options.length)return fallback();
  const seenIds=new Set<number>(),resolved:OwnedHubEvidence[]=[],unresolved:number[]=[];
  for(const option of options){
    if(!/^[1-9]\d*$/.test(option.id)||!option.name.trim())return fallback();
    const sourceId=Number(option.id);
    if(!Number.isSafeInteger(sourceId)||seenIds.has(sourceId))return fallback();
    seenIds.add(sourceId);
    const matches=catalog.airports.filter(a=>!a.conflict&&Array.isArray(a.sourceIds)&&a.sourceIds.includes(sourceId)&&/^[A-Z]{3}$/.test(a.iata));
    const codes=[...new Set(matches.map(a=>a.iata))];
    if(codes.length!==1){unresolved.push(sourceId);continue;}
    resolved.push({sourceId,iata:codes[0],name:option.name.trim().slice(0,160)});
  }
  if(unresolved.length||resolved.length!==options.length||new Set(resolved.map(x=>x.iata)).size!==resolved.length){
    const out=fallback();out.unresolvedSourceIds=unresolved;return out;
  }
  return {
    schemaVersion:1,observedAt:new Date().toISOString(),status:'observed',source:'research_main.php#hubSelect',
    reason:'LIVE_OWNED_HUBS_CROSSCHECKED_BY_AIRPORT_SOURCE_ID',
    effectiveBases:resolved.map(x=>x.iata),hubs:resolved,unresolvedSourceIds:[],fallbackBases:[...fallbackBases],
    dryRun:true,mutationAuthorized:false
  };
}

async function liveOwnedHubOptions(page:Page,timeoutMs=10000):Promise<OwnedHubOption[]>{
  try{
    return await page.evaluate(async timeout=>{
      if(!/(^|\.)airlinemanager\.com$/i.test(location.hostname))return [];
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
      try{
        const response=await fetch('research_main.php',{credentials:'include',signal:controller.signal});
        if(!response.ok)return [];
        const html=await response.text(),doc=new DOMParser().parseFromString(html,'text/html');
        const selectors=doc.querySelectorAll('#hubSelect');
        if(selectors.length!==1)return [];
        return Array.from(selectors[0].querySelectorAll('option')).flatMap(option=>{
          const id=(option.getAttribute('value')||'').trim();
          const name=(option.textContent||'').replace(/\s+/g,' ').trim();
          return /^[1-9]\d*$/.test(id)&&name?[{id,name:name.slice(0,160)}]:[];
        });
      }finally{clearTimeout(timer);}
    },timeoutMs);
  }catch{return [];}
}

export async function discoverOwnedAirlineBases(
  page:Page,
  fallbackBases:readonly string[],
  directory='test-results/demand'
):Promise<OwnedAirlineBasesReport>{
  const options=await liveOwnedHubOptions(page);
  let catalog:AirportCatalog|null=null;
  try{catalog=await loadReference<AirportCatalog>('airports.json');}catch{/* fallback below */}
  const report=catalog?resolveOwnedHubOptions(options,catalog,fallbackBases):{
    schemaVersion:1 as const,observedAt:new Date().toISOString(),status:'fallback' as const,
    source:'configured-fallback' as const,reason:'AIRPORT_REFERENCE_UNAVAILABLE',
    effectiveBases:[...fallbackBases],hubs:[],unresolvedSourceIds:[],fallbackBases:[...fallbackBases],
    dryRun:true as const,mutationAuthorized:false as const
  };
  await mkdir(directory,{recursive:true});
  await writeFile(join(directory,'owned-airline-bases.json'),JSON.stringify(report,null,2)+'\n');
  await writeFile(join(directory,'owned-airline-bases.md'),[
    '# Bases da companhia','',
    `Status: **${report.status}** — ${report.reason}.`,'',
    `Bases efetivas: **${report.effectiveBases.join(', ')}**.`,
    ...(report.hubs.length?['',...report.hubs.map(h=>`- ${h.iata}: ${h.name} (sourceId ${h.sourceId})`)]:[]),
    '','_A lista live vem do seletor nativo de hubs da pagina de Research e e cruzada pelo ID do aeroporto. O fallback configurado so e usado quando a leitura live nao pode ser comprovada._',''
  ].join('\n'));
  console.log('[OwnedBases] '+JSON.stringify({status:report.status,bases:report.effectiveBases,reason:report.reason}));
  return report;
}
