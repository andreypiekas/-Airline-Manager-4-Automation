import { Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CHALLENGE_URL = /(?:captcha|challenge|turnstile|recaptcha|hcaptcha|cdn-cgi\/challenge)/i;
const CHALLENGE_TITLE = /^(?:just a moment|security check|verification required|attention required)/i;
const CHALLENGE_TEXT = /(?:verify (?:that )?you are human|confirm (?:that )?you are human|checking your browser|security verification|complete the captcha|captcha verification)/i;
const CHALLENGE_SELECTORS = [
  'iframe[src*="recaptcha" i]',
  'iframe[src*="hcaptcha" i]',
  'iframe[src*="turnstile" i]',
  '.g-recaptcha',
  '.h-captcha',
  '.cf-turnstile'
];

export interface ChallengeEvidence {
  detected: boolean;
  stage: string;
  reason: string | null;
  observedAt: string;
  mutationAuthorized: false;
}

async function persist(evidence:ChallengeEvidence,directory:string){
  await mkdir(directory,{recursive:true});
  await writeFile(join(directory,'challenge-detected.json'),JSON.stringify(evidence,null,2)+'\n');
}

export async function assertNoInteractiveChallenge(
  page:Page,
  stage='runtime',
  directory='test-results/demand'
):Promise<void>{
  let reason:string|null=null;
  const url=page.url();
  if(CHALLENGE_URL.test(url)) reason='CHALLENGE_URL_DETECTED';

  if(!reason){
    const title=await page.title().catch(()=> '');
    if(CHALLENGE_TITLE.test(title.trim())) reason='CHALLENGE_TITLE_DETECTED';
  }

  if(!reason){
    for(const selector of CHALLENGE_SELECTORS){
      const locator=page.locator(selector).first();
      if(await locator.isVisible({timeout:200}).catch(()=>false)){
        reason='VISIBLE_CHALLENGE_CONTROL_DETECTED';
        break;
      }
    }
  }

  if(!reason){
    const text=await page.locator('body').innerText({timeout:500}).catch(()=> '');
    if(CHALLENGE_TEXT.test(text.slice(0,12000))) reason='CHALLENGE_TEXT_DETECTED';
  }

  if(!reason)return;

  const evidence:ChallengeEvidence={
    detected:true,
    stage:String(stage).replace(/[\r\n\t]+/g,' ').slice(0,120),
    reason,
    observedAt:new Date().toISOString(),
    mutationAuthorized:false
  };
  await persist(evidence,directory).catch(()=>undefined);
  throw new Error('INTERACTIVE_CHALLENGE_DETECTED_STOP');
}
