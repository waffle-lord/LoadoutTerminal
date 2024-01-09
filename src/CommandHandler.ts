import { MailSendService } from "@spt-aki/services/MailSendService";
import { IUserDialogInfo } from "@spt-aki/models/eft/profile/IAkiProfile";
import { ISendMessageRequest } from "@spt-aki/models/eft/dialog/ISendMessageRequest";
import { LoadoutManager } from "./LoadoutManager";
import { injectable, inject } from "tsyringe";
import { ProfileHelper } from "@spt-aki/helpers/ProfileHelper";
import { InRaidHelper } from "@spt-aki/helpers/InRaidHelper";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";
import { CommandInfo, CommandType } from "./CommandInfo";


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
    )
    {
    }

    private helpCommand(info: CommandInfo): string
    {
        if (!info.name) 
        {
            return "Available Commands:\n" +
                   "help\t\t:: This help text :D\n\t\t : Send with a command name to learn more\n\t\t : about it\n" +
                   "list\t\t:: List saved loadouts\n" +
                   "save\t\t:: Save your currently equipped items\n" +
                   "get\t\t:: Send yourself a loadout\n" +
                   "setprice\t:: Set the price on a loadout\n" +
                   "mv\t\t:: Rename a loadout\n" +
                   "rm\t\t:: Remove a saved loadout\n";
        }

        switch(info.name.toLowerCase())
        {
            case "help":
                return "cheeky breeky :)\n" +
                       "- - - - - - - - - - - - -\n" +
                       "incase you actually needed help with the help command though ...\n\n" +
                       "help -command name-\n" +
                       "Parameters:\n" +
                       "command name: save | get | list | mv | rm | help\n" +
                       "Example: help save";

            case "list":
                return "List saved loadouts\n" +
                       "- - - - - - - - - - - - - -\n" +
                       "Usage\t:: list\n";

            case "save":
                return "Save your currently equipped items\n" +
                       "- - - - - - - - - - - - - - - - - - - - - - - - -\n" +
                       "Usage\t:: save -name- (--price -price info-)\n" +
                       "";

            case "get":
                return "Send yourself a loadout\n" +
                       "- - - - - - - - - - - - - - - -\n" +
                       "more here";

            case "setprice":
                return "Set the price on a loadout\n" +
                       "- - - - - - - - - - - - - - - - - -" +
                       "more here";

            case "mv":
                return "Rename a loadout\n" +
                       "- - - - - - - - - - - - -\n" +
                       "more here";

            case "rm":
                return "Remove a saved loadout\n" +
                       "- - - - - - - - - - - - - - - -\n" +
                       "more here";

            default:
                return "could not find command, please try again"
        }
    }

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
        
            this.mailSendService.sendUserMessageToPlayer(
                sessionId,
                bot,
                `loadout saved: ${info.name}`);

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
    
    private setPriceCommand(info: CommandInfo): string
    {
        return "Not implemented"
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

    count(): number
    {
        return this.loadoutManager.count();
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