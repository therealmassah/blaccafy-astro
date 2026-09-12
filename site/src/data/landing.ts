export const navLinks = [
  { label: 'Spykher', href: '/spykher' },
  { label: 'Free', href: '/#free' },
  { label: 'Vault', href: '/#vault' },
  { label: 'VIP', href: '/#vip' },
  { label: 'Studio', href: '/#studio' },
  { label: 'Collector', href: '/collector' },
  { label: 'Entrer', href: '/#cta', variant: true }
];

export const leadWebhookUrl = 'https://automate.blaccflagg.com/webhook/blaccafy/mvp/lead';
export const navidromeWrapperUrl = (import.meta.env.PUBLIC_NAVIDROME_WRAPPER_URL ?? 'https://navidrome-wrapper.blaccflagg.com').replace(/\/$/, '');
export const navidromeActivationUrl = `${navidromeWrapperUrl}/activate`;
export const publicActivationPageUrl = (import.meta.env.PUBLIC_ACTIVATION_PAGE_URL ?? 'https://blaccafy.spykher.com/activate').replace(/\/$/, '');
export const spykherPageHref = '/spykher';
export const vaultCheckoutUrl = 'https://buy.stripe.com/dRm4gz7M0a8qdgT6rA73G02';
export const vipCheckoutUrl = import.meta.env.PUBLIC_VIP_STRIPE_CHECKOUT_URL ?? 'https://buy.stripe.com/5kQ5kD2rG2FY4KndU273G05';
export const studioCheckoutUrl = import.meta.env.PUBLIC_STUDIO_STRIPE_CHECKOUT_URL ?? 'https://buy.stripe.com/dRm28r4zO94mccP2bk73G04';
export const studioStripeCheckoutUrl = studioCheckoutUrl;
export const studioCaptureHref = '/studio/capture';
export const vipPageHref = '/vip';
export const studioPageHref = '/studio';
export const collectorPageHref = '/collector';
export const collectorCheckoutUrl = 'https://buy.stripe.com/8x2dR9giwdkCb8L8zI73G06';

export const featurePills = [
  'Sons exclusifs',
  'Accès privé',
  'Soutien direct',
  'Cercle privé'
];

export const freeTitle = 'Blaccafy Free';

export const freeLeadCopy = `La porte d’entrée gratuite vers Blaccafy.
Découvre l'univers, les previews et le chemin vers le Vault.`;

export const freeCopy = 'Blaccafy Free est la porte d’entrée gratuite pour découvrir mon univers, les previews du coffre et le chemin vers le Vault.';

export const freeBullets = [
  "Accès d'entrée",
  'Classiques et previews',
  'Preview du coffre',
  'Passage vers le Vault'
];

export const dropSessionTitle = 'Premier drop privé';

export const dropSessionCopy = 'Le premier moment privé pour découvrir l’univers Blaccafy, écouter des extraits en avance et entrer dans le cercle avant le public.';

export const dropSessionBullets = [
  'Preview exclusive',
  'Écoute privée',
  'Premiers membres',
  'Accès au prochain drop'
];

export const collectorTitle = 'Blaccafy Collector';

export const collectorCopy = 'Blaccafy Collector donne accès aux drops rares, éditions spéciales et expériences privées liées à l’univers Blaccafy.';

export const collectorLeadCopy = `Le bundle Shatta Kids réunit l'EP Shatta Kids interprété par ma fille et moi, et le cahier d'activité pour enfant Blacc Diamond Kids.
Pensé pour les parents fans qui veulent un objet collector utile, musical et familial.`;

export const collectorHeroPills = [
  'EP Shatta Kids',
  'Cahier d’activité enfant',
  'Objet collector physique',
  'Session visio privée'
];

export const collectorIncludes = [
  'EP Shatta Kids interprété par ma fille et moi',
  'Cahier d’activité Blacc Diamond Kids',
  'Objet collector physique à garder',
  'Expérience privée avec accès direct en session live visio'
];

export const collectorParentBenefits = [
  'Occuper l’enfant de façon ludique',
  'Partager un moment simple et utile en famille',
  'Transmettre tôt ce que l’on a appris tard',
  'Soutenir un projet indépendant avec du sens'
];

export const collectorFaq = [
  {
    q: 'À qui s’adresse le pack ?',
    a: 'Aux fans qui sont aussi parents, ou à toute personne qui veut offrir un objet collector utile, musical et pensé pour l’enfant.'
  },
  {
    q: 'Que contient le bundle ?',
    a: 'L’EP Shatta Kids interprété par ma fille et moi, le cahier d’activité Blacc Diamond Kids, et l’accès à une expérience privée.'
  },
  {
    q: 'Pourquoi le cahier d’activité ?',
    a: 'Pour aider les parents à divertir leur enfant de façon ludique et transmettre plus tôt des repères qu’on apprend souvent trop tard.'
  }
];

export const collectorBullets = [
  'Drops rares',
  'Quantité limitée',
  'Éditions spéciales'
];

export const vipTitle = 'Blaccafy VIP';

export const vipSubtitle = `Le cercle privé de mes vrais fans et supporters. Tu accèdes aux avant-premières, aux contenus réservés et à une proximité sans bruit inutile.`;

export const vipCopy = `Blaccafy VIP est le cercle privé des vrais fans. Tu accèdes aux avant-premières, aux contenus réservés et à une proximité plus directe avec l'univers Blaccafy.`;

export const vipBullets = [
  'Avant-premières',
  'Contenus réservés',
  'Cercle privé'
];

export const studioTitle = 'Blaccafy Studio';

export const studioCopy = `Blaccafy Studio est le cercle privé des artistes. Tu reçois des riddims mensuels, toplines, refrains et un cadre simple pour sortir plus de musique.`;

export const studioBullets = [
  'Riddims & Stems',
  'Toplines & Refrains',
  'Cadre artistes'
];

export const studioHeroPills = [
  'Pack du mois',
  'Bibliothèque privée',
  'Routine répétable'
];

export const studioPainPoints = [
  'Tu n’arrives pas à sortir assez de sons.',
  'Tu avances sans vraie structure.',
  'Tu es souvent seul dans ton process.',
  'Tu tournes en rond au lieu de bâtir.'
];

export const studioMonthlySystem = [
  'Productions Inédites et Toplines',
  'Routine de travail simple à appliquer',
  "Espace privé d'écoute et récupération de contenu",
  'Espace privé pour collaborer entre artistes'
];

export const studioIncluded = [
  'Ressources exclusives du mois',
  'Sons et outils de travail',
  'Templates pour créer plus vite',
  'Cadre de progression',
  'Soutien et accompagnement',
  'Positionnement et monétisation'
];

export const studioProofQuotes = [
  {
    quote: 'C’est l’un des premiers espaces où je me suis senti compris en tant qu’artiste.',
    author: 'Fabrice N.'
  },
  {
    quote: 'Même avec le taf et la famille, j’ai réussi à me remettre à sortir des sons.',
    author: 'Rony C.'
  }
];

export const studioFaq = [
  {
    q: 'Qu’est-ce que je reçois chaque mois ?',
    a: 'Des ressources inédites, un cadre de travail clair, des contenus téléchargeables et un espace privé pour avancer sans te disperser.'
  },
  {
    q: 'Est-ce que je dois être déjà prêt ?',
    a: 'Non. Le système est pensé pour t’aider à progresser même si tu démarres avec peu de structure.'
  },
  {
    q: 'Est-ce compatible avec une vie chargée ?',
    a: 'Oui. La structure est pensée pour que tu avances sans dépendre de l’inspiration du moment.'
  },
  {
    q: 'Est-ce que je peux écouter et récupérer les contenus à mon rythme ?',
    a: 'Oui. Tu peux consulter et télécharger les ressources à ton rythme depuis ton espace privé.'
  }
];
