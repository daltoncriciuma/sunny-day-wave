export interface Person {
  id: string;
  name: string;
  role: string;
  sector: string;
  avatar_url: string | null;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  from_person_id: string;
  to_person_id: string;
  created_at: string;
}

export type Sector = 'Comercial' | 'Financeiro' | 'RH' | 'Operações' | 'Marketing';

export const SECTORS: Sector[] = ['Comercial', 'Financeiro', 'RH', 'Operações', 'Marketing'];

export const SECTOR_COLORS: Record<Sector, string> = {
  'Comercial': 'sector-comercial',
  'Financeiro': 'sector-financeiro',
  'RH': 'sector-rh',
  'Operações': 'sector-operacoes',
  'Marketing': 'sector-marketing',
};
