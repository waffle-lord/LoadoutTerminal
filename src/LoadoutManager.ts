import { Item } from "@spt-aki/models/eft/common/tables/IItem";
import { injectable, inject } from "tsyringe";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";
import { VFS } from "@spt-aki/utils/VFS";

import path from "path";

@injectable()
export class LoadoutManager
{
    private static _loadoutsFilePath =  path.resolve(__dirname, "../data/loadouts.json");
    private _loadouts: Map<string, Item[]>;

    public constructor(
        @inject("JsonUtil") protected jsonUtil: JsonUtil,
        @inject("VFS") protected vfs: VFS,
    )
    {
        this._loadouts = new Map(jsonUtil.deserialize(vfs.readFile(LoadoutManager._loadoutsFilePath)));
    }

    private saveToDisk(): void
    {
        const json = this.jsonUtil.serialize(Array.from(this._loadouts.entries()), true);
        this.vfs.writeFile(LoadoutManager._loadoutsFilePath, json);
    }

    count(): number
    {
        return this._loadouts.size;
    }

    saveLoadout(name: string, loadout: Item[]): void
    {
        this._loadouts.set(name, loadout);
        this.saveToDisk();
    }

    removeLoadout(name: string): void
    {
        if (this._loadouts.delete(name))
        {
            this.saveToDisk();
        }
    }

    getLoadout(name: string): Item[] | undefined
    {
        return this._loadouts.get(name);
    }
}