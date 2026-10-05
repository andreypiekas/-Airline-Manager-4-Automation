import { test, expect } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { assertNoInteractiveChallenge } from '../../utils/challenge-guard';

let dir:string;
test.beforeEach(async()=>{dir=await mkdtemp(join(tmpdir(),'am4-challenge-'));});
test.afterEach(async()=>{await rm(dir,{recursive:true,force:true});});

test('normal AM4 page passes challenge guard',async({page})=>{
  await page.setContent('<html><head><title>Airline Manager 4</title></head><body><div id="mapRoutes">Fleet</div></body></html>');
  await expect(assertNoInteractiveChallenge(page,'normal',dir)).resolves.toBeUndefined();
});

test('visible captcha stops immediately and records non-actionable evidence',async({page})=>{
  await page.setContent('<html><body><div class="g-recaptcha">verification</div></body></html>');
  await expect(assertNoInteractiveChallenge(page,'before-login',dir)).rejects.toThrow('INTERACTIVE_CHALLENGE_DETECTED_STOP');
  const saved=JSON.parse(await readFile(join(dir,'challenge-detected.json'),'utf8'));
  expect(saved).toMatchObject({detected:true,stage:'before-login',reason:'VISIBLE_CHALLENGE_CONTROL_DETECTED',mutationAuthorized:false});
});

test('human verification text stops without attempting to solve it',async({page})=>{
  await page.setContent('<html><body><p>Please verify that you are human to continue.</p></body></html>');
  await expect(assertNoInteractiveChallenge(page,'runtime',dir)).rejects.toThrow('INTERACTIVE_CHALLENGE_DETECTED_STOP');
});
