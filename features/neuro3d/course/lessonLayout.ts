const cells = (line: string) => line.trim().slice(1, -1).split(/(?<!\\)\|/).map(cell => cell.trim());
const isRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isDivider = (line: string) => isRow(line) && cells(line).every(cell => /^:?-{3,}:?$/.test(cell));
const isSourceChip = /^(?:PMC|PubMed|NCBI Bookshelf|Radiopaedi…|neuroangio\.…|ScienceDirect|Springer(?:Link)?|Wiley Online L…|[\w.-]+\.(?:com|org|net|gov|edu))\s*(?:\+\d+)?$/i;

export function formatLesson(theory: string) {
  const source = theory.split('\n').filter(line => !isSourceChip.test(line.trim()));
  const output: string[] = [];
  let header = '';
  let columns = 0;
  for (let index = 0; index < source.length; index++) {
    const line = source[index];
    const next = source[index + 1] ?? '';
    const after = source[index + 2] ?? '';
    if (!line.trim() && columns && isRow(output.at(-1) ?? '') && isRow(next) && isDivider(after) && cells(next).length === columns) {
      // Original export continues the same table after a page break,
      // with its first body row misidentified as a second header.
      if (header && header !== next && !cells(next).every(cell => /^(?:[A-ZÁÉÍÓÚÇ][\p{L} ]{1,30})$/u.test(cell))) {
        output.push(next);
        index += 2;
        continue;
      }
    }
    if (isRow(line) && isDivider(next)) {
      header = line;
      columns = cells(line).length;
    } else if (!isRow(line) && line.trim()) {
      header = '';
      columns = 0;
    }
    output.push(line);
  }
  return output;
}
