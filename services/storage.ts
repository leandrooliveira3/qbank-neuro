
import { supabase } from './supabase';

export type StorageFolder = 'questions' | 'flashcards' | 'tools' | 'comments' | 'library';

export const storageService = {
  /**
   * Realiza o upload de um arquivo para o Supabase Storage.
   * Retorna a URL pública do objeto.
   */
  async uploadImage(file: File | Blob, folder: StorageFolder, customName?: string): Promise<string> {
    try {
      const fileExt = (file instanceof File) ? (file.name.split('.').pop() || 'jpg') : 'jpg';
      let namePrefix: string = crypto.randomUUID();
      
      if (customName) {
        // Sanitize to safe URL characters: a-z, 0-9, dash, underscore
        const sanitized = customName
          .toLowerCase()
          .normalize('NFD') // remove accents
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9_-]+/g, '-')
          .replace(/^-+|-+$/g, '') // remove trailing/leading dashes
          .substring(0, 100); // limit length
          
        if (sanitized) {
          // Append short unique suffix to avoid collisions but keep name highly recognizable and searchable
          const shortId = Math.random().toString(36).substring(2, 7);
          namePrefix = `${sanitized}-${shortId}`;
        }
      }
      
      const fileName = `${namePrefix}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('imagens')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Falha no upload para storage: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('imagens')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('StorageService Error:', error);
      throw error;
    }
  },

  /**
   * Upload de arquivo genérico (PDF, DOCX, JPG) com caminho completo específico.
   * Essencial para estrutura de pastas organizada.
   */
  async uploadFile(file: File | Blob, fullPath: string): Promise<string> {
    try {
        const { error } = await supabase.storage
            .from('imagens')
            .upload(fullPath, file, {
                cacheControl: '3600',
                upsert: true
            });
        
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('imagens')
            .getPublicUrl(fullPath);
            
        return publicUrl;
    } catch (error) {
        console.error('Upload File Error:', error);
        throw error;
    }
  },

  /**
   * Remove uma imagem do storage baseado na sua URL pública.
   */
  async deleteImage(url: string): Promise<void> {
    if (!url || !url.includes('/storage/v1/object/public/imagens/')) return;
    try {
      // Extrai o caminho relativo (folder/filename.ext) da URL
      const path = url.split('/imagens/')[1];
      if (!path) return;

      const { error } = await supabase.storage
        .from('imagens')
        .remove([path]);

      if (error) {
        console.warn("StorageService: Falha ao remover imagem remota:", error.message);
      }
    } catch (e) {
      console.error("StorageService Delete Error:", e);
    }
  },

  /**
   * Faz upload de uma string base64 diretamente.
   * Se 'customPath' for fornecido, usa esse caminho completo.
   */
  async uploadBase64(base64: string, folder: StorageFolder, customPath?: string, customName?: string): Promise<string> {
    const res = await fetch(`data:image/jpeg;base64,${base64}`);
    const blob = await res.blob();
    
    if (customPath) {
        return this.uploadFile(blob, customPath);
    }
    return this.uploadImage(blob, folder, customName);
  },

  /**
   * Lista imagens salvas em uma determinada pasta do bucket 'imagens'.
   * Retorna uma lista de URLs públicas.
   */
  async listImages(folder: StorageFolder): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from('imagens')
        .list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
      
      if (error) {
        console.error('Error listing images:', error);
        return [];
      }
      
      if (!data) return [];
      
      const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
      return data
        .filter(f => {
          const ext = f.name.split('.').pop()?.toLowerCase();
          return ext && imageExtensions.includes(ext);
        })
        .map(f => {
          const { data: { publicUrl } } = supabase.storage
            .from('imagens')
            .getPublicUrl(`${folder}/${f.name}`);
          return publicUrl;
        });
    } catch (e) {
      console.error('catch error in listImages:', e);
      return [];
    }
  },

  /**
   * Helper para converter URLs externas ou Base64 em File para re-upload se necessário
   */
  async urlToFile(url: string, filename: string, mimeType: string): Promise<File> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new File([buffer], filename, { type: mimeType });
  },

  // --- NOVOS MÉTODOS PARA BIBLIOTECA CLOUD ---

  async uploadJSON(data: any, path: string): Promise<string> {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const { error } = await supabase.storage
      .from('imagens')
      .upload(`library/${path}`, blob, { upsert: true });
    
    if (error) throw error;
    return path;
  },

  async downloadJSON(path: string): Promise<any> {
    const { data, error } = await supabase.storage
      .from('imagens')
      .download(`library/${path}`);
    
    if (error) throw error;
    const text = await data.text();
    return JSON.parse(text);
  },

  async listLibraryFiles(): Promise<{name: string, created_at: string, id: string}[]> {
    const { data, error } = await supabase.storage
      .from('imagens')
      .list('library', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    
    if (error) throw error;
    return data
      .filter(f => f.name.endsWith('.json'))
      .map(f => ({ name: f.name, created_at: f.created_at, id: f.id }));
  },

  async deleteLibraryFile(filename: string): Promise<void> {
      // 1. Deleta o JSON de metadados
      await supabase.storage.from('imagens').remove([`library/${filename}`]);
      
      // 2. Tenta deletar a pasta associada e seu conteúdo
      // O Supabase Storage não deleta pastas não vazias recursivamente via API simples JS facilmente,
      // então listamos os arquivos dentro primeiro.
      const folderName = filename.replace('.json', '');
      const folderPath = `library/${folderName}`;
      
      // Listar arquivos na raiz da pasta do documento
      const { data: rootFiles } = await supabase.storage.from('imagens').list(folderPath);
      
      if (rootFiles && rootFiles.length > 0) {
          const pathsToDelete = rootFiles.map(f => `${folderPath}/${f.name}`);
          await supabase.storage.from('imagens').remove(pathsToDelete);
      }

      // Tentar limpar subpasta images (se existir)
      const imagesPath = `${folderPath}/images`;
      const { data: imageFiles } = await supabase.storage.from('imagens').list(imagesPath);
      
      if (imageFiles && imageFiles.length > 0) {
          const imgPaths = imageFiles.map(f => `${imagesPath}/${f.name}`);
          await supabase.storage.from('imagens').remove(imgPaths);
      }
  }
};
