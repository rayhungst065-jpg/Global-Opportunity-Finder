export const featureDestinations = ["/college-match", "/meet-students"] as const;
export type FeatureDestination = (typeof featureDestinations)[number];

export function readFeatureDestination(value: unknown): FeatureDestination | undefined {
  return featureDestinations.find((path) => path === value);
}