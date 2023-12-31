import { MailSendService } from "@spt-aki/services/MailSendService";
import { IUserDialogInfo } from "@spt-aki/models/eft/profile/IAkiProfile";
import { ISendMessageRequest } from "@spt-aki/models/eft/dialog/ISendMessageRequest";
import { LoadoutManager } from "./LoadoutManager";
import { injectable, inject } from "tsyringe";
import { ProfileHelper } from "@spt-aki/helpers/ProfileHelper";
import { InRaidHelper } from "@spt-aki/helpers/InRaidHelper";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";


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

    private helpCommand(): string
    {
        return "Available Commands:\n" +
               "help\t\t\t:: This help text :D\n" +
               "save -name-\t\t:: Save your current loadout (equipt items)\n" +
               "rm -name-\t\t:: Remove a saved loadout\n" +
               "get -name-\t\t:: Send yourself a loadout\n" +
               "list\t\t\t:: List saved loadouts\n" + 
               "mv -old- | -new-\t:: rename a loadout\n" + 
               "\nParameters in -dashes- in the commands above can be any string of text\n" +
               "Examples: \n" +
               "save my super cool loadout\n" +
               "would save with the name 'my super cool loadout'\n\n" +
               "mv old name | new name\n" +
               "would rename 'old name' to 'new name'";
    }

    private saveLoadoutCommand(name: string, sessionId: string, bot: IUserDialogInfo): string
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
        
            this.loadoutManager.saveLoadout(name, equipt);
        
            this.mailSendService.sendUserMessageToPlayer(
                sessionId,
                bot,
                `loadout saved: ${name}`);

        }, 10000);

        return `Loadout '${name}' will be saved in ~10 seconds to help ensure profile was saved.\nPlease wait ...`;
    }

    private removeLoadoutCommand(name: string): string
    {
        this.loadoutManager.removeLoadout(name);

        return `loadout remove: ${name}`;
    }

    private getLoadoutCommand(name: string, sessionId: string, bot: IUserDialogInfo): string
    {
        const loadout = this.loadoutManager.getLoadout(name);

        if (loadout == undefined)
        {
            return "No loadout found with that name"
        }

        const loadoutUpdated = this.itemHelper.replaceIDs(null, loadout);

        this.mailSendService.sendSystemMessageToPlayer(
            sessionId,
            `Here is your loadout: ${name}`,
            loadoutUpdated
        );

        return "You can find your items in the system chat";
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

    private renameLoadoutCommand(oldName: string, newName: string): string
    {
        if(!this.loadoutManager.renameLoadout(oldName, newName))
        {
            return "failed to rename loadout"
        }

        return `loadout renamed\n${oldName} -> ${newName}`
    }

    count(): number
    {
        return this.loadoutManager.count();
    }

    route(sessionId: string, request: ISendMessageRequest, bot: IUserDialogInfo): void
    {
        const commandInfo = request.text.split(" ", 1);
        const command = commandInfo[0] ?? "";
        var name = request.text.replace(command, "").trim();
        var newName = ""

        if (name.includes(" | "))
        {
            const nameSplit = name.split(" | ", 2);

            name = nameSplit[0];
            newName = nameSplit[1];
        }



        let response = "something went super wrong :(";

        switch (command.toLowerCase())
        {
            case "help":
                response = this.helpCommand();
                break;

            case "save":
                response = this.saveLoadoutCommand(name, sessionId, bot);
                break;

            case "rm":
                response = this.removeLoadoutCommand(name);
                break;

            case "get":
                response = this.getLoadoutCommand(name, sessionId, bot);
                break;

            case "list":
                response = this.listLoadoutCommand();
                break;
            
            case "mv":
                response = this.renameLoadoutCommand(name, newName);
                break;
            
            default:
                response = "invalid command :(\nSend 'help' without quotes for a list of commands";
        }

        this.mailSendService.sendUserMessageToPlayer(
            sessionId,
            bot,
            response
        );
    }
}