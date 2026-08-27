/**
 * A/B experiment scaffolding (issue #30). Experiments are DECLARED here; the
 * variant is assigned once per visitor (cookie), exposed to the page and sent
 * to analytics as a dimension so conversion can be compared per variant.
 *
 * No experiment changes behaviour until its `enabled` flag is turned on and the
 * page reads `useExperiment(key)`. Turning one on is a deploy, not a config UI —
 * deliberate, so a live test is always intentional.
 */
export interface Experiment {
  key: string;
  hypothesis: string;
  variants: readonly string[];
  /** When false the control variant is always returned. */
  enabled: boolean;
}

export const experiments = {
  hero_layout: {
    key: "hero_layout",
    hypothesis:
      "Un selector de fechas directo en el hero convierte mejor que las cards de destino.",
    variants: ["control_cards", "hero_search"],
    enabled: false,
  },
  availability_cta: {
    key: "availability_cta",
    hypothesis: "'Consultar fechas' reduce la fricción frente a 'Ver disponibilidad'.",
    variants: ["ver_disponibilidad", "consultar_fechas"],
    enabled: false,
  },
  price_position: {
    key: "price_position",
    hypothesis: "Mostrar el precio total y las reseñas por encima del pliegue mejora la conversión.",
    variants: ["price_below", "price_above"],
    enabled: false,
  },
} as const satisfies Record<string, Experiment>;

export type ExperimentKey = keyof typeof experiments;

export function variantsOf(key: ExperimentKey): readonly string[] {
  return experiments[key].variants;
}

export function controlOf(key: ExperimentKey): string {
  return experiments[key].variants[0];
}

export function isEnabled(key: ExperimentKey): boolean {
  return experiments[key].enabled;
}
