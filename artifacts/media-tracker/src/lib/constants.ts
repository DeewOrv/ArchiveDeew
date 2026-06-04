export const CATEGORIES = [
  "Anime", "Donghua", "Manga", "Manhwa", "Manhua", 
  "Novel", "Light Novel", "Web Novel", 
  "Movie", "KDrama", "CDrama", "JDrama", "Short Drama"
];

export const MEDIA_STATUSES = ["Upcoming", "Ongoing", "Hiatus", "Delayed", "Completed"];

export const MY_STATUSES = ["Not Started", "Reading", "Watching", "Completed", "Dropped", "On Hold"];

export const SOURCES = ["Shinigami", "MG", "Komiku", "Donghive", "NovelBin", "SakuraNovel", "WebNovel", "YouTube", "Netflix", "Other"];

export function getCategoryGradient(category: string): string {
  switch (category) {
    case "Anime":
      return "from-blue-600 to-indigo-900";
    case "Donghua":
      return "from-purple-600 to-fuchsia-900";
    case "Manga":
      return "from-slate-600 to-slate-900";
    case "Manhwa":
      return "from-orange-500 to-amber-800";
    case "Manhua":
      return "from-red-600 to-rose-900";
    case "Novel":
    case "Light Novel":
    case "Web Novel":
      return "from-emerald-600 to-teal-900";
    case "Movie":
      return "from-crimson-600 to-red-900";
    case "KDrama":
    case "CDrama":
    case "JDrama":
    case "Short Drama":
      return "from-pink-600 to-rose-900";
    default:
      return "from-gray-700 to-gray-900";
  }
}

export function generateAcronym(title: string): string {
  if (!title) return "";
  return title
    .split(/\s+/)
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 4);
}
