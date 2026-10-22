import {expect,it} from 'vitest';
import {initialTcd,dopplerFrequency,effectivePrf,wrapFrequency,gateStrength,tcdMetrics} from './model';
it('uses the Doppler equation and folds positive and negative shifts at the Nyquist boundary',()=>{
  expect(dopplerFrequency(100,0)).toBeCloseTo(2597.4025974);
  expect(dopplerFrequency(100,60)).toBeCloseTo(dopplerFrequency(100,0)/2);
  expect(wrapFrequency(2500,4000)).toBe(-1500);expect(wrapFrequency(-2500,4000)).toBe(1500);
  for(let f=-20000;f<=20000;f+=137){expect(wrapFrequency(f,4000)).toBeGreaterThanOrEqual(-2000);expect(wrapFrequency(f,4000)).toBeLessThan(2000);}
});
it('limits the pulse repetition rate by round trip propagation depth',()=>{
  expect(effectivePrf({...initialTcd,depth:130,prf:12000})).toBe(5923);
  expect(effectivePrf({...initialTcd,depth:20,prf:6000})).toBe(6000);
});
it('loses the synthetic signal outside the gate or for an incompatible window',()=>{
  expect(gateStrength(initialTcd)).toBe(1);
  expect(gateStrength({...initialTcd,depth:100})).toBeLessThan(.001);
  expect(gateStrength({...initialTcd,approach:'suboccipital'})).toBe(0);
});
it('keeps pulsatility invariant under an ideal angular projection and reports reversing flow without PI',()=>{
  const zero=tcdMetrics({...initialTcd,angle:0}),oblique=tcdMetrics({...initialTcd,angle:60});
  expect(oblique.mean).toBeCloseTo(zero.mean/2);expect(oblique.pi).toBeCloseTo(zero.pi);
  expect(tcdMetrics({...initialTcd,angle:60,angleCorrection:true}).mean).toBeCloseTo(zero.mean);
  expect(tcdMetrics({...initialTcd,pattern:'reversing'}).pi).toBeNull();
  expect(tcdMetrics({...initialTcd,pattern:'fast',prf:1000}).aliasing).toBe(true);
});
