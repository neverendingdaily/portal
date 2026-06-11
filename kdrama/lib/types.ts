export type PersonaTraits = {
  vanity: number;
  jealousy: number;
  approval: number;
  loneliness: number;
  ambition: number;
  anxiety: number;
  loveSeeking: number;
  dominantType: string;
  description: string;
};

export type Episode = {
  number: number;
  title: string;
  synopsis: string;
  keyScene: string;
  emotionalHook: string;
  cliffhanger: string;
};

export type SalesCopy = {
  headline: string;
  subheadline: string;
  painPoints: string[];
  promises: string[];
  cta: string;
  socialProof: string;
  emailSubjectLines: string[];
};

export type CreativeOutput = {
  veo: {
    openingScenePrompt: string;
    episodeHighlightPrompts: string[];
    moodBoard: string;
  };
  filmora: {
    timelineStructure: string;
    transitionStyle: string;
    colorGrading: string;
    bgmMood: string;
    textOverlayGuide: string;
  };
  canva: {
    thumbnailBrief: string;
    colorPalette: string[];
    fontPairing: string;
    snsPostTemplates: string[];
    coverDesignConcept: string;
  };
};

export type Session = {
  id: string;
  createdAt: string;
  snsPostsText: string;
  productName: string;
  persona?: PersonaTraits;
  episodes?: Episode[];
  copy?: SalesCopy;
  creative?: CreativeOutput;
  assets?: CreativeAssets;
};

// ---- 構造化クリエイティブアセット型 ----

export type VeoScene = {
  sceneId: string;
  label: string;
  episodeRef?: number;
  prompt: string;
  durationHint: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  cameraMotion: string;
  moodKeywords: string[];
};

export type VeoOutput = {
  tool: "veo";
  sessionId: string;
  generatedAt: string;
  persona: Pick<PersonaTraits, "dominantType" | "description">;
  globalStyle: {
    cinematicStyle: string;
    colorGrading: string;
    referenceFilms: string[];
  };
  scenes: VeoScene[];
};

export type NaNoBananaScene = {
  sceneId: string;
  label: string;
  episodeRef?: number;
  prompt: string;
  durationHint: string;
  style: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  fps: 24 | 30;
};

export type NaNoBananaOutput = {
  tool: "nanobanana";
  sessionId: string;
  generatedAt: string;
  persona: Pick<PersonaTraits, "dominantType" | "description">;
  globalStyle: { style: string; colorPalette: string[] };
  scenes: NaNoBananaScene[];
};

export type BgmTrack = {
  trackId: string;
  label: string;
  genre: string;
  mood: string;
  bpm: number;
  startTimeSec: number;
  endTimeSec: number;
  fadeInSec: number;
  fadeOutSec: number;
};

export type FilmoraCut = {
  cutId: string;
  episodeRef: number;
  startTimeSec: number;
  endTimeSec: number;
  sceneDescription: string;
  transition: "fade" | "cut" | "dissolve" | "zoom";
  textOverlay?: {
    text: string;
    style: "title" | "subtitle" | "caption";
    positionX: "left" | "center" | "right";
    positionY: "top" | "middle" | "bottom";
    durationSec: number;
    fontColor: string;
  };
  bgmTrackRef: string;
  videoSourceHint: string;
};

export type FilmoraOutput = {
  tool: "filmora";
  sessionId: string;
  generatedAt: string;
  projectSettings: {
    resolution: "1920x1080" | "1080x1920";
    fps: 30;
    totalDurationSec: number;
  };
  bgmTracks: BgmTrack[];
  cuts: FilmoraCut[];
};

export type ThumbnailLayer = {
  layerId: string;
  type: "text" | "shape" | "image_placeholder" | "gradient_overlay";
  content?: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    bold?: boolean;
    opacity?: number;
  };
  position: { x: string; y: string; width?: string; height?: string };
};

export type Thumbnail = {
  thumbnailId: string;
  label: string;
  format: string;
  usage: string;
  layout: {
    backgroundType: "gradient" | "solid" | "image";
    backgroundColors: string[];
    mainImagePlacement: "left" | "right" | "center" | "full";
    textAlignment: "left" | "center" | "right";
  };
  layers: ThumbnailLayer[];
};

export type CanvaOutput = {
  tool: "canva";
  sessionId: string;
  generatedAt: string;
  brandKit: {
    colorPalette: string[];
    fontPrimary: string;
    fontSecondary: string;
  };
  thumbnails: Thumbnail[];
};

export type CreativeAssets = {
  veo?: VeoOutput;
  nanobanana?: NaNoBananaOutput;
  filmora?: FilmoraOutput;
  canva?: CanvaOutput;
};
