export type BookFormat = 'cartaceo' | 'audiolibro' | 'kindle';

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  nationality: string;
  cover_url: string;
  pages: number;
  read_pages: number;
  is_reading: boolean;
  start_date: string;
  format: BookFormat;
}

export interface Challenge {
  id: string;
  goal: string;
  target_value: number;
  current_value: number;
  unit: 'minuti' | 'pagine' | 'libri';
  reward: string;
  is_completed: boolean;
}
