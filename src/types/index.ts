export type ElementType = 'column' | 'foundation' | 'beam' | 'slab' | 'wind';

export interface Material {
  concreteGrade: string; // B20, B25, B30...
  steelGrade: string;    // CB300-V, CB400-V...
  Rb: number;            // MPa
  Rbt: number;
  Rs: number;
  Rsc: number;
}

export interface ColumnInput {
  id: string;
  name: string;
  type: 'column';
  sectionType: 'rectangular' | 'circular' | 'T';
  b: number; // mm
  h: number; // mm
  d?: number; // diameter for circular
  height: number; // m
  N: number; // kN
  Mx: number; // kNm
  My: number; // kNm
  Q: number; // kN shear
  material: Material;
  bucklingLength: number; // m
  eccentricity?: number;
}

export interface FoundationInput {
  id: string;
  name: string;
  type: 'foundation';
  L: number; // m bottom length
  B: number; // m bottom width
  H: number; // m height
  N: number; // kN
  Mx: number;
  My: number;
  soilBearing: number; // kPa (R)
  soilModulus?: number;
  material: Material;
}

export interface BeamInput {
  id: string;
  name: string;
  type: 'beam';
  b: number; // mm
  h: number; // mm
  L: number; // m span
  M: number; // kNm
  Q: number; // kN
  material: Material;
}

export interface SlabInput {
  id: string;
  name: string;
  type: 'slab';
  lx: number; // m
  ly: number; // m
  h: number; // mm
  M: number; // kNm/m
  material: Material;
}

export type StructuralElement = ColumnInput | FoundationInput | BeamInput | SlabInput;

export interface CheckResult {
  utilization: number;
  status: 'pass' | 'fail' | 'warning';
  details: string[];
  formulaRefs: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  elements: StructuralElement[];
  results: Record<string, CheckResult>;
}