import { DependencyContainer, Lifecycle } from "tsyringe";

import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { DialogueController } from "@spt-aki/controllers/DialogueController";
import { LoadoutTerminalChatBot } from "./LoadoutTerminalChatBot";
import { CommandHandler } from "./CommandHandler";
import { LoadoutManager } from "./LoadoutManager";

class Mod implements IPostDBLoadMod 
{
    public postDBLoad(container: DependencyContainer): void
    {
        container.register<LoadoutManager>("LoadoutManager", LoadoutManager, { lifecycle: Lifecycle.Singleton });
        container.register<CommandHandler>("CommandHandler", CommandHandler);
        container.register<LoadoutTerminalChatBot>("LoadoutTerminalChatBot", LoadoutTerminalChatBot);
        container.resolve<DialogueController>("DialogueController").registerChatBot(container.resolve<LoadoutTerminalChatBot>("LoadoutTerminalChatBot"));
    }
}

module.exports = {
	mod: new Mod()
}
