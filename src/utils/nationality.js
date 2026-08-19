// Flamuj (emoji) për kombësitë e listuara te Edit_Profile.jsx (NATIONALITY_OPTIONS).
// Përdoret kudo ku duam të shfaqim flamurin pranë emrit të një lojtari (p.sh.
// tabela e golashënuesve).
const NATIONALITY_FLAGS = {
  Albania: "🇦🇱",
  Kosovo: "🇽🇰",
  "North Macedonia": "🇲🇰",
  Montenegro: "🇲🇪",
  Serbia: "🇷🇸",
  Croatia: "🇭🇷",
  "Bosnia and Herzegovina": "🇧🇦",
  Slovenia: "🇸🇮",
  Greece: "🇬🇷",
  Italy: "🇮🇹",
  Switzerland: "🇨🇭",
  Germany: "🇩🇪",
  Austria: "🇦🇹",
  France: "🇫🇷",
  Belgium: "🇧🇪",
  Netherlands: "🇳🇱",
  England: "🏴",
  Spain: "🇪🇸",
  Portugal: "🇵🇹",
  Turkey: "🇹🇷",
  "United States": "🇺🇸",
  Canada: "🇨🇦",
  Brazil: "🇧🇷",
  Argentina: "🇦🇷",
};

export const getNationalityFlag = (nationality) => NATIONALITY_FLAGS[nationality] || "";
