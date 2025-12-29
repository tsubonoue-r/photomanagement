/**
 * Blackboard utility functions
 */

import type { BlackboardTemplate, BlackboardFieldValue } from '@/types/blackboard';

export function generateBlackboardSvg(
  template: BlackboardTemplate,
  values: BlackboardFieldValue[]
): string {
  // Placeholder SVG generation
  const width = template.width || 600;
  const height = template.height || 400;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#1a1a1a"/>
    <text x="50%" y="50%" fill="white" text-anchor="middle" dominant-baseline="middle" font-size="24">
      ${template.name}
    </text>
  </svg>`;
}

export function formatDate(date: Date | string, format = 'yyyy/MM/dd'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('yyyy', String(year))
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

export function validateBlackboardValues(
  template: BlackboardTemplate,
  values: BlackboardFieldValue[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of template.fields) {
    if (field.required) {
      const value = values.find((v) => v.fieldId === field.id);
      if (!value || !value.value) {
        errors.push(`${field.label} is required`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
