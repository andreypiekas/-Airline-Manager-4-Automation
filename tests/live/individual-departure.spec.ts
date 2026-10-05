import { test,expect } from '@playwright/test';
import { readDemandConfig } from '../../demand/config';
import { executionEnvironment,runDemandExecution } from '../../demand/execute-run';
import { loginForReadOnlyCollection } from '../../utils/read-only-login';
import { withRunLock } from '../../utils/run-lock';
import { CampaignUtils } from '../../utils/campaign.utils';
import { GeneralUtils } from '../../utils/general.utils';
import { assertNoInteractiveChallenge } from '../../utils/challenge-guard';

const enabled=(raw:string|undefined,fallback=true)=>{
 const value=(raw||'').trim().toLowerCase();
 if(!value)return fallback;
 return !['false','0','off','no'].includes(value);
};

test('executor individual — escopo controlado, com campanha validada antes de departure',async({page})=>{
 await withRunLock(async()=>{
  const config=readDemandConfig();executionEnvironment(config); // Reject before entering credentials.
  await loginForReadOnlyCollection(page,process.env,90000);

  const campaignRequired=enabled(process.env.ENABLE_CAMPAIGN,true);
  let campaignVerified=!campaignRequired;

  if(!config.dryRun&&campaignRequired){
   await assertNoInteractiveChallenge(page,'individual:before-campaign');
   const campaignMenu=page.locator('div:nth-child(5) > #mapMaint > img');
   await GeneralUtils.moveAndClick(page,campaignMenu,20000);
   await page.getByRole('button',{name:/Marketing/i}).waitFor({state:'visible',timeout:15000});
   try{
    const evidence=await new CampaignUtils(page).createCampaign();
    campaignVerified=evidence.allRequiredVerified;
   }catch(error){
    if((error as Error)?.message==='INTERACTIVE_CHALLENGE_DETECTED_STOP')throw error;
    campaignVerified=false;
   }
   await assertNoInteractiveChallenge(page,'individual:after-campaign');
   await page.evaluate(()=>{const fn=(window as any).hideAllWhenClick;if(typeof fn==='function')fn();}).catch(()=>undefined);
   await page.waitForTimeout(500);
  }

  const report=await runDemandExecution(page,config,{
   ...process.env,
   CAMPAIGN_GATE_REQUIRED:campaignRequired?'true':'false',
   CAMPAIGN_GATE_VERIFIED:campaignVerified?'true':'false'
  });
  expect(report.halted).toBe(false);
  expect(report.summary.departed).toBeLessThanOrEqual(Number(process.env.DEMAND_MAX_DEPARTURES_PER_RUN||'1'));
  if(!config.dryRun&&campaignRequired&&!campaignVerified){
   expect(report.summary.departed).toBe(0);
   expect(report.entries.every(e=>e.reason==='CAMPAIGN_NOT_VERIFIED')).toBe(true);
  }
 });
});
