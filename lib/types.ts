export type ExtensionOtherCreator = {
  name: string;
  handle: string;
  htmlPath: string;
  trust: string;
};

export type ExtensionEndorsement = {
  productName: string;
  productSlug: string;
  productHtmlPath: string;
  usefulness: string;
  relationship: string | null;
  disclosure: "有標示合作" | "未標示合作" | null;
  occurredOn: string;
  evidenceUrl: string | null;
  matchedVideo: boolean;
  otherCreators: ExtensionOtherCreator[];
};

export type ExtensionScore = {
  label: "可信度";
  value: string;
  origin: "示意" | "社群" | null;
  votes: string | null;
};

export type ExtensionCreator = {
  name: string;
  handle: string;
  slug: string;
  htmlPath: string;
  score: ExtensionScore;
  disclosureRate: string;
  endorsementCount: number;
  endorsements: ExtensionEndorsement[];
};

export type ExtensionYoutubeResponse = {
  creator: ExtensionCreator | null;
};

export type YtSurface = "watch" | "shorts" | "channel" | "other";

export type PageContext = {
  surface: YtSurface;
  handle: string | null;
  videoId: string | null;
  title: string | null;
  url: string;
};

export type LookupResult =
  | { loggedIn: false; configured: boolean }
  | { loggedIn: true; creator: ExtensionCreator | null; error?: string };
