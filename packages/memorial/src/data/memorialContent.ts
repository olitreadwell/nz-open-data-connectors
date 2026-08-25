/**
 * Curated content for the Dolly Parton Wellington memorial.
 *
 * Every fact here is sourced. Nothing is invented: figures come from RNZ,
 * the NZ Herald archive, or Wikipedia tour records, and each entry carries
 * its source URL. See the footer of the page for the full source list.
 */

export interface TimelineEntry {
  year: string;
  title: string;
  body: string;
}

export interface TributeCard {
  outlet: string;
  headline: string;
  quote: string | null;
  url: string;
}

export interface GalleryImage {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  license: string;
  sourceUrl: string;
}

export const heroCopy = {
  eyebrow: "A Wellington memorial",
  title: "The wind keeps her songs.",
  subtitle:
    "Dolly Parton sang to Aotearoa once. Wellington never got the show. This is our wreath.",
  cta: "Read her story",
  ctaHref: "#story",
} as const;

export const marqueeSongs = [
  "Jolene",
  "9 to 5",
  "I Will Always Love You",
  "Coat of Many Colors",
  "Islands in the Stream",
  "Here You Come Again",
  "Dumb Blonde",
  "Blue Smoke",
] as const;

export const timelineEntries: readonly TimelineEntry[] = [
  {
    year: "1946",
    title: "Born in Locust Ridge",
    body: "The fourth of 12 children, born in a one-room cabin in the Smoky Mountains of Tennessee.",
  },
  {
    year: "1967",
    title: "On the Porter Wagoner Show",
    body: "At 21 she joined the syndicated country television show that carried her voice into millions of homes.",
  },
  {
    year: "1974",
    title: "I Will Always Love You",
    body: "Written as a plea to leave the show and go solo. She later turned down Elvis because his manager wanted half the publishing.",
  },
  {
    year: "1980",
    title: "9 to 5",
    body: "The film and the title song, an anthem for women and workers that topped the charts.",
  },
  {
    year: "1992",
    title: "The Bodyguard cover",
    body: "Whitney Houston carried I Will Always Love You to the top of the world. Parton netted roughly $10 million in royalties.",
  },
  {
    year: "2014",
    title: "Blue Smoke in Aotearoa",
    body: "The album went on sale in New Zealand first, and she played her only New Zealand show at Vector Arena, Auckland, on 7 February.",
  },
  {
    year: "2019",
    title: "MusiCares Person of the Year",
    body: "Honoured by her peers for a lifetime of music and giving.",
  },
  {
    year: "2022",
    title: "Rockstar, her last solo album",
    body: "Her final studio album, released at 76, with Lizzo, Miley Cyrus, Paul McCartney and more.",
  },
  {
    year: "2026",
    title: "Nashville, 25 August",
    body: "She died at home in Nashville, aged 80, after a career that spanned more than half a century and 3000 written songs.",
  },
];

export const wellingtonCopy = {
  eyebrow: "Wellington, Aotearoa",
  title: "She never played here.",
  body: [
    "7 February 2014, Vector Arena, Auckland. The Blue Smoke tour touched down in Aotearoa once, and the album went on sale here on 31 January, months ahead of the United States.",
    "Wellington never got a date. The wind made it up to her. It still carries her songs up Cuba Street, across the harbour and over Mt Victoria, the way it carries everything else.",
  ],
} as const;

export const tributeCards: readonly TributeCard[] = [
  {
    outlet: "RNZ",
    headline: "Queen of country and humanitarian hero, dead at 80",
    quote:
      "In a career that spanned over half a century, Parton captured the American experience, penning more than 3000 songs.",
    url: "https://www.rnz.co.nz/life/people/celebrity/country-music-star-dolly-parton-has-died-aged-80",
  },
  {
    outlet: "RNZ",
    headline: "A world less sparkly: tributes pour in",
    quote: "The world feels a lot less sparkly all of a sudden.",
    url: "https://www.rnz.co.nz/life/people/celebrity/a-world-less-sparkly-tributes-pour-in-after-death-of-dolly-parton",
  },
  {
    outlet: "NZ Herald",
    headline: "Dolly on Rockstar, with Lizzo, Miley and McCartney",
    quote:
      "A New Zealand interview with Dolly about her final solo album, republished the day she died.",
    url: "https://www.nzherald.co.nz/entertainment/dolly-parton-on-her-final-solo-album-rockstar-working-with-lizzo-miley-mccartney-and-more/premium/3JNZOMJEIZHCTDMXAIY4DB5QNA/",
  },
];

export const booksCopy = {
  title: "Three hundred million books.",
  body: [
    "Her Imagination Library mails one free book a month to enrolled children until they start school. More than 300 million books so far.",
    "Wellington holds the National Library of Aotearoa. She would have loved that.",
  ],
  cta: "Read about the Imagination Library",
  ctaHref: "https://dollyparton.com/imagination_library",
} as const;

export const galleryImages: readonly GalleryImage[] = [
  {
    src: "images/dolly-1977.jpg",
    alt: "Dolly Parton in a vintage portrait",
    caption: "Dolly Parton, vintage portrait",
    credit: "Photo by Alan Light",
    license: "CC BY 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Dolly_Parton_2.jpg",
  },
  {
    src: "images/liseberg-2010.jpg",
    alt: "Dolly Parton accepting the Liseberg Applause Award in 2010",
    caption: "Accepting the Liseberg Applause Award, 2010",
    credit: "Photo by Curtis Hilbun",
    license: "CC BY 3.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Dolly_Parton_accepting_Liseberg_Applause_Award_2010_portrait.jpg",
  },
  {
    src: "images/dolly-2023.jpg",
    alt: "Dolly Parton in 2023",
    caption: "Dolly Parton, 2023",
    credit: "Photo by KIND MUSIC GROUP",
    license: "CC BY 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Dolly_Parton_2023.jpg",
  },
  {
    src: "images/kennedy-2006.jpg",
    alt: "Dolly Parton at the Kennedy Center Honors in 2006",
    caption: "Kennedy Center Honors, 2006",
    credit: "White House photo by Eric Draper",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:2006_Kennedy_Center_honorees_(cropped).jpg",
  },
];

export const sourceLinks = [
  {
    label: "RNZ obituary",
    url: "https://www.rnz.co.nz/life/people/celebrity/country-music-star-dolly-parton-has-died-aged-80",
  },
  {
    label: "RNZ tributes roundup",
    url: "https://www.rnz.co.nz/life/people/celebrity/a-world-less-sparkly-tributes-pour-in-after-death-of-dolly-parton",
  },
  {
    label: "NZ Herald archive interview",
    url: "https://www.nzherald.co.nz/entertainment/dolly-parton-on-her-final-solo-album-rockstar-working-with-lizzo-miley-mccartney-and-more/premium/3JNZOMJEIZHCTDMXAIY4DB5QNA/",
  },
  {
    label: "Wikipedia: Blue Smoke World Tour",
    url: "https://en.wikipedia.org/wiki/Blue_Smoke_World_Tour",
  },
  {
    label: "Dollywood Foundation: Imagination Library",
    url: "https://dollyparton.com/imagination_library",
  },
] as const;
