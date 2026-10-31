export const featureDestinations = ["/college-match", "/meet-students", "/opportunities"] as const;
export type FeatureDestination = (typeof featureDestinations)[number];

export function readFeatureDestination(value: unknown): FeatureDestination | undefined {
  return featureDestinations.find((path) => path === value);
}

/** No destination while the existing identity boundary is still loading. */
export function opportunityDestination(ready: boolean, signedIn: boolean) {
  if (!ready) return undefined;
  return signedIn ? "/opportunities" as const : "/login" as const;
}