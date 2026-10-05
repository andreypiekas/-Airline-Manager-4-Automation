import { test, expect } from '@playwright/test';
import { readAirlineBases, resolveAircraftOrigin } from '../../optimization/aircraft-origins';
import { AircraftSnapshot } from '../../demand/types';
function resolve(from: string, to: string, explicit?: string, complete = true) {
  const a: AircraftSnapshot = { aircraftId:'1',routeId:'2',registration:'TEST',routeLabel:`${from}-${to}`,from,to,state:'inflight',capacity:null,remaining:null,dailyTotal:null,observedAt:new Date().toISOString() };
  return resolveAircraftOrigin(a,{aircraft:[a],complete,expectedRoutes:1,warnings:[]},new Map(explicit?[['1',explicit]]:[]),readAirlineBases('["GRU","DTW","XAP","TXL"]'));
}
for (const [a,b,base] of [['GRU','BSB','GRU'],['BSB','GRU','GRU'],['GEO','DTW','DTW'],['XAP','BSB','XAP'],['TXL','BTJ','TXL'],['MIA','TXL','TXL']]) test(`unique base ${a}-${b}`,()=>{
  expect(resolve(a,b)).toMatchObject({origin:base,source:'unique-route-base'});
});
for (const [a,b] of [['GRU','XAP'],['XAP','GRU'],['DTW','GRU'],['DTW','TXL'],['TXL','GRU'],['BSB','GEO']]) test(`ambiguous or missing base ${a}-${b}`,()=>expect(resolve(a,b).origin).toBeNull());
test('explicit assignment resolves two hubs and takes priority over route rule',()=>{
  expect(resolve('GRU','XAP','XAP')).toMatchObject({origin:'XAP',source:'registered'});
  expect(resolve('GRU','BSB','DTW').origin).toBe('DTW');
});
test('incomplete collection and invalid route cannot infer origin',()=>{
  expect(resolve('GRU','BSB',undefined,false).origin).toBeNull();
  expect(resolve('GRU','GRU').origin).toBeNull();
  expect(resolve('GRU','bad').origin).toBeNull();
});
for(const raw of ['["GRU","GRU"]','["gru"]','{}','null'])test(`invalid base config ${raw}`,()=>expect(()=>readAirlineBases(raw)).toThrow());
test('missing base fallback is empty and fail-closed',()=>{
  expect(readAirlineBases(undefined)).toEqual([]);
  expect(readAirlineBases('')).toEqual([]);
  expect(readAirlineBases('[]')).toEqual([]);
});
test('configured bases are used exactly as supplied',()=>expect(readAirlineBases('["LHR"]')).toEqual(['LHR']));
