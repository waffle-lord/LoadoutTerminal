import { Money } from "@spt-aki/models/enums/Money";

export enum CommandType
{
    invalid,
    save,
    get,
    rename,
    delete,
    list,
    help,
}

export class CommandInfo 
{
    protected _command: CommandType;
    get command(): CommandType { return this._command; };

    protected _name: string;
    get name(): string { return this._name; };

    protected _newName: string;
    get newName(): string {return this._newName; };

    protected _price: boolean;
    get price(): boolean { return this._price; };

    protected _currency: Money;
    get currency(): Money { return this._currency; };

    protected _amount: number;
    get amount(): number { return this._amount; };

    protected _message: string;
    get message(): string { return this._message; };

    protected constructor(
        command: CommandType,
        name: string,
        newName: string,
        price: boolean,
        currency: Money,
        amount: number,
        message: string,
        )
    {
        this._command = command;
        this._name = name;
        this._newName = newName;
        this._price = price;
        this._currency = currency;
        this._amount = amount;
        this._message = message;
    }

    public static Parse(request: string): CommandInfo 
    {
        const regex = new RegExp(/^((?<command>help|save|rm|get|mv) (?<name>(?![ ]+)[\w ]+)(?<price>([|] (?<newname>(?![ ]+)[\w ]+))|--price( (?<currency>d|r|e)?\s?(?<amount>\d*))?)?$|(?<noparams>help|list))/, "i");

        const result = request.match(regex);

        // return no-parameter command info
        if (result.groups && result.groups.noparams)
        {
            return new CommandInfo(CommandType[result.groups.noparams], null, null, null, null, null, "");
        }
        
        // return command info
        if (result.groups && result.groups.command && result.groups.name)
        {
            const newName = result.groups.newName ? result.groups.newName : "";
            const price = result.groups.price ? true : false;
            var currency = Money.ROUBLES;
            var amount: number = +result.groups.amount;

            // check amount is valid if it was set
            if (result.groups.amount && (amount < 0 || isNaN(amount)))
            {
                return new CommandInfo(CommandType.invalid, null, null, null, null, null, "provided amount was invalid");
            }
            
            // check currency was set or is invalid
            if (result.groups.currency)
            {
                switch(result.groups.currency.toLowerCase())
                {
                    case "d":
                        currency = Money.DOLLARS;
                        break;
                    case "e":
                        currency = Money.EUROS;
                        break;
                    default:
                        return new CommandInfo(CommandType.invalid, null, null, null, null, null, "provided currency was invalid")
                }
            }

            return new CommandInfo(CommandType[result.groups.command],
                result.groups.name,
                result.groups.newName,
                price,
                currency,
                amount,
                "",
                );
        }

        // invalid command
        return new CommandInfo(CommandType.invalid, null, null, null, null, null, "invalid command :(\nSend 'help' without quotes for a list of commands");
    }
}