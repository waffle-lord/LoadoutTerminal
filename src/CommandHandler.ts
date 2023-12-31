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
               ":: help \n  -> This help text :D\n" +
               ":: save -name- \n  -> Save your current loadout (equip items)\n" +
               ":: rm -name- \n  -> Remove a saved loadout\n" +
               ":: get -name- \n  -> Send yourself a loadout\n" +
               ":: list \n  -> List saved loadouts\n" + 
               "\nPlaceholder -name- in the commands above can be any string of text\n" +
               "Example: \n" +
               "save my super cool loadout\n" +
               "would save with the name 'my super cool loadout'";
    }

    private saveLoadoutCommand(name: string, sessionId: string): string
    {
        const inventory = this.profileHelper.getPmcProfile(sessionId).Inventory;
        const equipt =  this.jsonUtil.clone(this.inRaidHelper.getPlayerGear(inventory.items));

        for (const item of equipt) 
        {
            if (item.parentId)
            {
                const tpl = inventory.items.find(x => x._id === item.parentId)._tpl;

                if (tpl === "55d7217a4bdc2d86028b456d" || tpl === "627a4e6b255f7527fb05a0f6")
                {
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

        return `loadout saved: '${name}'`;
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
            "Here's you shit loser, fuckin idiot fuck you!",
            loadoutUpdated
        );

        return "You can find your items in the system chat";
    }

    count(): number
    {
        return this.loadoutManager.count();
    }

    route(sessionId: string, request: ISendMessageRequest, bot: IUserDialogInfo): void
    {
        const commandInfo = request.text.split(" ", 1);
        const command = commandInfo[0] ?? "";
        const name = request.text.replace(command, "").trim();

        let response = "something went super wrong :(";

        switch (command.toLowerCase())
        {
            case "help":
                response = this.helpCommand();
                break;

            case "save":
                response = this.saveLoadoutCommand(name, sessionId);
                break;

            case "rm":
                response = this.removeLoadoutCommand(name);
                break;

            case "get": 
            {
                const blah = this.getLoadoutCommand(name, sessionId, bot);
                response = blah
                break;
            }

            case "list":
                // todo: this
                break;
            
            case "rename":
                // todo: this
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