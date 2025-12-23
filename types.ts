export interface StoryboardFrame {
  id: number;
  imageUrl: string | null;
  prompt: string;
  isLoading: boolean;
  settings: ShotSettings;
}

export interface ShotSettings {
  style: string;
  angle: string;
  cameraPosition: string;
  focalLength: string;
  aperture: string; // NEW
  shotSize: string;
  lighting: string;
  aspectRatio: string;
}

export interface GlobalSettings extends ShotSettings {
  referenceImageFront: string | null; // Base64 string
  referenceImageSide: string | null;  // Base64 string
  referenceImageFullBody: string | null; // Base64 string
  referenceImageEnvironment: string | null; // Base64 string
}

export interface GeneratePayload {
  prompt: string;
  style: string;
  angle: string;
  cameraPosition: string;
  focalLength: string;
  aperture: string; // NEW
  shotSize: string;
  lighting: string;
  aspectRatio: string;
  referenceImageFront?: string | null;
  referenceImageSide?: string | null;
  referenceImageFullBody?: string | null;
  referenceImageEnvironment?: string | null;
}