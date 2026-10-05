import { test, expect } from '@playwright/test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const {runSummaryMessage,importantMessage}=require('../../scripts/telegram-demand.cjs');

test('semi-automatic Telegram summary is concise and requires manual execution',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'am4-telegram-'));
 const oldMode=process.env.AUTOMATION_MODE,oldUrl=process.env.WORKFLOW_URL;
 try{
  process.env.AUTOMATION_MODE='semi-automatic';
  process.env.WORKFLOW_URL='https://github.com/example/repo/actions/workflows/playwright.yml';
  await writeFile(join(dir,'semi-automatic-summary.json'),JSON.stringify({
   mode:'semi-automatic',
   fleet:{seen:20,ready:13,inflight:7},
   demand:{evaluated:13,sufficient:11,insufficient:2,unavailable:0},
   pricing:{wouldAdjust:4,recommendationOnly:1,unchanged:8,unavailable:0},
   routes:{wouldReroute:2,keep:6,hold:5,unavailable:0},
   supplies:{fuel:{pricePer1000:420,status:'would_buy'},co2:{pricePer1000:88,status:'would_buy'}}
  }));
  const text=runSummaryMessage(dir,'success');
  expect(text).toContain('MODO SEMIAUTOMÁTICO');
  expect(text).toContain('Prontas: 13');
  expect(text).toContain('Fuel: $420/1k');
  expect(text).toContain('Pricing: 4 ajustes sugeridos');
  expect(text).toContain('Nenhuma operação foi executada');
  expect(text).toContain('confirm_semiautomatic_execution');
 }finally{
  if(oldMode===undefined)delete process.env.AUTOMATION_MODE;else process.env.AUTOMATION_MODE=oldMode;
  if(oldUrl===undefined)delete process.env.WORKFLOW_URL;else process.env.WORKFLOW_URL=oldUrl;
  await rm(dir,{recursive:true,force:true});
 }
});

test('safe maintenance HOLD becomes an explicit Telegram alert without implying mutation',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'am4-telegram-maint-hold-'));
 try{
  await writeFile(join(dir,'operational-modules.json'),JSON.stringify({
   schemaVersion:1,
   maintenance:{status:'held_safe',evidence:{reason:'UI_CONTROL_OBSCURED',mutationAuthorized:false}}
  }));
  const text=importantMessage(dir,'success',join(dir,'missing-journal.json'));
  expect(text).toContain('manutencao em HOLD seguro: UI_CONTROL_OBSCURED');
  expect(text).not.toContain('executada');
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('campaign verification is shown in Telegram summary and blocks departures when unverified',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'am4-telegram-campaign-'));
 const oldRun=process.env.GITHUB_RUN_NUMBER;
 try{
  process.env.GITHUB_RUN_NUMBER='99';
  await writeFile(join(dir,'company-dashboard.json'),JSON.stringify({
   run:{stale:false},
   bases:{effective:['AAA'],status:'observed'},
   fleet:{seen:2,inflight:1,ready:1},
   demand:{sufficient:1,evaluated:1,insufficient:0,unavailable:0},
   departures:{departed:0,evaluated:1,held:1,unknown:0},
   pricing:{adjusted:0,unchanged:1,unknown:0},
   routes:{rerouted:0,reviewDecisions:{keep:0,hold:0,wouldReroute:0}},
   supplies:{},
   campaign:{
    status:'unverified',
    departureAuthorized:false,
    evidence:{
     allRequiredVerified:false,
     ecoFriendly:{required:true,verifiedActive:false},
     airlineReputation:{required:true,verifiedActive:true}
    }
   },
   quarantines:{departure:0,route:0,pricingRoute:0,supplyKinds:0},
   uiHealth:{status:'healthy'}
  }));
  await writeFile(join(dir,'operational-modules.json'),JSON.stringify({
   schemaVersion:1,
   campaign:{status:'unverified',evidence:{allRequiredVerified:false,departureAuthorized:false}}
  }));
  const summary=runSummaryMessage(dir,'success');
  expect(summary).toContain('Campanhas: Eco ❌ | Reputation ✅ | decolagens ⛔');
  const alert=importantMessage(dir,'success',join(dir,'missing-journal.json'));
  expect(alert).toContain('campanhas exigidas nao confirmadas; decolagens bloqueadas');
 }finally{
  if(oldRun===undefined)delete process.env.GITHUB_RUN_NUMBER;else process.env.GITHUB_RUN_NUMBER=oldRun;
  await rm(dir,{recursive:true,force:true});
 }
});

test('post-reroute pricing HOLD becomes an explicit Telegram alert',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'am4-telegram-reroute-pricing-'));
 try{
  await writeFile(join(dir,'execution-report.json'),JSON.stringify({
   entries:[{aircraftId:'101',status:'held',reason:'REROUTE_PRICING_NOT_VERIFIED'}]
  }));
  const text=importantMessage(dir,'success',join(dir,'missing-journal.json'));
  expect(text).toContain('aeronaves reroteadas aguardando pricing confirmado: 1');
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('challenge evidence becomes an explicit Telegram alert',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'am4-telegram-challenge-'));
 try{
  await writeFile(join(dir,'challenge-detected.json'),JSON.stringify({detected:true,reason:'VISIBLE_CHALLENGE_CONTROL_DETECTED'}));
  expect(importantMessage(dir,'failure',join(dir,'missing-journal.json'))).toContain('CAPTCHA/challenge detectado');
 }finally{await rm(dir,{recursive:true,force:true});}
});
