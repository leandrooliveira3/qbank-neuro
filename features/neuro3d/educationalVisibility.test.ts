import { expect, it } from 'vitest';
import { educationalVessels } from './educationalVessels';
import { hideEducationalVessel } from './educationalVisibility';
import { dangerousAnastomoses } from './dangerousAnastomoses';
import { openAnatomy } from './openAnatomy';
import { reconstructedVessels } from './reconstructedVessels';
import { connectionIds } from './DangerousAnastomosesPanel';

it('requires explicit embryonic visibility regardless of selection, family and generic variants', () => {
  const rows = educationalVessels.filter(row => row.embryonic);
  expect(rows).toHaveLength(4);
  for (const row of rows) for (const selected of [null, row.id]) {
    for (const illustrations of [true, false]) for (const variants of [true, false]) {
      const options = { illustrations, variants, selected, family: new Set([row.id]), embryonic: false };
      expect(hideEducationalVessel(row, options)).toBe(true);
      expect(hideEducationalVessel(row, { ...options, embryonic: true })).toBe(false);
    }
  }
});

it('preserves adult neuromeningeal routes when embryonic arteries are hidden', () => {
  const rows = educationalVessels.filter(row => /hypoglossal_branch_to_odontoid|arterial_branch_to_hypoglossal/.test(row.id));
  expect(rows).toHaveLength(4);
  for (const row of rows) {
    expect(row.embryonic).toBe(false);
    expect(hideEducationalVessel(row, { illustrations: true, variants: false, embryonic: false, selected: null, family: new Set() })).toBe(false);
  }
});

it('resolves the 25 study routes on each side while retaining the missing falcotentorial branch', () => {
  const ids = new Set([...openAnatomy.structures, ...reconstructedVessels].map(row => row.id));
  expect(dangerousAnastomoses).toHaveLength(25);
  expect(new Set(dangerousAnastomoses.map(row => row.id)).size).toBe(25);
  for (const route of dangerousAnastomoses) for (const side of ['l', 'r']) {
    expect(route.geometryConnectionVerified).toBe(false);
    const resolved = connectionIds(route.vessels, side);
    for (const id of resolved) {
      if (id === 'falcotentorial_dural_branches_of_pca') expect(ids.has(id)).toBe(false);
      else expect(ids.has(id), id).toBe(true);
      expect(id.endsWith(side === 'l' ? '_r' : '_l')).toBe(false);
    }
  }
});
