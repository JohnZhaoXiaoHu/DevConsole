 class WebCLI {
    constructor() {
        let self = this;

        self.history    = []; //holds commands history
        self.cmdOffset  = 0; //reverse offset into history

        self.createElements();
        self.wireEvents();
        self.showGreeting();
        self.busy(false);
    }

    wireEvents() {
        let self = this;

        // calling event handlers from here will make 'this'
        // refer to THIS instance of the class
        self.clickHandler = e =>  self.onClick(e);
        self.keyDownHandler = e =>  self.onKeyDown(e);

        // when ctrl-`, toggle console div
        document.addEventListener('keydown', self.keyDownHandler);
        // when clicking anywhere on console div, focus input field
        self.ctrlEl.addEventListener('click', self.clickHandler);
    }

    onClick(e) {
        this.focus();
    }

    onKeyDown(e) {
        let self = this;
        let ctrlStyle = self.ctrlEl.style;

        //Ctrl + Backquote (Document)
        if (e.ctrlKey && e.keyCode == 192) {
            if (ctrlStyle.display == "none") {
                ctrlStyle.display = "";
                self.focus();
            } else ctrlStyle.display = "none";
            return;
        }

        if (self.isBusy) return;

        //Other keys (when input has focus)
        if (self.inputEl === document.activeElement) {
            switch (e.keyCode) {
                case 13: //Enter
                    return self.runCmd();

                case 38: //Up
                    if ((self.history.length + self.cmdOffset) > 0) {
                        self.cmdOffset--;
                        self.inputEl.value = self.history[self.history.length + self.cmdOffset];
                        e.preventDefault();
                    }
                    break;

                case 40: //Down
                    if (self.cmdOffset < -1) {
                        self.cmdOffset++;
                        self.inputEl.value = self.history[self.history.length + self.cmdOffset];
                        e.preventDefault();
                    }
                    break;
            }
        }
    }

    runCmd() {
        let self = this;
        let text = self.inputEl.value.trim();

        self.cmdOffSet = 0; // reverse history index
        self.inputEl.value = ""; // clear input
        self.writeLine(text, "cmd");

        if (text === "") return; // if empty, stop processing
        self.history.push(text); // add to cmd history arr

        /* Client commands */
        let tokens = text.split(' ');
        let cmd    = tokens[0].toUpperCase();

        if (cmd === "CLS") {
            self.outputEl.innerHTML = "";
            return;
        }

        self.busy(true); // display busy spinner

        fetch("/api/webcli", {
            method: "post",
            headers: new Headers({"Content-Type": "application/json"}),
            body: JSON.stringify({cmdLine: text})

        }).then(function(response) {
            return response.json();

        }).then(function(result) {
            let output = result.output;
            let style  = result.isError ? "error" : "ok";
            result.isHTML ? self.writeHTML(output) : self.writeLine(output, style);

        }).catch(function() {

            self.writeLine("Error sending the request!", "error");
        }).then(function() { // finally, run the following:

            console.log('finally');
            self.busy(false);
            self.focus();
        });

        self.inputEl.blur();
    }

    focus() {
        this.inputEl.focus();
    }

    // when output is displayed, scroll so that INPUT field is visible
    scrollToBottom() {
        this.ctrlEl.scrollTop = this.ctrlEl.scrollHeight;
    }

    // new empty line
    newLine() {
        this.outputEl.appendChild(document.createElement("br"));
        this.scrollToBottom();
    }

    writeLine(text, cssSuffix = "ok") {
        let span = document.createElement('span');

        span.className = `webcli-${cssSuffix}`;
        span.innerText = text;
        this.outputEl.appendChild(span);
        this.newLine();
    }

    writeHTML(markup) {
        var div = document.createElement("div");
        div.innerHTML = markup;
        this.outputEl.appendChild(div);
        this.newLine();
    }

    showGreeting() {
        this.writeLine("Welcome to Web CLI [v 0.0.1]", "cmd");
        this.newLine();
    }


    createElements() {
        let self = this, doc = document;

        // Create & store CLI elements
        self.ctrlEl   = doc.createElement("div"); // CLI outer frame
        self.outputEl = doc.createElement("div"); // holding output of console
        self.inputEl  = doc.createElement("input"); // input control
        self.busyEl   = doc.createElement("div"); // busy spinner

        // Add classes
        self.ctrlEl.className   = 'webcli';
        self.outputEl.className = 'webcli-output';
        self.inputEl.className  = 'webcli-input';
        self.busyEl.className   = 'webcli-busy';

        // Add attributes (if any)
        self.inputEl.setAttribute("spellcheck", "false");

        // Put elements together
        self.ctrlEl.appendChild(self.outputEl);
        self.ctrlEl.appendChild(self.inputEl);
        self.ctrlEl.appendChild(self.busyEl);

        // Hide by default & add to DOM
        self.ctrlEl.style.display = "none";
        doc.body.appendChild(self.ctrlEl);
    }

    busy(b) {
        this.isBusy = b;
        this.busyEl.style.display  = b ? "block" : "none";
        this.inputEl.style.display = b ? "none" : "block";
    }
}
