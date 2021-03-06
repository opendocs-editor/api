# dictionary-es-hn

Spanish (or Castilian; Honduras) spelling dictionary in UTF-8.

Useful with [hunspell][], [`nodehun`][nodehun], [`nspell`][nspell],
Open Office, LibreOffice, Firefox and Thunderbird, or [macOS][].

Generated by [`dictionaries`][dictionaries] from
[`sbosio/rla-es`][source].

## Install

[npm][]:

```sh
npm install dictionary-es-hn
```

## Use

```js
var esHn = require("dictionary-es-hn");

esHn(function (err, result) {
    console.log(err || result);
});
```

Yields:

```js
{dic: <Buffer>, aff: <Buffer>}
```

Where `dic` is a [`Buffer`][buffer] for the dictionary file at `index.dic` (in
UTF-8) and `aff` is a [`Buffer`][buffer] for the affix file at `index.aff` (in
UTF-8).

Or directly load the files, using something like:

```js
var path = require("path");
var base = require.resolve("dictionary-es-hn");

fs.readFileSync(path.join(base, "index.dic"), "utf-8");
fs.readFileSync(path.join(base, "index.aff"), "utf-8");
```

## License

Dictionary and affix file: [(GPL-3.0 OR LGPL-3.0 OR MPL-1.1)](https://github.com/wooorm/dictionaries/blob/main/dictionaries/es-HN/license).
Rest: [MIT][] © [Titus Wormer][home].

[hunspell]: https://hunspell.github.io
[nodehun]: https://github.com/nathanjsweet/nodehun
[nspell]: https://github.com/wooorm/nspell
[macos]: https://github.com/wooorm/dictionaries#macos
[source]: https://github.com/sbosio/rla-es
[npm]: https://docs.npmjs.com/cli/install
[dictionaries]: https://github.com/wooorm/dictionaries
[mit]: https://github.com/wooorm/dictionaries/blob/main/license
[buffer]: https://nodejs.org/api/buffer.html#buffer_buffer
[home]: https://wooorm.com
