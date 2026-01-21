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

// Vibrant colors for cards
export const CARD_COLORS = [
  { name: 'Azul', value: '#3B82F6', class: 'bg-blue-500' },
  { name: 'Verde', value: '#22C55E', class: 'bg-green-500' },
  { name: 'Roxo', value: '#8B5CF6', class: 'bg-violet-500' },
  { name: 'Rosa', value: '#EC4899', class: 'bg-pink-500' },
  { name: 'Laranja', value: '#F97316', class: 'bg-orange-500' },
  { name: 'Vermelho', value: '#EF4444', class: 'bg-red-500' },
  { name: 'Amarelo', value: '#EAB308', class: 'bg-yellow-500' },
  { name: 'Ciano', value: '#06B6D4', class: 'bg-cyan-500' },
  { name: 'Índigo', value: '#6366F1', class: 'bg-indigo-500' },
  { name: 'Esmeralda', value: '#10B981', class: 'bg-emerald-500' },
];

export const SECTOR_COLORS: Record<Sector, string> = {
  'Comercial': 'sector-comercial',
  'Financeiro': 'sector-financeiro',
  'RH': 'sector-rh',
  'Operações': 'sector-operacoes',
  'Marketing': 'sector-marketing',
};

// Card sizes
export type CardSize = 'small' | 'medium' | 'large';

export const CARD_SIZES: Record<CardSize, { width: number; height: number; label: string }> = {
  small: { width: 160, height: 64, label: 'Pequeno' },
  medium: { width: 224, height: 96, label: 'Médio' },
  large: { width: 288, height: 128, label: 'Grande' },
};
