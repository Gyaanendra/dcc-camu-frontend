/**
 * Notionist Avatar Generator for DCC Camu Frontend
 * Generates gender-matched funky Notion-style illustration avatar URLs using DiceBear v9 API
 */

export const PASTEL_BACKGROUNDS = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'];

export const FEMALE_HAIR_VARIANTS = [
  'variant63', 'variant62', 'variant61', 'variant58', 'variant57',
  'variant51', 'variant50', 'variant49', 'variant48', 'variant47',
  'variant46', 'variant45', 'variant43', 'variant42', 'variant41',
  'variant40', 'variant36', 'variant32', 'variant31', 'variant30',
  'variant28', 'variant27', 'variant26', 'variant25', 'variant24',
  'variant23', 'variant22', 'variant21', 'variant20', 'variant19',
  'variant18', 'variant17', 'variant16'
];

export const MALE_HAIR_VARIANTS = [
  'variant60', 'variant59', 'variant56', 'variant55', 'variant54',
  'variant53', 'variant52', 'variant44', 'variant39', 'variant38',
  'variant37', 'variant35', 'variant34', 'variant33', 'variant29',
  'variant15', 'variant14', 'variant13', 'variant12', 'variant11',
  'variant10', 'variant09', 'variant08', 'variant07', 'variant06',
  'variant05', 'variant04', 'variant03', 'variant02', 'variant01'
];

const KNOWN_FEMALE_FIRST_NAMES = new Set([
  'disha', 'vrinda', 'rupanshi', 'yashvi', 'janavi', 'sunidhi',
  'aarna', 'shreya', 'sneha', 'anushka', 'tanu', 'supriya',
  'tanzil', 'angel', 'asmita', 'nehal', 'gurnayan', 'divya',
  'nimisha', 'kanishka', 'nishtha', 'aayushi', 'shristy', 'priya',
  'ananya', 'pooja', 'neha', 'isha', 'simran', 'riya', 'rhea',
  'tanvi', 'aditi', 'muskan', 'kriti', 'khushi', 'palak', 'sakshi',
  'megha', 'shweta', 'pallavi', 'anjali', 'sonali', 'radhika', 'swati', 'mannat'
]);

export function detectClientGender(nameOrIdentifier?: string): 'female' | 'male' {
  if (!nameOrIdentifier) return 'male';
  const clean = nameOrIdentifier.trim().toLowerCase();

  if (clean.includes('gyanendra') || clean.includes('s24cseu0771')) {
    return 'male';
  }

  const firstName = clean.split(/[\s._-]+/)[0];
  if (KNOWN_FEMALE_FIRST_NAMES.has(firstName)) {
    return 'female';
  }

  if (clean.includes(' kaur') || clean.includes(' kumari') || clean.includes(' devi')) {
    return 'female';
  }

  return 'male';
}

export function generateCoolTechGuyAvatar(seed = 'Gyanendra-Head-Of-Tech'): string {
  const safeSeed = seed ? seed.trim() : 'Gyanendra-Head-Of-Tech';
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(safeSeed)}&hair=variant59,variant14,variant37&glasses=variant01,variant02&glassesProbability=100&gesture=ok,handPhone&gestureProbability=100&bodyIcon=electric,saturn&bodyIconProbability=100&beardProbability=0&backgroundColor=b6e3f4`;
}

export function generateClientNotionistAvatar(
  seed?: string,
  explicitGender?: 'male' | 'female'
): string {
  const cleanSeed = seed ? seed.trim() : 'member';

  if (cleanSeed.toLowerCase().includes('gyanendra') || cleanSeed.toLowerCase().includes('s24cseu0771')) {
    return generateCoolTechGuyAvatar(cleanSeed || 'Gyanendra-Head-Of-Tech');
  }

  const gender = explicitGender || detectClientGender(cleanSeed);
  const fullSeed = encodeURIComponent(cleanSeed.replace(/\s+/g, '-'));
  const bgParam = PASTEL_BACKGROUNDS.join(',');

  if (gender === 'female') {
    const hairPool = FEMALE_HAIR_VARIANTS.join(',');
    return `https://api.dicebear.com/9.x/notionists/svg?seed=${fullSeed}&hair=${hairPool}&beardProbability=0&backgroundColor=${bgParam}`;
  } else {
    const hairPool = MALE_HAIR_VARIANTS.join(',');
    return `https://api.dicebear.com/9.x/notionists/svg?seed=${fullSeed}&hair=${hairPool}&beardProbability=25&backgroundColor=${bgParam}`;
  }
}
