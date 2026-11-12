// Turn the single-file build into the page body format a Claude Artifact expects
// (the Artifact adds its own <!doctype>, <html>, <head> and <body> around it).
import fs from "node:fs";
const html = fs.readFileSync("dist/index.html", "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const title = head.match(/<title>[\s\S]*?<\/title>/)[0];
const styles = head.match(/<style[\s\S]*?<\/style>/g) ?? [];
const scripts = head.match(/<script[\s\S]*?<\/script>/g) ?? [];
const out = [
  title,
  '<meta name="claude:viewport-fit-sides" content="cover">',
  '<meta name="theme-color" content="#0b0b0e">',
  ...styles,
  body.trim(),
  ...scripts,
].join("\n");
fs.writeFileSync("dist/storyloom.html", out);
console.log(`dist/storyloom.html  ${(out.length / 1024).toFixed(0)} KB`);
