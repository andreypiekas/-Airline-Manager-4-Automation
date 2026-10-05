import { Page, Locator } from "@playwright/test";
import { GeneralUtils } from "./general.utils";
import { assertNoInteractiveChallenge } from "./challenge-guard";

export type CampaignItemStatus = 'already_active' | 'purchased_verified' | 'not_required' | 'unverified';

export interface CampaignItemEvidence {
    required: boolean;
    activeBefore: boolean;
    purchaseAttempted: boolean;
    verifiedActive: boolean;
    status: CampaignItemStatus;
    reason: string;
}

export interface CampaignEvidence {
    schemaVersion: 1;
    observedAt: string;
    ecoFriendly: CampaignItemEvidence;
    airlineReputation: CampaignItemEvidence;
    allRequiredVerified: boolean;
    departureAuthorized: boolean;
}

export class CampaignUtils {
    page: Page;
    increaseAirlineReputation = false;
    campaignType = 1;
    campaignDuration = 4;

    constructor(page: Page) {
        this.page = page;
        this.increaseAirlineReputation = (process.env.INCREASE_AIRLINE_REPUTATION || 'false').trim().toLowerCase() === 'true';
        const configuredType = parseInt(process.env.CAMPAIGN_TYPE || '1', 10);
        const configuredDuration = parseInt(process.env.CAMPAIGN_DURATION || '4', 10);
        this.campaignType = Number.isFinite(configuredType) && configuredType > 0 ? configuredType : 1;
        this.campaignDuration = Number.isFinite(configuredDuration) && configuredDuration > 0 ? configuredDuration : 4;
    }

    private async moveAndClick(locator: Locator) {
        await GeneralUtils.moveAndClick(this.page, locator);
    }

    private async moveAndSelectOption(selectLocator: Locator, optionValue: string) {
        await assertNoInteractiveChallenge(this.page, 'campaign:before-select');
        await selectLocator.waitFor({ state: 'visible', timeout: 10000 });
        await selectLocator.selectOption(optionValue);
    }

    private activeEcoLocator() {
        return this.page.getByRole('cell', { name: /Eco friendly/i }).first();
    }

    private activeReputationLocator() {
        return this.page.getByRole('cell', { name: /Airline reputation/i }).first();
    }

    private async isVisible(locator: Locator, timeout = 500): Promise<boolean> {
        return locator.isVisible({ timeout }).catch(() => false);
    }

    private async verifyActive(locator: Locator, stage: string): Promise<boolean> {
        await assertNoInteractiveChallenge(this.page, stage);
        if (await this.isVisible(locator, 800)) return true;

        // Reopen Marketing once to obtain a fresh post-action view.
        const marketingButton = this.page.getByRole('button', { name: /Marketing/i }).first();
        if (await this.isVisible(marketingButton, 800)) {
            await this.moveAndClick(marketingButton);
            await GeneralUtils.randomSleep(500, 900);
            await assertNoInteractiveChallenge(this.page, stage + ':after-refresh');
        }

        return locator.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
    }

    private async ensureEcoFriendly(): Promise<CampaignItemEvidence> {
        const active = this.activeEcoLocator();
        if (await this.verifyActive(active, 'campaign:eco:precheck')) {
            return { required: true, activeBefore: true, purchaseAttempted: false, verifiedActive: true,
                status: 'already_active', reason: 'ACTIVE_BEFORE_ACTION' };
        }

        const newCampaignButton = this.page.getByRole('button', { name: /New campaign/i }).first();
        await this.moveAndClick(newCampaignButton);
        await GeneralUtils.randomSleep(600, 1000);
        const ecoFriendlyCell = this.page.getByRole('cell', { name: /Eco-friendly Increases/i }).first();
        await this.moveAndClick(ecoFriendlyCell);
        await GeneralUtils.randomSleep(600, 1000);
        const buyButton = this.page.getByRole('button', { name: '$' }).first();

        try {
            await this.moveAndClick(buyButton);
        } catch (error) {
            if ((error as Error)?.message === 'INTERACTIVE_CHALLENGE_DETECTED_STOP') throw error;
            return { required: true, activeBefore: false, purchaseAttempted: true, verifiedActive: false,
                status: 'unverified', reason: 'ECO_PURCHASE_OUTCOME_UNCONFIRMED:' + ((error as Error)?.message || 'UNCLASSIFIED') };
        }

        await GeneralUtils.randomSleep(700, 1200);
        const verified = await this.verifyActive(active, 'campaign:eco:post-purchase');
        return { required: true, activeBefore: false, purchaseAttempted: true, verifiedActive: verified,
            status: verified ? 'purchased_verified' : 'unverified',
            reason: verified ? 'POST_PURCHASE_ACTIVE_CONFIRMED' : 'POST_PURCHASE_ACTIVE_NOT_CONFIRMED' };
    }

    private async ensureReputation(): Promise<CampaignItemEvidence> {
        if (!this.increaseAirlineReputation) {
            return { required: false, activeBefore: false, purchaseAttempted: false, verifiedActive: false,
                status: 'not_required', reason: 'REPUTATION_NOT_REQUIRED' };
        }

        const active = this.activeReputationLocator();
        if (await this.verifyActive(active, 'campaign:reputation:precheck')) {
            return { required: true, activeBefore: true, purchaseAttempted: false, verifiedActive: true,
                status: 'already_active', reason: 'ACTIVE_BEFORE_ACTION' };
        }

        const newCampaignButton = this.page.getByRole('button', { name: /New campaign/i }).first();
        await this.moveAndClick(newCampaignButton);
        await GeneralUtils.randomSleep(600, 1000);
        const increaseReputationCell = this.page.getByRole('cell', { name: /Increase airline reputation/i }).first();
        await this.moveAndClick(increaseReputationCell);
        await GeneralUtils.randomSleep(600, 1000);

        const durationOption = (Math.floor(this.campaignDuration / 4) || 1).toString();
        const durationSelect = this.page.locator('#dSelector');
        await this.moveAndSelectOption(durationSelect, durationOption);
        await GeneralUtils.randomSleep(500, 800);

        const targetCampaignButton = this.page
            .locator('tr:has(td:has-text("Campaign ' + this.campaignType + '")) .btn-danger')
            .first();
        try {
            await this.moveAndClick(targetCampaignButton);
        } catch (error) {
            if ((error as Error)?.message === 'INTERACTIVE_CHALLENGE_DETECTED_STOP') throw error;
            return { required: true, activeBefore: false, purchaseAttempted: true, verifiedActive: false,
                status: 'unverified', reason: 'REPUTATION_PURCHASE_OUTCOME_UNCONFIRMED:' + ((error as Error)?.message || 'UNCLASSIFIED') };
        }

        await GeneralUtils.randomSleep(700, 1200);
        const verified = await this.verifyActive(active, 'campaign:reputation:post-purchase');
        return { required: true, activeBefore: false, purchaseAttempted: true, verifiedActive: verified,
            status: verified ? 'purchased_verified' : 'unverified',
            reason: verified ? 'POST_PURCHASE_ACTIVE_CONFIRMED' : 'POST_PURCHASE_ACTIVE_NOT_CONFIRMED' };
    }

    public async createCampaign(): Promise<CampaignEvidence> {
        console.log('Iniciando verificacao de campanhas...');
        await assertNoInteractiveChallenge(this.page, 'campaign:start');
        const marketingButton = this.page.getByRole('button', { name: /Marketing/i }).first();
        await this.moveAndClick(marketingButton);
        await GeneralUtils.randomSleep(700, 1200);

        const ecoFriendly = await this.ensureEcoFriendly();
        await GeneralUtils.randomSleep(500, 800);
        const airlineReputation = !ecoFriendly.verifiedActive && this.increaseAirlineReputation
            ? {
                required: true, activeBefore: false, purchaseAttempted: false, verifiedActive: false,
                status: 'unverified' as const, reason: 'PREVIOUS_REQUIRED_CAMPAIGN_UNVERIFIED'
              }
            : await this.ensureReputation();
        const allRequiredVerified = ecoFriendly.verifiedActive &&
            (!airlineReputation.required || airlineReputation.verifiedActive);

        const evidence: CampaignEvidence = {
            schemaVersion: 1,
            observedAt: new Date().toISOString(),
            ecoFriendly,
            airlineReputation,
            allRequiredVerified,
            departureAuthorized: allRequiredVerified
        };

        console.log('[Campaign] ' + JSON.stringify({
            eco: ecoFriendly.status,
            reputation: airlineReputation.status,
            allRequiredVerified
        }));
        return evidence;
    }
}
