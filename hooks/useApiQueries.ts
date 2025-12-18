// hooks/useApiQueries.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================
// QUERY KEYS - Centralizadas para fácil invalidación
// ============================================

export const queryKeys = {
  options: (filters: Record<string, string>) => ['options', filters] as const,
  search: (filters: Record<string, string>) => ['search', filters] as const,
  calculate: (filters: Record<string, string>, parts: any[]) => ['calculate', filters, parts] as const,
  debug: ['debug'] as const,
};

// ============================================
// INTERFACES
// ============================================

interface FilterOptions {
  TIPO: string[];
  FABRICANTE: string[];
  CABEZA: string[];
  CUERPO: string[];
  PARTE_DIVISION: string[];
  TRAMO: string[];
}

interface Piece {
  id_item: string;
  texto_breve: string;
  tipo: string;
  fabricante: string;
  cabeza: string;
  parte_division: string;
  cuerpo: string;
  tramo: string;
  posicion: string;
  descripcion: string;
  long_2_principal: string;
  cantidad_x_torre: number;
  peso_unitario: number;
  plano: string;
  mod_plano: string;
}

interface CalculatedPiece {
  id_item: string;
  texto_breve: string;
  descripcion: string;
  parte_division: string;
  posicion: string;
  cantidad_original: number;
  cantidad_calculada: number;
  peso_unitario: number;
  peso_total: number;
  long_2_principal: string;
  plano: string;
  mod_plano: string;
}

// ============================================
// HOOK: useOptions - Obtener opciones de filtros
// ============================================

export function useOptions(filters: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.options(filters),
    queryFn: async (): Promise<FilterOptions> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key.toUpperCase(), value);
      });

      const response = await fetch(`/api/options?${params}`);
      if (!response.ok) {
        throw new Error('Error al cargar opciones');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error al cargar opciones');
      }

      return data.options;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - opciones cambian raramente
    gcTime: 30 * 60 * 1000, // 30 minutos en caché
  });
}

// ============================================
// HOOK: useSearchPieces - Buscar piezas
// ============================================

export function useSearchPieces(filters: Record<string, string>, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.search(filters),
    queryFn: async (): Promise<Piece[]> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error en la búsqueda');
      }

      return data.results;
    },
    enabled, // Solo ejecutar cuando enabled es true
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ============================================
// HOOK: useCalculateMaterials - Calcular materiales (Mutation)
// ============================================

interface CalculateParams {
  filters: Record<string, string>;
  parts: Array<{ part: string; quantity: number }>;
}

interface CalculateResult {
  results: CalculatedPiece[];
  totals: {
    total_pieces: number;
    total_weight: number;
  };
}

export function useCalculateMaterials() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CalculateParams): Promise<CalculateResult> => {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Error al calcular materiales');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error al calcular materiales');
      }

      return {
        results: data.results,
        totals: data.totals,
      };
    },
    // Opcional: invalidar queries relacionadas después del cálculo
    onSuccess: () => {
      // Puedes invalidar caché aquí si es necesario
      // queryClient.invalidateQueries({ queryKey: ['calculate'] });
    },
  });
}

// ============================================
// HOOK: useUploadExcel - Subir archivo Excel (Mutation)
// ============================================

export function useUploadExcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir archivo');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error al subir archivo');
      }

      return data;
    },
    onSuccess: () => {
      // 🔥 INVALIDAR TODO EL CACHÉ cuando se sube nuevo Excel
      queryClient.invalidateQueries({ queryKey: ['options'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['calculate'] });
      queryClient.invalidateQueries({ queryKey: ['debug'] });
      
      console.log('✅ Caché invalidado después de subir Excel');
    },
  });
}

// ============================================
// HOOK: useDebugData - Ver datos de debug
// ============================================

export function useDebugData() {
  return useQuery({
    queryKey: queryKeys.debug,
    queryFn: async () => {
      const response = await fetch('/api/debug');
      if (!response.ok) {
        throw new Error('Error al obtener datos de debug');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al obtener datos de debug');
      }

      return data;
    },
    staleTime: 30 * 1000, // 30 segundos - debug es para desarrollo
    enabled: process.env.NODE_ENV === 'development',
  });
}
