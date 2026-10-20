import {describe,it,expect} from "vitest";
import {sourceStructures} from "./openAnatomy";
import {reconstructedVessels} from "./reconstructedVessels";
import {resolveVascularRequirement,vascularCompleteness,unmappedVascularDiagramEntries} from "./vascularCompleteness";
import {diagramRegistry} from "./anatomicalInventory";
import audit from "../../docs/neuro3d-vascular-geometry-audit.json";

describe("whole vascular completeness without parent or contralateral substitution",()=>{
  it("accounts for every source and reconstructed vessel, including extracranial veins and access vessels",()=>{
    const keys=new Set(vascularCompleteness.map(row=>`${row.layer}:${row.id}`));
    expect(keys.size).toBe(vascularCompleteness.length);
    for (const item of [...sourceStructures,...reconstructedVessels].filter(row=>["arterial","venous"].includes(row.layer))) {
      expect(vascularCompleteness.some(row=>row.layer === item.layer && row.expectedIds.includes(item.id))).toBe(true);
    }
    expect(vascularCompleteness.find(row=>row.id === "facial_vein")?.ids).toEqual(expect.arrayContaining(["facial_vein_l","facial_vein_r"]));
    expect(vascularCompleteness.find(row=>row.id === "brachiocephalic_vein")?.ids).toHaveLength(2);
    expect(vascularCompleteness.every(row=>row.anatomicalApproval === false)).toBe(true);
    for (const row of diagramRegistry.entries) {
      expect(unmappedVascularDiagramEntries.some(entry=>entry.key === row.key) || row.targets.every(target=>vascularCompleteness.some(requirement=>requirement.id === target.replace(/^(right|left)_/,"")))).toBe(true);
    }
  });
  it("records an absent side and rejects a different vascular system even when IDs match",()=>{
    const row={id:"test_vein",name:"Test",layer:"venous" as const,group:"test",expectedIds:["test_vein_l","test_vein_r"],references:[],note:""};
    const resolved=resolveVascularRequirement(row,new Map([["test_vein_l",{layer:"venous"}],["test_vein_r",{layer:"arterial"}]]));
    expect(resolved.status).toBe("partial");
    expect(resolved.ids).toEqual(["test_vein_l"]);
    expect(resolved.missingIds).toEqual(["test_vein_r"]);
  });
  it("exposes named perforators, choroidals and tributaries instead of filling them with existing trunks",()=>{
    for (const id of ["recurrent_artery_of_heubner","medial_lenticulostriate_arteries","posterior_thalamoperforating_arteries","medial_posterior_choroidal_artery","lateral_posterior_choroidal_artery","perforating_branches_of_pica","radiculomedullary_arteries","internal_cerebral_vein"]) {
      const row=vascularCompleteness.find(candidate=>candidate.id === id)!;
      expect(row.status).toBe("present-unverified");
      expect(row.missingIds).toEqual([]);
      expect(row.illustratedIds).toEqual([`${id}_l`,`${id}_r`]);
      expect(row.referenceMissingIds).toEqual([`${id}_l`,`${id}_r`]);
    }
    expect(vascularCompleteness.find(row=>row.id === "subcallosal_artery")?.referenceMissingIds).toEqual(["subcallosal_artery"]);
    expect(vascularCompleteness.find(row=>row.id === "middle_meningeal_artery")?.status).toBe("present-unverified");
    expect(vascularCompleteness.find(row=>row.id === "accessory_meningeal_artery")?.status).toBe("present-unverified");
    expect(vascularCompleteness.find(row=>row.id === "foramen_rotundum_branch")?.status).toBe("present-unverified");
    expect(vascularCompleteness.find(row=>row.id === "artery_of_foramen_rotundum_from_maxillary")?.status).toBe("present-unverified");
  });
  it("keeps the source MMA extent warning tied to measured original buffers",()=>{
    for (const side of ["l","r"]) {
      const row=audit.meshes.find(mesh=>mesh.id === `middle_meningeal_artery_${side}`)!;
      expect(row.boundsCm![1][1]-row.boundsCm![0][1]).toBeCloseTo(2.40,2);
    }
    expect(vascularCompleteness.find(row=>row.id === "middle_meningeal_artery")?.findings.join(" ")).toContain("2,40 cm");
  });
});
