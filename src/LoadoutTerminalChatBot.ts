import { IDialogueChatBot } from "@spt-aki/helpers/Dialogue/IDialogueChatBot";
import { ISendMessageRequest } from "@spt-aki/models/eft/dialog/ISendMessageRequest";
import { IUserDialogInfo } from "@spt-aki/models/eft/profile/IAkiProfile";
import { MemberCategory } from "@spt-aki/models/enums/MemberCategory";
import { MailSendService } from "@spt-aki/services/MailSendService";
import { CommandHandler } from "./CommandHandler";
import { inject, injectable } from "tsyringe";

@injectable()
export class LoadoutTerminalChatBot implements IDialogueChatBot
{
    public constructor(
        @inject("MailSendService") protected mailSendService: MailSendService,
        @inject("CommandHandler") protected commandHandler: CommandHandler,
    )
    {
    }

    public getChatBot(): IUserDialogInfo
    {
        return {
            _id: "waffle.loadouts",
            info: {
                Level: 1,
                MemberCategory: MemberCategory.SHERPA,
                Nickname: "Loadout Terminal",
                Side: "Usec",
            },
        };
    }

    public handleMessage(sessionId: string, request: ISendMessageRequest): string
    {
        this.commandHandler.route(sessionId, request, this.getChatBot());

        return request.dialogId;
    }

}
