declare module 'tz-lookup' {
  /** Retourne l'identifiant IANA du fuseau contenant ces coordonnées. */
  export default function tzlookup(lat: number, lng: number): string;
}
