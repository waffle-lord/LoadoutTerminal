import { Item } from "@spt-aki/models/eft/common/tables/IItem";
import { injectable, inject } from "tsyringe";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";
import { VFS } from "@spt-aki/utils/VFS";

import path from "path";
import { Money } from "@spt-aki/models/enums/Money";
import { PriceInfo } from "./PriceInfo";

@injectable()
export class LoadoutManager
{
    private static _loadoutsFilePath =  path.resolve(__dirname, "../data/loadouts.json");
    private static _loadoutsPricesPath = path.resolve(__dirname, "../data/loadout_prices.json");
    private _loadouts: Map<string, Item[]>;
    private _prices: Map<string, PriceInfo>;

    public constructor(
        @inject("JsonUtil") protected jsonUtil: JsonUtil,
        @inject("VFS") protected vfs: VFS,
    )
    {
        this._loadouts = new Map(jsonUtil.deserialize(vfs.readFile(LoadoutManager._loadoutsFilePath)));
        this._prices = new Map(jsonUtil.deserialize(vfs.readFile(LoadoutManager._loadoutsPricesPath)));
    }

    private saveToDisk<K,V>(path: string, data: Map<K,V>): void
    {
        const json = this.jsonUtil.serialize(Array.from(data.entries()), true);
        this.vfs.writeFile(path, json);
    }

    loadoutCount(): number
    {
        return this._loadouts.size;
    }

    priceCount(): number
    {
        return this._prices.size;
    }

    private getLoadoutNames(): string[]
    {
        return Array.from(this._loadouts.keys());
    }

    getLoadoutListInfo(): string[]
    {
        let names = this.getLoadoutNames();

        for (let i = 0; i < names.length; i++)
        {
            const name = names[i];

            const priceInfo: PriceInfo = this._prices.get(name);

            const moneyName = priceInfo ? Object.keys(Money)[Object.values(Money).indexOf(priceInfo.currency)].toLowerCase() : "";

            names[i] = priceInfo ? `${names[i]} | ${priceInfo.price} ${moneyName}` : `${names[i]} | Free`;
        }

        return names;
    }

    saveLoadoutPrice(name: string, price: number, currency: Money): void
    {
        this._prices.set(name, new PriceInfo(name, price, currency));
        this.saveToDisk(LoadoutManager._loadoutsPricesPath, this._prices);
    }

    removeLoadoutPrice(name: string): void
    {
        if (this._prices.delete(name))
        {
            this.saveToDisk(LoadoutManager._loadoutsPricesPath, this._prices);
        }
    }

    saveLoadout(name: string, loadout: Item[]): void
    {
        this._loadouts.set(name, loadout);
        this.saveToDisk(LoadoutManager._loadoutsFilePath, this._loadouts);
    }

    removeLoadout(name: string): void
    {
        if (this._loadouts.delete(name) || this._prices.delete(name))
        {
            this.saveToDisk(LoadoutManager._loadoutsFilePath, this._loadouts);
            this.saveToDisk(LoadoutManager._loadoutsPricesPath, this._prices);
        }
    }

    getLoadout(name: string): Item[] | undefined
    {
        return this._loadouts.get(name);
    }

    renameLoadout(oldName: string, newName: string): boolean
    {
        const loadout = this._loadouts.get(oldName);

        if (loadout == undefined)
        {
            return false;
        }

        this._loadouts.delete(oldName);
        this.saveLoadout(newName, loadout);

        return true;
    }
}
