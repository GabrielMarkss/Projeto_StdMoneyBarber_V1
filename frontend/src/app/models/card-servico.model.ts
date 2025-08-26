export interface Card {
  imagemBase64: string;
  id?: number;
  descricao: string;
  imagemPath: string | null; // URL da imagem
}
