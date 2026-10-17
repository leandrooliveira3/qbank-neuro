import requirements from "./anatomy-requirements.json";
import { openAnatomy } from "./openAnatomy";
import { reconstructedArteries } from "./reconstructedArteries";

// Explicit identity mapping: substring matching alone can confuse a plexus,
// supplying artery, anastomosis and parent vessel. Grouped source rows remain partial.
const identities: Record<string, string[]> = {
  "1": ["internal_carotid_artery"], "2": ["meningohypophyseal_trunk"], "3": ["inferolateral_trunk"],
  "5": ["ophthalmic_artery"], "8": ["anterior_ethmoidal_artery"], "10": ["short_posterior_ciliary_arteries"],
  "11": ["long_posterior_ciliary_arteries"], "12": ["central_retinal_artery"], "13": ["lacrimal_artery"],
  "14": ["inferior_hypophyseal_artery"], "17": ["marginal_tentorial_artery"], "18": ["medial_clival_branch"],
  "36": ["foramen_ovale_branch"], "37": ["foramen_rotundum_branch"], "38": ["anteromedial_ilt_branch"],
  "39": ["middle_meningeal_artery"], "47": ["ascending_pharyngeal_artery"], "52": ["artery_of_pterygoid_canal"],
  "55": ["maxillary_artery"], "56": ["anterior_deep_temporal_artery"], "57": ["posterior_deep_temporal_artery"],
  "63": ["posterior_septal_branches_of_sphenopalatine_artery", "anterior_septal_branches_of_anterior_ethmoidal_artery", "posterior_ethmoidal_artery", "anterior_ethmoidal_artery"],
  "68a": ["greater_palatine_artery"], "71": ["submental_artery"], "72": ["inferior_alveolar_artery"],
  "73": ["facial_artery"], "75": ["angular_artery"], "76": ["inferior_labial_artery"], "77": ["superior_labial_artery"],
  "79": ["buccal_artery"], "80": ["transverse_facial_artery"], "81": ["infra_orbital_artery"],
  "83": ["supratrochlear_artery"], "84": ["supra_orbital_artery"], "85": ["superficial_temporal_artery"],
  "86": ["frontal_branch_of_superficial_temporal_artery"], "90": ["vertebral_artery"], "91": ["anterior_spinal_artery"],
  "92": ["posterior_inferior_cerebellar_artery"], "102": ["deep_cervical_artery"],
  "19": [], "29": ["occipital_artery"], "60": ["posterior_lateral_nasal_branches_of_sphenopalatine_artery"],
  "64": ["posterior_septal_branches_of_sphenopalatine_artery"], "66": ["posterior_ethmoidal_artery"], "67": ["anterior_ethmoidal_artery"],
  "68": ["descending_palatine_artery"], "110": ["anterior_cerebral_artery"], "111": ["posterior_communicating_artery"],
  "112": ["anterior_choroidal_artery"], "114": ["posterior_cerebral_artery"], "115": ["superior_cerebellar_artery"],
  "116": ["anterior_inferior_cerebellar_artery"], "117": ["basilar_artery"], "118": ["middle_cerebral_artery_m1_segment"],
  "109": ["anterior_cerebral_artery", "posterior_communicating_artery", "anterior_choroidal_artery", "posterior_cerebral_artery", "superior_cerebellar_artery", "anterior_inferior_cerebellar_artery", "basilar_artery", "middle_cerebral_artery_m1_segment"],
};
const grouped = new Set(["5", "57", "63", "109"]);
// Items embedded in grouped source rows or parentheses must not disappear from the audit.
const expandedEntries = [
  ["6", "Ophthalmic artery · loop intraorbital segment"], ["7", "Ophthalmic artery · distal intraorbital segment"],
  ["19", "Lateral clival arcade"], ["27", "Superior sagittal sinus arterial arcade"],
  ["28", "Transmastoid branch of occipital artery"], ["29", "Occipital artery"],
  ["58", "Middle deep temporal branch"], ["59", "Anterior superior alveolar artery"],
  ["60", "Sphenopalatine artery · lateral nasal branch"], ["61", "Inferior turbinate arterial branches"],
  ["62", "Middle turbinate arterial branches"], ["62a", "Superior turbinate arterial branches"],
  ["64", "Posterior nasal septal arterial system"], ["65", "Anterior nasal septal arterial system"],
  ["66", "Posterior ethmoidal artery"], ["67", "Anterior ethmoidal artery"], ["68", "Descending palatine artery"],
  ["104", "Ascending cervical–vertebral anastomoses"], ["110", "Anterior cerebral artery"],
  ["111", "Posterior communicating artery"], ["112", "Anterior choroidal artery"],
  ["113", "Posterior choroidal arteries"], ["114", "Posterior cerebral artery"],
  ["115", "Superior cerebellar artery"], ["116", "Anterior inferior cerebellar artery"],
  ["117", "Basilar artery"], ["118", "Middle cerebral artery"],
].map(([sourceNumber, label]) => ({ sourceNumber, label }));
export const anatomicalInventory = [...requirements.numberedEntries, ...expandedEntries].map((entry, index) => {
  const targets = identities[entry.sourceNumber] ?? [];
  const imported = openAnatomy.structures.filter((structure) => targets.some((target) => structure.id === target || structure.id === `${target}_l` || structure.id === `${target}_r`));
  const rebuilt = reconstructedArteries.filter((structure) => targets.some((target) => structure.id === `${target}_l` || structure.id === `${target}_r`));
  const status = grouped.has(entry.sourceNumber) ? "partial" : imported.length ? "imported" : rebuilt.length ? "reconstructed" : "missing";
  return { key: `${entry.sourceNumber}-${index}`, number: entry.sourceNumber, label: entry.label,
    ids: [...imported, ...rebuilt].map((item) => item.id), status,
    note: status === "partial" ? "Entrada agrupada: apenas as estruturas listadas foram mapeadas. Segmentos, variantes e conexões exigem revisão individual."
      : status === "imported" ? "Malha importada identificada. Presença não certifica óstio, ramos ou relações finas."
      : status === "reconstructed" ? "Superfície didática criada nesta revisão. Calibre, trajeto e relações finas não validados."
      : "Sem malha individual identificada. Pendente de reconstrução e revisão.",
  };
});
export const inventoryStatus: Record<string, string> = {
  imported: "Malha importada", reconstructed: "Reconstrução didática", partial: "Grupo parcialmente mapeado", missing: "Pendente",
};
