import { Page } from "@playwright/test";
import { GeneralUtils } from "./general.utils";
import { assertNoInteractiveChallenge } from "./challenge-guard";

export class CampaignUtils {
    page: Page;

    increaseAirlineReputation: boolean = false;
    campaignType: number = 1;
    campaignDuration: number = 4;

    constructor(page: Page) {
        this.page = page;

        this.increaseAirlineReputation =
            (process.env.INCREASE_AIRLINE_REPUTATION || 'false').trim().toLowerCase() === 'true';

        const configuredType = parseInt(process.env.CAMPAIGN_TYPE || '1', 10);
        const configuredDuration = parseInt(process.env.CAMPAIGN_DURATION || '4', 10);

        this.campaignType = Number.isFinite(configuredType) && configuredType > 0 ? configuredType : 1;
        this.campaignDuration = Number.isFinite(configuredDuration) && configuredDuration > 0 ? configuredDuration : 4;
    }

    /** Standard UI helpers; delays only allow dependent UI state to settle. */
    private async moveAndClick(locator: any) {
        await GeneralUtils.moveAndClick(this.page, locator);
    }

    private async moveAndSelectOption(selectLocator: any, optionValue: string) {
        await assertNoInteractiveChallenge(this.page, 'campaign:before-select');
        await selectLocator.waitFor({ state: 'visible', timeout: 10000 });
        await selectLocator.selectOption(optionValue);
    }

    private async createEcoFriendly() {
        const isEcoFriendExists = await this.page.getByRole('cell', { name: ' Eco friendly' }).isVisible();
        if(!isEcoFriendExists) {
            const newCampaignButton = this.page.getByRole('button', { name: ' New campaign' });
            await this.moveAndClick(newCampaignButton);
            await GeneralUtils.randomSleep(1000, 2000);
            
            const ecoFriendlyCell = this.page.getByRole('cell', { name: 'Eco-friendly Increases' });
            await this.moveAndClick(ecoFriendlyCell);
            await GeneralUtils.randomSleep(1000, 2000);
            
            const buyButton = this.page.getByRole('button', { name: '$' });
            await this.moveAndClick(buyButton);

            console.log("Campanha ecologica iniciada.");
        }
    }

    private async createReputation() {
        const campaignType = this.campaignType.toString();
        const durationOption = (Math.floor(this.campaignDuration / 4) || 1).toString();

        const isAirlineReputationExists = await this.page.getByRole('cell', { name: ' Airline reputation' }).isVisible();
        if (!isAirlineReputationExists) {
            const newCampaignButton = this.page.getByRole('button', { name: ' New campaign' });
            await this.moveAndClick(newCampaignButton);
            await GeneralUtils.randomSleep(1000, 2000);
            
            const increaseReputationCell = this.page.getByRole('cell', { name: 'Increase airline reputation' });
            await this.moveAndClick(increaseReputationCell);
            await GeneralUtils.randomSleep(1000, 2000);
            
            const durationSelect = this.page.locator('#dSelector');
            await this.moveAndSelectOption(durationSelect, durationOption);
            await GeneralUtils.randomSleep(1000, 2000);
            
            const targetCampaignButton = this.page.locator(`tr:has(td:has-text("Campaign ${campaignType}")) .btn-danger`);
            await this.moveAndClick(targetCampaignButton);

            console.log("Campanha de reputacao da companhia iniciada.");
        }
    }

    public async createCampaign() {
        console.log('Iniciando verificacao de campanhas...')

        const marketingButton = this.page.getByRole('button', { name: ' Marketing' });
        await this.moveAndClick(marketingButton);

        await GeneralUtils.randomSleep(1500, 3000);

        await this.createEcoFriendly();
        await GeneralUtils.randomSleep(1500, 3000);

        if(this.increaseAirlineReputation) {
            await this.createReputation();
        }

        console.log('Verificacao de campanhas finalizada.');
    }
}
