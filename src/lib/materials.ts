import { Material } from '../types';

export const CONCRETE_GRADES: Record<string, { Rb: number; Rbt: number }> = {
  'B15': { Rb: 8.5, Rbt: 0.75 },
  'B20': { Rb: 11.5, Rbt: 0.90 },
  'B25': { Rb: 14.5, Rbt: 1.05 },
  'B30': { Rb: 17.0, Rbt: 1.15 },
  'B35': { Rb: 19.5, Rbt: 1.30 },
  'B40': { Rb: 22.0, Rbt: 1.40 },
  'B45': { Rb: 25.0, Rbt: 1.50 },
  'B50': { Rb: 27.5, Rbt: 1.60 },
};

export const STEEL_GRADES: Record<string, { Rs: number; Rsc: number }> = {
  'CB240-T': { Rs: 210, Rsc: 210 },
  'CB300-V': { Rs: 260, Rsc: 260 },
  'CB400-V': { Rs: 350, Rsc: 350 },
  'CB500-V': { Rs: 435, Rsc: 435 },
};

export function createMaterial(concrete: string, steel: string): Material {
  const c = CONCRETE_GRADES[concrete] || CONCRETE_GRADES['B25'];
  const s = STEEL_GRADES[steel] || STEEL_GRADES['CB400-V'];
  return {
    concreteGrade: concrete,
    steelGrade: steel,
    Rb: c.Rb,
    Rbt: c.Rbt,
    Rs: s.Rs,
    Rsc: s.Rsc,
  };
}