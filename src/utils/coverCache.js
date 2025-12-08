const CACHE_NAME = 'track-covers-cache-v1';

export const cacheTrackCover = async (url) => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(url);
    await cache.put(url, response.clone());
    return url;
  } catch (error) {
    console.error('Cover resmi önbelleğe alınamadı:', error);
    return url;
  }
};

export const getTrackCover = async (url) => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);
    
    if (cachedResponse) {
      return url;
    }

    return await cacheTrackCover(url);
  } catch (error) {
    console.error('Cover resmi önbellekten alınamadı:', error);
    return url;
  }
};

// Önbellek boyutunu yönetmek için
export const cleanupOldCovers = async () => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    // Son 100 cover'ı tut, gerisini sil
    if (keys.length > 100) {
      const keysToDelete = keys.slice(0, keys.length - 100);
      await Promise.all(keysToDelete.map(key => cache.delete(key)));
    }
  } catch (error) {
    console.error('Önbellek temizleme hatası:', error);
  }
};