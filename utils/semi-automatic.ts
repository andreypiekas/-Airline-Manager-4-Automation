import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { planTicketPrices } from '../pricing/ticket-pricing';
import type { DemandSimulationContext } from '../demand/run';

const readJson=async(path:string)=>{try{return JSON.parse(await readFile(path,'utf8'));}catch{return null;}};
const enabled=(raw:string|undefined,fallback=true)=>{
  const value=(raw||'').trim().toLowerCase();
  if(!value)return fallback;
  return !['false','0','off','no'].includes(value);
};

export interface SemiAutomaticSummary {
  schemaVersion:1;
  generatedAt:string;
  mode:'semi-automatic';
  noGameMutation:true;
  manualExecutionRequired:true;
  fleet:{seen:number;ready:number;inflight:number};
  demand:{evaluated:number;sufficient:number;insufficient:number;unavailable:number};
  pricing:{wouldAdjust:number;recommendationOnly:number;unchanged:number;unavailable:number};
  routes:{wouldReroute:number;keep:number;hold:number;unavailable:number};
  supplies:{
    fuel:{pricePer1000:number|null;status:string|null};
    co2:{pricePer1000:number|null;status:string|null};
  };
}

export async function writeSemiAutomaticSummary(
  context:DemandSimulationContext,
  directory='test-results/demand',
  env:NodeJS.ProcessEnv=process.env
):Promise<SemiAutomaticSummary>{
  if(env.AUTOMATION_MODE!=='semi-automatic')throw new Error('SEMI_AUTOMATIC_SUMMARY_MODE_INVALID');

  const aircraft=context.collection.aircraft;
  const maxAgeSeconds=Number((env.DEMAND_MAX_AGE_SECONDS||'300').trim());
  const pricingEnabled=enabled(env.ENABLE_TICKET_PRICING,true);
  const pricing=aircraft.map(a=>planTicketPrices(a,pricingEnabled,new Date(),maxAgeSeconds));
  const routeDecisions=Array.isArray(context.candidateData?.routeDecisions)?context.candidateData.routeDecisions:[];
  const supply=await readJson(join(directory,'supply-report.json'));
  const supplyEntry=(kind:string)=>{
    const x=(supply?.entries||[]).find((e:any)=>e?.kind===kind);
    return {
      pricePer1000:Number.isSafeInteger(x?.before?.pricePer1000)?x.before.pricePer1000:null,
      status:typeof x?.status==='string'?x.status:null
    };
  };
  const summary:SemiAutomaticSummary={
    schemaVersion:1,
    generatedAt:new Date().toISOString(),
    mode:'semi-automatic',
    noGameMutation:true,
    manualExecutionRequired:true,
    fleet:{
      seen:aircraft.length,
      ready:aircraft.filter(a=>a.state==='ready').length,
      inflight:aircraft.filter(a=>a.state==='inflight').length
    },
    demand:{
      evaluated:context.report.summary.evaluated,
      sufficient:context.report.summary.sufficient,
      insufficient:context.report.summary.insufficient,
      unavailable:context.report.summary.unavailable
    },
    pricing:{
      wouldAdjust:pricing.filter(x=>x.status==='would_adjust').length,
      recommendationOnly:pricing.filter(x=>x.status==='recommendation_only').length,
      unchanged:pricing.filter(x=>x.status==='unchanged').length,
      unavailable:pricing.filter(x=>['unavailable','disabled'].includes(x.status)).length
    },
    routes:{
      wouldReroute:routeDecisions.filter((x:any)=>x?.decision==='would_reroute').length,
      keep:routeDecisions.filter((x:any)=>x?.decision==='keep_route').length,
      hold:routeDecisions.filter((x:any)=>x?.decision==='hold').length,
      unavailable:routeDecisions.filter((x:any)=>x?.decision==='unavailable').length
    },
    supplies:{fuel:supplyEntry('fuel'),co2:supplyEntry('co2')}
  };

  await writeFile(join(directory,'semi-automatic-summary.json'),JSON.stringify(summary,null,2)+'\n');
  await writeFile(join(directory,'semi-automatic-summary.md'),[
    '# Modo semiautomático','',
    '> Nenhuma mutação no jogo foi autorizada nesta execução. Para executar, faça uma run manual com a confirmação do modo semiautomático.','',
    `- Frota: ${summary.fleet.ready} prontas / ${summary.fleet.seen} observadas.`,
    `- Demanda: ${summary.demand.sufficient} suficientes / ${summary.demand.evaluated} avaliadas.`,
    `- Pricing: ${summary.pricing.wouldAdjust} ajustes confirmadamente necessários; ${summary.pricing.recommendationOnly} recomendações sem preço atual confirmado.`,
    `- Rotas: ${summary.routes.wouldReroute} candidatas a reroute.`,
    `- Fuel: ${summary.supplies.fuel.pricePer1000??'n/d'} por 1k (${summary.supplies.fuel.status??'n/d'}).`,
    `- CO2: ${summary.supplies.co2.pricePer1000??'n/d'} por 1k (${summary.supplies.co2.status??'n/d'}).`,'',
  ].join('\n'));
  return summary;
}
