import {describe,it,expect} from "vitest";
import {createStation,stationReducer} from "./simulation/station/engine";

describe("roadmap capture of the last displayed exposure",()=>{
  it("retains the frozen contrast time and projection after live contrast has washed out",()=>{
    const frame={...createStation("diagnostic","reference"),mode:"dsa" as const,clock:2.3,contrast:{edge:"ref-ICA-L",at:0}};
    const current={...frame,clock:12,view:{...frame.view,yaw:40},acquiring:0,pedal:false};
    const captured=stationReducer(current,{type:"mask",frame});
    expect(captured.mask?.contrastAge).toBe(2.3);
    expect(captured.mask?.view.yaw).toBe(frame.view.yaw);
    expect(captured.mask?.edges).toContain("ref-ICA-L");
    expect(captured.exposure).toBe(current.exposure);
    const reinjected=stationReducer(captured,{type:"tick",dt:.5});
    expect(reinjected.mask).toBe(captured.mask);
    const otherCase=stationReducer(current,{type:"mask",frame:{...frame,referenceEntry:"femoral"}});
    expect(otherCase.mask).toBeNull();
  });
});
