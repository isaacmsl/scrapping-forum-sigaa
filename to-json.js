const fs = require('node:fs')
const output = []
fs.readFile('./data/forum-cet.txt', 'utf8', (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  const messages = data.split("*-delimit-msg-*")
  for (const message of messages) {
    const contents = message.split("*-start-content-*")
    if (contents.length == 1) {
      continue
    }
    
    const header = contents[0].split("\n")
    const topic = header[1].substring(1, header[1].length - 1).trim()
    const metas = header[2].substring(1, header[2].length-1).split("\t")
    const date = metas[0].split(" ")[0].trim()
    const hour = metas[0].split(" ")[1].trim()
    const author = metas[1].split("-")[0].substring(13).trim()
    const content = contents[1].split("*-end-content-*")[0].trim()

    output.push({
      topic,
      date,
      hour,
      author,
      content
    })
  }

  fs.writeFileSync('./data/forum-cet.json', JSON.stringify(output), 'utf8');
})
