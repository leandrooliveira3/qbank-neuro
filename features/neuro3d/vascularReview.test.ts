import {maxillaryBranchReview} from "./maxillaryReview";
import {describe,it,expect} from "vitest";
import {sourceStructures,openAnatomy} from "./openAnatomy";
import {vascularMeshReview,venousCoverage,vascularReviewCounts} from "./vascularReview";
import {vascularQuarantine} from "./vascularQuarantine";
import {reconstructedArteries} from "./reconstructedArteries";
import axes from "./reference-access-network.json";
import geometryAudit from "../../docs/neuro3d-vascular-geometry-audit.json";

describe("whole vascular review and traceable ECA corrections",()=>{
  it("retains every original triangle and used vertex in the component audit, without assigning branch identities",()=>{
    for(const mesh of geometryAudit.meshes) {
      expect(mesh.components.length).toBe(mesh.usedVertexComponents);
      expect(mesh.components.reduce((sum,component)=>sum+component.triangles,0)).toBe(mesh.triangles);
      expect(mesh.components.reduce((sum,component)=>sum+component.vertices,0)).toBe(mesh.vertices-mesh.unusedVertices);
      expect(mesh.components.every(component=>component.anatomicalIdentityAssigned === false)).toBe(true);
    }
    for(const side of ["l","r"]) expect(geometryAudit.meshes.find(row=>row.id === `maxillary_artery_${side}`)?.components).toHaveLength(9);
  });
  it("keeps the maxillary side of skull-base connections distinct from ICA branches and ambiguous source labels",()=>{
    expect(maxillaryBranchReview.find(row=>row.key === "accessory-meningeal")?.status).toBe("missing");
    expect(maxillaryBranchReview.find(row=>row.key === "foramen-rotundum-imax")?.status).toBe("missing");
    expect(maxillaryBranchReview.find(row=>row.key === "sphenopalatine")?.status).toBe("partial");
    expect(maxillaryBranchReview.find(row=>row.key === "infraorbital")?.ids).toContain("infra_orbital_artery_l");
  });
  it("accounts for every original arterial and venous mesh, including rejected originals",()=>{
    const vascular=sourceStructures.filter(row=>["arterial","venous"].includes(row.layer));
    expect(vascularMeshReview.filter(row=>row.kind === "imported").map(row=>row.id).sort()).toEqual(vascular.map(row=>row.id).sort());
    expect(new Set(vascularMeshReview.map(row=>row.key)).size).toBe(vascularMeshReview.length);
    expect(vascularMeshReview.every(row=>row.boundsFinite)).toBe(true);
    expect(vascularReviewCounts.importedVenous).toBe(63);
    expect(vascularReviewCounts.anatomicallyApproved).toBe(0);
    for (const [id] of vascularQuarantine) {
      expect(sourceStructures.some(row=>row.id === id)).toBe(true);
      expect(openAnatomy.structures.some(row=>row.id === id)).toBe(false);
      expect(vascularMeshReview.find(row=>row.key === `source:${id}`)?.selectable).toBe(false);
      expect(reconstructedArteries.filter(row=>row.id === id)).toHaveLength(1);
    }
  });
  it("does not replace absent deep or superficial veins with existing sinuses",()=>{
    for (const id of ["great_cerebral_vein","internal_cerebral_vein","basal_vein_of_rosenthal","superior_anastomotic_vein","inferior_anastomotic_vein","anterior_spinal_vein"]) {
      expect(venousCoverage.find(row=>row.id === id)?.status).toBe("missing");
    }
    expect(venousCoverage.find(row=>row.id === "straight_sinus")?.status).toBe("present-unverified");
    expect(venousCoverage.find(row=>row.id === "internal_cerebral_vein")?.drainageTargets).toContain("great_cerebral_vein");
    for(const row of venousCoverage) {
      expect(row.drainageGeometryVerified).toBe(false);
      for(const id of row.drainageTargets) expect(venousCoverage.some(candidate=>candidate.id === id)).toBe(true);
    }
  });
  it("anchors APA and lingual independently to each ECA and separates jugular and hypoglossal divisions",()=>{
    const get=(id:string)=>reconstructedArteries.find(row=>row.id === id)!;
    for (const side of ["l","r"] as const) {
      const axis=axes.originalAxes[side === "l" ? "external_carotid_artery_l" : "external_carotid_artery_r"].points;
      for (const root of ["ascending_pharyngeal_artery","lingual_artery"]) {
        const vessel=get(`${root}_${side}`);
        expect(vessel.parentId).toBe(`external_carotid_artery_${side}`);
        expect(vessel.points[0]).toEqual(axis[vessel.anchorIndex]);
      }
      const hypo=get(`hypoglossal_division_of_ascending_pharyngeal_artery_${side}`);
      const jugular=get(`jugular_division_of_ascending_pharyngeal_artery_${side}`);
      expect(hypo.parentId).toBe(`neuromeningeal_trunk_${side}`);
      expect(jugular.parentId).toBe(hypo.parentId);
      expect(Math.abs(hypo.points.at(-1)![0])).toBeLessThan(Math.abs(jugular.points.at(-1)![0]));
      expect(hypo.points.at(-1)![1]).toBeGreaterThan(-4);
      expect(get(`deep_lingual_artery_${side}`).points.at(-1)![2]).toBeGreaterThan(7);
    }
  });
});
