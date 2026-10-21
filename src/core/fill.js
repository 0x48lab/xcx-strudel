import {Hap, Pattern, TimeSpan} from '@strudel/core';

/**
 * Stretch each event until the next event starts, so that a gated pattern sounds connected.
 * Events are looked for one cycle before and after the query, so a gap longer than a cycle
 * is not filled. Events without a whole, such as signals, are dropped.
 * @param {Pattern} pat - pattern
 * @returns {Pattern} - pattern whose events reach the next events
 */
export const fillGaps = pat => new Pattern(state => {
    const span = state.span;
    const around = state.setSpan(new TimeSpan(span.begin.sub(1), span.end.add(1)));
    const haps = pat.query(around).filter(hap => hap.whole);
    const onsets = haps.map(hap => hap.whole.begin).sort((a, b) => a.compare(b));
    // the first onset at or after a time, by binary search
    const nextOnset = time => {
        let low = 0;
        let high = onsets.length;
        while (low < high) {
            const mid = (low + high) >> 1;
            if (onsets[mid].lt(time)) low = mid + 1;
            else high = mid;
        }
        return onsets[low];
    };
    const result = [];
    haps.forEach(hap => {
        const next = nextOnset(hap.whole.end);
        const end = next || hap.whole.end;
        const begin = hap.part.begin.max(span.begin);
        const partEnd = end.min(span.end);
        if (begin.gte(partEnd)) return;
        result.push(new Hap(new TimeSpan(hap.whole.begin, end), new TimeSpan(begin, partEnd), hap.value, hap.context));
    });
    return result;
});

/**
 * The same function as Strudel code, which is put before exported code that uses it.
 * It is a fixed text and has no user input.
 */
export const FILL_GAPS_CODE = `register('fillGaps', (pat) => new Pattern((state) => {
  const span = state.span;
  const around = state.setSpan(new TimeSpan(span.begin.sub(1), span.end.add(1)));
  const haps = pat.query(around).filter((hap) => hap.whole);
  const onsets = haps.map((hap) => hap.whole.begin).sort((a, b) => a.compare(b));
  const nextOnset = (time) => {
    let low = 0;
    let high = onsets.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (onsets[mid].lt(time)) low = mid + 1;
      else high = mid;
    }
    return onsets[low];
  };
  const result = [];
  haps.forEach((hap) => {
    const next = nextOnset(hap.whole.end);
    const end = next || hap.whole.end;
    const begin = hap.part.begin.max(span.begin);
    const partEnd = end.min(span.end);
    if (begin.gte(partEnd)) return;
    result.push(new Hap(new TimeSpan(hap.whole.begin, end), new TimeSpan(begin, partEnd), hap.value, hap.context));
  });
  return result;
}))`;
