/**
 * Academic Year Utilities for Bennett University Roll Numbers
 *
 * Mapping convention:
 * - s26... -> 1st Year (Batch of 2026)
 * - s25... -> 2nd Year (Batch of 2025)
 * - s24... -> 3rd Year (Batch of 2024)
 * - s23... -> 4th Year (Batch of 2023)
 */

export type AcademicYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | 'Other';

export function getAcademicYear(rollNumber?: string | null): AcademicYear {
  if (!rollNumber) return 'Other';
  const clean = rollNumber.trim().toLowerCase();
  const match = clean.match(/^s(\d{2})/i);
  if (!match) return 'Other';

  const yearCode = match[1];
  switch (yearCode) {
    case '26':
      return '1st Year';
    case '25':
      return '2nd Year';
    case '24':
      return '3rd Year';
    case '23':
      return '4th Year';
    default:
      return 'Other';
  }
}

export function getYearShortBadge(rollNumber?: string | null): string {
  const year = getAcademicYear(rollNumber);
  switch (year) {
    case '1st Year':
      return '1st Yr';
    case '2nd Year':
      return '2nd Yr';
    case '3rd Year':
      return '3rd Yr';
    case '4th Year':
      return '4th Yr';
    default:
      return '';
  }
}

export function getYearBadgeColor(year: AcademicYear): string {
  switch (year) {
    case '1st Year':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case '2nd Year':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case '3rd Year':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case '4th Year':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export const ACADEMIC_YEAR_OPTIONS: AcademicYear[] = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
];
