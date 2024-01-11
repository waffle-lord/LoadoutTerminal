import { MailSendService } from "@spt-aki/services/MailSendService";
import { RagfairPriceService } from "@spt-aki/services/RagfairPriceService";
import { IUserDialogInfo } from "@spt-aki/models/eft/profile/IAkiProfile";
import { ISendMessageRequest } from "@spt-aki/models/eft/dialog/ISendMessageRequest";
import { LoadoutManager } from "./LoadoutManager";
import { injectable, inject } from "tsyringe";
import { ProfileHelper } from "@spt-aki/helpers/ProfileHelper";
import { InRaidHelper } from "@spt-aki/helpers/InRaidHelper";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";
import { CommandInfo, CommandType } from "./CommandInfo";
import { Item } from "@spt-aki/models/eft/common/tables/IItem";
import { Money } from "@spt-aki/models/enums/Money";


@injectable()
export class CommandHandler
{
    public constructor(
        @inject("LoadoutManager") protected loadoutManager: LoadoutManager,
        @inject("MailSendService") protected mailSendService: MailSendService,
        @inject("ProfileHelper") protected profileHelper: ProfileHelper,
        @inject("InRaidHelper") protected inRaidHelper: InRaidHelper,
        @inject("ItemHelper") protected itemHelper: ItemHelper,
        @inject("JsonUtil") protected jsonUtil: JsonUtil,
        @inject("RagfairPriceService") protected ragfairPriceService: RagfairPriceService,
    )
    {
    }

    private helpCommand(info: CommandInfo): string
    {
        if (!info.name) 
        {
            return "== Available Commands ==\n" +
                   "help\t\t:: This help text :D\n\t\t : Send with a command name to learn more\n\t\t : about it\n" +
                   "list\t\t:: List saved loadouts\n" +
                   "save\t\t:: Save your currently equipped items\n" +
                   "get\t\t:: Send yourself a loadout\n" +
                   "setprice\t:: Set the price on a loadout\n" +
                   "mv\t\t:: Rename a loadout\n" +
                   "rm\t\t:: Remove a saved loadout\n" +
                   "-   -   -   -   -   -   -   -   -   -   -   -   -\n" +
                   "Detailed help info is in the README and mod page";
        }

        switch(info.name.toLowerCase())
        {
            case "help":
                return "cheeky breeky :)\n" +
                       "incase you actually needed help with the help command though ...\n\n" +
                       "Usage\t\t\t:: help -command name-\n" +
                       "== Parameters ==\n" +
                       "command name\t:: any command name shown in the help message\n" +
                       "== Examples ==\n" + 
                       "'help save' shows the save help info";

            case "list":
                return "List saved loadouts\n" +
                       "Usage\t:: list\n";

            case "save":
                return "Save your currently equipped items\n" +
                       "Usage\t\t:: save -name- (--price -price info-)\n" +
                       "== Parameters ==\n" +
                       "name\t\t:: The name of your loadout\n" + 
                       "--price\t:: optionally add a price to the loadout\n" +
                       "price info\t:: optionally specify the money type and amount\n" +
                       "\t\t : money type can be d or e (dollars or euros)\n" +
                       "\t\t : default money type is roubles\n" +
                       "\t\t : amount is a number or dynamic when blank\n" +
                       "== Examples ==\n" + 
                       "'save my loadout' save as my loadout (no price)\n" +
                       "'save my loadout --price e1000' save with price as 1000 euros";

            case "get":
                return "Send yourself a loadout\n" +
                       "Usage\t:: get -name-\n" +
                       "== Parameters ==\n" +
                       "name\t:: the name of the loadout\n" +
                       "== Examples ==\n" +
                       "'get my loadout' sends you items from my loadout";

            case "setprice":
                return "Set the price on a loadout\n" +
                       "Usage\t:: setprice -name- (-price info-)\n" +
                       "== Parameters ==\n" +
                       "name\t\t:: the name of the loadout\n" +
                       "price info\t:: optionally specify the money type and amount\n" +
                       "\t\t : money type can be d or e (dollars or euros)\n" +
                       "\t\t : default money type is roubles\n" +
                       "\t\t : amount is a number or dynamic when blank\n" +
                       "\t\t : set price to 0 to remove the price\n" +
                       "== Examples ==\n" +
                       "'setprice my loadout d1000' set price to 1000 dollars\n" +
                       "'setprice my loadout 0' remove price from loadout";

            case "mv":
                return "Rename a loadout\n" +
                       "Usage\t\t:: mv -old name- | -new name-\n" +
                       "== Parameters ==\n" +
                       "old name\t:: the loadout to update\n" +
                       "new name\t:: the new name of the loadout\n" +
                       "== Examples ==\n" +
                       "'mv my loadout | tacos' change name of my loadout to tacos";

            case "rm":
                return "Remove a saved loadout\n" +
                       "Usage\t:: rm -name-\n" +
                       "== Parameters ==\n" +
                       "name\t:: the name of the loadout\n" +
                       "== Examples ==\n" +
                       "'rm my loadout' delete my loadout";

            default:
                return "could not find command, please try again"
        }
    }

    // todo: setup pagination because there is a char limit on messages
    //     : should be ok to show 5 loadout per page
    //     : list <-- shows first page
    //     : list 2 <-- shows page 2 if it exists
    //     : new header can be like: === Loadouts (1/3) ===
    private listLoadoutCommand(): string
    {
        var message: string = "== Saved Loadouts ==\n";

        for (const loadoutName of this.loadoutManager.getLoadoutNames())
        {
            message += `- ${loadoutName}\n`
        }

        return message;
    }

    private saveLoadoutCommand(info: CommandInfo, sessionId: string, bot: IUserDialogInfo): string
    {
        // run after 10s timeout to hopefully ensure profile changes are saved
        setTimeout(() => {
            // get a copy of pmc equipt items
            const inventory = this.profileHelper.getPmcProfile(sessionId).Inventory;
            const equipt =  this.jsonUtil.clone(this.inRaidHelper.getPlayerGear(inventory.items));
            
            for (const item of equipt)
            {
                if (item.parentId)
                {
                    // if the item has a parent ID, get the parent item's tpl
                    const tpl = inventory.items.find(x => x._id === item.parentId)._tpl;
                    
                    // if the parent's tpl is 'default inventory' or 'pockets' remove parent/slot id from the item
                    if (tpl === "55d7217a4bdc2d86028b456d" || tpl === "627a4e6b255f7527fb05a0f6")
                    {
                        // if the parent's tpl is specifically 'pockets', remove location as well
                        if (tpl === "627a4e6b255f7527fb05a0f6")
                        {
                            delete item.location;
                        }
                        
                        delete item.parentId;
                        delete item.slotId;
                    }
                }
            }
        
            this.loadoutManager.saveLoadout(info.name, equipt);

            var priceInfo: string = "";

            if (info.price)
            {
                priceInfo = `\n${this.setPriceCommand(info, equipt).replace(`${info.name}: `, "")}`;
            }
        
            this.mailSendService.sendUserMessageToPlayer(
                sessionId,
                bot,
                `loadout saved: ${info.name}${priceInfo}`);

        }, 10000);

        return `Loadout '${info.name}' will be saved in ~10 seconds to help ensure profile was saved.\nPlease wait ...`;
    }

    private getLoadoutCommand(info: CommandInfo, sessionId: string, bot: IUserDialogInfo): string
    {
        const loadout = this.loadoutManager.getLoadout(info.name);

        if (loadout == undefined)
        {
            return "No loadout found with that name"
        }

        const loadoutUpdated = this.itemHelper.replaceIDs(null, loadout);

        this.mailSendService.sendSystemMessageToPlayer(
            sessionId,
            `Here is your loadout: ${info.name}`,
            loadoutUpdated
        );

        return "You can find your items in the system chat";
    }
    
    private setPriceCommand(info: CommandInfo, items: Item[] = undefined): string
    {
        var loadoutPrice = info.amount ? info.amount : 0;

        // if no amount is set, get dynamic price
        if (!info.amount)
        {
            // get items from file if they weren't provided
            if (!items)
            {
                items = this.loadoutManager.getLoadout(info.name);
            }

            loadoutPrice = Math.round(this.ragfairPriceService.getDynamicOfferPriceForOffer(items, info.currency, false));
        }

        this.loadoutManager.saveLoadoutPrice(info.name, loadoutPrice, info.currency);

        const moneyName = Object.keys(Money)[Object.values(Money).indexOf(info.currency)].toLowerCase();

        return `${info.name}: price is ${loadoutPrice} ${moneyName}`
    }

    private renameLoadoutCommand(info: CommandInfo): string
    {
        if(!this.loadoutManager.renameLoadout(info.name, info.newName))
        {
            return "failed to rename loadout"
        }

        return `loadout renamed\n${info.name} -> ${info.newName}`
    }

    private removeLoadoutCommand(info: CommandInfo): string
    {
        this.loadoutManager.removeLoadout(info.name);

        return `loadout remove: ${info.name}`;
    }

    loadoutCount(): number
    {
        return this.loadoutManager.loadoutCount();
    }

    priceCount(): number
    {
        return this.loadoutManager.priceCount();
    }

    route(sessionId: string, request: ISendMessageRequest, bot: IUserDialogInfo): void
    {
        const commandInfo = CommandInfo.Parse(request.text);

        let response = "something went super wrong :(";

        switch (commandInfo.command)
        {
            case CommandType.help:
                response = this.helpCommand(commandInfo);
                break;

            case CommandType.list:
                response = this.listLoadoutCommand();
                break;

            case CommandType.save:
                response = this.saveLoadoutCommand(commandInfo, sessionId, bot);
                break;

            case CommandType.get:
                response = this.getLoadoutCommand(commandInfo, sessionId, bot);
                break;

            case CommandType.setprice:
                if (commandInfo.amount == 0) {
                    // if the price is set to 0, just remove the price
                    this.loadoutManager.removeLoadoutPrice(commandInfo.name);
                    response =  `${commandInfo.name}: price removed`;
                    break;
                }

                // otherwise, set loadout price
                response = this.setPriceCommand(commandInfo);
                break;

            case CommandType.rename:
                response = this.renameLoadoutCommand(commandInfo);
                break;

            case CommandType.delete:
                response = this.removeLoadoutCommand(commandInfo);
                break;
            
            case CommandType.invalid:
                response = commandInfo.message;
        }

        this.mailSendService.sendUserMessageToPlayer(
            sessionId,
            bot,
            response
        );
    }
}
