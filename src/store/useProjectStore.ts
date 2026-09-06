import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, StructuralElement, CheckResult } from '../types';
import { runCheck } from '../lib/calculations';
import { createMaterial } from '../lib/materials';

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  darkMode: boolean;
  language: 'vi' | 'en';

  // Actions
  createProject: (name: string, description?: string) => void;
  setCurrentProject: (id: string) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addElement: (element: StructuralElement) => void;
  updateElement: (id: string, data: Partial<StructuralElement>) => void;
  removeElement: (id: string) => void;
  recalculateAll: () => void;
  toggleDarkMode: () => void;
  setLanguage: (lang: 'vi' | 'en') => void;
}

const demoElements: StructuralElement[] = [
  {
    id: 'C1',
    name: 'Cột C1',
    type: 'column',
    sectionType: 'rectangular',
    b: 300,
    h: 500,
    height: 3.3,
    N: 1200,
    Mx: 80,
    My: 40,
    Q: 50,
    material: createMaterial('B25', 'CB400-V'),
    bucklingLength: 3.3,
  },
  {
    id: 'C2',
    name: 'Cột C2',
    type: 'column',
    sectionType: 'rectangular',
    b: 400,
    h: 400,
    height: 3.3,
    N: 1500,
    Mx: 60,
    My: 60,
    Q: 40,
    material: createMaterial('B25', 'CB400-V'),
    bucklingLength: 3.3,
  },
  {
    id: 'M1',
    name: 'Móng M1',
    type: 'foundation',
    L: 2.4,
    B: 2.0,
    H: 0.6,
    N: 1400,
    Mx: 50,
    My: 30,
    soilBearing: 200,
    material: createMaterial('B25', 'CB400-V'),
  },
  {
    id: 'D1',
    name: 'Dầm D1',
    type: 'beam',
    b: 220,
    h: 500,
    L: 6,
    M: 120,
    Q: 80,
    material: createMaterial('B25', 'CB400-V'),
  },
  {
    id: 'S1',
    name: 'Sàn S1',
    type: 'slab',
    lx: 4,
    ly: 5,
    h: 120,
    M: 15,
    material: createMaterial('B25', 'CB400-V'),
  },
];

function createDemoProject(): Project {
  const results: Record<string, CheckResult> = {};
  demoElements.forEach(el => {
    results[el.id] = runCheck(el);
  });
  return {
    id: 'DEMO-01',
    name: 'Nhà phố 5 tầng — DEMO-01',
    description: 'Dự án mẫu để minh họa',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    elements: demoElements,
    results,
  };
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [createDemoProject()],
      currentProjectId: 'DEMO-01',
      darkMode: false,
      language: 'vi',

      createProject: (name, description = '') => {
        const id = `PRJ-${Date.now()}`;
        const newProject: Project = {
          id,
          name,
          description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          elements: [],
          results: {},
        };
        set(state => ({
          projects: [...state.projects, newProject],
          currentProjectId: id,
        }));
      },

      setCurrentProject: (id) => set({ currentProjectId: id }),

      updateProject: (id, data) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deleteProject: (id) => {
        set(state => {
          const filtered = state.projects.filter(p => p.id !== id);
          return {
            projects: filtered,
            currentProjectId: filtered[0]?.id || null,
          };
        });
      },

      addElement: (element) => {
        const { currentProjectId, projects } = get();
        if (!currentProjectId) return;
        const result = runCheck(element);
        set({
          projects: projects.map(p =>
            p.id === currentProjectId
              ? {
                  ...p,
                  elements: [...p.elements, element],
                  results: { ...p.results, [element.id]: result },
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        });
      },

      updateElement: (id, data) => {
        const { currentProjectId, projects } = get();
        if (!currentProjectId) return;
        set({
          projects: projects.map(p => {
            if (p.id !== currentProjectId) return p;
            const elements = p.elements.map(el =>
              el.id === id ? { ...el, ...data } as StructuralElement : el
            );
            const updated = elements.find(e => e.id === id)!;
            const results = { ...p.results, [id]: runCheck(updated) };
            return { ...p, elements, results, updatedAt: new Date().toISOString() };
          }),
        });
      },

      removeElement: (id) => {
        const { currentProjectId, projects } = get();
        if (!currentProjectId) return;
        set({
          projects: projects.map(p => {
            if (p.id !== currentProjectId) return p;
            const { [id]: _, ...restResults } = p.results;
            return {
              ...p,
              elements: p.elements.filter(e => e.id !== id),
              results: restResults,
              updatedAt: new Date().toISOString(),
            };
          }),
        });
      },

      recalculateAll: () => {
        const { currentProjectId, projects } = get();
        if (!currentProjectId) return;
        set({
          projects: projects.map(p => {
            if (p.id !== currentProjectId) return p;
            const results: Record<string, CheckResult> = {};
            p.elements.forEach(el => {
              results[el.id] = runCheck(el);
            });
            return { ...p, results, updatedAt: new Date().toISOString() };
          }),
        });
      },

      toggleDarkMode: () => {
        set(state => {
          const next = !state.darkMode;
          if (next) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
          return { darkMode: next };
        });
      },

      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'ketcau-pro-storage',
    }
  )
);