// Safe JSON for <script type="application/ld+json">: escapes characters that could close the script
// tag or break out of it (</script>, <!--, U+2028/2029). Route params can contain arbitrary text.
export function jsonLdString(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
