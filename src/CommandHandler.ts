import { MailSendService } from "@spt-aki/services/MailSendService";
import { IUserDialogInfo } from "@spt-aki/models/eft/profile/IAkiProfile";
import { ISendMessageRequest } from "@spt-aki/models/eft/dialog/ISendMessageRequest";
import { injectable } from "tsyringe";

@injectable()
export class CommandHandler {
    route(sessionId: string, request: ISendMessageRequest, bot: IUserDialogInfo) {

    }
}