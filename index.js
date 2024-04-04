const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

async function getPageMessages(page) {
    return await page.evaluate(() => {
        const forumTitle = document.querySelector('h2').innerText.split("Portal do Discente > Discussão sobre ")[1];
        const msgs = [];
        const tbody = document.querySelector('tbody');
        const headers = tbody.querySelectorAll('tr.bg-claro');
        const contents = tbody.querySelectorAll('td[style="background-color: #FCFCFC;"');
        // TODO: min?
        for (let i = 0; i < Math.min(contents.length, headers.length); ++i) {
            const newMsg = `[${forumTitle}]\n{${headers[i].innerText}}\n*-start-content-*\n${contents[i].innerText}\n*-end-content-*`;
            msgs.push(newMsg);
        }
        return msgs;
    });
}

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://sigaa.ufrn.br/sigaa/portais/discente/discente.jsf');

    await page.type("#username", process.env.SIGAA_USERNAME);
    await page.type("#password", process.env.SIGAA_PASSWORD);

    await Promise.all([
        page.click("button"),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // Clique lá em "Visualizar todos os fóruns (algo assim)"
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    const allMsgs = [];
    let nextPageTopic = await page.$("input[src='/sigaa/img/avancar.gif']");
    let pageIndex = 0;
    while (nextPageTopic) {
        ++pageIndex;
        console.log(`Page ${pageIndex}...`);
        let topics = await page.$$("[id*='listagem:mostrar']");
        for (let i = 0; i < topics.length; i++) {
            await page.waitForSelector("[id*='listagem:mostrar']");
            topics = await page.$$("[id*='listagem:mostrar']");
            const topic = topics[i];
            await Promise.all([
                topic.click(),
                page.waitForNavigation({ waitUntil: 'networkidle2' })
            ]);
            const msgs = await getPageMessages(page);
            fs.appendFileSync('forum.txt', msgs.join('\n*-delimit-msg-*\n'));
            let nextPageButton = await page.$("a[id*='j_id_jsp_454333105_172:pageNext']");
            while (nextPageButton) {
                await Promise.all([
                    nextPageButton.click(),
                    page.waitForNavigation({ waitUntil: 'networkidle2' })
                ]);
                const msgsNextPage = await getPageMessages(page);
                fs.appendFileSync('forum.txt', msgsNextPage.join('\n*-delimit-msg-*\n'));
                msgs.push(...msgsNextPage);
                nextPageButton = await page.$("a[id*='j_id_jsp_454333105_172:pageNext']");
            }
            allMsgs.push(...msgs);
            console.log(`Pushed ${msgs.length} messages to allMsgs`);
            for (let j = 0; j < Math.max(1, msgs.length / 20); j++) {
                await Promise.all([
                    page.goBack(),
                    page.waitForNavigation({ waitUntil: 'networkidle2' })
                ]);
            }
        }
        nextPageTopic = await page.$("input[src='/sigaa/img/avancar.gif']");
        await Promise.all([
            nextPageTopic.click(),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);
    }

    await browser.close();
})();
