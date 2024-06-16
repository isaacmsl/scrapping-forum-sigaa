import os, json

path_to_forum_txt = "data/???.txt"

with open(path_to_forum_txt, 'r') as f:
    forum : list[str] = f.read().split("*-end-content-*")


forum_cleaned : list[str] = []

for msg in forum:
    lines : list[str] = msg.splitlines()
    content_start = False
    msg_clean : str = ""

    for line in lines:
        if line == "*-delimit-msg-*":
            line = ""
        elif line == "*-start-content-*":
            content_start = True

        if content_start:
            msg_clean += line + "\n"
        elif len(line) != 0:
            msg_clean += line + "\n"

    
    if len(msg_clean) != 0:
        forum_cleaned.append(msg_clean)


forum_cet_json = []

for msg in forum_cleaned:
    lines = msg.splitlines()
    d = dict()

    d["topic"] = lines[0][1:len(lines[0])-1].strip()
    d["date"] = lines[1][1:11].strip()
    d["hour"] = lines[1][12:20].strip()
    d["author"] = lines[1][34:].split("-")[0].strip()
    d["content"] = "\n".join(lines[3:]).strip()

    forum_cet_json.append(d)

with open("???.json", 'w', encoding="utf8") as f:
    json.dump(forum_cet_json, f, ensure_ascii=False)


