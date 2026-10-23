import { useEffect } from 'react'
import { LightboxProvider } from './components/Lightbox'
import { Contents } from './components/Contents'
import { loadAllImages } from './components/loadImages'
import { AmbientField } from './components/Ambient'
import { ForestBand } from './components/Scenes'
import { asset } from './data/figures'
import { ChapterOpener, Hero, Introduction, PrintHeader } from './content/Front'
import { PartA } from './content/PartA'
import { PartB } from './content/PartB'
import { Observations } from './content/Back'

export default function App() {
  useEffect(() => {
    // Lazy images keep the first paint light; right after it every figure starts loading so
    // nothing pops in while scrolling, and printing never misses one.
    const onBeforePrint = () => void loadAllImages()
    window.addEventListener('beforeprint', onBeforePrint)
    const soon = window.setTimeout(() => void loadAllImages(), 300)
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint)
      window.clearTimeout(soon)
    }
  }, [])

  return (
    <LightboxProvider>
      <a className="skip-link" href="#introduction">
        Skip to the report
      </a>
      <PrintHeader />
      <AmbientField />
      <Hero />
      <div className="page">
        <Contents />
        <main className="report" id="report">
          <Introduction />
          <ChapterOpener
            id="part-a"
            numeral="I"
            variant="ocean"
            title="Following the Flow"
            official="Part A: Exploring the Power of Flow Models"
          >
            <p>
              A pretrained model, no training. I build noisy inputs by hand, compare a blur to the model's one-step
              guess, write the Euler sampler, add classifier-free guidance, and then bend the sampler into an image
              editor and two kinds of optical illusion.
            </p>
          </ChapterOpener>
          <PartA />
          <ChapterOpener
            id="part-b"
            numeral="II"
            variant="falls"
            title="Learning the Current"
            official="Part B: Flow Matching from Scratch"
            plate={
              <figure className="opener__print">
                <img
                  src={asset('images/decorative/hokusai-kirifuri-falls.webp')}
                  alt="Hokusai's woodblock print of Kirifuri Waterfall, with pilgrims at its foot"
                  width={560}
                  height={793}
                  loading="lazy"
                />
                <figcaption>
                  Hokusai, <em>Kirifuri Waterfall at Kurokami Mountain</em>, c. 1832
                </figcaption>
              </figure>
            }
          >
            <p>
              Now the velocity field has to be learned. A UNet on MNIST goes from a one-step denoiser, which can only
              ever produce the average digit, to time-conditioned and class-conditioned flow matching models that
              generate real samples.
            </p>
          </ChapterOpener>
          <div className="lab" data-ambient="lab">
            <PartB />
          </div>
          <ForestBand />
          <Observations />
        </main>
      </div>
    </LightboxProvider>
  )
}
