// Digital Wellbeing Chrome Extension - Domain Categories
// Categories designed to help users overcome urges and improve productivity

export interface DomainCategory {
  name: string;
  description: string;
  domains: string[];
  redirectTo?: string; // Optional custom redirect URL for this category
}

export const DOMAIN_CATEGORIES: DomainCategory[] = [
  {
    name: "Adult Content",
    description:
      "Adult websites that users may want to avoid for self-respect and wellbeing",
    domains: [
      "pornhub.com",
      "www.pornhub.com",
      "xvideos.com",
      "www.xvideos.com",
      "xhamster.com",
      "www.xhamster.com",
      "youporn.com",
      "www.youporn.com",
      "brazzers.com",
      "www.brazzers.com",
      "redtube.com",
      "www.redtube.com",
      "xnxx.com",
      "www.xnxx.com",
      "onlyfans.com",
      "www.onlyfans.com",
      "chaturbate.com",
      "www.chaturbate.com",
      "myfreecams.com",
      "www.myfreecams.com",
      "stripchat.com",
      "www.stripchat.com",
      "bongacams.com",
      "www.bongacams.com",
      "cam4.com",
      "www.cam4.com",
      "livejasmin.com",
      "www.livejasmin.com",
      "adultfriendfinder.com",
      "www.adultfriendfinder.com",
      "ashleymadison.com",
      "www.ashleymadison.com",
    ],
    redirectTo: "https://www.yourbrainonporn.com", // Educational resource about porn addiction
  },
  {
    name: "Social Media",
    description:
      "Major social networking platforms that can be time-consuming and affect self-esteem",
    domains: [
      "facebook.com",
      "www.facebook.com",
      "fb.com",
      "messenger.com",
      "instagram.com",
      "www.instagram.com",
      "twitter.com",
      "www.twitter.com",
      "x.com",
      "tiktok.com",
      "www.tiktok.com",
      "snapchat.com",
      "www.snapchat.com",
    ],
    redirectTo: "https://www.psychologytoday.com/us/basics/social-media", // Resource on social media psychology
  },
  {
    name: "Gambling",
    description:
      "Online gambling sites that can lead to addiction and financial harm",
    domains: [
      "pokerstars.com",
      "www.pokerstars.com",
      "888poker.com",
      "www.888poker.com",
      "bet365.com",
      "www.bet365.com",
      "draftkings.com",
      "www.draftkings.com",
      "fanduel.com",
      "www.fanduel.com",
      "bovada.lv",
      "www.bovada.lv",
      "williamhill.com",
      "www.williamhill.com",
      "betway.com",
      "www.betway.com",
      "unibet.com",
      "www.unibet.com",
    ],
    redirectTo: "https://www.ncpgambling.org/help-treatment/help-by-state/", // National Council on Problem Gambling
  },
];

// RSS/Positive alternatives category
export const RSS_DOMAINS: DomainCategory[] = [
  {
    name: "Positive Alternatives",
    description: "Educational and self-improvement websites to redirect to",
    domains: [], // These would be the positive sites you want to encourage
    redirectTo: "", // Would redirect within this category
  },
];

// Default redirect URL if no category-specific redirect is provided
export const DEFAULT_REDIRECT_URL =
  "https://www.verywellmind.com/self-respect-4158202"; // Article on self-respect

// Helper function to check if a domain is in any category
export function isDomainBlocked(domain: string): boolean {
  const normalizedDomain = domain.toLowerCase().trim();
  return DOMAIN_CATEGORIES.some((category) =>
    category.domains.some((d) => d.toLowerCase() === normalizedDomain),
  );
}

// Helper function to get redirect URL for a domain
export function getRedirectUrlForDomain(domain: string): string {
  const normalizedDomain = domain.toLowerCase().trim();
  const category = DOMAIN_CATEGORIES.find((category) =>
    category.domains.some((d) => d.toLowerCase() === normalizedDomain),
  );

  return category?.redirectTo || DEFAULT_REDIRECT_URL;
}

// Export all domains as a flat array for quick lookups
export const ALL_BLOCKED_DOMAINS: string[] = DOMAIN_CATEGORIES.flatMap(
  (category) => category.domains,
);

// Original arrays for backward compatibility
export const pornDomains: string[] =
  DOMAIN_CATEGORIES.find((c) => c.name === "Adult Content")?.domains || [];
export const rssDomains: string[] = RSS_DOMAINS.flatMap(
  (category) => category.domains,
);

export const phrases = [
  "Remember why you decided to block this page in the first place.",
  "Respect yourself, stop and reconsider.",
];
