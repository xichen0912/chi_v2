// Writes the finished website to the repository root after the Vite builds:
//   program/  ← React Program (built by Vite)
//   shared/   ← data.js + askchi.js (built by Vite) + site.css, shell.js, dc-lite.js …
//   map/ people/ awards/ accessibility/ my/  ← static pages from source/pages
//   index.html ← opens Program
// Edit files under source/, never the generated folders at the root.
import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')   // source/
const dist = join(root, '..')                                        // repository root

cpSync(join(root, 'shared'), join(dist, 'shared'), { recursive: true })
for (const page of readdirSync(join(root, 'pages'))) {
  mkdirSync(join(dist, page), { recursive: true })
  cpSync(join(root, 'pages', page), join(dist, page), { recursive: true })
}

// Program: add the shared stylesheet and the sidebar shell.
const programHtml = join(dist, 'program', 'index.html')
let html = readFileSync(programHtml, 'utf8')
html = html.replace('</title>', '</title>\n    <link rel="icon" href="../shared/favicon.svg" type="image/svg+xml" />\n    <link rel="stylesheet" href="../shared/site.css" />')
html = html.replace('<body data-page="program">', '<body data-page="program">\n    <script src="../shared/shell.js"></script>')
writeFileSync(programHtml, html)

// Site root opens Program.
writeFileSync(join(dist, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>CHI 2027</title>
<meta http-equiv="refresh" content="0; url=program/">
<script>location.replace('program/' + location.search + location.hash)</script>
</head><body><a href="program/">Open the CHI 2027 program</a></body></html>
`)
writeFileSync(join(dist, '.nojekyll'), '')
console.log('Website written to the repository root:', dist)
