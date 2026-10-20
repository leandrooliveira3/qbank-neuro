import {describe,it,expect} from "vitest";
import {educationalVessels,educationalVesselIds} from "./educationalVessels";
import {reconstructedVessels} from "./reconstructedVessels";
import {openAnatomy} from "./openAnatomy";
import baseline from "./educational-coverage-baseline.json";
import catalogue from "./educational-vascular-paths.json";
import {vascularCompleteness} from "./vascularCompleteness";
import {anatomicalInventory} from "./anatomicalInventory";
import {createStation,networkFor,opacifiedEdges} from "./simulation/station/engine";
import {referenceContrast} from "./simulation/station/referenceScene";
import type {ReferenceGeometry} from "./simulation/station/referenceGeometry";

describe("explicit illustrative coverage, never a surrogate for measured anatomy",()=>{
  it("represents every preceding missing individual ID with its own layer and keeps the reference gap",()=>{
    const expected=baseline.requirements.flatMap(row=>row.missingIds);
    expect(new Set(expected).size).toBe(223);
    const byId=new Map(educationalVessels.map(row=>[row.id,row]));
    for(const requirement of baseline.requirements) for(const id of requirement.missingIds) {
      const mesh=byId.get(id)!;
      expect(mesh,id).toBeDefined();expect(mesh.layer).toBe(requirement.layer);
      const row=vascularCompleteness.find(row=>row.id === requirement.id)!;
      expect(row.illustratedIds).toContain(id);expect(row.referenceMissingIds).toContain(id);
      expect(row.anatomicalApproval).toBe(false);
    }
  });
  it("retains all original identities and resolves study parents without replacing imported surfaces",()=>{
    expect(educationalVessels).toHaveLength(301);
    expect(educationalVesselIds.size).toBe(301);
    const ids=new Set([...openAnatomy.structures,...reconstructedVessels].map(row=>row.id));
    expect(ids.size).toBe(openAnatomy.structures.length+reconstructedVessels.length);
    for(const mesh of educationalVessels) {
      expect(openAnatomy.structures.some(row=>row.id === mesh.id)).toBe(false);
      expect(ids.has(mesh.parentId),mesh.parentId).toBe(true);
      expect(mesh.proceduralEligible).toBe(false);
      expect(mesh.coordinateBasis).toBe("original-hand-authored-controls");
      expect(mesh.note).toContain("NÃO segmentado");
    }
  });
  it("keeps every surface finite, closed and nondegenerate with enclosing bounds on both sides",()=>{
    for(const row of educationalVessels) {
      const {positions:p,indices}=row.surface;
      expect(p.every(Number.isFinite),row.id).toBe(true);
      const bounds=row.bounds.map(point=>point.map((v,k)=>v*100-(k === 1 ? 160 : 0)));
      const edges=new Map<string,number>();
      let volume=0;
      for(let i=0;i<indices.length;i+=3) {
        const a=indices[i],b=indices[i+1],c=indices[i+2];
        for(const [v,w] of [[a,b],[b,c],[c,a]]) {if(v<0 || v>=p.length/3) throw new Error(`Invalid index: ${row.id}`);const key=[Math.min(v,w),Math.max(v,w)].join(':');edges.set(key,(edges.get(key)??0)+1);}
        const A=p.slice(a*3,a*3+3),B=p.slice(b*3,b*3+3),C=p.slice(c*3,c*3+3);
        volume+=(A[0]*(B[1]*C[2]-B[2]*C[1])+A[1]*(B[2]*C[0]-B[0]*C[2])+A[2]*(B[0]*C[1]-B[1]*C[0]))/6;
      }
      expect([...edges.values()].every(count=>count === 2),row.id).toBe(true);
      expect(volume,row.id).toBeGreaterThan(0);
      expect(p.every((v,i)=>v+1e-9>=bounds[0][i%3] && v-1e-9<=bounds[1][i%3]),row.id).toBe(true);
    }
  });
  it("keeps unknown figure labels unresolved and segment 6/7 grouped rather than duplicating ophthalmic tubes",()=>{
    expect(anatomicalInventory.filter(row=>row.status === "unresolved")).toHaveLength(7);
    for(const row of anatomicalInventory.filter(row=>row.status === "unresolved")) expect(row.ids).toEqual([]);
    for(const number of ["6","7"]) {
      const row=anatomicalInventory.find(row=>row.number === number)!;
      expect(row.status).toBe("partial");expect(row.geometryKinds).toEqual(["imported"]);
    }
    expect(catalogue.templates.filter(row=>row.variant).map(row=>row.id)).toEqual(expect.arrayContaining(["persistent_trigeminal_artery","persistent_ventral_ophthalmic_artery","falcine_sinus"]));
  });
  it("does not inject any new illustration or add its identity to the procedural network",()=>{
    const state={...createStation("diagnostic","reference"),contrast:{edge:"ref-ICA-L",at:0}};
    const geometry:ReferenceGeometry=new Map(educationalVessels.map(row=>[row.id,{id:row.id,layer:row.layer,positions:new Float32Array(row.surface.positions),indices:new Uint32Array(row.surface.indices)}]));
    const network=networkFor(state);
    for(const row of educationalVessels) expect(Object.values(network).some(vessel=>vessel.anatomicalId === row.id)).toBe(false);
    expect(referenceContrast(state,geometry,opacifiedEdges(state,network))).toEqual([]);
    expect(referenceContrast(state,geometry,Object.keys(network))).toEqual([]);
  });
});
