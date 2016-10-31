"use strict";
const escape = require('escape-html');
const os     = require('os');


class Command {
    constructor(help, func) {
        this.help = help;
        this.func = func;
    }
}

class CmdResult {
    constructor(output, isHTML, isError) {
        this.output  = output  || "";
        this.isHTML  = isHTML  || false;
        this.isError = isError || false;
    }
}


/*----------------------------------------
| Server Commands
|----------------------------------------*/
let _commands = {}; // obj to hold commands

_commands.ECHO = new Command("Echos back waht it receives", function(args) {
    return (args.length >= 2) ? new CmdResult(args[1]) : new CmdResult("");
});

_commands.ADD = new Command("Returns the sum of two numbers", function(args) {
    if (args.length != 3) return new CmdResult("Exactly 2 operands required", false, true);

    let x   = Number(args[1]);
    let y   = Number(args[2]);
    let sum = (x + y).toString();

    return new CmdResult(sum);
});

_commands.STATUS = new Command("Displays server status info", function(args) {
    let freeMem  = Math.floor(os.freemem() / 1024 / 1024);
    let totalMem = Math.floor(os.totalmem() / 1024 / 1024);

    //Calculate uptime in days, hours, minutes
    let upTime  = os.uptime();
    let days    = Math.floor(upTime / 86400);
    let hours   = Math.floor((upTime % 86400) / 3600);
    let minutes = Math.floor(((upTime % 86400) % 3600) / 60);
    upTime = `${days}d ${hours}h ${minutes}m`;

    let s = `${freeMem}/${totalMem} MB Free :: ${upTime} up time.`;

    return new CmdResult(s);
});

_commands.HELP = new Command("Lists available commands", function(args) {
    let s = "<table class='webcli-tbl'>";

    Object.keys(_commands).forEach( (key)=> {
        let cmd = _commands[key];
        let name = escape(key.toLowerCase());

        s += `<tr>
            <td class='webcli-lbl'> ${name} </td> <td> : </td>
            <td class='webcli-val'> ${ escape(cmd.help) } </td>
        </tr>`;
    });

    s += "</table>";
    return new CmdResult(s, true);
});

/*----------------------------------------
| Client Commands
|----------------------------------------*/
_commands.CLS     = new Command("Clears the console");


/*----------------------------------------
| POST: /api/webcli
|----------------------------------------*/
module.exports = function(app) {
    app.post("/api/webcli", function(req, res) {
        setTimeout(function() {
            let result = new CmdResult("Invalid command", false, true);

            try {
                let args = getArgs(req.body.cmdLine);
                let cmd  = args[0].toUpperCase();

                result = _commands[cmd].func(args);
            } finally {
                res.send(result);
            }
        }, 1000)
    });
};


function getArgs(cmdLine) {
    let tokenEx = /[^\s"]+|"[^"]*"/g;
    let quoteEx = /"/g;
    let args    = cmdLine.match(tokenEx); //search cmd for tokenEx

    for (let i = 0; i < args.length; i++) {
        args[i] = args[i].replace(quoteEx, '');
    }

    return args;
}
