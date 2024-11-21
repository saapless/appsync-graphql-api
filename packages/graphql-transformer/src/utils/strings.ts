export function dedent<T extends TemplateStringsArray>(segments: T) {
  console.log(segments);
  const lines = segments
    .reduce((acc, segment) => acc + segment, "") // get raw string
    .trimEnd()
    .split("\n");

  // Find the minimum number of leading spaces across all lines
  const minLeadingSpaces = lines.reduce((acc, line) => {
    // Find the number of leading spaces for this line
    const leadingSpaces = line?.match(/^ */)?.[0].length ?? Infinity;
    // if it has less leading spaces than the previous minimum, set it as the new minimum
    return leadingSpaces < acc ? leadingSpaces : acc;
  }, Infinity);

  // Trim lines, join them and return the result
  return lines.map((line) => line.substring(minLeadingSpaces)).join("\n");
}
