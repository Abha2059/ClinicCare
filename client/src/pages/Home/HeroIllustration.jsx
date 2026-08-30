/**
 * Hero artwork — a three-panel strip of clinicians.
 *
 * The centre panel is taller and sits forward; the two side panels are shorter
 * and tuck a tenth of their width behind it, so the three read as one layered
 * composition rather than three separate cards. Portraits are the same seeded
 * doctor photographs used across the site, so the hero matches what a visitor
 * finds in the directory.
 */

const PANELS = [
  { src: '/doctors/ananya-rao.jpg', size: 'side', edge: 'left' },
  { src: '/doctors/vikram-chauhan.jpg', size: 'centre' },
  { src: '/doctors/tanvi-joshi.jpg', size: 'side', edge: 'right' },
]

export default function HeroIllustration() {
  return (
    <div
      className="relative mx-auto w-full max-w-lg select-none"
      role="img"
      aria-label="Doctors available for consultation on ClinicCare"
    >
      <div className="flex items-center justify-center">
        {PANELS.map((panel) => {
          const isCentre = panel.size === 'centre'

          return (
            <div
              key={panel.src}
              className={[
                // Border picks up brand-500 — the same teal as the app icon.
                'overflow-hidden rounded-lg border-4 border-brand-500 shadow-pop',
                isCentre ? 'h-72 sm:h-80' : 'h-56 sm:h-64',
                // The centre sits forward, so the side panels slide a tenth of
                // their own width underneath it rather than over it.
                isCentre ? 'relative z-10 w-[42%]' : 'relative z-0 w-[30%]',
                panel.edge === 'left' ? '-mr-[3%]' : '',
                panel.edge === 'right' ? '-ml-[3%]' : '',
              ].join(' ')}
            >
              <img
                src={panel.src}
                alt=""
                // The centre portrait is the visual anchor, so it is not lazy.
                fetchPriority={isCentre ? 'high' : undefined}
                loading={isCentre ? undefined : 'lazy'}
                className="block h-full w-full object-cover object-top"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
