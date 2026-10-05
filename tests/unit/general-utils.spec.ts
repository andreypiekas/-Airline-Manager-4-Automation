import { test, expect } from '@playwright/test';
import { GeneralUtils } from '../../utils/general.utils';

test('standard click uses a visible uncovered point without force', async ({page}) => {
  await page.setContent(`
    <style>
      #target { position:absolute; left:100px; top:100px; width:200px; height:80px; }
      #cover { position:absolute; left:100px; top:100px; width:200px; height:45px; z-index:10; }
    </style>
    <button id="target" onclick="window.clicked=(window.clicked||0)+1">Plan bulk check</button>
    <div id="cover"></div>
  `);
  const target=page.locator('#target');
  await GeneralUtils.moveAndClick(page,target,2000);
  expect(await page.evaluate(()=>(window as any).clicked||0)).toBe(1);
});

test('fully obscured control fails closed instead of forcing a click', async ({page}) => {
  await page.setContent(`
    <style>
      #target { position:absolute; left:100px; top:100px; width:200px; height:80px; }
      #cover { position:absolute; left:90px; top:90px; width:220px; height:100px; z-index:10; }
    </style>
    <button id="target" onclick="window.clicked=(window.clicked||0)+1">Plan bulk check</button>
    <div id="cover"></div>
  `);
  const target=page.locator('#target');
  await expect(GeneralUtils.moveAndClick(page,target,1000)).rejects.toThrow('UI_CONTROL_OBSCURED');
  expect(await page.evaluate(()=>(window as any).clicked||0)).toBe(0);
});
