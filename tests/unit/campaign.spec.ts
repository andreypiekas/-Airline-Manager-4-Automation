import { test, expect } from '@playwright/test';
import { CampaignUtils } from '../../utils/campaign.utils';

const withReputation = async (value:string|undefined,fn:()=>Promise<void>)=>{
  const previous=process.env.INCREASE_AIRLINE_REPUTATION;
  try{
    if(value===undefined)delete process.env.INCREASE_AIRLINE_REPUTATION;
    else process.env.INCREASE_AIRLINE_REPUTATION=value;
    await fn();
  }finally{
    if(previous===undefined)delete process.env.INCREASE_AIRLINE_REPUTATION;
    else process.env.INCREASE_AIRLINE_REPUTATION=previous;
  }
};

test('campaign verification accepts campaigns already active before departure',async({page})=>{
 await withReputation('true',async()=>{
  await page.setContent(`
   <button>Marketing</button>
   <table>
    <tr><td> Eco friendly</td></tr>
    <tr><td> Airline reputation</td></tr>
   </table>
  `);
  const evidence=await new CampaignUtils(page).createCampaign();
  expect(evidence).toMatchObject({
   allRequiredVerified:true,
   departureAuthorized:true,
   ecoFriendly:{status:'already_active',verifiedActive:true,purchaseAttempted:false},
   airlineReputation:{status:'already_active',verifiedActive:true,purchaseAttempted:false}
  });
 });
});

test('eco campaign is re-read and confirmed after purchase',async({page})=>{
 await withReputation('false',async()=>{
  await page.setContent(`
   <button>Marketing</button>
   <button>New campaign</button>
   <button style="display:none">$</button>
   <table id="campaigns"><tr><td>Eco-friendly Increases</td></tr></table>
   <button id="buyEco">$</button>
   <script>
    document.querySelector('#buyEco').onclick=()=>{
      const row=document.createElement('tr');
      row.innerHTML='<td> Eco friendly</td>';
      document.querySelector('#campaigns').appendChild(row);
    };
   </script>
  `);
  const evidence=await new CampaignUtils(page).createCampaign();
  expect(evidence.ecoFriendly).toMatchObject({
   activeBefore:false,purchaseAttempted:true,verifiedActive:true,status:'purchased_verified',
   reason:'POST_PURCHASE_ACTIVE_CONFIRMED'
  });
  expect(evidence.airlineReputation.status).toBe('not_required');
  expect(evidence.allRequiredVerified).toBe(true);
 });
});

test('hidden stale active-campaign rows do not mask the visible current campaign state',async({page})=>{
 await withReputation('true',async()=>{
  await page.setContent(`
   <button>Marketing</button>
   <table style="display:none">
    <tr><td> Eco friendly</td></tr>
    <tr><td> Airline reputation</td></tr>
   </table>
   <table>
    <tr><td> Eco friendly</td></tr>
    <tr><td> Airline reputation</td></tr>
   </table>
  `);
  const evidence=await new CampaignUtils(page).createCampaign();
  expect(evidence).toMatchObject({
   allRequiredVerified:true,departureAuthorized:true,
   ecoFriendly:{status:'already_active',verifiedActive:true},
   airlineReputation:{status:'already_active',verifiedActive:true}
  });
 });
});

test('reputation campaign is re-read and confirmed after purchase',async({page})=>{
 await withReputation('true',async()=>{
  process.env.CAMPAIGN_TYPE='1';process.env.CAMPAIGN_DURATION='4';
  try{
   await page.setContent(`
    <button>Marketing</button>
    <button>New campaign</button>
    <table id="campaigns">
      <tr><td> Eco friendly</td></tr>
      <tr><td>Increase airline reputation</td></tr>
      <tr><td>Campaign 1</td><td><button class="btn-danger">Buy</button></td></tr>
    </table>
    <select id="dSelector"><option value="1">4h</option></select>
    <script>
      document.querySelector('.btn-danger').onclick=()=>{
        const row=document.createElement('tr');
        row.innerHTML='<td> Airline reputation</td>';
        document.querySelector('#campaigns').appendChild(row);
      };
    </script>
   `);
   const evidence=await new CampaignUtils(page).createCampaign();
   expect(evidence.airlineReputation).toMatchObject({
    activeBefore:false,purchaseAttempted:true,verifiedActive:true,status:'purchased_verified'
   });
   expect(evidence.allRequiredVerified).toBe(true);
  }finally{
   delete process.env.CAMPAIGN_TYPE;delete process.env.CAMPAIGN_DURATION;
  }
 });
});

test('unconfirmed campaign never authorizes departure',async({page})=>{
 await withReputation('false',async()=>{
  await page.setContent(`
   <button>Marketing</button>
   <button>New campaign</button>
   <table><tr><td>Eco-friendly Increases</td></tr></table>
   <button>$</button>
  `);
  const evidence=await new CampaignUtils(page).createCampaign();
  expect(evidence.ecoFriendly).toMatchObject({
   purchaseAttempted:true,verifiedActive:false,status:'unverified',
   reason:'POST_PURCHASE_ACTIVE_NOT_CONFIRMED'
  });
  expect(evidence.allRequiredVerified).toBe(false);
  expect(evidence.departureAuthorized).toBe(false);
 });
});
