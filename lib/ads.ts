/** ID-ul de editor AdSense (ca-pub-…), din ADSENSE_CLIENT; implicit cel al DiVet. Gol = reclamele sunt oprite. */
export function getAdsenseClient(): string | null {
  const raw = process.env.ADSENSE_CLIENT ?? 'ca-pub-5857406003088462'
  return /^ca-pub-\d{10,20}$/.test(raw) ? raw : null
}

/** Linia din ads.txt pentru Google AdSense (f08c47fec0942fa0 = ID-ul de autoritate certificatoare Google). */
export function adsTxtLine(client: string): string {
  return `google.com, ${client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0`
}
