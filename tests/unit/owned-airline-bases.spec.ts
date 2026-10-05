import { test, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { discoverOwnedAirlineBases, resolveOwnedHubOptions } from '../../optimization/owned-airline-bases';
import { AirportCatalog, loadReference } from '../../optimization/reference-data';

test('maps live owned hub source ids to every current company base',async()=>{
  const catalog=await loadReference<AirportCatalog>('airports.json');
  const r=resolveOwnedHubOptions([
    {id:'2926',name:'Chapecó, Brazil'},
    {id:'2947',name:'São Paulo Guarulhos, Brazil'},
    {id:'1275',name:'Detroit Metrop., United States'},
    {id:'465',name:'Berlin Tegel, Germany'},
  ],catalog,['XAP','GRU','DTW','TXL']);
  expect(r).toMatchObject({status:'observed',source:'research_main.php#hubSelect',
    effectiveBases:['XAP','GRU','DTW','TXL'],unresolvedSourceIds:[]});
  expect(r.hubs.map(h=>h.sourceId)).toEqual([2926,2947,1275,465]);
});

test('unknown or ambiguous live hub ids fail closed to configured bases',async()=>{
  const catalog=await loadReference<AirportCatalog>('airports.json');
  const fallback=['XAP','GRU','DTW','TXL'];
  expect(resolveOwnedHubOptions([{id:'99999999',name:'Unknown'}],catalog,fallback)).toMatchObject({
    status:'fallback',effectiveBases:fallback,unresolvedSourceIds:[99999999]
  });
  expect(resolveOwnedHubOptions([{id:'2926',name:'A'},{id:'2926',name:'B'}],catalog,fallback)).toMatchObject({
    status:'fallback',effectiveBases:fallback
  });
});

test('discovers owned hubs from the authenticated research page without mutation',async({page})=>{
  const dir=await mkdtemp(join(tmpdir(),'am4-owned-bases-'));
  try{
    await page.route('https://www.airlinemanager.com/',route=>route.fulfill({status:200,contentType:'text/html',body:'<html><body>AM4</body></html>'}));
    await page.route('https://www.airlinemanager.com/research_main.php',route=>route.fulfill({status:200,contentType:'text/html',body:
      '<select id="hubSelect"><option value="2926">Chapecó, Brazil</option><option value="2947">São Paulo Guarulhos, Brazil</option><option value="1275">Detroit Metrop., United States</option><option value="465">Berlin Tegel, Germany</option></select>'}));
    await page.goto('https://www.airlinemanager.com/');
    const r=await discoverOwnedAirlineBases(page,['XAP','GRU','DTW','TXL'],dir);
    expect(r).toMatchObject({status:'observed',effectiveBases:['XAP','GRU','DTW','TXL']});
    expect(r.mutationAuthorized).toBe(false);
  }finally{await rm(dir,{recursive:true,force:true});}
});
