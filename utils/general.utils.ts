import { Page } from "@playwright/test";
import { assertNoInteractiveChallenge } from "./challenge-guard";

require('dotenv').config();

export class GeneralUtils {
    username: string;
    password: string;
    page: Page;

    constructor(page: Page) {
        this.username = process.env.EMAIL!;
        this.password = process.env.PASSWORD!;
        this.page = page;
    }

    public static async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /** Small bounded jitter used only to allow asynchronous UI transitions to settle. */
    public static async randomSleep(min: number, max: number) {
        const ms = Math.floor(Math.random() * (max - min + 1) + min);
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /** Move the pointer for UI stability/visibility only; no anti-detection behavior. */
    public static async movePointer(page: Page, targetX: number, targetY: number) {
        await assertNoInteractiveChallenge(page, 'pointer-move');
        await page.mouse.move(targetX, targetY);
    }

    /** Standard Playwright click with a challenge check immediately before interaction. */
    public static async moveAndClick(page: Page, locator: any, customTimeout = 10000) {
        await assertNoInteractiveChallenge(page, 'before-click');
        await locator.waitFor({ state: 'visible', timeout: customTimeout });
        await locator.click({ timeout: customTimeout });
    }

    public static async clickControl(page: Page, selectorOrLocator: any) {
        const locator = typeof selectorOrLocator === 'string' ? page.locator(selectorOrLocator) : selectorOrLocator;
        await this.moveAndClick(page, locator);
    }

    /** Legacy login path retained for compatibility. Uses normal browser interaction only. */
    public async login(page: Page) {
        console.log('Iniciando login no Airline Manager 4...');
        await page.goto('https://www.airlinemanager.com/');
        await assertNoInteractiveChallenge(page, 'legacy-login:site-open');

        await page.waitForLoadState('networkidle', { timeout: 15000 })
            .catch(() => console.log('Rede ainda esta carregando; continuando...'));

        const playFreeButton = page.getByRole('button', { name: /play free now/i });
        await playFreeButton.waitFor({ state: 'visible', timeout: 30000 });

        let loginOpened = false;
        const loginMenuButton = page.getByRole('button', { name: /log\s*in|sign\s*in/i });

        for (let attempt = 1; attempt <= 3; attempt++) {
            await assertNoInteractiveChallenge(page, 'legacy-login:open-game');
            if (await page.locator('#lEmail').isVisible()) {
                loginOpened = true;
                break;
            }
            if (await loginMenuButton.first().isVisible()) {
                loginOpened = true;
                break;
            }
            try {
                await playFreeButton.click({ timeout: 12000 });
            } catch (error) {
                console.warn('[Login] Clique em PLAY FREE NOW falhou:', error);
            }
            await assertNoInteractiveChallenge(page, 'legacy-login:after-open-game');
            try {
                await loginMenuButton.first().waitFor({ state: 'visible', timeout: 7000 });
                loginOpened = true;
                break;
            } catch {
                if (await page.locator('#lEmail').isVisible()) {
                    loginOpened = true;
                    break;
                }
                console.warn('[Login] O jogo ainda nao mostrou o acesso; tentando novamente.');
                await page.waitForTimeout(1500);
            }
        }

        if (!loginOpened) throw new Error('[Login] PLAY FREE NOW nao abriu a tela de acesso.');

        if (!(await page.locator('#lEmail').isVisible())) {
            await assertNoInteractiveChallenge(page, 'legacy-login:before-login-form');
            await loginMenuButton.first().click({ timeout: 15000 });
        }

        await assertNoInteractiveChallenge(page, 'legacy-login:before-credentials');
        await page.locator('#lEmail').waitFor({ state: 'visible', timeout: 12000 });
        const emailInput = page.locator('#lEmail');
        const passwordInput = page.locator('#lPass');
        await emailInput.fill(this.username);
        await passwordInput.fill(this.password);

        await assertNoInteractiveChallenge(page, 'legacy-login:before-submit');
        await page.getByRole('button', { name: 'Log In', exact: true }).click({ timeout: 15000 });
        await assertNoInteractiveChallenge(page, 'legacy-login:after-submit');

        console.log('Tentativa de login concluida; validando operacoes seguintes.');
    }
}
