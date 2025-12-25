export interface StoryboardFrame {
  id: number;
  imageUrl: string | null;
  prompt: string;
  script: string; // Manual script/description text
  isLoading: boolean;
  settings: ShotSettings;
}

export interface ShotSettings {
  style: string;
  angle: string;
  cameraPosition: string;
  focalLength: string;
  aperture: string;
  shotSize: string;
  lighting: string;
  aspectRatio: string;
}

export interface GlobalSettings extends ShotSettings {
  referenceImageFront: string | null;
  referenceImageSide: string | null;
  referenceImageFullBody: string | null;
  referenceImageEnvironment: string | null;
  referenceImageEnvironmentMask: string | null; // NEW: Mask for Env
  referenceImageCharacter2: string | null; // NEW: Additional Character
  referenceImageCharacter3: string | null; // NEW: Additional Character
  apiEndpoint: string;
}

export interface GeneratePayload {
  prompt: string;
  style: string;
  angle: string;
  cameraPosition: string;
  focalLength: string;
  aperture: string;
  shotSize: string;
  lighting: string;
  aspectRatio: string;
  referenceImageFront?: string | null;
  referenceImageSide?: string | null;
  referenceImageFullBody?: string | null;
  referenceImageEnvironment?: string | null;
  referenceImageEnvironmentMask?: string | null; // NEW
  referenceImageCharacter2?: string | null; // NEW
  referenceImageCharacter3?: string | null; // NEW
  apiEndpoint?: string;
}

export interface EditPayload {
  prompt: string;
  image: string; // Base64 original image
  maskImage: string; // Base64 mask image
  apiEndpoint?: string;
}