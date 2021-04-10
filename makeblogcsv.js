import { fix0 } from "https://code4sabae.github.io/js/fix0.js";
import { CSV } from "https://code4sabae.github.io/js/CSV.js";

const makeDate = (s) => {
    const d = new Date(s);
    return d.getFullYear() + "-" + fix0(d.getMonth() + 1, 2) + "-" + fix0(d.getDate(), 2) + "T" + fix0(d.getHours(), 2) + ":" + fix0(d.getMinutes(), 2) + ":" + fix0(d.getSeconds(), 2);
};

const parse = async (s) => {
    const guid = parseInt(s.match(/<guid>https:\/\/fukuno.jig.jp\/(\d+)<\/guid>/)[1]);
    //console.log(guid);
    const titletags = s.substring(s.indexOf("<title>") + 7, s.indexOf("</title>"));
    //console.log(titletags);
    const ss = titletags.split(" ");
    let n = titletags.length;
    for (let i = ss.length - 1; i >= 0; i--) {
        if (ss[i].charAt(0) == "#") {
            n -= ss[i].length + 1;
        }
    }
    const tags = titletags.substring(n + 1);
    const title = titletags.substring(0, n).trim()
    //console.log(tags, "**", title);

    const date = makeDate(s.substring(s.indexOf("<pubDate>") + 7, s.indexOf("</pubDate>")));
    //console.log(date);

    const dir = "../xml/" + Math.floor(guid / 100);
    

    await Deno.mkdir(dir, { recursive: true });
    await Deno.writeTextFile(dir + "/" + guid + ".xml", s);
    
    // const xml = "https://fukuno.jig.jp/xml/" + Math.floor(guid / 100) + "/" + guid + ".xml";
    const url = "https://fukuno.jig.jp/" + guid;
    return { id: guid, date, title, tags, url };
};

const sortByDate = (a, b) => {
    const ad = new Date(a.date).getTime();
    const bd = new Date(b.date).getTime();
    return ad - bd;
};

const rssxml2csv = async () => {
    const xml = await Deno.readTextFile("../rss.xml");
    let off = 0;
    let idx = 0;
    const list = [];
    for (;;) {
        const n = xml.indexOf("<item>", off);
        if (n < 0) {
            break;
        }
        const m = xml.indexOf("</item>", n);
        off = m;
        const s = xml.substring(n, m + 7);
        const d = await parse(s);
        list.unshift(d);
    }
    console.log(list);
    await Deno.writeTextFile("../blog.csv", CSV.encode(CSV.fromJSON(list)));
};

const xml2json = async (fn) => {
    const xml = await Deno.readTextFile(fn);
    const n = xml.indexOf("<item>");
    if (n < 0) {
        return null;
    }
    const m = xml.indexOf("</item>", n);
    const s = xml.substring(n, m + 7);
    const d = await parse(s);
    return d;
};

const dir2csv = async () => {
    const dirs = Deno.readDirSync("../xml");
    const list = [];
    for (const dir of dirs) {
        console.log(dir);
        if (!dir.isDirectory) {
            continue;
        }
        const files = Deno.readDirSync("../xml/" + dir.name);
        for (const file of files) {
            const d = await xml2json("../xml/" + dir.name + "/" + file.name);
            if (!d) {
                console.log("err", d);
                Deno.exit(0);
            }
            list.push(d);
        }
    }
    list.sort(sortByDate);
    console.log(list);
    await Deno.writeTextFile("../blog.csv", CSV.encode(CSV.fromJSON(list)));
};

const csv2rssxml = async () => {
    const list = CSV.toJSON(CSV.decode(Deno.readTextFileSync("../blog.csv")));
    list.reverse();
    const s = [];
    s.push(`<rss version='2.0' xmlns:media='http://search.yahoo.com/mrss/'>
<channel>

<title>福野泰介の一日一創 / Create every day by Taisuke Fukuno</title>
<description>福井高専出身、株式会社jig.jp 創業者＆会長、福野泰介の一日一創ブログです。</description>
`);
    for (const l of list) {
        const no = l.id;
        const sxml = Deno.readTextFileSync("../xml/" + Math.floor(no / 100) + "/" + no + ".xml");
        //console.log(sxml);
        s.push(sxml);
    }
    s.push(`</channel>
</rss>
`);
    const xml = s.join("\n");
    console.log(xml);
    Deno.writeTextFileSync("../rss.xml", xml);
    console.log(list.length);
};

await dir2csv();
await csv2rssxml();
