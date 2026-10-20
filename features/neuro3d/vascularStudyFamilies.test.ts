import {describe,it,expect} from "vitest";
import {vascularStudyFamily,vascularStudyRelations,hiddenOutsideStudyFamily} from "./vascularStudyFamilies";
import {vascularCompleteness} from "./vascularCompleteness";
import {openAnatomy} from "./openAnatomy";
import {reconstructedVessels} from "./reconstructedVessels";

describe("vascular study grouping without anatomical or flow approval",()=>{
  it("keeps each relation traceable to named requirements, without changing navigation",()=>{
    const ids=new Set(vascularCompleteness.map(row=>row.id));
    for(const row of vascularStudyRelations) {
      expect(ids.has(row.parent),row.parent).toBe(true);
      expect(ids.has(row.child),row.child).toBe(true);
      expect(row.geometryConnectionVerified).toBe(false);
    }
  });
  it("keeps the maxillary tree lateralized, includes nested terminals and exposes absent trunks",()=>{
    const family=vascularStudyFamily("maxillary_artery_l");
    expect(family.ids.has("maxillary_artery_l")).toBe(true);
    expect(family.ids.has("middle_meningeal_artery_l")).toBe(true);
    expect(family.ids.has("greater_palatine_artery_l")).toBe(true);
    expect(family.ids.has("posterior_septal_branches_of_sphenopalatine_artery_l")).toBe(true);
    expect(family.ids.has("sphenopalatine_artery_l")).toBe(true);
    expect(family.ids.has("accessory_meningeal_artery_l")).toBe(true);
    expect(family.ids.has("frontal_branch_of_middle_meningeal_artery_l")).toBe(true);
    expect(family.ids.has("accessory_branch_of_middle_meningeal_artery_l")).toBe(false);
    expect([...family.ids,...family.missingIds].some(id=>id.endsWith("_r"))).toBe(false);
    expect(family.contextIds.has("external_carotid_artery_l")).toBe(true);
  });
  it("retains recovered MCA branches and missing perforators in the ipsilateral ICA study",()=>{
    const family=vascularStudyFamily("internal_carotid_artery_r");
    expect(family.ids.has("insular_branches_of_middle_cerebral_artery_m2_r")).toBe(true);
    expect(family.ids.has("arterial_branch_to_angular_gyrus_r")).toBe(true);
    expect(family.ids.has("anterior_choroidal_artery_r")).toBe(true);
    expect(family.ids.has("recurrent_artery_of_heubner_r")).toBe(true);
    expect([...family.ids].some(id=>id.endsWith("_l"))).toBe(false);
    expect(vascularStudyFamily("right_common_carotid_artery").ids.has("internal_carotid_artery_r")).toBe(true);
  });
  it("keeps absent deep veins visible in collector requirements rather than substituting sinuses",()=>{
    const family=vascularStudyFamily("straight_sinus");
    expect(family.ids.has("straight_sinus")).toBe(true);
    expect(family.ids.has("inferior_sagittal_sinus")).toBe(true);
    expect([...family.ids]).toEqual(expect.arrayContaining(["great_cerebral_vein","internal_cerebral_vein_l","internal_cerebral_vein_r","thalamostriate_vein_l"]));
    expect(family.rows.every(row=>row.layer === "venous")).toBe(true);
    expect(vascularStudyFamily("internal_jugular_vein_l").ids.has("sigmoid_sinus_l")).toBe(true);
  });
  it("hides nonvascular context too, preserves manual hiding, and never mutates the original set",()=>{
    const all=[...openAnatomy.structures,...reconstructedVessels];
    const manual=new Set(["middle_meningeal_artery_l"]);
    const hidden=hiddenOutsideStudyFamily("maxillary_artery_l",all,manual);
    expect(hidden.has("sphenoid_bone")).toBe(true);
    expect(hidden.has("maxillary_artery_r")).toBe(true);
    expect(hidden.has("middle_meningeal_artery_l")).toBe(true);
    expect(hidden.has("maxillary_artery_l")).toBe(false);
    expect(hidden.has("external_carotid_artery_l")).toBe(false);
    expect([...manual]).toEqual(["middle_meningeal_artery_l"]);
    for(const item of all.filter(row=>!["arterial","venous"].includes(row.layer))) expect(hidden.has(item.id)).toBe(true);
  });
});
