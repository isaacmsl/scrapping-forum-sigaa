
### Detailed Code Functionality: SIGAA Forum Scrapping

This Node.js script utilizes Puppeteer for browser automation and data collection from the SIGAA forums of UFRN. Below, each part of the code is detailed along with its functionality:

### 📁 Directory and File Structure
The project includes the following files and directories:

- **.env.template**: Template for the environment variables required for execution.
- **.gitignore**: Specifies which files and directories to ignore in version control.
- **readme.md**: Documentation of the project, installation, and usage instructions.
- **index.js**: The main script for scrapping execution.
- **package.json**: Project metadata, such as dependencies and available scripts.
- **pnpm-lock.yaml**: Lock file to ensure the consistency of dependencies installed with PNPM.

### 🛠 Environment Setup

#### Prerequisites
- **Node.js** version 20.6.1 or higher.
- **Package Manager**: PNPM, NPM, or Yarn.

#### Configuration
1. Clone the repository using:
   ```bash
   git clone https://github.com/isaacmsl/scrapping-forum-sigaa
   ```
2. Navigate to the cloned project directory.
3. Copy the `.env.template` to a new file named `.env`.
4. Fill in the variables in the `.env` file with your access information and desired settings:
   ```plaintext
   SIGAA_USERNAME="your_username"
   SIGAA_PASSWORD="your_password"
   INITIAL_FORUM_PAGE=1
   TERMINAL_FORUM_PAGE=2
   ```
5. Execute `pnpm install` to install the dependencies.

### 🚀 Script Execution
To start the scrapping process, execute the following command in the terminal:
```bash
node .
```
The script will:
- Initiate a browser session.
- Log into SIGAA using the provided credentials.
- Navigate to the forum page.
- Collect messages from all forum pages between `INITIAL_FORUM_PAGE` and `TERMINAL_FORUM_PAGE`.
- Save the messages to the file specified by the `OUTPUT_FILE_PATH` variable.

#### .gitignore
The `.gitignore` file includes:
- `node_modules/`: Node.js modules directory.
- `.env`: Environment variables file with sensitive information.
- `data/`: Directory for storing extracted data.

### 🔐 Security
- Do not commit the `.env` file to version control to protect access credentials.
- Ensure secure connections when making requests to prevent data interception.

### 📚 Dependencies
The script utilizes the following main libraries:
- **puppeteer**: For browser automation and data collection.
- **dotenv**: To load environment variables from the `.env` file.

#### 📦 Module Import and Configuration

```javascript
const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();
```

- **puppeteer**: Module that enables programmatic control of a Chrome or Chromium browser.
- **fs**: Node.js module for file and directory manipulation.
- **dotenv**: Module to load environment variables from a `.env` file.

#### 🌍 Environment Variables

```javascript
const {
    INITIAL_FORUM_PAGE,
    TERMINAL_FORUM_PAGE,
    SIGAA_USERNAME,
    SIGAA_PASSWORD
} = process.env;
```

- **INITIAL_FORUM_PAGE** and **TERMINAL_FORUM_PAGE**: Define the range of forum pages to be accessed.
- **SIGAA_USERNAME** and **SIGAA_PASSWORD**: User credentials for logging into SIGAA.

#### 🗂 Output File Path

```javascript
const OUTPUT_FILE_PATH = `data/forum-pages-${INITIAL_FORUM_PAGE}-${TERMINAL_FORUM_PAGE}.txt`;
```

- Defines the path and name of the file where the extracted data will be stored.

#### 📄 Function `getPageMessages`

```javascript
async function getPageMessages(page) {
    return await page.evaluate(() => {
        // Extract relevant information from the page's DOM
        const forumTitle = document.querySelector('h2').innerText.split("Portal do Discente > Discussão sobre ")[1];
        const msgs = [];
        const tbody = document.querySelector('tbody');
        const headers = tbody.querySelectorAll('tr.bg-claro');
        const contents = tbody.querySelectorAll('td[style="background-color: #FCFCFC;"');
        
        for (let i = 0; i < Math.min(contents.length, headers.length); ++i) {
            const newMsg = `[${forumTitle}]\n{${headers[i].innerText}}\n*-start-content-*\n${contents[i].innerText}\n*-end-content-*`;
            msgs.push(newMsg);
        }
        return msgs;
    });
}
```

- This function navigates through the current forum page's DOM and collects messages, which are formatted in a specific style and returned as an array.

#### 🔄 Main Script

```javascript
(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://sigaa.ufrn.br/sigaa/portais/discente/discente.jsf');
    await page.type("#username", SIGAA_USERNAME);
    await page.type("#password", SIGAA_PASSWORD);
    await Promise.all([
        page.click("button"),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    const allMsgs = [];
    for (let pageIndex = Number(INITIAL_FORUM_PAGE); pageIndex <= Number(TERMINAL_FORUM_PAGE); ++pageIndex) {
        console.log(`Getting page ${pageIndex}`);
        const selectPageForum = await page.$("select");
        await Promise.all([
            selectPageForum.select(`${pageIndex-1}`),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);
        
        // Iterates over each forum topic, clicking on it and extracting messages
        let topics = await page.$$("[id*='listagem:mostrar']");
        for (let i = 0; i < topics.length; i++) {
            const topic = topics[i];
            await Promise.all([
                topic.click(),
                page.waitForNavigation({ waitUntil: 'networkidle2' })
            ]);
            const msgs = await getPageMessages(page);
            fs.appendFileSync(OUTPUT_FILE_PATH, msgs.join('\n*-delimit-msg-*\n'));

            // Navigation between pages within a topic, if there are multiple pages
            let nextPageButton = await page.$("a[id*='j_id_jsp_454333105_172:pageNext']");
            while (nextPageButton) {
                await Promise.all([
                    nextPageButton.click(),
                    page.waitForNavigation({ waitUntil: 'networkidle2' })
                ]);
                const msgsNextPage = await getPageMessages(page);
                fs.appendFileSync(OUTPUT_FILE_PATH, msgsNextPage.join('\n*-delimit-msg-*\n'));
                msgs.push(...msgsNextPage);
                nextPageButton = await page.$("a[id*='j_id_jsp_454333105_172:pageNext']");
            }
            allMsgs.push(...msgs);
            console.log(`Pushed ${msgs.length} messages to allMsgs`);
        }
    }

    await browser.close();


})();
```

#### 🔍 Detailed Functioning
- **Starts the browser**: Non-headless for visual confirmation of actions.
- **Accesses the SIGAA login page**: Fills in user and password fields and logs in.
- **Forum page navigation**: Sequentially accesses topic pages between `INITIAL_FORUM_PAGE` and `TERMINAL_FORUM_PAGE`.
- **Message extraction from each topic**: Iterates over the topics on the page, collecting messages from each one, including navigating through subsequent pages within a topic.
- **Data storage**: Saves the collected messages to a text file.
- This process is carried out for each configured page and topic, comprising a comprehensive and systematic data collection from the forum.
