import { CSV } from "https://code4sabae.github.io/js/CSV.js";

// 2718 = 2020.1.1

const json = CSV.toJSON(CSV.decode(await Deno.readTextFile("ranking2020.csv")));
let n = 1;
const list = [];
for (const d of json) {
  if (d.id >= 2718) {
    console.log(n++, d);
    list.unshift(d);
  }
}

const addComma = (n) => {
  const s = "" + n;
  return s.substring(0, s.length - 3) + "," + s.substring(s.length - 3);
}
const blog = CSV.toJSON(CSV.decode(await Deno.readTextFile("../blog.csv")));
const s = [];
let idx = list.length;
for (const d of list) {
  const item = blog.filter(i => i.id == d.id)[0];
  console.log(item);
  s.push(`<p>
${idx--}位 ${addComma(d.pv)}PV <a href=https://fukuno.jig.jp/${item.id}>${item.title}</a><br>
</p><p>`);
}
console.log(s.join("\n"));
