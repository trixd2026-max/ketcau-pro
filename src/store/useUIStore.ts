import { create } from 'zustand';

interface UIState {
  /** ID cấu kiện đang được yêu cầu edit từ Dashboard modal */
  pendingEditId: string | null;
  setPendingEditId: (id: string | null) => void;
  lengthUnit: 'mm' | 'cm' | 'm';
  setLengthUnit: (u: 'mm' | 'cm' | 'm') => void;
}

export const useUIStore = create<UIState>((set) => ({
  pendingEditId: null,
  setPendingEditId: (id) => set({ pendingEditId: id }),
  lengthUnit: 'mm',
  setLengthUnit: (u) => set({ lengthUnit: u }),
}));
