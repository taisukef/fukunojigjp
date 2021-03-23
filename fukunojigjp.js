import { createApp } from "https://servestjs.org/@v1.1.9/mod.ts";
import { CONTENT_TYPE } from "https://js.sabae.cc/CONTENT_TYPE.js";
import { fix0 } from "https://js.sabae.cc/fix0.js";
import { CSV } from "https://js.sabae.cc/CSV.js";

const SHORT_LEN = 120;

let template = Deno.readTextFileSync("../index.html");
let templateBody = `
  <div class='section' id='content' itemscope itemtype='http://schema.org/Article'>
    <span itemprop='mainEntityOfPage' value='https://fukuno.jig.jp/'></span>
    <div class='header' id='chead'><a itemprop='url' href='<rep>url</rep>'><h2 itemprop='headline'><rep>title</rep></h2></a></div>
    <div class='datetime' itemprop='dateCreated'><rep>date</rep></div>
    <div class='hash'><rep>hashs</rep></div>
    <div class='article' id='cmain' itemprop='articleBody'>
      <rep>articleBody</rep>
    </div>
    <div class='footer' id='cfoot'>
      <div id='author'><a itemprop='license' href='https://creativecommons.org/licenses/by/4.0/deed.ja'>CC BY 4.0 </a> 福野泰介 / <a itemprop='author' href='https://twitter.com/taisukef'>@taisukef</a></div>
      <div class='related'></div>
    </div>
  </div>
`;
// <a href="./js">#js</a>&nbsp;<a href="./hanadojo">#hanadojo</a>&nbsp;<a href="./opendata">#opendata</a>&nbsp;<a href="./DXGOV">#DXGOV</a>&nbsp;<a href="./teito">#teito</a>&nbsp;

let templateList = `
  <div class='section' id='content' itemscope itemtype='http://schema.org/Article'>
    <span itemprop='mainEntityOfPage' value='https://fukuno.jig.jp/'></span>
    <div class='header' id='chead'><a itemprop='url' href='<rep>url</rep>'><h2 itemprop='headline'><rep>title</rep></h2></a></div>
    <div class='article' id='cmain' itemprop='articleBody'>
      <rep>articleBody</rep>
    </div>
    <div class='footer' id='cfoot'>
      <div id='author'><a itemprop='license' href='https://creativecommons.org/licenses/by/4.0/deed.ja'>CC BY 4.0 </a> 福野泰介 / <a itemprop='author' href='https://twitter.com/taisukef'>@taisukef</a></div>
      <div class='related'></div>
    </div>
  </div>
`;

const topdata = {
  title: "福野泰介の一日一創 / create every day",
  url: "https://fukuno.jig.jp/",
  img: "https://fukuno.jig.jp/ced3.jpg",
  description: "福井高専出身、株式会社jig.jp 創業者＆会長、福野泰介の一日一創ブログです。",
};

/*
<div class='nav' id='pagenav'><a href='?off=10'>NEXT &gt;&gt;</a></div>
		</div>
	</div>
</div>
*/

const readFileSyncCore = (fn, req) => {
  const query = req.url;
  const issearch = query.indexOf("/?q=") >= 0;
  const fn2 = fn.substring(1);
  const no = parseInt(fn2);
  const ishash = fn2.indexOf("/") == -1 && fn2.indexOf(".") == -1;
  const isdirect = no == fn2;
  const istop = fn == "/index.html" && !issearch;
  if (istop) {
    const list = CSV.toJSON(CSV.decode(Deno.readTextFileSync("../blog.csv")));
    let narticle = 3;
    let html = buildText(template, topdata);
    const bodies = [];
    for (const l of list.reverse()) {
      const d = readDirect(l.id);
      const body = buildText(templateBody, d);
      bodies.push(body);
      if (!narticle--) {
        break;
      }
    }
    html = html.replace(/<rep>body<\/rep>/g, bodies.join("\n"));
    return html;
  } else if (issearch) {
    const key = decodeURIComponent(query.substring(4));
    const hash = key;
    const title = "福野泰介の一日一創 - " + key;
    const list = CSV.toJSON(CSV.decode(Deno.readTextFileSync("../blog.csv"))).filter(l => l.title.indexOf(key) >= 0);
    const hit = list.reverse().map(l => `<div>${l.date.substring(0, 10)} <a href=${l.url}>${l.title}</a></div>`).join("\n");
    let htmllist = templateList;
    htmllist = htmllist.replace(/<rep>title<\/rep>/g, hash);
    htmllist = htmllist.replace(/<rep>url<\/rep>/g, "https://fukuno.jig.jp/" + fn2);
    htmllist = htmllist.replace(/<rep>articleBody<\/rep>/g, hit)
    let html = template.replace(/<rep>body<\/rep>/g, htmllist);
    html = html.replace(/<rep>title<\/rep>/g, title);
    return html;
  } else if (isdirect) {
    const d = readDirect(no);
    const body = buildText(templateBody, d);
    let html = buildText(template, d);
    html = html.replace(/<rep>body<\/rep>/g, body);
    return html;
  } else if (ishash) {
    const hash = "#" + fn2;
    const title = "福野泰介の一日一創 - " + hash;
    const list = CSV.toJSON(CSV.decode(Deno.readTextFileSync("../blog.csv")));
    const hit = list.reverse().filter(l => l.tags.indexOf(hash) >= 0).map(l => `<div>${l.date.substring(0, 10)} <a href=${l.url}>${l.title}</a></div>`).join("\n");
    let htmllist = templateList;
    htmllist = htmllist.replace(/<rep>title<\/rep>/g, hash);
    htmllist = htmllist.replace(/<rep>url<\/rep>/g, "https://fukuno.jig.jp/" + fn2);
    htmllist = htmllist.replace(/<rep>articleBody<\/rep>/g, hit)
    let html = template.replace(/<rep>body<\/rep>/g, htmllist);
    html = html.replace(/<rep>title<\/rep>/g, title);
    return html;
  }
  try {
    const d = Deno.readFileSync("../" + fn);
    return d;
  } catch (e) {
    console.log(e);
  }
  return "not found";
};

const readDirect = no => {
  const sxml = Deno.readTextFileSync("../xml/" + Math.floor(no / 100) + "/" + no + ".xml");
  const json = xml2json(sxml);
  //console.log(json);
  const d = makeData(json);
  //console.log(sxml, d);
  return d;
};

const buildHashLinks = tag => {
  if (!tag) {
    return "";
  }
  return tag.split(" ").map(tag => `<a href=${tag.substring(1)}>${tag}</a>&nbsp;`).join("");
};
const buildText = (template, d) => {
  let s = template;
  s = s.replace(/<rep>title<\/rep>/g, d.title);
  s = s.replace(/<rep>description<\/rep>/g, d.description);
  s = s.replace(/<rep>image<\/rep>/g, d.img);
  s = s.replace(/<rep>date<\/rep>/g, d.dt);
  s = s.replace(/<rep>url<\/rep>/g, d.guid);
  s = s.replace(/<rep>hashs<\/rep>/g, buildHashLinks(d.tag));
  s = s.replace(/<rep>articleBody<\/rep>/g, d.body);
  return s;
};
const makeData = d => {
  d.body = d.description;
  d.description = makeShort(d.body);
  d.img = makeThumnail(d.body);
  d.tag = makeTag(d.title);
  d.title = cutHash(d.title);
  d.dt = makeDate(d.pubDate);
  return d;
};

const getDate = (d) => {
  if (!d) {
    d = new Date();
  }
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const date = d.getDate();
  //return y + "-" + fix0(m, 2) + "-" + fix0(date, 2) + "T" + fix0(h, 2) + ":" + fix0(min, 2);
  return "" + y + "-" + fix0(m, 2) + "-" + fix0(date, 2);
};

const makeDate = date => {
  const d = new Date(date);
  return getDate(d);
}
const makeTag = title => {
  const n = title.indexOf("#");
  if (n < 0) {
    return "";
  }
  return title.substring(n);
};

const cutHash = title => {
  const n = title.indexOf(" #");
  if (n < 0) {
    return title;
  }
  return title.substring(0, n);
};

const cutTags = s => {
  const res = [];
  let idx = 0;
  for (;;) {
    const n = s.indexOf("<", idx);
    if (n < 0) {
      res.push(s.substring(idx));
      break;
    }
    res.push(s.substring(idx, n))
    const m = s.indexOf(">", n);
    if (m < 0) {
      console.log("err!! " + s);
      idx = s.length;
    } else {
      idx = m + 1;
    }
  }
  return res.join("");
};
const cutSpaces = s => {
  s = s.replace(/\s/g, "");
  return s;
};
const makeShort = body => {
  const b = cutSpaces(cutTags(body));
  const len = Math.min(b.length, SHORT_LEN);
  return b.substring(0, len) + "...";
};
const makeThumnail = body => {
  const b = body;
  const n = b.indexOf("<img ");
  if (n < 0) {
    return;
  }
  const n2 = b.indexOf(">", n);
  const b2 = b.substring(n, n2);
  let m = b2.indexOf(' src="');
  if (m >= 0) {
    const m2 = b2.indexOf("\"", m + 6);
    if (m2 >= 0) {
      return b2.substring(m + 6, m2);
    }
    return null;
  }
  m = b2.indexOf(" src='");
  if (m >= 0) {
    const m2 = b2.indexOf("'", m + 6);
    if (m2 >= 0) {
      return b2.substring(m + 6, m2);
    }
    return null;
  }
  m = b2.indexOf(" src=");
  if (m >= 0) {
    const m2 = b2.indexOf(" ", m + 5);
    if (m2 >= 0) {
      return b2.substring(m + 5, m2);
    }
    d.img = b2.substring(m + 5);
  }
  return null;
};

const decodeXML = s => {
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&lt;/g, "<");
  return s;
};
const xml2json = sxml => {
  const names = ["title", "guid", "pubDate"];
  const res = {};
  for (const name of names) {
    const n = sxml.indexOf("<" + name + ">");
    const m = sxml.indexOf("</" + name + ">", n);
    if (n < 0 || m < 0) {
      return null;
    }
    const s = sxml.substring(n + name.length + 2, m);
    res[name] = decodeXML(s);
  }
  const n = sxml.indexOf("<description><![CDATA[");
  const m = sxml.lastIndexOf("]]></description>");
  const s = sxml.substring(n + 22, m);
  res["description"] = decodeXML(s);
  return res;
};

class Server {
  constructor(port) {
    const app = createApp();

    app.handle(/\/*/, async (req) => {
      try {
        const getRange = (req) => {
          const range = req.headers.get("Range");
          if (!range || !range.startsWith("bytes=")) {
            return null;
          }
          const res = range.substring(6).split("-");
          if (res.length === 0) {
            return null;
          }
          return res;
        };
        const range = getRange(req);
        const fn = req.path === "/" || req.path.indexOf("..") >= 0
          ? "/index.html"
          : req.path;
        const n = fn.lastIndexOf(".");
        const ext = n < 0 ? "html" : fn.substring(n + 1);
        const readFileSync = (fn, range, req) => {
          const data = readFileSyncCore(fn, req);
          if (!range) {
            return [data, data.length];
          }
          const offset = parseInt(range[0]);
          const len = range[1]
            ? parseInt(range[1]) - offset + 1
            : data.length - offset;
          const res = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            res[i] = data[offset + i];
          }
          return [res, data.length];
        };
        const [data, totallen] = readFileSync(fn, range, req);
        const ctype = CONTENT_TYPE[ext] || "text/plain";
        const headers = {
          "Content-Type": ctype,
          "Accept-Ranges": "bytes",
          "Content-Length": data.length,
        };
        if (range) {
          headers["Content-Range"] = "bytes " + range[0] + "-" + range[1] +
            "/" + totallen;
        }
        await req.respond({
          status: range ? 206 : 200,
          headers: new Headers(headers),
          body: data,
        });
      } catch (e) {
        if (req.path !== "/favicon.ico") {
          console.log("err", req.path, e.stack);
        }
      }
    });

    const hostname = "::";
    app.listen({ port, hostname });

    console.log(`http://localhost:${port}/`);
  }
}

new Server(8085);
