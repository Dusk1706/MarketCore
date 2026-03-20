export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  products?: T[]; // El backend a veces usa la llave del recurso (ej: 'products')
  items?: T[];    // O una llave genérica 'items'
  meta: PaginationMeta;
}
