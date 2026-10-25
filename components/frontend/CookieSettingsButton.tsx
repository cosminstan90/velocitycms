'use client'

type GoogleFc = { callbackQueue?: Array<Record<string, () => void>>; showRevocationMessage?: () => void }

/** Redeschide mesajul Google de consimtamant, ca vizitatorul sa-si poata retrage sau schimba acordul. */
export default function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const fc = (window as unknown as { googlefc?: GoogleFc }).googlefc
        if (!fc) return
        if (fc.showRevocationMessage) fc.showRevocationMessage()
        else fc.callbackQueue?.push({ CONSENT_DATA_READY: () => fc.showRevocationMessage?.() })
      }}
    >
      Setări cookie-uri
    </button>
  )
}
