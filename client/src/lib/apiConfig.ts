export interface AudioConfig {
    elevenLabsApiKey: string;
    available: boolean;
  }
  
  export async function getAudioConfig(): Promise<AudioConfig | null> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/audios/config`);
      
      if (!response.ok) {
        console.warn('Audio configuration not available');
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch audio config:', error);
      return null;
    }
  }