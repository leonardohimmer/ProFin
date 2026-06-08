/**
 * Utilitários para matemática financeira exata.
 * O sistema usa inteiros (centavos) para evitar erros de ponto flutuante.
 * Exemplo: R$ 10,50 -> 1050 centavos.
 */

export function toCents(amount: number | string): number {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount;
  return Math.round(num * 100);
}

export function toDecimal(cents: number): number {
  return cents / 100;
}

export function formatCurrency(cents: number): string {
  const decimal = toDecimal(cents);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(decimal);
}
