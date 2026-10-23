import { useState, type ReactNode } from 'react'
import { asset, fig } from '../data/figures'
import { Eq, M } from '../components/Math'
import { LIVE_URL, REPO_URL, Params, ProjectStrip } from '../components/Layout'
import { Butterfly, Contours, Fern, Ripples, WaveRule } from '../components/Motifs'
import { useHeroParallax } from '../components/motion'
import { WaterCanvas, WaterfallCanvas } from '../components/WaterCanvas'
import { Caustics } from '../components/Ambient'
import { FlowDigits } from '../components/Scenes'

export function Hero() {
  const plate = fig('hero-cat-ocean')
  const [turned, setTurned] = useState(true)
  useHeroParallax('top')
  return (
    <header className="hero" id="top" data-ambient="night">
      <div className="hero__sky" aria-hidden="true" />
      <WaterCanvas className="hero__sea" />
      <div className="hero__mist" aria-hidden="true">
        <span />
        <span />
      </div>
      <ProjectStrip />
      <div className="hero__inner">
        <div className="hero__text">
          <p className="hero__kicker">
            <span>CS180 · Project 3</span>
            <span>UC Berkeley · Fall 2026</span>
          </p>
          <h1 className="hero__title">
            <span className="hero__title-a">Flow</span>
            <span className="hero__title-b">
              <em>of</em> Water
            </span>
          </h1>
          <p className="hero__subtitle">Exploring Flow Matching, Image Generation, and Visual Perception</p>
          <dl className="hero__ledger">
            <div>
              <dt>live site</dt>
              <dd>
                <a href={LIVE_URL}>sane24.github.io/flow-of-water/</a>
              </dd>
            </div>
            <div>
              <dt>code</dt>
              <dd>
                <a href={REPO_URL}>github.com/Sane24/flow-of-water</a>
              </dd>
            </div>
            <div>
              <dt>course</dt>
              <dd>CS180, Intro to Computer Vision and Computational Photography</dd>
            </div>
            <div>
              <dt>by</dt>
              <dd>Sampurn Bhowmick</dd>
            </div>
          </dl>
          <div className="hero__actions">
            <a className="hero__begin" href="#introduction">
              Begin reading
              <svg viewBox="0 0 16 22" aria-hidden="true">
                <path d="M8 1v19M2 14l6 6 6-6" />
              </svg>
            </a>
          </div>
        </div>

        <figure className="hero__plate">
          <Ripples className="hero__ripples" />
          <button
            type="button"
            className={`hero__porthole ${turned ? 'is-turned' : ''}`}
            onClick={() => setTurned((v) => !v)}
            aria-pressed={turned}
            aria-label={turned ? 'Turn the anagram back upright' : 'Turn the anagram upside down'}
          >
            <img src={asset(plate.src)} width={plate.w} height={plate.h} alt={plate.alt} />
          </button>
          <Butterfly className="hero__butterfly" />
          <Fern className="hero__fern" />
          <figcaption>
            <span className="hero__plate-label">fig. 0</span> cat ↔ ocean waves anagram (§3.3, seed 182).{' '}
            <span className="screen-only">Tap it to turn it over.</span>
          </figcaption>
        </figure>
      </div>
      <div className="hero__shore" aria-hidden="true">
        <svg className="shore shore--foam" viewBox="0 0 2880 90" preserveAspectRatio="none">
          <path d="M0 38c120-18 240-18 360 0s240 18 360 0 240-18 360 0 240 18 360 0 240-18 360 0 240 18 360 0 240-18 360 0 240 18 360 0v52H0z" />
        </svg>
        <svg className="shore shore--paper" viewBox="0 0 2880 90" preserveAspectRatio="none">
          <path d="M0 52c120-16 240-16 360 0s240 16 360 0 240-16 360 0 240 16 360 0 240-16 360 0 240 16 360 0 240-16 360 0 240 16 360 0v38H0z" />
        </svg>
      </div>
    </header>
  )
}

export function PrintHeader() {
  return (
    <div className="print-header print-only">
      <p>
        Live site: <a href={LIVE_URL}>{LIVE_URL}</a> · Code: <a href={REPO_URL}>{REPO_URL}</a>
      </p>
    </div>
  )
}

export function Introduction() {
  return (
    <section id="introduction" className="intro flow" data-toc aria-labelledby="intro-title">
      <Caustics />
      <Contours className="intro__contours" rings={11} seed={2} />
      <p className="eyebrow">Introduction</p>
      <h2 id="intro-title" className="intro__title">
        Following a current from noise to an image
      </h2>
      <p className="lede">
        This project has two halves. In Part A I used a pretrained text-to-image flow model, PixNerd-XXL-P16-T2I,
        without training it at all: I noised my own photos, looked at what the model predicts, wrote an Euler sampler,
        added classifier-free guidance, and then used the same sampler to edit images and to make optical illusions. In
        Part B I built a small UNet and trained it on MNIST, first as a one-step denoiser and then as time- and
        class-conditioned flow matching models.
      </p>
      <p>
        The title is a bit of a pun. Flow matching learns a velocity field that carries Gaussian noise toward images,
        and sampling is just following that current downstream. A lot of my own experiments ended up being about water
        anyway (the ocean in my cat anagram, the waves in the hourglass hybrid, the waterfall in the skull hybrid), so I
        leaned into it.
      </p>
      <div className="keyidea">
        <p className="keyidea__label">The one idea under everything on this page</p>
        <Eq>{String.raw`x_t = (1 - t)\,x_0 + t\,x_1, \qquad x_0 \sim \mathcal{N}(0, I), \qquad \frac{dx_t}{dt} = x_1 - x_0`}</Eq>
        <p>
          <M>{String.raw`t = 0`}</M> is noise and <M>{String.raw`t = 1`}</M> is a clean image. A network{' '}
          <M>{String.raw`v_\theta(x_t, t, c)`}</M> is trained to predict the velocity <M>{String.raw`x_1 - x_0`}</M> at
          random points on the path, and generation integrates that velocity from <M>{String.raw`t = 0`}</M> to{' '}
          <M>{String.raw`1`}</M>. Almost every experiment below is a variation on: build <M>{String.raw`x_t`}</M>, ask
          the network for <M>{String.raw`v`}</M>, take a step.
        </p>
      </div>
      <div className="setup-grid">
        <div>
          <p className="setup-grid__title">Part A setup</p>
          <Params
            items={[
              ['model', 'MCG-NJU/PixNerd-XXL-P16-T2I'],
              ['resolution', '512 × 512, RGB in [−1, 1]'],
              ['hardware', 'Kaggle, Tesla T4, float32'],
              ['defaults', 'seed 180 · h = 0.02 · w = 7'],
            ]}
          />
        </div>
        <div>
          <p className="setup-grid__title">Part B setup</p>
          <Params
            items={[
              ['data', 'MNIST, 60,000 training digits'],
              ['model', 'UNet, D = 128 or 64'],
              ['hardware', 'Colab, Tesla T4'],
              ['defaults', 'seed 180 · Adam · MSE'],
            ]}
          />
        </div>
      </div>
      <p className="provenance-note">
        Every result image on this page is a saved output from my two notebooks. Decorative drawings are original line
        art made for this site, and the few engravings used as ornaments are public-domain prints credited at the end.
        Small labels under each figure say which is which.
      </p>
      <WaveRule />
    </section>
  )
}

interface OpenerProps {
  id: string
  numeral: string
  title: string
  official: string
  children: ReactNode
  variant: 'ocean' | 'falls'
  plate?: ReactNode
}

export function ChapterOpener({ id, numeral, title, official, children, variant, plate }: OpenerProps) {
  return (
    <header
      id={id}
      className={`opener opener--${variant}`}
      data-toc
      data-ambient={variant === 'falls' ? 'night' : undefined}
    >
      {variant === 'ocean' && <Caustics tone="foam" />}
      <div className="opener__stage">
        {variant === 'falls' && <Waterfall />}
        <div className="opener__inner">
          <span className="opener__numeral" aria-hidden="true">
            {numeral}
          </span>
          <div className="opener__text">
            <p className="opener__part">Part {numeral}.</p>
            <h2 className="opener__title">{title}</h2>
            <p className="opener__official">{official}</p>
            <div className="opener__intro">{children}</div>
            {plate}
          </div>
          {variant === 'ocean' && (
            <figure className="opener__plate">
              <img
                src={asset('images/decorative/hokusai-great-wave-ink.webp')}
                alt="Ink-toned reproduction of Hokusai's Great Wave off Kanagawa"
                width={1200}
                height={807}
                loading="lazy"
              />
              <figcaption>after Hokusai, c. 1831</figcaption>
            </figure>
          )}
        </div>
      </div>
      {variant === 'falls' && <FlowDigits />}
    </header>
  )
}

function Waterfall() {
  return (
    <div className="falls" aria-hidden="true">
      <WaterfallCanvas className="falls__canvas" />
      <div className="falls__mist" />
    </div>
  )
}
