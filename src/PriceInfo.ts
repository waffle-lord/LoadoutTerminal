import { Money } from "@spt-aki/models/enums/Money"

export class PriceInfo
{
    name: string;
    price: number;
    currency: Money;

    constructor(name: string, price: number, currency: Money)
    {
        this.name = name;
        this.price = price;
        this.currency = currency;
    }
}
