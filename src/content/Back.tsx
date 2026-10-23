import { AnagramDisc } from '../components/AnagramViewer'
import { Frog, WaveRule } from '../components/Motifs'

export function Observations() {
  return (
    <section id="observations" className="closing flow" data-toc data-ambient="forest" aria-labelledby="obs-title">
      <p className="eyebrow">Experiments and observations</p>
      <h2 id="obs-title" className="closing__title">A few things I noticed</h2>
      <div className="closing__spread">
        <AnagramDisc group="volcano-wine" className="closing__disc" />
        <div className="obs-grid">
          <article className="obs">
            <h3>One-step outputs come out blurry</h3>
            <p>
              This happened in both parts. Part A's one-step estimate was soft but still had lower MSE than Euler
              (0.0071 vs 0.0086), and Part B's pure-noise denoiser just gave the average digit. With squared error,
              a single guess ends up being an average. Euler keeps asking the model again, so it lands on one sharp
              image, which looks better even though its MSE is worse.
            </p>
          </article>
          <article className="obs">
            <h3>“A high quality photo” usually meant a person</h3>
            <p>
              All five samples from noise were portraits, and so was the <M2>t = 0.02</M2> column of almost every
              edit. With barely anything left of the input, the model falls back on what it thinks a nice photo is,
              and apparently that is a person.
            </p>
          </article>
          <article className="obs">
            <h3>Prompts that fit the original's shape lasted longer</h3>
            <p>
              The galaxy prompt held on to a higher starting time than the mansion, since a galaxy fits inside a
              round iris. The volcano and wine glass worked for the same reason: both prompts wanted a dark shape
              with a bright line through it.
            </p>
          </article>
          <article className="obs">
            <h3>CFG made results cleaner but more alike</h3>
            <p>
              In Part A, <M2>w = 7</M2> fixed every melted face but turned five different photos into five similar
              headshots. In Part B, <M2>γ = 5</M2> gave readable digits after just one epoch.
            </p>
          </article>
        </div>
      </div>
      <p className="closing__again">
        <a href="#creative">
          <svg viewBox="0 0 16 22" aria-hidden="true">
            <path d="M8 21V2M2 8l6-6 6 6" />
          </svg>
          See the creative applications again
        </a>
      </p>
      <WaveRule />
      <footer className="colophon">
        <Frog />
        <p>Flow of Water · CS180 Project 3 · UC Berkeley · Fall 2026</p>
        <a href="#top">back to the top</a>
      </footer>
    </section>
  )
}

function M2({ children }: { children: string }) {
  return <span className="math-plain">{children}</span>
}
